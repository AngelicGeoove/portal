/**
 * Conflict Detection Utility
 * Checks for booking conflicts
 */

import { timeRangesOverlap, getDayOfWeek } from './dateUtils.js';

/**
 * Check if a new booking conflicts with existing bookings
 */
export function checkBookingConflict(newBooking, existingBookings) {
    const conflicts = [];

    for (const booking of existingBookings) {
        // Skip if different rooms
        if (booking.roomId !== newBooking.roomId) continue;

        // Check permanent vs permanent conflicts
        if (newBooking.type === 'permanent' && booking.type === 'permanent') {
            if (booking.dayOfWeek === newBooking.dayOfWeek) {
                if (timeRangesOverlap(booking.startTime, booking.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        booking,
                        reason: 'Overlaps with existing permanent booking'
                    });
                }
            }
        }

        // Check event vs event conflicts
        if (newBooking.type === 'event' && booking.type === 'event') {
            if (booking.date === newBooking.date) {
                if (timeRangesOverlap(booking.startTime, booking.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        booking,
                        reason: 'Overlaps with existing event booking'
                    });
                }
            }
        }

        // Check event vs permanent conflicts
        if (newBooking.type === 'event' && booking.type === 'permanent') {
            const eventDayOfWeek = getDayOfWeek(newBooking.date);
            
            if (booking.dayOfWeek === eventDayOfWeek) {
                // Check if this date is marked as temporarily free
                if (booking.temporaryFreeDates && booking.temporaryFreeDates.includes(newBooking.date)) {
                    continue; // No conflict, room is marked free
                }
                
                if (timeRangesOverlap(booking.startTime, booking.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        booking,
                        reason: 'Overlaps with recurring permanent booking'
                    });
                }
            }
        }

        // Check permanent vs event conflicts (when checking future events)
        if (newBooking.type === 'permanent' && booking.type === 'event') {
            const eventDayOfWeek = getDayOfWeek(booking.date);
            
            if (newBooking.dayOfWeek === eventDayOfWeek) {
                if (timeRangesOverlap(booking.startTime, booking.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        booking,
                        reason: `Conflicts with event on ${booking.date}`,
                        isWarning: true // This might be acceptable
                    });
                }
            }
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflicts
    };
}

/**
 * Check if a room is unavailable at a specific time
 */
export function checkUnavailability(roomId, date, startTime, endTime, unavailablePeriods) {
    const dayOfWeek = getDayOfWeek(date);

    for (const period of unavailablePeriods) {
        if (period.roomId !== roomId) continue;

        // Check specific date unavailability
        if (period.date && period.date === date) {
            if (timeRangesOverlap(period.startTime, period.endTime, startTime, endTime)) {
                return {
                    isUnavailable: true,
                    period,
                    reason: period.customMessage || `Room is ${period.reason.replace('_', ' ')}`
                };
            }
        }

        // Check recurring unavailability
        if (period.isRecurring && period.dayOfWeek === dayOfWeek) {
            if (timeRangesOverlap(period.startTime, period.endTime, startTime, endTime)) {
                return {
                    isUnavailable: true,
                    period,
                    reason: period.customMessage || `Room is ${period.reason.replace('_', ' ')} every ${getDayName(dayOfWeek)}`
                };
            }
        }
    }

    return {
        isUnavailable: false
    };
}

/**
 * Find alternative available rooms at the same time
 */
export function findAlternativeRooms(allRooms, targetDate, startTime, endTime, existingBookings, unavailablePeriods) {
    const availableRooms = [];

    for (const room of allRooms) {
        // Check conflicts
        const conflictCheck = checkBookingConflict(
            { roomId: room.roomId, type: 'event', date: targetDate, startTime, endTime },
            existingBookings.filter(b => b.roomId === room.roomId)
        );

        // Check unavailability
        const unavailCheck = checkUnavailability(
            room.roomId,
            targetDate,
            startTime,
            endTime,
            unavailablePeriods.filter(p => p.roomId === room.roomId)
        );

        if (!conflictCheck.hasConflict && !unavailCheck.isUnavailable) {
            availableRooms.push(room);
        }
    }

    return availableRooms;
}

/**
 * Get day name helper
 */
function getDayName(dayNumber) {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNumber] || '';
}
