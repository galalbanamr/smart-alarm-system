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
        const now = new Date().toISOString();
        const record = {
            id: `check_${Date.now()}_${parentId}`,
            childId,
            parentId,
            type: 'check',
            checkType, // 'standing' or 'clothing'
            passed,
            timestamp: now,
            checkTime: now, // Time when this specific check was completed
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
    addCompleteRecord(childId, parentId, standingComplete, clothingComplete, standingTime = null, uniformTime = null) {
        const records = this.getAllRecords();
        const now = new Date().toISOString();
        const record = {
            id: `complete_${Date.now()}_${parentId}`,
            childId,
            parentId,
            type: 'complete',
            standingComplete,
            clothingComplete,
            timestamp: now,
            standingTime: standingTime || (standingComplete ? now : null),
            uniformTime: uniformTime || (clothingComplete ? now : null),
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
        // Get all records for this child
        const records = this.getChildRecords(childId);

        // Filter for today's records
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysRecords = records.filter(r => {
            const recordDate = new Date(r.timestamp);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
        });

        // 1. Check for a complete record first (highest priority)
        const completeRecord = todaysRecords.find(r => r.type === 'complete');

        if (completeRecord) {
            return {
                standingComplete: completeRecord.standingComplete || false,
                clothingComplete: completeRecord.clothingComplete || false,
                timestamp: completeRecord.timestamp,
                standingTime: completeRecord.standingTime,
                uniformTime: completeRecord.uniformTime
            };
        }

        // 2. If no complete record, aggregate individual checks
        const standingCheck = todaysRecords.find(r => r.type === 'check' && r.checkType === 'standing' && r.passed);
        const clothingCheck = todaysRecords.find(r => r.type === 'check' && r.checkType === 'clothing' && r.passed);

        return {
            standingComplete: !!standingCheck,
            clothingComplete: !!clothingCheck,
            // Use the latest timestamp
            timestamp: standingCheck
                ? (clothingCheck && new Date(clothingCheck.timestamp) > new Date(standingCheck.timestamp) ? clothingCheck.timestamp : standingCheck.timestamp)
                : (clothingCheck ? clothingCheck.timestamp : null),
            standingTime: standingCheck ? (standingCheck.checkTime || standingCheck.timestamp) : null,
            uniformTime: clothingCheck ? (clothingCheck.checkTime || clothingCheck.timestamp) : null
        };
    }

    /**
     * Get records grouped by date for calendar view
     */
    getRecordsByDate(parentId, allUsers = []) {
        const records = this.getParentRecords(parentId);

        // Group records by date
        const recordsByDate = {};

        records.forEach(record => {
            if (!record || !record.timestamp) return;

            const date = new Date(record.timestamp);
            if (isNaN(date.getTime())) return; // Skip invalid dates

            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!recordsByDate[dateKey]) {
                recordsByDate[dateKey] = [];
            }

            // Get child name
            const child = allUsers.find(u => u && u.id === record.childId);
            const childName = child ? child.name : 'Unknown';

            // Extract times
            let standingTime = null;
            let uniformTime = null;

            if (record.type === 'complete') {
                // For complete records, use the stored times or fallback to timestamp
                standingTime = record.standingTime || (record.standingComplete ? record.timestamp : null);
                uniformTime = record.uniformTime || (record.clothingComplete ? record.timestamp : null);
            } else if (record.type === 'check') {
                // For individual check records, extract the time
                if (record.checkType === 'standing') {
                    standingTime = record.checkTime || record.timestamp;
                } else if (record.checkType === 'clothing') {
                    uniformTime = record.checkTime || record.timestamp;
                }
            }

            recordsByDate[dateKey].push({
                childId: record.childId,
                childName,
                standingTime,
                uniformTime,
                timestamp: record.timestamp
            });
        });

        return recordsByDate;
    }

    /**
     * Get records grouped by child and date
     */
    getRecordsByChildAndDate(parentId, allUsers = []) {
        const recordsByDate = this.getRecordsByDate(parentId, allUsers);
        const result = {};

        Object.keys(recordsByDate).forEach(date => {
            recordsByDate[date].forEach(record => {
                if (!result[record.childId]) {
                    result[record.childId] = {};
                }
                if (!result[record.childId][date]) {
                    result[record.childId][date] = {
                        childName: record.childName,
                        standingTime: null,
                        uniformTime: null
                    };
                }

                // Use the earliest standing time and uniform time for each day
                if (record.standingTime) {
                    if (!result[record.childId][date].standingTime ||
                        new Date(record.standingTime) < new Date(result[record.childId][date].standingTime)) {
                        result[record.childId][date].standingTime = record.standingTime;
                    }
                }

                if (record.uniformTime) {
                    if (!result[record.childId][date].uniformTime ||
                        new Date(record.uniformTime) < new Date(result[record.childId][date].uniformTime)) {
                        result[record.childId][date].uniformTime = record.uniformTime;
                    }
                }
            });
        });

        return result;
    }
}
