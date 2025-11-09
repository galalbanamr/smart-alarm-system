/**
 * Records Management Module
 * Handles standing detection records and notifications
 */

export class RecordsManager {
    constructor() {
        this.RECORDS_KEY = 'standing_detection_records';
        this.NOTIFICATIONS_KEY = 'standing_detection_notifications';
    }

    /**
     * Add a new standing record
     */
    addRecord(childId, parentId, isStanding, duration = 0) {
        const records = this.getAllRecords();
        const record = {
            id: `record_${Date.now()}_${parentId}`,
            childId, // Changed from studentId
            parentId, // Changed from teacherId
            isStanding,
            duration, // Duration in seconds
            timestamp: new Date().toISOString(),
            viewed: false
        };

        records.push(record);
        localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));

        // Create notification for parent
        this.createNotification(parentId, childId, isStanding, record.id);

        return record;
    }

    /**
     * Get all records
     */
    getAllRecords() {
        const data = localStorage.getItem(this.RECORDS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Get records for a child
     */
    getChildRecords(childId) {
        const records = this.getAllRecords();
        return records.filter(r => r.childId === childId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get records for a parent
     */
    getParentRecords(parentId) {
        const records = this.getAllRecords();
        return records.filter(r => r.parentId === parentId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Mark record as viewed
     */
    markRecordAsViewed(recordId) {
        const records = this.getAllRecords();
        const record = records.find(r => r.id === recordId);
        if (record) {
            record.viewed = true;
            localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
        }
    }

    /**
     * Create notification for parent
     */
    createNotification(parentId, childId, isStanding, recordId) {
        const notifications = this.getAllNotifications();
        const notification = {
            id: `notif_${Date.now()}`,
            parentId, // Changed from teacherId
            childId, // Changed from studentId
            recordId,
            type: isStanding ? 'standing' : 'not_standing',
            message: isStanding 
                ? 'Child stood up!' 
                : 'Child is not standing',
            timestamp: new Date().toISOString(),
            read: false
        };

        notifications.push(notification);
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    /**
     * Get all notifications
     */
    getAllNotifications() {
        const data = localStorage.getItem(this.NOTIFICATIONS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Get notifications for a parent
     */
    getParentNotifications(parentId) {
        const notifications = this.getAllNotifications();
        return notifications.filter(n => n.parentId === parentId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get unread notification count
     */
    getUnreadCount(parentId) {
        const notifications = this.getParentNotifications(parentId);
        return notifications.filter(n => !n.read).length;
    }

    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId) {
        const notifications = this.getAllNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
        }
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(parentId) {
        const notifications = this.getAllNotifications();
        notifications.forEach(n => {
            if (n.parentId === parentId && !n.read) {
                n.read = true;
            }
        });
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    /**
     * Add a check record (standing or clothing)
     */
    addCheckRecord(childId, parentId, checkType, passed) {
        const records = this.getAllRecords();
        const record = {
            id: `check_${Date.now()}_${parentId}`,
            childId,
            parentId,
            type: 'check',
            checkType, // 'standing' or 'clothing'
            passed,
            timestamp: new Date().toISOString(),
            viewed: false
        };

        records.push(record);
        localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));

        // Create notification for parent
        const message = checkType === 'standing' 
            ? 'Child has waked up! (Standing check complete)'
            : 'Child is wearing uniform! (Clothing check complete)';
        
        this.createCheckNotification(parentId, childId, checkType, message, record.id);

        return record;
    }

    /**
     * Add a complete record (both checks done)
     */
    addCompleteRecord(childId, parentId, standingComplete, clothingComplete) {
        const records = this.getAllRecords();
        const record = {
            id: `complete_${Date.now()}_${parentId}`,
            childId,
            parentId,
            type: 'complete',
            standingComplete,
            clothingComplete,
            timestamp: new Date().toISOString(),
            viewed: false
        };

        records.push(record);
        localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));

        // Create notification for parent
        const message = 'All checks complete! Child has waked up and is wearing uniform.';
        this.createCheckNotification(parentId, childId, 'complete', message, record.id);

        return record;
    }

    /**
     * Create notification for check completion
     */
    createCheckNotification(parentId, childId, checkType, message, recordId) {
        const notifications = this.getAllNotifications();
        const notification = {
            id: `notif_${Date.now()}`,
            parentId,
            childId,
            recordId,
            type: checkType,
            message,
            timestamp: new Date().toISOString(),
            read: false
        };

        notifications.push(notification);
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    /**
     * Get latest complete record for a child
     */
    getLatestCompleteRecord(childId) {
        const records = this.getAllRecords();
        const completeRecords = records
            .filter(r => r.childId === childId && r.type === 'complete')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return completeRecords.length > 0 ? completeRecords[0] : null;
    }

    /**
     * Get check status for a child (latest complete record)
     */
    getChildCheckStatus(childId) {
        const latestRecord = this.getLatestCompleteRecord(childId);
        if (!latestRecord) {
            return {
                standingComplete: false,
                clothingComplete: false,
                timestamp: null
            };
        }
        
        return {
            standingComplete: latestRecord.standingComplete || false,
            clothingComplete: latestRecord.clothingComplete || false,
            timestamp: latestRecord.timestamp
        };
    }
}
