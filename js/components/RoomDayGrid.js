/**
 * Room Day Grid Component
 * Visualizes room availability for a single day:
 * - Rows: rooms
 * - Columns: 06:00 -> 20:00 (time left-to-right)
 *
 * Blocks supported:
 * - permanent/event bookings
 * - temp-free blocks (derived from permanent booking temporarily freed)
 * - unavailable blocks (admin unavailability)
 */

import { formatTime } from '../utils/dateUtils.js';
import { openModal } from './Modal.js';

const START_TIME = '06:00';
const END_TIME = '20:00';
const MINUTES_PER_DAY = minutesBetween(START_TIME, END_TIME);

export function renderRoomDayGrid(containerId, dateIso, hall, rooms, blocks, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const title = options.title || '';
    const hallName = hall?.name || '';

    const wrapper = document.createElement('div');
    wrapper.className = 'room-day-grid';

    const header = document.createElement('div');
    header.className = 'room-day-grid-header';
    header.innerHTML = `
        <div class="rdg-room-col">
            <div class="rdg-title">${escapeHtml(title || (hallName ? `${hallName} Rooms` : 'Rooms'))}</div>
            <div class="rdg-subtitle">${escapeHtml(dateIso || '')}</div>
        </div>
        <div class="rdg-time-col">${buildTimeHeaderHtml()}</div>
    `;
    wrapper.appendChild(header);

    const roomList = document.createElement('div');
    roomList.className = 'room-day-grid-body';

    const roomsSorted = [...(rooms || [])].sort((a, b) => String(a.number || '').localeCompare(String(b.number || '')));

    for (const room of roomsSorted) {
        const row = document.createElement('div');
        row.className = 'room-day-row';

        const label = document.createElement('div');
        label.className = 'room-day-room-label';
        label.innerHTML = `
            <div class="rdg-room-name">${escapeHtml(room.number || room.name || 'Room')}</div>
            <div class="rdg-room-meta">
                ${Number.isFinite(room.capacity) ? `<span>${escapeHtml(room.capacity)} seats</span>` : ''}
                ${room.hasProjector ? `<span title="Projector">📽️</span>` : ''}
                ${(room.workingSockets || 0) > 0 ? `<span title="Sockets">🔌</span>` : ''}
                ${room.hasMicSpeaker ? `<span title="PA System">🎤</span>` : ''}
            </div>
        `;

        const track = document.createElement('div');
        track.className = 'room-day-track';
        track.dataset.roomId = room.roomId || room.id || '';

        track.appendChild(buildTrackBackground());

        const roomId = room.roomId || room.id;
        const roomBlocks = (blocks || []).filter(b => (b.roomId || b.roomID) === roomId);
        renderBlocksIntoTrack(track, roomBlocks, dateIso, hall, room);

        row.appendChild(label);
        row.appendChild(track);
        roomList.appendChild(row);
    }

    wrapper.appendChild(roomList);
    container.appendChild(wrapper);
}

function buildTimeHeaderHtml() {
    const parts = [];
    for (let hour = 6; hour <= 20; hour++) {
        const time = `${String(hour).padStart(2, '0')}:00`;
        parts.push(`<div class="rdg-time-label">${escapeHtml(formatTime(time))}</div>`);
    }
    return parts.join('');
}

function buildTrackBackground() {
    const bg = document.createElement('div');
    bg.className = 'room-day-track-bg';

    for (let hour = 6; hour <= 20; hour++) {
        const line = document.createElement('div');
        line.className = 'room-day-hour-line';
        const minutesFromStart = (hour - 6) * 60;
        line.style.left = `${(minutesFromStart / MINUTES_PER_DAY) * 100}%`;
        bg.appendChild(line);
    }

    return bg;
}

function renderBlocksIntoTrack(trackEl, blocks, dayIso, hall, room) {
    const lanes = [];

    const normalized = (blocks || [])
        .map(b => normalizeBlock(b))
        .filter(Boolean)
        .sort((a, b) => a.startMinutes - b.startMinutes);

    for (const blockData of normalized) {
        const laneIndex = findLaneForBlock(lanes, blockData);
        if (!lanes[laneIndex]) lanes[laneIndex] = [];
        lanes[laneIndex].push(blockData);

        const block = document.createElement('div');
        block.className = `rdg-block booking-${escapeHtml(blockData.cssType)}`;
        block.style.left = `${(blockData.startMinutes / MINUTES_PER_DAY) * 100}%`;
        block.style.width = `${(blockData.durationMinutes / MINUTES_PER_DAY) * 100}%`;
        block.style.top = `${laneIndex * 26}px`;

        block.innerHTML = `
            <div class="rdg-block-title">${escapeHtml(blockData.title)}</div>
            <div class="rdg-block-meta">${escapeHtml(blockData.startTime)}-${escapeHtml(blockData.endTime)}${blockData.meta ? ` • ${escapeHtml(blockData.meta)}` : ''}</div>
        `;

        block.addEventListener('click', () => {
            showBlockDetailsModal(blockData.raw, dayIso, hall, room);
        });

        trackEl.appendChild(block);
    }

    const laneCount = Math.max(1, lanes.length);
    trackEl.style.minHeight = `${Math.max(58, laneCount * 26 + 28)}px`;
}

function normalizeBlock(raw) {
    if (!raw?.startTime || !raw?.endTime) return null;

    const startMinutes = clampMinutes(minutesBetween(START_TIME, raw.startTime), 0, MINUTES_PER_DAY);
    const endMinutesRaw = minutesBetween(START_TIME, raw.endTime);
    const endMinutes = clampMinutes(endMinutesRaw, 0, MINUTES_PER_DAY);
    if (endMinutes <= startMinutes) return null;

    const type = raw.type || 'booking';
    const cssType = type === 'tempfree' ? 'temp-free' : type;

    const title = raw.title || raw.courseName || raw.eventName || raw.reasonLabel || 'Untitled';
    const meta = raw.type === 'unavailable' ? (raw.customMessage || '') : (raw.courseCode || '');

    return {
        raw,
        cssType,
        title,
        meta,
        startTime: raw.startTime,
        endTime: raw.endTime,
        startMinutes,
        durationMinutes: endMinutes - startMinutes
    };
}

function findLaneForBlock(lanes, block) {
    for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const last = lane[lane.length - 1];
        if (!last) return i;
        const lastEnd = last.startMinutes + last.durationMinutes;
        if (block.startMinutes >= lastEnd) return i;
    }
    return lanes.length;
}

function showBlockDetailsModal(block, dayIso, hall, room) {
    const modalId = 'roomModal';
    const content = document.getElementById('roomModalContent');

    if (!content || !document.getElementById(modalId)) {
        return;
    }

    if (block?.type === 'unavailable') {
        content.innerHTML = `
            <h2>Room Unavailable</h2>
            <div class="room-details">
                <div class="detail-row"><strong>Room:</strong> ${escapeHtml(room?.number || room?.name || '')}</div>
                <div class="detail-row"><strong>Hall:</strong> ${escapeHtml(hall?.name || '')}</div>
                <div class="detail-row"><strong>Date:</strong> ${escapeHtml(dayIso || '')}</div>
                <div class="detail-row"><strong>Time:</strong> ${escapeHtml(block?.startTime || '')} - ${escapeHtml(block?.endTime || '')}</div>
                <div class="detail-row"><strong>Reason:</strong> ${escapeHtml(block?.reasonLabel || block?.reason || '')}</div>
                ${block?.customMessage ? `<div class="detail-row"><strong>Note:</strong> ${escapeHtml(block.customMessage)}</div>` : ''}
            </div>
        `;
        openModal(modalId);
        return;
    }

    if (block?.type === 'tempfree') {
        content.innerHTML = `
            <h2>Temporarily Free</h2>
            <div class="room-details">
                <div class="detail-row"><strong>Room:</strong> ${escapeHtml(room?.number || room?.name || '')}</div>
                <div class="detail-row"><strong>Hall:</strong> ${escapeHtml(hall?.name || '')}</div>
                <div class="detail-row"><strong>Date:</strong> ${escapeHtml(dayIso || '')}</div>
                <div class="detail-row"><strong>Time:</strong> ${escapeHtml(block?.startTime || '')} - ${escapeHtml(block?.endTime || '')}</div>
                <div class="detail-row"><strong>Normally:</strong> ${escapeHtml(block?.courseName || block?.title || 'Class')}</div>
            </div>
        `;
        openModal(modalId);
        return;
    }

    const title = block?.courseName || block?.title || block?.eventName || 'Booking';
    const typeLabel = block?.type === 'event' ? 'One-Time Event' : (block?.type === 'permanent' ? 'Permanent Class' : 'Booking');

    content.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        <div class="room-details">
            <div class="detail-row"><strong>Type:</strong> ${escapeHtml(typeLabel)}</div>
            <div class="detail-row"><strong>Date:</strong> ${escapeHtml(dayIso || block?.date || '')}</div>
            <div class="detail-row"><strong>Time:</strong> ${escapeHtml(block?.startTime || '')} - ${escapeHtml(block?.endTime || '')}</div>
            <div class="detail-row"><strong>Room:</strong> ${escapeHtml(room?.number || room?.name || '')}</div>
            <div class="detail-row"><strong>Hall:</strong> ${escapeHtml(hall?.name || '')}</div>
            ${block?.indexPrefix ? `<div class="detail-row"><strong>Class:</strong> ${escapeHtml(block.indexPrefix)}</div>` : ''}
            ${block?.lecturerName ? `<div class="detail-row"><strong>Lecturer:</strong> ${escapeHtml(block.lecturerName)}</div>` : ''}
        </div>
    `;

    openModal(modalId);
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
