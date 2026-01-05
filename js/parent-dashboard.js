/**
 * Parent Dashboard Controller
 */

import { AuthManager } from './auth.js';
import { RecordsManager } from './records.js';
import { translationManager } from './translations.js';

const authManager = new AuthManager();
const recordsManager = new RecordsManager();

let currentParent = null;
let refreshInterval = null;

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    const session = authManager.getCurrentSession();

    if (!session || session.role !== 'parent') {
        window.location.href = 'login.html';
        return;
    }

    currentParent = session;

    // Set user name and avatar
    const userName = session.name || session.username;
    document.getElementById('userName').textContent = userName;
    document.getElementById('userAvatar').textContent = userName.charAt(0).toUpperCase();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authManager.logout();
        window.location.href = 'login.html';
    });

    // Setup refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboard();
    });

    // Setup mark all read
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            recordsManager.markAllAsRead(currentParent.userId);
            loadDashboard();
        });
    }

    // Load dashboard
    loadDashboard();

    // Auto-refresh every 5 seconds
    refreshInterval = setInterval(() => {
        loadDashboard();
    }, 5000);

    // Listen for language changes
    translationManager.subscribe((lang) => {
        loadDashboard();
        updateNavigationTexts();

        // Update toggle button text if it exists
        const langText = document.getElementById('langText');
        if (langText) langText.textContent = lang === 'en' ? 'EN' : 'AR';
    });

    // Setup Language Toggle
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        // Init state
        const langText = document.getElementById('langText');
        if (langText) langText.textContent = translationManager.currentLang === 'en' ? 'EN' : 'AR';

        langBtn.onclick = () => {
            const newLang = translationManager.currentLang === 'en' ? 'ar' : 'en';
            translationManager.setLanguage(newLang);
        };
    }

    // Initial translation update
    updateNavigationTexts();

    // Setup Navigation
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) switchSection(section);
        });
    });
});

// Navigation Function
function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('active');
    });

    // Show target section
    const target = document.getElementById(sectionId + 'Section');
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-primary/10', 'text-primary', 'border', 'border-primary/20', 'shadow-[0_0_10px_rgba(16,183,127,0.1)]');
        el.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-white/5');

        if (el.dataset.section === sectionId) {
            el.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-white/5');
            el.classList.add('bg-primary/10', 'text-primary', 'border', 'border-primary/20', 'shadow-[0_0_10px_rgba(16,183,127,0.1)]');
        }
    });

    // Specific logic for sections
    if (sectionId === 'calendar') {
        loadCalendar();
    }
}

// Global expose for HTML onclicks
window.switchSection = switchSection;

function updateNavigationTexts() {
    // Update navigation items
    const navItems = {
        overview: translationManager.t('overview'),
        children: translationManager.t('myChildren'),
        notifications: translationManager.t('notifications'),
        records: translationManager.t('records'),
        calendar: translationManager.t('calendar')
    };

    Object.keys(navItems).forEach(key => {
        const navItem = document.querySelector(`[data-section="${key}"] .nav-text`);
        if (navItem) {
            navItem.textContent = navItems[key];
        }
    });

    // Update logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn && logoutBtn.children[1]) {
        logoutBtn.children[1].textContent = translationManager.t('logout');
    }

    // Update refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.title = translationManager.t('refresh');
    }
}

function loadDashboard() {
    loadOverview();
    loadNotifications();
    loadChildren();
    loadRecords();
    loadCalendar();
}

function loadOverview() {
    const children = authManager.getChildrenForParent(currentParent.userId);
    const notifications = recordsManager.getParentNotifications(currentParent.userId);
    const unreadCount = recordsManager.getUnreadCount(currentParent.userId);
    const records = recordsManager.getParentRecords(currentParent.userId);

    // Get today's standing count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const standingToday = records.filter(r => {
        const recordDate = new Date(r.timestamp);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime() && r.isStanding;
    }).length;

    // Update stats
    document.getElementById('totalChildren').textContent = children.length;
    document.getElementById('totalNotifications').textContent = unreadCount;
    document.getElementById('totalRecords').textContent = records.length;
    document.getElementById('standingToday').textContent = standingToday;

    // Update stat labels
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels.length >= 4) {
        statLabels[0].textContent = translationManager.t('totalChildren');
        statLabels[1].textContent = translationManager.t('unreadNotifications');
        statLabels[2].textContent = translationManager.t('totalRecords');
        statLabels[3].textContent = translationManager.t('standingToday');
    }
}

function loadNotifications() {
    const notifications = recordsManager.getParentNotifications(currentParent.userId);
    const unreadCount = recordsManager.getUnreadCount(currentParent.userId);
    const notificationsList = document.getElementById('notificationsList');
    const sidebarBadge = document.getElementById('sidebarNotificationBadge');

    // Update sidebar badge
    if (sidebarBadge) {
        sidebarBadge.textContent = unreadCount;
    }

    if (notifications.length === 0) {
        notificationsList.innerHTML = `<div class="empty-state">${translationManager.t('noNotifications')}</div>`;
        return;
    }

    // Get all users for name lookup
    const allUsers = authManager.getAllUsers();

    notificationsList.innerHTML = notifications.map(notif => {
        const child = allUsers.find(u => u.id === notif.childId);
        const childName = child ? child.name : 'Unknown Child';
        const timeAgo = getTimeAgo(new Date(notif.timestamp));
        const isRead = notif.read ? 'read' : '';
        let iconClass = 'standing';
        let icon = '✅';

        if (notif.type === 'standing') {
            iconClass = 'standing';
            icon = '✅';
        } else if (notif.type === 'clothing') {
            iconClass = 'standing';
            icon = '👕';
        } else if (notif.type === 'complete') {
            iconClass = 'standing';
            icon = '🎉';
        } else {
            iconClass = 'not_standing';
            icon = '❌';
        }

        return `
            <div class="notification-card ${isRead}" data-id="${notif.id}">
                <div class="notification-icon ${iconClass}">
                    ${icon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.message}</div>
                    <div class="notification-details">
                        <span class="child-name">${childName}</span>
                        <span class="notification-time">${timeAgo}</span>
                    </div>
                </div>
                ${!notif.read ? '<div class="unread-dot"></div>' : ''}
            </div>
        `;
    }).join('');

    // Add click handlers
    notificationsList.querySelectorAll('.notification-card').forEach(card => {
        card.addEventListener('click', () => {
            const notifId = card.dataset.id;
            recordsManager.markNotificationAsRead(notifId);
            recordsManager.markRecordAsViewed(notifications.find(n => n.id === notifId)?.recordId);
            loadDashboard();
        });
    });
}

function loadChildren() {
    const children = authManager.getChildrenForParent(currentParent.userId);
    const childrenList = document.getElementById('childrenList');
    const allChildrenList = document.getElementById('allChildrenList');

    if (!childrenList && !allChildrenList) return;

    let content = '';

    if (children.length === 0) {
        content = `<div class="empty-state">${translationManager.t('noChildrenRegistered')}</div>`;
    } else {
        content = children.map(child => {
            const childRecords = recordsManager.getChildRecords(child.id);
            const checkStatus = recordsManager.getChildCheckStatus(child.id);
            const recentRecord = childRecords[0];
            const lastActivity = recentRecord ? getTimeAgo(new Date(recentRecord.timestamp)) : 'Never';

            return `
                <div class="child-card">
                    <div class="child-card-header">
                        <div class="child-avatar">${child.name.charAt(0).toUpperCase()}</div>
                        <div class="child-info">
                            <h3>${child.name}</h3>
                            <p>@${child.username} • ${translationManager.t('lastActivity')}: ${lastActivity}</p>
                        </div>
                    </div>
                        <div class="child-checks">
                        <div class="check-item ${checkStatus.standingComplete ? 'complete' : 'pending'}">
                            <span class="check-icon">${checkStatus.standingComplete ? '✅' : '⏳'}</span>
                            <span class="check-label">${translationManager.t('standingUp')}</span>
                        </div>
                        <div class="check-item ${checkStatus.clothingComplete ? 'complete' : 'pending'}">
                            <span class="check-icon">${checkStatus.clothingComplete ? '✅' : '⏳'}</span>
                            <span class="check-label">${translationManager.t('wearingUniform')}</span>
                        </div>
                    </div>
                    <div class="child-stats">
                        <div class="child-stat">
                            <div class="child-stat-value">${childRecords.length}</div>
                            <div class="child-stat-label">${translationManager.t('totalRecordsLabel')}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (childrenList) childrenList.innerHTML = content;
    if (allChildrenList) allChildrenList.innerHTML = content;
}

function loadRecords() {
    const records = recordsManager.getParentRecords(currentParent.userId).slice(0, 20);
    const recordsList = document.getElementById('recordsList');
    const allUsers = authManager.getAllUsers();

    if (records.length === 0) {
        recordsList.innerHTML = `<div class="empty-state">${translationManager.t('noRecords')}</div>`;
        return;
    }

    recordsList.innerHTML = records.map(record => {
        const child = allUsers.find(u => u.id === record.childId);
        const childName = child ? child.name : 'Unknown';
        const timeAgo = getTimeAgo(new Date(record.timestamp));
        const duration = record.duration > 0 ? `${record.duration}s` : '';
        const statusClass = record.isStanding ? '' : 'not-standing';

        return `
            <div class="record-card ${statusClass}">
                <div class="record-icon">
                    ${record.isStanding ? '✅' : '❌'}
                </div>
                <div class="record-content">
                    <div class="record-title">${record.isStanding ? translationManager.t('childStoodUpRecord') : translationManager.t('childNotStandingRecord')}</div>
                    <div class="record-details">
                        <span class="child-name">${childName}</span>
                        ${duration ? `<span class="record-duration">${translationManager.t('duration')}: ${duration}</span>` : ''}
                        <span class="record-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return translationManager.t('justNow');
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${translationManager.t('minutesAgo')}`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${translationManager.t('hoursAgo')}`;
    return `${Math.floor(seconds / 86400)}${translationManager.t('daysAgo')}`;
}

let currentCalendarDate = new Date();

function loadCalendar() {
    try {
        const calendarContainer = document.getElementById('calendarContainer');
        if (!calendarContainer) {
            console.error('Calendar container not found');
            return;
        }

        if (!currentParent) {
            console.error('No current parent');
            calendarContainer.innerHTML = '<div class="empty-state">Error: Not logged in</div>';
            return;
        }

        const children = authManager.getChildrenForParent(currentParent.userId);
        const allUsers = authManager.getAllUsers();
        const recordsByChild = recordsManager.getRecordsByChildAndDate(currentParent.userId, allUsers);

        // Get current month
        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();

        // Update month display
        const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'];
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${translationManager.t(monthKeys[month])} ${year}`;
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        // Create calendar HTML
        let calendarHTML = '<div class="calendar-grid">';

        // Day headers
        const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayKeys.forEach(dayKey => {
            calendarHTML += `<div class="calendar-day-header">${translationManager.t(dayKey)}</div>`;
        });

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            calendarHTML += `<div class="calendar-day ${isToday ? 'today' : ''}">`;
            calendarHTML += `<div class="calendar-day-number">${day}</div>`;

            // Show records for each child on this date
            children.forEach(child => {
                const childRecords = recordsByChild[child.id];
                if (childRecords && childRecords[dateKey]) {
                    const record = childRecords[dateKey];
                    calendarHTML += `<div class="calendar-child-entry">`;
                    calendarHTML += `<div class="calendar-child-name">${record.childName}</div>`;

                    if (record.standingTime) {
                        const standingDate = new Date(record.standingTime);
                        const standingTime = standingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        calendarHTML += `<div class="calendar-time standing-time">⏰ ${translationManager.t('woke')}: ${standingTime}</div>`;
                    }

                    if (record.uniformTime) {
                        const uniformDate = new Date(record.uniformTime);
                        const uniformTime = uniformDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        calendarHTML += `<div class="calendar-time uniform-time">👕 ${translationManager.t('uniform')}: ${uniformTime}</div>`;
                    }

                    calendarHTML += `</div>`;
                }
            });

            calendarHTML += '</div>';
        }

        // Empty cells for days after month ends
        const totalCells = startingDayOfWeek + daysInMonth;
        const remainingCells = 42 - totalCells; // 6 rows * 7 days
        for (let i = 0; i < remainingCells && totalCells + i < 42; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        calendarHTML += '</div>';
        calendarContainer.innerHTML = calendarHTML;

        // If no records, show a message below the calendar
        if (Object.keys(recordsByChild).length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'calendar-empty-message';
            emptyMsg.textContent = translationManager.t('noRecordsCalendar');
            calendarContainer.appendChild(emptyMsg);
        }

        // Setup navigation buttons
        const prevBtn = document.getElementById('prevMonthBtn');
        const nextBtn = document.getElementById('nextMonthBtn');

        if (prevBtn) {
            prevBtn.textContent = `◀ ${translationManager.t('previous')}`;
            prevBtn.onclick = () => {
                currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
                loadCalendar();
            };
        }

        if (nextBtn) {
            nextBtn.textContent = `${translationManager.t('next')} ▶`;
            nextBtn.onclick = () => {
                currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
                loadCalendar();
            };
        }
    } catch (error) {
        console.error('Error loading calendar:', error);
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) {
            calendarContainer.innerHTML = '<div class="empty-state">Error loading calendar. Please refresh the page.</div>';
        }
    }
}

// Make loadCalendar globally accessible
window.loadCalendar = loadCalendar;

// Make translationManager globally accessible
window.translationManager = translationManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
