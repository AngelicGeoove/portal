/**
 * Timeline Calendar Component
 * Renders the visual calendar/timeline view
 */

import { getTimeSlots, formatTime, getCurrentTime, getTimeSlotIndex } from '../utils/dateUtils.js';

/**
 * Render timeline for a specific date
 * @param {string} containerId - ID of container element
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} halls - Array of lecture hall objects with rooms
 * @param {Array} bookings - Array of booking objects
 * @param {string} mode - 'full' or 'current' (next 2 hours)
 */
export function renderTimeline(containerId, date, halls, bookings, mode = 'full') {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }

    container.innerHTML = '';

    const timeSlots = getTimeSlots();
    let displaySlots = timeSlots;

    // Filter slots for 'current' mode
    if (mode === 'current') {
        const currentTime = getCurrentTime();
        const currentIndexRaw = getTimeSlotIndex(currentTime);
        const currentIndex = clamp(currentIndexRaw, 0, Math.max(0, timeSlots.length - 1));
        displaySlots = timeSlots.slice(
            Math.max(0, currentIndex),
            Math.min(timeSlots.length, currentIndex + 4)
        );

        // If we're outside the configured timeline hours, fall back to the last 4 slots.
        if (displaySlots.length === 0 && timeSlots.length > 0) {
            displaySlots = timeSlots.slice(Math.max(0, timeSlots.length - 4));
        }
    }

    const dayOfWeek = getDayOfWeekFromDate(date);
    const bookingsForDay = dedupeBookings(filterBookingsForDate(bookings, date, dayOfWeek));

    // Create timeline grid
    const timeline = document.createElement('div');
    timeline.className = 'timeline-grid';

    // Render time column
    const timeColumn = createTimeColumn(displaySlots);
    timeline.appendChild(timeColumn);

    // Render hall/room columns
    halls.forEach(hall => {
        const hallColumn = createHallColumn(hall, displaySlots, bookingsForDay, date);
        timeline.appendChild(hallColumn);
    });

    container.appendChild(timeline);

    // Add current time marker if in today and full mode
    if (mode === 'full') {
        addCurrentTimeMarker(timeline, displaySlots);
    }

    // Add legend
    const legend = createLegend();
    container.appendChild(legend);
}

/**
 * Create time labels column
 */
function createTimeColumn(timeSlots) {
    const column = document.createElement('div');
    column.className = 'timeline-time-column';

    timeSlots.forEach(slot => {
        const label = document.createElement('div');
        label.className = 'timeline-time-label';
        label.textContent = slot.display;
        column.appendChild(label);
    });

    return column;
}

/**
 * Create hall column with rooms
 */
function createHallColumn(hall, timeSlots, bookings, date) {
    const column = document.createElement('div');
    column.className = 'timeline-hall-column';

    const hallKey = hall?.hallId || hall?.id || hall?.key || hall?.name || '';

    // Hall header
    const header = document.createElement('div');
    header.className = 'timeline-hall-header clickable';
    header.textContent = hall.name;
    header.dataset.hallId = hallKey;
    column.appendChild(header);

    // Time slots container
    const slotsContainer = document.createElement('div');
    slotsContainer.className = 'timeline-time-slots';

    // Render background slots (hover + current-hour highlight)
    const currentTime = getCurrentTime();
    const slotHeightPx = 60; // matches CSS (min-height: 60px)
    const timeStartMinutes = timeToMinutes(timeSlots[0]?.time || '06:00');
    const visibleRangeMinutes = Math.max(0, (timeSlots.length - 1) * 30);

    timeSlots.forEach((slot, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'timeline-slot';
        slotDiv.dataset.time = slot.time;

        if (slot.time <= currentTime && timeSlots[index + 1]?.time > currentTime) {
            slotDiv.classList.add('current-hour');
        }

        slotsContainer.appendChild(slotDiv);
    });

    // Render booking blocks once (prevents duplicates across slots)
    const layer = document.createElement('div');
    layer.style.position = 'absolute';
    layer.style.top = '0';
    layer.style.left = '0';
    layer.style.right = '0';
    layer.style.bottom = '0';
    layer.style.pointerEvents = 'none';

    const hallBookings = bookings.filter(b => bookingMatchesHall(b, hall));
    hallBookings.forEach(booking => {
        const block = createBookingBlock(booking, timeStartMinutes, visibleRangeMinutes, slotHeightPx);
        if (!block) return;
        block.style.pointerEvents = 'auto';
        layer.appendChild(block);
    });

    slotsContainer.appendChild(layer);

    column.appendChild(slotsContainer);

    return column;
}

/**
 * Create booking block element
 */
function createBookingBlock(booking, timeStartMinutes, visibleRangeMinutes, slotHeightPx) {
    if (!booking?.startTime || !booking?.endTime) return null;

    const block = document.createElement('div');
    block.className = `booking-block booking-${booking.type}`;
    block.dataset.bookingId = booking.bookingId;

    // Calculate position and height
    const startMinutes = timeToMinutes(booking.startTime);
    const endMinutes = timeToMinutes(booking.endTime);

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
    if (endMinutes <= startMinutes) return null;

    const visibleStart = Math.max(startMinutes, timeStartMinutes);
    const visibleEnd = Math.min(endMinutes, timeStartMinutes + visibleRangeMinutes);
    if (visibleEnd <= visibleStart) return null;

    const visibleDuration = visibleEnd - visibleStart;
    const height = (visibleDuration / 30) * slotHeightPx;
    const top = ((visibleStart - timeStartMinutes) / 30) * slotHeightPx;

    block.style.height = `${height}px`;
    block.style.top = `${top}px`;

    block.innerHTML = `
        <div class="booking-block-title">${booking.courseName || booking.eventName}</div>
        <div class="booking-block-time">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</div>
    `;

    // Click handler
    block.addEventListener('click', () => {
        showBookingDetails(booking);
    });

    return block;
}

/**
 * Convert time string to minutes
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
}

function bookingMatchesHall(booking, hall) {
    // If the caller didn't provide a real hall object (e.g., student single-column schedule), show everything.
    const hallKey = hall?.hallId || hall?.id || null;
    if (!hallKey) return true;

    // Prefer hallId match when available.
    if (booking?.hallId && booking.hallId === hallKey) return true;

    // Fallback: match by hallName (best-effort).
    if (booking?.hallName && hall?.name && booking.hallName === hall.name) return true;

    // If the hall has an explicit list of room IDs, use that.
    if (Array.isArray(hall.roomIds) && booking?.roomId) {
        return hall.roomIds.includes(booking.roomId);
    }

    // Otherwise, don't filter out.
    return true;
}

function getDayOfWeekFromDate(dateString) {
    // Returns 1-7 (Mon-Sun)
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 ? 7 : day;
}

function filterBookingsForDate(bookings, date, dayOfWeek) {
    return (bookings || []).filter((b) => {
        if (!b?.isActive && b?.isActive !== undefined) return false;

        if (b.type === 'event') {
            return b.date === date;
        }

        if (b.type === 'permanent') {
            if (b.dayOfWeek !== dayOfWeek) return false;

            // If marked temporarily free for this date, do not show as a class session.
            if (Array.isArray(b.temporaryFreeDates) && b.temporaryFreeDates.includes(date)) {
                return false;
            }

            return true;
        }

        // Unknown booking type: keep it visible if it at least has times.
        return Boolean(b.startTime && b.endTime);
    });
}

function dedupeBookings(bookings) {
    const map = new Map();
    for (const b of bookings || []) {
        const key = b?.bookingId || b?.id || `${b?.type || ''}:${b?.date || b?.dayOfWeek || ''}:${b?.roomId || ''}:${b?.startTime || ''}-${b?.endTime || ''}:${b?.courseName || b?.title || ''}`;
        if (!map.has(key)) {
            map.set(key, b);
        }
    }
    return Array.from(map.values());
}

/**
 * Add current time marker
 */
function addCurrentTimeMarker(timeline, timeSlots) {
    const now = new Date();
    const currentTime = getCurrentTime();
    
    // Calculate position
    const firstSlot = timeSlots[0];
    const [firstHour] = firstSlot.time.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    
    const minutesFromStart = (currentHour - firstHour) * 60 + currentMinute;
    const position = (minutesFromStart / 30) * 60; // 60px per 30 min

    const marker = document.createElement('div');
    marker.className = 'current-time-marker';
    marker.style.top = `${position + 60}px`; // +60 for header
    marker.dataset.time = formatTime(currentTime);

    timeline.appendChild(marker);

    // Update every minute
    setTimeout(() => addCurrentTimeMarker(timeline, timeSlots), 60000);
}

/**
 * Create legend
 */
function createLegend() {
    const legend = document.createElement('div');
    legend.className = 'calendar-legend';

    const items = [
        { color: '#3b82f6', label: 'Permanent Booking' },
        { color: '#8b5cf6', label: 'Event Booking' },
        { color: '#fbbf24', label: 'Temporarily Free' },
        { color: '#10b981', label: 'Available' },
        { color: '#ef4444', label: 'Unavailable' }
    ];

    items.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${item.color}"></div>
            <span>${item.label}</span>
        `;
        legend.appendChild(legendItem);
    });

    return legend;
}

/**
 * Show booking details (to be implemented)
 */
function showBookingDetails(booking) {
    console.log('Show booking details:', booking);
    // This would open a modal with booking details
}

/**
 * Export for use in other modules
 */
export { createBookingBlock, createLegend };
