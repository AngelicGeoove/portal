/**
 * Room Service
 * Handles all room and lecture hall related database operations
 */

import { db } from '../firebase-config.js';

/**
 * Create a new lecture hall
 */
export async function createLectureHall(hallData) {
    try {
        const hall = {
            ...hallData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('lectureHalls').add(hall);
        
        return {
            success: true,
            hallId: docRef.id,
            hall: { ...hall, hallId: docRef.id }
        };
    } catch (error) {
        console.error('Create hall error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all lecture halls
 */
export async function getAllLectureHalls() {
    try {
        const snapshot = await db.collection('lectureHalls').get();

        const halls = snapshot.docs.map(doc => ({
            hallId: doc.id,
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort by name client-side
        return halls.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch (error) {
        console.error('Get halls error:', error);
        return [];
    }
}

/**
 * Get lecture hall by ID
 */
export async function getLectureHall(hallId) {
    try {
        const doc = await db.collection('lectureHalls').doc(hallId).get();
        
        if (!doc.exists) return null;

        return {
            hallId: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Get hall error:', error);
        return null;
    }
}

/**
 * Update lecture hall
 */
export async function updateLectureHall(hallId, updates) {
    try {
        await db.collection('lectureHalls').doc(hallId).update(updates);
        return { success: true };
    } catch (error) {
        console.error('Update hall error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete lecture hall
 */
export async function deleteLectureHall(hallId) {
    try {
        // Check if hall has rooms
        const roomsSnapshot = await db.collection('rooms')
            .where('hallId', '==', hallId)
            .limit(1)
            .get();

        if (!roomsSnapshot.empty) {
            throw new Error('Cannot delete hall with existing rooms');
        }

        await db.collection('lectureHalls').doc(hallId).delete();
        return { success: true };
    } catch (error) {
        console.error('Delete hall error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new room
 */
export async function createRoom(roomData) {
    try {
        const room = {
            ...roomData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('rooms').add(room);
        
        return {
            success: true,
            roomId: docRef.id,
            room: { ...room, roomId: docRef.id }
        };
    } catch (error) {
        console.error('Create room error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all rooms
 */
export async function getAllRooms() {
    try {
        const snapshot = await db.collection('rooms').get();

        const rooms = snapshot.docs.map(doc => ({
            roomId: doc.id,
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort client-side
        return rooms.sort((a, b) => {
            if (a.hallId !== b.hallId) return a.hallId.localeCompare(b.hallId);
            return (a.number || '').localeCompare(b.number || '');
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        return [];
    }
}

/**
 * Get rooms by lecture hall
 */
export async function getRoomsByHall(hallId) {
    try {
        const snapshot = await db.collection('rooms')
            .where('hallId', '==', hallId)
            .get();

        const rooms = snapshot.docs.map(doc => ({
            roomId: doc.id,
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort by room number client-side
        return rooms.sort((a, b) => (a.number || '').localeCompare(b.number || ''));
    } catch (error) {
        console.error('Get hall rooms error:', error);
        return [];
    }
}

/**
 * Get room by ID
 */
export async function getRoom(roomId) {
    try {
        const doc = await db.collection('rooms').doc(roomId).get();
        
        if (!doc.exists) return null;

        return {
            roomId: doc.id,
            ...doc.data()
        };
    } catch (error) {
        console.error('Get room error:', error);
        return null;
    }
}

/**
 * Update room
 */
export async function updateRoom(roomId, updates) {
    try {
        await db.collection('rooms').doc(roomId).update(updates);
        return { success: true };
    } catch (error) {
        console.error('Update room error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete room
 */
export async function deleteRoom(roomId) {
    try {
        // For now, allow deletion (we can add booking checks later with proper indexes)
        await db.collection('rooms').doc(roomId).delete();
        return { success: true };
    } catch (error) {
        console.error('Delete room error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create unavailable period
 */
export async function createUnavailablePeriod(periodData) {
    try {
        const period = {
            ...periodData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('unavailablePeriods').add(period);
        
        return {
            success: true,
            periodId: docRef.id,
            period: { ...period, periodId: docRef.id }
        };
    } catch (error) {
        console.error('Create unavailable period error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all unavailable periods
 */
export async function getAllUnavailablePeriods() {
    try {
        const snapshot = await db.collection('unavailablePeriods').get();

        return snapshot.docs.map(doc => ({
            periodId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get unavailable periods error:', error);
        return [];
    }
}

/**
 * Get unavailable periods by room
 */
export async function getUnavailablePeriodsByRoom(roomId) {
    try {
        const snapshot = await db.collection('unavailablePeriods')
            .where('roomId', '==', roomId)
            .get();

        return snapshot.docs.map(doc => ({
            periodId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get room unavailable periods error:', error);
        return [];
    }
}

/**
 * Delete unavailable period
 */
export async function deleteUnavailablePeriod(periodId) {
    try {
        await db.collection('unavailablePeriods').doc(periodId).delete();
        return { success: true };
    } catch (error) {
        console.error('Delete unavailable period error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Search rooms by features
 */
export async function searchRoomsByFeatures(criteria) {
    try {
        let query = db.collection('rooms');

        if (criteria.hallId) {
            query = query.where('hallId', '==', criteria.hallId);
        }

        if (criteria.minCapacity) {
            query = query.where('capacity', '>=', criteria.minCapacity);
        }

        const snapshot = await query.get();
        let rooms = snapshot.docs.map(doc => ({
            roomId: doc.id,
            ...doc.data()
        }));

        // Filter by features (client-side)
        if (criteria.hasProjector) {
            rooms = rooms.filter(r => r.features?.hasProjector);
        }

        if (criteria.hasMicSpeaker) {
            rooms = rooms.filter(r => r.features?.hasMicSpeaker);
        }

        if (criteria.minSockets) {
            rooms = rooms.filter(r => r.features?.workingSockets >= criteria.minSockets);
        }

        return rooms;
    } catch (error) {
        console.error('Search rooms error:', error);
        return [];
    }
}

// Alias functions for backwards compatibility
export const getAllHalls = getAllLectureHalls;
export const getHall = getLectureHall;
export const createHall = createLectureHall;
export const updateHall = updateLectureHall;
export const deleteHall = deleteLectureHall;
export const createUnavailability = createUnavailablePeriod;
export const getAllUnavailability = getAllUnavailablePeriods;
export const deleteUnavailability = deleteUnavailablePeriod;
