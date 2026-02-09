/**
 * User Service
 * Handles user-related database operations
 */

import { db } from '../firebase-config.js';

/**
 * Get user by ID
 */
export async function getUser(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        
        if (!doc.exists) return null;

        return {
            userId: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Get all users
 */
export async function getAllUsers() {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get users error:', error);
        return [];
    }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role) {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', role)
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get users by role error:', error);
        return [];
    }
}

/**
 * Get lecturers (staff with isLecturer = true)
 */
export async function getLecturers() {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'staff')
            .where('isLecturer', '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get lecturers error:', error);
        return [];
    }
}

/**
 * Get staff managing a specific index prefix
 */
export async function getStaffByIndexPrefix(prefix) {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'staff')
            .where('managedIndexPrefixes', 'array-contains', prefix)
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get staff by prefix error:', error);
        return [];
    }
}

/**
 * Get students assigned to a staff member
 */
export async function getStudentsByStaff(staffId) {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'student')
            .where('assignedToStaff', 'array-contains', staffId)
            .get();

        return snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get students by staff error:', error);
        return [];
    }
}

/**
 * Update user data
 */
export async function updateUser(userId, updates) {
    try {
        await db.collection('users').doc(userId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user statistics
 */
export async function getUserStats() {
    try {
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => doc.data());

        const stats = {
            total: users.length,
            students: users.filter(u => u.role === 'student').length,
            staff: users.filter(u => u.role === 'staff').length,
            lecturers: users.filter(u => u.role === 'staff' && u.isLecturer).length,
            admins: users.filter(u => u.role === 'admin').length
        };

        return stats;
    } catch (error) {
        console.error('Get user stats error:', error);
        return {
            total: 0,
            students: 0,
            staff: 0,
            lecturers: 0,
            admins: 0
        };
    }
}
