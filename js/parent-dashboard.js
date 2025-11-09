/**
 * Parent Dashboard Controller
 */

import { AuthManager } from './auth.js';
import { RecordsManager } from './records.js';

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
});

function loadDashboard() {
    loadOverview();
    loadNotifications();
    loadChildren();
    loadRecords();
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
        notificationsList.innerHTML = '<div class="empty-state">No notifications yet</div>';
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

    if (children.length === 0) {
        childrenList.innerHTML = '<div class="empty-state">No children registered yet</div>';
        return;
    }

    childrenList.innerHTML = children.map(child => {
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
                        <p>@${child.username} • Last activity: ${lastActivity}</p>
                    </div>
                </div>
                <div class="child-checks">
                    <div class="check-item ${checkStatus.standingComplete ? 'complete' : 'pending'}">
                        <span class="check-icon">${checkStatus.standingComplete ? '✅' : '⏳'}</span>
                        <span class="check-label">Standing Up</span>
                    </div>
                    <div class="check-item ${checkStatus.clothingComplete ? 'complete' : 'pending'}">
                        <span class="check-icon">${checkStatus.clothingComplete ? '✅' : '⏳'}</span>
                        <span class="check-label">Wearing Uniform</span>
                    </div>
                </div>
                <div class="child-stats">
                    <div class="child-stat">
                        <div class="child-stat-value">${childRecords.length}</div>
                        <div class="child-stat-label">Total Records</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadRecords() {
    const records = recordsManager.getParentRecords(currentParent.userId).slice(0, 20);
    const recordsList = document.getElementById('recordsList');
    const allUsers = authManager.getAllUsers();

    if (records.length === 0) {
        recordsList.innerHTML = '<div class="empty-state">No records yet</div>';
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
                    <div class="record-title">${record.isStanding ? 'Child Stood Up' : 'Child Not Standing'}</div>
                    <div class="record-details">
                        <span class="child-name">${childName}</span>
                        ${duration ? `<span class="record-duration">Duration: ${duration}</span>` : ''}
                        <span class="record-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
