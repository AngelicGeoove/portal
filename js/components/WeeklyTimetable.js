/**
 * Weekly Timetable Component
 * Renders a classic timetable grid:
 * - Rows: Monday -> Sunday
 * - Columns: 6:00 -> 20:00
 *
 * Bookings supported:
 * - permanent: uses dayOfWeek (1-7) + startTime/endTime
 * - event: uses date (YYYY-MM-DD) + startTime/endTime
 */

import { formatTime, getDayName, getDayOfWeek } from '../utils/dateUtils.js';
import { openModal } from './Modal.js';

const START_TIME = '06:00';
const END_TIME = '20:00';
const MINUTES_PER_DAY = minutesBetween(START_TIME, END_TIME);

export function renderWeeklyTimetable(containerId, weekStartDate, bookings, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const title = options.title || '';

    const weekStart = toDateAtMidnight(weekStartDate);
    const days = buildWeekDays(weekStart);

    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'weekly-timetable';

    if (title) {
        const header = document.createElement('div');
        header.className = 'weekly-timetable-title';
        header.textContent = title;
        wrapper.appendChild(header);
    }

    // Header row: time labels
    const grid = document.createElement('div');
    grid.className = 'weekly-timetable-grid';

    const corner = document.createElement('div');
    corner.className = 'weekly-timetable-corner';
    corner.textContent = 'Day';
    grid.appendChild(corner);

    buildTimeHeaderCells().forEach(cell => grid.appendChild(cell));

    // Each day row
    for (const day of days) {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'weekly-timetable-day-label';
        dayLabel.innerHTML = `
            <div class="day-name">${escapeHtml(day.name)}</div>
            <div class="day-date">${escapeHtml(day.iso)}</div>
        `;
        grid.appendChild(dayLabel);

        const dayTrack = document.createElement('div');
        dayTrack.className = 'weekly-timetable-day-track';
        dayTrack.dataset.date = day.iso;

        // background hour lines
        dayTrack.appendChild(buildTrackBackground());

        // bookings for this day
        const dayBookings = filterBookingsForDay(bookings, day.iso, day.dayOfWeek);
        renderBookingsIntoTrack(dayTrack, dayBookings, day.iso);

        grid.appendChild(dayTrack);
    }

    wrapper.appendChild(grid);
    container.appendChild(wrapper);
}

export function getWeekStartFromAnchor(anchorDateIso) {
    // Returns Monday of the week containing anchorDateIso
    const anchor = toDateAtMidnight(anchorDateIso);
    const day = anchor.getDay(); // 0 (Sun) -> 6
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() + diffToMonday);
    return toIsoDate(monday);
}

function buildWeekDays(weekStart) {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const iso = toIsoDate(d);
        const dayOfWeek = getDayOfWeek(iso); // 1-7
        days.push({
            iso,
            date: d,
            dayOfWeek,
            name: getDayName(dayOfWeek)
        });
    }
    return days;
}

function buildTimeHeaderCells() {
    const cells = [];
    // hour markers from 6AM to 8PM
    for (let hour = 6; hour <= 20; hour++) {
        const cell = document.createElement('div');
        cell.className = 'weekly-timetable-time-label';
        const time = `${String(hour).padStart(2, '0')}:00`;
        cell.textContent = formatTime(time);
        cells.push(cell);
    }
    return cells;
}

function buildTrackBackground() {
    const bg = document.createElement('div');
    bg.className = 'weekly-timetable-track-bg';

    // Create hour lines (6->20 gives 15 segments)
    for (let hour = 6; hour <= 20; hour++) {
        const line = document.createElement('div');
        line.className = 'weekly-timetable-hour-line';
        const minutesFromStart = (hour - 6) * 60;
        line.style.left = `${(minutesFromStart / MINUTES_PER_DAY) * 100}%`;
        bg.appendChild(line);
    }

    return bg;
}

function renderBookingsIntoTrack(trackEl, bookings, dayIso) {
    // Basic lane stacking for overlaps
    const lanes = [];

    const normalized = (bookings || [])
        .map(b => normalizeBooking(b, dayIso))
        .filter(Boolean)
        .sort((a, b) => a.startMinutes - b.startMinutes);

    for (const booking of normalized) {
        const laneIndex = findLaneForBooking(lanes, booking);
        if (!lanes[laneIndex]) lanes[laneIndex] = [];
        lanes[laneIndex].push(booking);

        const block = document.createElement('div');
        block.className = `weekly-booking-block booking-${booking.type}`;
        block.style.left = `${(booking.startMinutes / MINUTES_PER_DAY) * 100}%`;
        block.style.width = `${(booking.durationMinutes / MINUTES_PER_DAY) * 100}%`;
        block.style.top = `${laneIndex * 26}px`;

        const title = booking.courseName || booking.title || 'Untitled';
        const where = [booking.hallName, booking.roomName].filter(Boolean).join(' • ');
        block.innerHTML = `
            <div class="wb-title">${escapeHtml(title)}</div>
            <div class="wb-meta">${escapeHtml(booking.startTime)}-${escapeHtml(booking.endTime)}${where ? ` • ${escapeHtml(where)}` : ''}</div>
        `;

        block.addEventListener('click', () => {
            showBookingDetailsModal(booking, dayIso);
        });

        trackEl.appendChild(block);
    }

    // Set track height based on lane count
    const laneCount = Math.max(1, lanes.length);
    trackEl.style.minHeight = `${Math.max(52, laneCount * 26 + 24)}px`;
}

function showBookingDetailsModal(booking, dayIso) {
    const modalId = 'roomModal';
    const content = document.getElementById('roomModalContent');

    // If the student page modal isn't present, fall back gracefully.
    if (!content || !document.getElementById(modalId)) {
        const title = booking?.courseName || booking?.title || 'Untitled';
        const where = [booking?.hallName, booking?.roomName].filter(Boolean).join(' • ');
        alert(`${title}\n${booking?.startTime || ''} - ${booking?.endTime || ''}\n${where}`);
        return;
    }

    const title = booking?.courseName || booking?.title || booking?.eventName || 'Untitled';
    const typeLabel = booking?.type === 'event' ? 'One-Time Event' : (booking?.type === 'permanent' ? 'Permanent Class' : 'Booking');

    const whenLabel = booking?.type === 'event'
        ? `${dayIso} (${typeLabel})`
        : `${escapeHtml(getDayName(booking?.dayOfWeek || getDayOfWeek(dayIso)))} (${typeLabel})`;

    const hallRoom = [booking?.hallName, booking?.roomName].filter(Boolean).join(' • ');
    const lecturer = booking?.lecturerName || booking?.lecturer || booking?.staffName || '';
    const indexPrefix = booking?.indexPrefix || '';

    content.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        <div class="room-details">
            <div class="detail-row"><strong>When:</strong> ${escapeHtml(whenLabel)}</div>
            <div class="detail-row"><strong>Time:</strong> ${escapeHtml(booking?.startTime || '')} - ${escapeHtml(booking?.endTime || '')}</div>
            ${hallRoom ? `<div class="detail-row"><strong>Where:</strong> ${escapeHtml(hallRoom)}</div>` : ''}
            ${indexPrefix ? `<div class="detail-row"><strong>Class:</strong> ${escapeHtml(indexPrefix)}</div>` : ''}
            ${lecturer ? `<div class="detail-row"><strong>Lecturer:</strong> ${escapeHtml(lecturer)}</div>` : ''}
        </div>
    `;

    openModal(modalId);
}

function normalizeBooking(b, dayIso) {
    if (!b?.startTime || !b?.endTime) return null;

    const startMinutes = clampMinutes(minutesBetween(START_TIME, b.startTime), 0, MINUTES_PER_DAY);
    const endMinutesRaw = minutesBetween(START_TIME, b.endTime);
    const endMinutes = clampMinutes(endMinutesRaw, 0, MINUTES_PER_DAY);

    if (endMinutes <= startMinutes) return null;

    return {
        ...b,
        startMinutes,
        durationMinutes: endMinutes - startMinutes
    };
}

function findLaneForBooking(lanes, booking) {
    for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const last = lane[lane.length - 1];
        if (!last) return i;

        const lastEnd = last.startMinutes + last.durationMinutes;
        if (booking.startMinutes >= lastEnd) return i;
    }
    return lanes.length;
}

function filterBookingsForDay(bookings, dayIso, dayOfWeek) {
    return (bookings || []).filter(b => {
        if (b?.isActive === false) return false;

        if (b.type === 'event') {
            return b.date === dayIso;
        }

        if (b.type === 'permanent') {
            if (b.dayOfWeek !== dayOfWeek) return false;

            // Respect temporary free days if present
            if (Array.isArray(b.temporaryFreeDates) && b.temporaryFreeDates.includes(dayIso)) {
                return false;
            }

            return true;
        }

        return false;
    });
}

function toDateAtMidnight(isoDate) {
    const d = new Date(isoDate);
    d.setHours(0, 0, 0, 0);
    return d;
}

function toIsoDate(d) {
    return d.toISOString().split('T')[0];
}

function minutesBetween(startTime, endTime) {
    const start = toMinutes(startTime);
    const end = toMinutes(endTime);
    return end - start;
}

function toMinutes(time) {
    const [h, m] = String(time).split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    return h * 60 + m;
}

function clampMinutes(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
