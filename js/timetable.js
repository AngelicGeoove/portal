/**
 * Public Timetable Page
 * Displays weekly schedule without requiring login
 */

import { db } from './firebase-config.js';
import { showToast } from './components/Toast.js';
import { renderWeeklyTimetable } from './components/WeeklyTimetable.js';
import { getCurrentDate, getWeekStart, addWeeks, getDayOfWeek } from './utils/dateUtils.js';

let cachedHalls = null;

/**
 * Initialize public timetable page
 */
async function init() {
    try {
        await loadHalls();
        setupControls();
        loadTimetable();
    } catch (error) {
        console.error('Error initializing timetable:', error);
        showToast('error', 'Failed to initialize timetable');
    }
}

/**
 * Load lecture halls into filter
 */
async function loadHalls() {
    try {
        const snapshot = await db.collection('lectureHalls').get();
        cachedHalls = snapshot.docs.map(doc => ({
            id: doc.id,
            hallId: doc.id,
            ...doc.data()
        }));

        const hallFilter = document.getElementById('hallFilter');
        if (hallFilter) {
            hallFilter.innerHTML = '<option value="">All Halls</option>' +
                cachedHalls.map(hall => 
                    `<option value="${hall.id}">${hall.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading halls:', error);
        showToast('error', 'Failed to load lecture halls');
    }
}

/**
 * Setup week navigation and filter controls
 */
function setupControls() {
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const weekDate = document.getElementById('weekDate');
    const hallFilter = document.getElementById('hallFilter');

    // Initialize to current week Monday
    if (weekDate) {
        weekDate.value = getWeekStart(getCurrentDate());
    }

    prevWeekBtn?.addEventListener('click', () => {
        const current = weekDate?.value || getCurrentDate();
        const newDate = addWeeks(getWeekStart(current), -1);
        if (weekDate) weekDate.value = newDate;
        loadTimetable();
    });

    nextWeekBtn?.addEventListener('click', () => {
        const current = weekDate?.value || getCurrentDate();
        const newDate = addWeeks(getWeekStart(current), 1);
        if (weekDate) weekDate.value = newDate;
        loadTimetable();
    });

    weekDate?.addEventListener('change', () => {
        const weekStart = getWeekStart(weekDate.value);
        weekDate.value = weekStart;
        loadTimetable();
    });

    hallFilter?.addEventListener('change', () => loadTimetable());
}

/**
 * Load and display timetable
 */
async function loadTimetable() {
    const container = document.getElementById('timetableContainer');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading timetable...</p>';

    try {
        const weekDate = document.getElementById('weekDate');
        const hallFilter = document.getElementById('hallFilter');

        let weekStartDate = weekDate?.value || getCurrentDate();
        weekStartDate = getWeekStart(weekStartDate);

        const hallId = hallFilter?.value || '';

        // Get bookings for the entire week
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStartDate);
            d.setDate(d.getDate() + i);
            weekDates.push(d.toISOString().slice(0, 10));
        }

        // Fetch bookings for all days
        const bookingsPromises = weekDates.map((date, idx) => 
            getBookingsForDate(date, idx + 1)
        );
        const bookingsArrays = await Promise.all(bookingsPromises);
        const allBookings = bookingsArrays.flat();

        // Filter by hall if selected
        let filteredBookings = allBookings;
        if (hallId) {
            filteredBookings = allBookings.filter(b => b.hallId === hallId);
        }

        // Determine title
        let title = 'Weekly Class Schedule';
        if (hallId && cachedHalls) {
            const hall = cachedHalls.find(h => h.id === hallId);
            title = hall ? `${hall.name} - Weekly Schedule` : 'Weekly Class Schedule';
        } else {
            title = 'All Halls - Weekly Schedule';
        }

        renderWeeklyTimetable('timetableContainer', weekStartDate, filteredBookings, {
            title
        });
    } catch (error) {
        console.error('Error loading timetable:', error);
        container.innerHTML = '<p class="empty-state">Failed to load timetable</p>';
        showToast('error', 'Failed to load timetable');
    }
}

/**
 * Get bookings for a specific date
 */
async function getBookingsForDate(date, dayOfWeek) {
    const bookings = [];

    try {
        // Get permanent bookings for this day of week
        const permanentSnapshot = await db.collection('bookings')
            .where('type', '==', 'permanent')
            .where('dayOfWeek', '==', dayOfWeek)
            .where('isActive', '==', true)
            .get();

        for (const doc of permanentSnapshot.docs) {
            const booking = { id: doc.id, bookingId: doc.id, ...doc.data() };
            
            // Skip if this date is marked as temporarily free
            if (Array.isArray(booking.temporaryFreeDates) && 
                booking.temporaryFreeDates.includes(date)) {
                continue;
            }

            bookings.push(booking);
        }

        // Get event bookings for this specific date
        const eventSnapshot = await db.collection('bookings')
            .where('type', '==', 'event')
            .where('date', '==', date)
            .where('isActive', '==', true)
            .get();

        eventSnapshot.docs.forEach(doc => {
            bookings.push({ id: doc.id, bookingId: doc.id, ...doc.data() });
        });

    } catch (error) {
        console.error('Error fetching bookings for date:', date, error);
    }

    return bookings;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
