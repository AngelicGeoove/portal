/**
 * Booking Service
 * Handles all booking-related database operations
 */

import { db } from '../firebase-config.js';
import { getCurrentUser } from '../auth.js';

/**
 * Create a new booking
 */
export async function createBooking(bookingData) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const booking = {
            ...bookingData,
            staffId: user.userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            temporaryFreeDates: []
        };

        const docRef = await db.collection('bookings').add(booking);
        
        return {
            success: true,
            bookingId: docRef.id,
            booking: { ...booking, bookingId: docRef.id }
        };
    } catch (error) {
        console.error('Create booking error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all bookings
 */
export async function getAllBookings() {
    try {
        const snapshot = await db.collection('bookings')
            .where('isActive', '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get bookings error:', error);
        return [];
    }
}

/**
 * Get bookings by room
 */
export async function getBookingsByRoom(roomId) {
    try {
        const snapshot = await db.collection('bookings')
            .where('roomId', '==', roomId)
            .where('isActive', '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get room bookings error:', error);
        return [];
    }
}

/**
 * Get bookings by staff member
 */
export async function getBookingsByStaff(staffId) {
    try {
        const snapshot = await db.collection('bookings')
            .where('staffId', '==', staffId)
            .where('isActive', '==', true)
            .get();

        const bookings = snapshot.docs.map(doc => ({
            bookingId: doc.id,
            id: doc.id,
            ...doc.data()
        }));
        
        // Sort by createdAt client-side
        return bookings.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error('Get staff bookings error:', error);
        return [];
    }
}

/**
 * Get bookings by index prefix (for students)
 */
export async function getBookingsByIndexPrefix(indexPrefix) {
    try {
        const snapshot = await db.collection('bookings')
            .where('indexPrefix', '==', indexPrefix)
            .where('isActive', '==', true)
            .get();

        return snapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Get index bookings error:', error);
        return [];
    }
}

/**
 * Update booking
 */
export async function updateBooking(bookingId, updates) {
    try {
        await db.collection('bookings').doc(bookingId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Update booking error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete booking (soft delete)
 */
export async function deleteBooking(bookingId) {
    try {
        await db.collection('bookings').doc(bookingId).update({
            isActive: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Delete booking error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark booking as temporarily free for specific dates
 */
export async function markTemporarilyFree(bookingId, dates) {
    try {
        const docRef = db.collection('bookings').doc(bookingId);
        const doc = await docRef.get();
        
        if (!doc.exists) throw new Error('Booking not found');

        const currentDates = doc.data().temporaryFreeDates || [];
        const updatedDates = [...new Set([...currentDates, ...dates])];

        await docRef.update({
            temporaryFreeDates: updatedDates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Mark temp free error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove temporarily free dates
 */
export async function removeTemporarilyFree(bookingId, dates) {
    try {
        const docRef = db.collection('bookings').doc(bookingId);
        const doc = await docRef.get();
        
        if (!doc.exists) throw new Error('Booking not found');

        const currentDates = doc.data().temporaryFreeDates || [];
        const updatedDates = currentDates.filter(d => !dates.includes(d));

        await docRef.update({
            temporaryFreeDates: updatedDates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Remove temp free error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get bookings for a specific date
 */
export async function getBookingsForDate(date, dayOfWeek) {
    try {
        // Get permanent bookings for this day of week
        const permanentSnapshot = await db.collection('bookings')
            .where('type', '==', 'permanent')
            .where('dayOfWeek', '==', dayOfWeek)
            .where('isActive', '==', true)
            .get();

        const permanentBookings = permanentSnapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data()
        }));

        // Get event bookings for this specific date
        const eventSnapshot = await db.collection('bookings')
            .where('type', '==', 'event')
            .where('date', '==', date)
            .where('isActive', '==', true)
            .get();

        const eventBookings = eventSnapshot.docs.map(doc => ({
            bookingId: doc.id,
            ...doc.data()
        }));

        return [...permanentBookings, ...eventBookings];
    } catch (error) {
        console.error('Get date bookings error:', error);
        return [];
    }
}

/**
 * Get bookings by user ID (alias for getBookingsByStaff)
 */
export async function getBookingsByUser(userId) {
    return getBookingsByStaff(userId);
}
