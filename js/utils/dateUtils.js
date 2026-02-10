/**
 * Date and Time Utilities
 */

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Get day of week from date (1-7, Monday-Sunday)
 */
export function getDayOfWeek(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 ? 7 : day; // Convert Sunday from 0 to 7
}

/**
 * Get day name from day number
 */
export function getDayName(dayNumber) {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNumber] || '';
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format time for display (12-hour format)
 */
export function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${hour12}:${minutes} ${period}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(start1, end1, start2, end2) {
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    
    return s1 < e2 && s2 < e1;
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime, endTime) {
    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    return toMinutes(endTime) - toMinutes(startTime);
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
}

/**
 * Get all dates for a specific day of week between two dates
 */
export function getDatesForDayOfWeek(startDate, endDate, dayOfWeek) {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    // Move to first occurrence of dayOfWeek
    while (getDayOfWeek(current.toISOString().split('T')[0]) !== dayOfWeek) {
        current.setDate(current.getDate() + 1);
    }
    
    // Collect all occurrences
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 7);
    }
    
    return dates;
}

/**
 * Check if a date is today
 */
export function isToday(dateString) {
    return dateString === getCurrentDate();
}

/**
 * Check if a date is in the past
 */
export function isPast(dateString) {
    return new Date(dateString) < new Date(getCurrentDate());
}

/**
 * Check if a date is in the future
 */
export function isFuture(dateString) {
    return new Date(dateString) > new Date(getCurrentDate());
}

/**
 * Get time slots for calendar (6 AM to 8 PM in 30-minute intervals)
 */
export function getTimeSlots() {
    const slots = [];
    for (let hour = 6; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 20 && minute > 0) break; // Stop at 8:00 PM
            
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            slots.push({
                time,
                display: formatTime(time)
            });
        }
    }
    return slots;
}

/**
 * Calculate grid row position for a time in the timeline
 */
export function getTimeSlotIndex(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const startHour = 6; // 6 AM
    
    return ((hours - startHour) * 2) + (minutes >= 30 ? 1 : 0);
}

/**
 * Get current time slot index
 */
export function getCurrentTimeSlotIndex() {
    return getTimeSlotIndex(getCurrentTime());
}

/**
 * Get the Monday of the week containing the given date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Monday of that week in YYYY-MM-DD format
 */
export function getWeekStart(dateString) {
    const date = new Date(dateString);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
    date.setDate(date.getDate() + diff);
    return date.toISOString().split('T')[0];
}

/**
 * Add or subtract weeks from a date
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {number} weeks - Number of weeks to add (negative to subtract)
 * @returns {string} - New date in YYYY-MM-DD format
 */
export function addWeeks(dateString, weeks) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + (weeks * 7));
    return date.toISOString().split('T')[0];
}
