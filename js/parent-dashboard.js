/**
 * Parent Dashboard Controller
 */

import { AuthManager } from './auth.js';
import { RecordsManager } from './records.js';
import { translationManager } from './translations.js';
import { CONFIG } from './config.js';

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

            const formatCheckTime = (isoString) => {
                if (!isoString) return '';
                const date = new Date(isoString);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            };

            const standingTimeDisplay = checkStatus.standingComplete && checkStatus.standingTime
                ? `<span class="check-time">${formatCheckTime(checkStatus.standingTime)}</span>`
                : '';

            const uniformTimeDisplay = checkStatus.clothingComplete && checkStatus.uniformTime
                ? `<span class="check-time">${formatCheckTime(checkStatus.uniformTime)}</span>`
                : '';

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
                            <div class="flex items-center gap-2">
                                <span class="check-icon">${checkStatus.standingComplete ? '✅' : '⏳'}</span>
                                <span class="check-label">${translationManager.t('standingUp')}</span>
                            </div>
                            ${standingTimeDisplay}
                        </div>
                        <div class="check-item ${checkStatus.clothingComplete ? 'complete' : 'pending'}">
                            <div class="flex items-center gap-2">
                                <span class="check-icon">${checkStatus.clothingComplete ? '✅' : '⏳'}</span>
                                <span class="check-label">${translationManager.t('wearingUniform')}</span>
                            </div>
                            ${uniformTimeDisplay}
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
    if (alarmCheckInterval) {
        clearInterval(alarmCheckInterval);
    }
});

// ============================================
// ALARM SCHEDULER SYSTEM
// ============================================

let alarmCheckInterval = null;
let alarmTriggeredToday = {}; // Track which child alarms have triggered today

/**
 * Initialize the Alarm System
 * Call this after DOM is loaded
 */
function initAlarmSystem() {
    console.log('⏰ Initializing alarm system...');

    // Load saved settings
    loadAlarmSettings();

    // Setup UI event listeners
    setupAlarmEventListeners();

    // Start checking alarms every second
    alarmCheckInterval = setInterval(checkAlarms, 1000);

    // Reset triggered flags at midnight
    scheduleMidnightReset();

    console.log('✅ Alarm system initialized');
}

/**
 * Load alarm settings from localStorage and populate UI
 */
function loadAlarmSettings() {
    const children = authManager.getChildrenForParent(currentParent?.userId);
    const childAlarmList = document.getElementById('childAlarmList');
    const alarmEnabled = document.getElementById('alarmEnabled');

    if (!childAlarmList) return;

    // Load master alarm toggle
    const savedEnabled = localStorage.getItem('alarm_enabled');
    if (alarmEnabled && savedEnabled !== null) {
        alarmEnabled.checked = savedEnabled === 'true';
    }
    updateAlarmStatusDisplay();

    // Populate child alarm list
    if (children.length === 0) {
        childAlarmList.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">No children registered</div>';
        return;
    }

    childAlarmList.innerHTML = children.map(child => {
        const savedTime = localStorage.getItem(`alarm_time_${child.id}`) || '06:30';
        const childEnabled = localStorage.getItem(`alarm_child_enabled_${child.id}`) !== 'false';

        return `
            <div class="flex items-center justify-between p-2 bg-white/5 rounded-lg" data-child-id="${child.id}">
                <div class="flex items-center gap-2">
                    <input type="checkbox" 
                           id="alarmChild_${child.id}" 
                           class="child-alarm-checkbox rounded border-gray-600 text-primary focus:ring-primary"
                           ${childEnabled ? 'checked' : ''}>
                    <label for="alarmChild_${child.id}" class="text-sm text-white cursor-pointer">${child.name}</label>
                </div>
                <input type="time" 
                       id="alarmTime_${child.id}" 
                       class="alarm-time-input bg-transparent border border-white/20 rounded px-2 py-1 text-sm text-white focus:border-primary focus:outline-none"
                       value="${savedTime}">
            </div>
        `;
    }).join('');

    // Update next alarm display
    updateNextAlarmDisplay();
}

/**
 * Setup event listeners for alarm UI
 */
function setupAlarmEventListeners() {
    // Master toggle
    const alarmEnabled = document.getElementById('alarmEnabled');
    if (alarmEnabled) {
        alarmEnabled.addEventListener('change', () => {
            updateAlarmStatusDisplay();
        });
    }

    // Save button
    const saveAlarmBtn = document.getElementById('saveAlarmBtn');
    if (saveAlarmBtn) {
        saveAlarmBtn.addEventListener('click', saveAlarmSettings);
    }

    // ESP32 IP Settings
    const ipInput = document.getElementById('esp32IpInputParent');
    const testBtn = document.getElementById('testEsp32BtnParent');

    // Load saved IP
    if (ipInput) {
        const savedIP = localStorage.getItem('esp32_buzzer_ip');
        if (savedIP) {
            ipInput.value = savedIP;
            updateEsp32StatusParent(true, savedIP);
        } else if (CONFIG.ESP32_BUZZER_IP && !CONFIG.ESP32_BUZZER_IP.endsWith('.local')) {
            ipInput.value = CONFIG.ESP32_BUZZER_IP;
        }
    }

    // Test button
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const ip = ipInput?.value?.trim();
            if (!ip) {
                alert('Please enter an IP address');
                return;
            }

            testBtn.disabled = true;
            testBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">sync</span>';

            try {
                const response = await fetch(`http://${ip}/status`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'ok') {
                        updateEsp32StatusParent(true, ip);
                        alert(`✅ Connected to ESP32 at ${ip}\nBuzzer: ${data.buzzer}`);
                    }
                } else {
                    updateEsp32StatusParent(false);
                    alert('❌ ESP32 not responding');
                }
            } catch (error) {
                updateEsp32StatusParent(false);
                alert(`❌ Could not connect to ${ip}\n\nMake sure:\n1. ESP32 is powered on\n2. ESP32 is on the same network\n3. IP address is correct`);
            }

            testBtn.disabled = false;
            testBtn.innerHTML = '<span class="material-symbols-outlined text-sm">sync</span>';
        });
    }
}

/**
 * Update ESP32 connection status display for parent dashboard
 */
function updateEsp32StatusParent(connected, ip = null) {
    const statusIcon = document.getElementById('esp32StatusIconParent');
    const statusText = document.getElementById('esp32StatusTextParent');

    if (!statusIcon || !statusText) return;

    if (connected) {
        statusIcon.className = 'w-2 h-2 rounded-full bg-green-500';
        statusText.textContent = ip ? `Connected (${ip})` : 'Connected';
        statusText.className = 'text-green-400';
    } else {
        statusIcon.className = 'w-2 h-2 rounded-full bg-red-500';
        statusText.textContent = 'Not connected';
        statusText.className = 'text-red-400';
    }
}

/**
 * Save alarm settings to localStorage
 */
function saveAlarmSettings() {
    const children = authManager.getChildrenForParent(currentParent?.userId);
    const alarmEnabled = document.getElementById('alarmEnabled');

    // Save master toggle
    if (alarmEnabled) {
        localStorage.setItem('alarm_enabled', alarmEnabled.checked);
    }

    // Save per-child settings
    children.forEach(child => {
        const timeInput = document.getElementById(`alarmTime_${child.id}`);
        const enabledCheckbox = document.getElementById(`alarmChild_${child.id}`);

        if (timeInput) {
            localStorage.setItem(`alarm_time_${child.id}`, timeInput.value);
        }
        if (enabledCheckbox) {
            localStorage.setItem(`alarm_child_enabled_${child.id}`, enabledCheckbox.checked);
        }
    });

    // Save ESP32 IP
    const ipInput = document.getElementById('esp32IpInputParent');
    if (ipInput && ipInput.value.trim()) {
        localStorage.setItem('esp32_buzzer_ip', ipInput.value.trim());
        updateEsp32StatusParent(true, ipInput.value.trim());
    }

    updateAlarmStatusDisplay();
    updateNextAlarmDisplay();

    alert('✅ Alarm settings saved!');
    console.log('⏰ Alarm settings saved to localStorage');
}

/**
 * Update the alarm status display
 */
function updateAlarmStatusDisplay() {
    const alarmEnabled = document.getElementById('alarmEnabled');
    const statusIcon = document.getElementById('alarmStatusIcon');
    const statusText = document.getElementById('alarmStatusText');

    if (!statusIcon || !statusText) return;

    const isEnabled = alarmEnabled?.checked;

    if (isEnabled) {
        statusIcon.className = 'size-3 rounded-full bg-green-500 animate-pulse';
        statusText.textContent = 'Alarm Active';
        statusText.className = 'text-sm text-green-400 font-medium';
    } else {
        statusIcon.className = 'size-3 rounded-full bg-gray-500';
        statusText.textContent = 'Alarm Off';
        statusText.className = 'text-sm text-gray-400';
    }
}

/**
 * Update the next alarm display
 */
function updateNextAlarmDisplay() {
    const children = authManager.getChildrenForParent(currentParent?.userId);
    const nextAlarmDisplay = document.getElementById('nextAlarmDisplay');
    const alarmEnabled = localStorage.getItem('alarm_enabled') === 'true';

    if (!nextAlarmDisplay) return;

    if (!alarmEnabled) {
        nextAlarmDisplay.textContent = 'Disabled';
        return;
    }

    // Find earliest alarm time
    let earliestTime = null;
    let earliestChild = null;

    children.forEach(child => {
        const childEnabled = localStorage.getItem(`alarm_child_enabled_${child.id}`) !== 'false';
        const timeStr = localStorage.getItem(`alarm_time_${child.id}`) || '06:30';

        if (childEnabled) {
            if (!earliestTime || timeStr < earliestTime) {
                earliestTime = timeStr;
                earliestChild = child.name;
            }
        }
    });

    if (earliestTime && earliestChild) {
        // Format time for display
        const [hours, minutes] = earliestTime.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
        nextAlarmDisplay.textContent = `${hour12}:${minutes} ${ampm} (${earliestChild})`;
    } else {
        nextAlarmDisplay.textContent = 'No alarms set';
    }
}

/**
 * Check if any alarm should trigger
 * Called every second
 */
function checkAlarms() {
    const alarmEnabled = localStorage.getItem('alarm_enabled') === 'true';
    if (!alarmEnabled) return;

    const children = authManager.getChildrenForParent(currentParent?.userId);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayKey = now.toDateString();

    children.forEach(child => {
        const childEnabled = localStorage.getItem(`alarm_child_enabled_${child.id}`) !== 'false';
        const alarmTime = localStorage.getItem(`alarm_time_${child.id}`) || '06:30';

        // Check if alarm should trigger
        if (childEnabled && currentTime === alarmTime) {
            // Only trigger once per day per child
            const triggeredKey = `${todayKey}_${child.id}`;
            if (!alarmTriggeredToday[triggeredKey]) {
                alarmTriggeredToday[triggeredKey] = true;
                triggerAlarm(child);
            }
        }
    });
}

/**
 * Trigger the alarm for a specific child
 */
async function triggerAlarm(child) {
    console.log(`🔔 ALARM TRIGGERED for ${child.name}!`);

    // Get ESP32 IP from config or localStorage
    const esp32IP = localStorage.getItem('esp32_buzzer_ip') || CONFIG.ESP32_BUZZER_IP;

    if (!esp32IP || esp32IP.endsWith('.local')) {
        console.error('❌ ESP32 IP not configured. Please set it in the settings.');
        alert(`⚠️ Alarm triggered for ${child.name} but ESP32 IP is not configured!\n\nPlease set the ESP32 IP address in the Child Dashboard settings.`);
        return;
    }

    const url = `http://${esp32IP}/buzzer/on`;
    console.log(`📡 Sending buzzer ON request to: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                child: child.name,
                reason: 'scheduled_alarm'
            }),
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Buzzer turned ON for ${child.name}:`, data);

            // Show notification
            showAlarmNotification(child);
        } else {
            console.error(`❌ Failed to turn buzzer ON: ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Error triggering alarm for ${child.name}:`, error);
        alert(`⚠️ Could not reach ESP32 buzzer!\n\nAlarm for ${child.name} failed.\nCheck that ESP32 is connected.`);
    }
}

/**
 * Show alarm notification in UI
 */
function showAlarmNotification(child) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update next alarm display to show active
    const nextAlarmDisplay = document.getElementById('nextAlarmDisplay');
    if (nextAlarmDisplay) {
        nextAlarmDisplay.innerHTML = `<span class="text-yellow-400 animate-pulse">🔔 ${child.name}'s alarm ACTIVE</span>`;
    }

    console.log(`🔔 Alarm notification: ${child.name} at ${timeStr}`);
}

/**
 * Schedule reset of triggered flags at midnight
 */
function scheduleMidnightReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);

    const msUntilMidnight = midnight - now;

    setTimeout(() => {
        console.log('🌙 Midnight reset - clearing alarm triggered flags');
        alarmTriggeredToday = {};
        scheduleMidnightReset(); // Schedule next reset
    }, msUntilMidnight);
}

// Initialize alarm system after DOM load
window.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to be ready
    setTimeout(() => {
        if (currentParent) {
            initAlarmSystem();
        }
    }, 500);
});

// Export for manual testing
window.triggerAlarm = triggerAlarm;
window.checkAlarms = checkAlarms;
