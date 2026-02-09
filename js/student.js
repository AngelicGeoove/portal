/**
 * Student Portal Functionality
 * - Auto-populates schedule from staff bookings using index prefix
 * - Renders a weekly timetable (Mon-Sun) for student schedule
 */

import { showToast } from './components/Toast.js';
import { openModal, closeModal } from './components/Modal.js';
import * as bookingService from './services/bookingService.js';
import * as roomService from './services/roomService.js';
import { renderWeeklyTimetable, getWeekStartFromAnchor } from './components/WeeklyTimetable.js';
import { renderRoomDayGrid } from './components/RoomDayGrid.js';
import { auth, db } from './firebase-config.js';
import { getDayName, getDayOfWeek, getCurrentDate, getCurrentTime } from './utils/dateUtils.js';

let currentUser = null;
let currentIndexPrefix = null;

let cachedHalls = null;
let cachedHallOptionsLoaded = false;
let cachedRooms = null;

export async function initStudent() {
    console.log('initStudent() called');

    try {
        await waitForAuth();
        currentUser = await getCurrentUserData();

        const indexNumber = currentUser.indexNumber || '';
        currentIndexPrefix = extractIndexPrefix(indexNumber);

        document.getElementById('userName').textContent = currentUser.name || 'Student';
        document.getElementById('studentName').textContent = currentUser.name || '';
        document.getElementById('studentIndex').textContent = indexNumber || 'No Index';

        setupRouteHandlers();
        setupScheduleControls();
        setupFindRoomControls();

        await loadDashboard();

        console.log('Student portal initialized');
    } catch (error) {
        console.error('Error in initStudent:', error);
        showToast('error', error.message || 'Failed to initialize student portal');
    }
}

function waitForAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) resolve(user);
            else reject(new Error('No user logged in'));
        });
    });
}

async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) throw new Error('User data not found');

    return { id: doc.id, ...doc.data() };
}

function extractIndexPrefix(indexNumber) {
    if (!indexNumber) return null;
    const parts = String(indexNumber).toUpperCase().split('/');
    if (parts.length < 3) return null;
    return parts.slice(0, 3).join('/');
}

function setupRouteHandlers() {
    document.addEventListener('routechange', async (e) => {
        const route = e.detail?.route;
        if (!route) return;

        if (route === 'dashboard') await loadDashboard();
        if (route === 'schedule') await loadSchedule();
        if (route === 'find-room') await loadFindRoom();
        if (route === 'courses') await loadCourses();
    });
}

function setupScheduleControls() {
    const dateInput = document.getElementById('scheduleDate');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');

    if (dateInput && !dateInput.value) {
        dateInput.value = getCurrentDate();
    }

    dateInput?.addEventListener('change', () => loadSchedule());

    prevWeekBtn?.addEventListener('click', () => {
        const anchor = dateInput?.value || getCurrentDate();
        const d = new Date(anchor + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        if (dateInput) dateInput.value = d.toISOString().slice(0, 10);
        loadSchedule();
    });

    nextWeekBtn?.addEventListener('click', () => {
        const anchor = dateInput?.value || getCurrentDate();
        const d = new Date(anchor + 'T00:00:00');
        d.setDate(d.getDate() + 7);
        if (dateInput) dateInput.value = d.toISOString().slice(0, 10);
        loadSchedule();
    });
}

function setupFindRoomControls() {
    const hallFilter = document.getElementById('filterHall');
    const featuresFilter = document.getElementById('filterFeatures');
    const capacityFilter = document.getElementById('filterCapacity');
    const dateInput = document.getElementById('findRoomDate');

    if (dateInput && !dateInput.value) {
        dateInput.value = getCurrentDate();
    }

    hallFilter?.addEventListener('change', () => loadFindRoom());
    featuresFilter?.addEventListener('change', () => loadFindRoom());
    capacityFilter?.addEventListener('input', debounce(() => loadFindRoom(), 250));
    dateInput?.addEventListener('change', () => loadFindRoom());
}

async function getMyBookings() {
    if (!currentIndexPrefix) return [];
    return bookingService.getBookingsByIndexPrefix(currentIndexPrefix);
}

async function loadDashboard() {
    try {
        const bookings = await getMyBookings();

        // Upcoming classes today
        const upcomingContainer = document.getElementById('upcomingClasses');
        const today = getCurrentDate();
        const todayDay = getDayOfWeek(today);

        const todayBookings = bookings
            .filter(b => (b.type === 'event' && b.date === today) || (b.type === 'permanent' && b.dayOfWeek === todayDay && !(b.temporaryFreeDates || []).includes(today)))
            .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

        if (upcomingContainer) {
            if (todayBookings.length === 0) {
                upcomingContainer.innerHTML = '<p class="empty-state">No classes today</p>';
            } else {
                upcomingContainer.innerHTML = todayBookings.map(b => `
                    <div class="class-item">
                        <div class="class-item-time">${b.startTime} - ${b.endTime}</div>
                        <div class="class-item-details">
                            <div class="class-item-name">${escapeHtml(b.courseName || b.title || 'Untitled')}</div>
                            <div class="class-item-location">${escapeHtml(b.roomName || '')} ${b.hallName ? `(${escapeHtml(b.hallName)})` : ''}</div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Stats
        const courses = new Set(bookings.map(b => (b.courseCode || b.courseName || b.title || '').trim()).filter(Boolean));
        document.getElementById('totalCourses').textContent = String(courses.size);

        const weekRange = getWeekRange(today);
        const classesThisWeek = countClassesInRange(bookings, weekRange.start, weekRange.end);
        document.getElementById('classesThisWeek').textContent = String(classesThisWeek);

        await loadAvailableRoomsNow();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('error', 'Failed to load dashboard');
    }
}

async function loadAvailableRoomsNow() {
    const availableNow = document.getElementById('availableRoomsNow');
    if (!availableNow) return;

    availableNow.innerHTML = '<p class="loading">Loading...</p>';

    try {
        const today = getCurrentDate();
        const dayOfWeek = getDayOfWeek(today);
        const nowTime = getCurrentTime();

        const [halls, rooms, bookingsForDate, unavailability] = await Promise.all([
            getCachedHalls(),
            getCachedRooms(),
            bookingService.getBookingsForDate(today, dayOfWeek),
            roomService.getAllUnavailability(),
        ]);

        const hallById = new Map((halls || []).map(h => [String(h.id || h.hallId), h]));
        const bookingsByRoom = groupByRoomId(bookingsForDate || []);
        const unavailByRoom = groupByRoomId((unavailability || []).map(u => ({ ...u, type: 'unavailable' })));

        const availableRooms = [];

        for (const room of rooms || []) {
            const roomId = room.roomId || room.id;
            if (!roomId) continue;

            const hall = hallById.get(String(room.hallId)) || null;

            const blockedByUnavailability = (unavailByRoom.get(roomId) || []).some(u => {
                const matchesDay = u.type === 'date' ? (u.date === today) : (parseInt(u.dayOfWeek || 0, 10) === dayOfWeek);
                if (!matchesDay) return false;
                return isTimeWithinRange(nowTime, u.startTime, u.endTime);
            });

            if (blockedByUnavailability) continue;

            const blockedByBooking = (bookingsByRoom.get(roomId) || []).some(b => {
                if (!b?.startTime || !b?.endTime) return false;

                // Temporarily free permanent booking => treat as free for this date.
                if (b.type === 'permanent' && Array.isArray(b.temporaryFreeDates) && b.temporaryFreeDates.includes(today)) {
                    return false;
                }

                return isTimeWithinRange(nowTime, b.startTime, b.endTime);
            });

            if (blockedByBooking) continue;

            availableRooms.push({ room, hall });
        }

        if (availableRooms.length === 0) {
            availableNow.innerHTML = '<p class="empty-state">No rooms available right now</p>';
            return;
        }

        const maxCards = 12;
        const slice = availableRooms.slice(0, maxCards);

        const grid = document.createElement('div');
        grid.className = 'room-grid';

        for (const item of slice) {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div class="room-card-header">
                    <div>
                        <div class="room-card-title">${escapeHtml(item.room.number || item.room.roomNumber || 'Room')}</div>
                        <div class="room-card-subtitle">${escapeHtml(item.hall?.name || 'Unknown Hall')}</div>
                    </div>
                    <div class="room-card-status available">Available</div>
                </div>
                <div class="room-card-body">
                    ${Number.isFinite(item.room.capacity) ? `<p>Capacity: ${escapeHtml(item.room.capacity)} seats</p>` : ''}
                </div>
                <div class="room-card-features">
                    ${(item.room.workingSockets || 0) > 0 ? `<div class="room-feature" title="Sockets"><span class="room-feature-icon-inline">🔌</span><span>${escapeHtml(item.room.workingSockets)}</span></div>` : ''}
                    ${item.room.hasProjector ? `<div class="room-feature" title="Projector"><span class="room-feature-icon-inline">🎦</span><span>Projector</span></div>` : ''}
                    ${item.room.hasMicSpeaker ? `<div class="room-feature" title="PA System"><span class="room-feature-icon-inline">🔊</span><span>PA</span></div>` : ''}
                </div>
            `;

            card.addEventListener('click', () => {
                openRoomDetailsModal(item.room, item.hall);
            });

            grid.appendChild(card);
        }

        availableNow.innerHTML = '';
        availableNow.appendChild(grid);

        if (availableRooms.length > maxCards) {
            const more = document.createElement('p');
            more.className = 'empty-state';
            more.textContent = `Showing ${maxCards} of ${availableRooms.length} available rooms`;
            availableNow.appendChild(more);
        }
    } catch (error) {
        console.error('Error loading available rooms now:', error);
        availableNow.innerHTML = '<p class="empty-state">Failed to load available rooms</p>';
    }
}

async function loadSchedule() {
    const containerId = 'scheduleCalendar';
    const dateInput = document.getElementById('scheduleDate');
    const anchorDate = dateInput?.value || getCurrentDate();

    try {
        const bookings = await getMyBookings();

        const weekStart = getWeekStartFromAnchor(anchorDate);
        renderWeeklyTimetable(containerId, weekStart, bookings, {
            title: currentIndexPrefix ? `Schedule (${currentIndexPrefix})` : 'My Weekly Timetable'
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        showToast('error', 'Failed to load schedule');
    }
}

async function loadFindRoom() {
    const container = document.getElementById('availableRoomsList');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading...</p>';

    try {
        await ensureFindRoomHallsLoaded();

        const hallFilter = document.getElementById('filterHall');
        const featuresFilter = document.getElementById('filterFeatures');
        const capacityFilter = document.getElementById('filterCapacity');
        const dateInput = document.getElementById('findRoomDate');

        const date = dateInput?.value || getCurrentDate();
        if (dateInput && !dateInput.value) dateInput.value = date;

        const hallId = hallFilter?.value || '';

        // Show all halls at a glance when no hall is selected.
        if (!hallId) {
            const halls = await getCachedHalls();
            if (!halls.length) {
                container.innerHTML = '<p class="empty-state">No lecture halls found. Ask admin to add some.</p>';
                return;
            }

            container.innerHTML = `
                <div class="card">
                    <h3>Select a Lecture Hall</h3>
                    <p class="empty-state">Pick a hall to view room schedules for the selected date.</p>
                    <div class="room-grid">
                        ${halls.map(h => `
                            <button class="btn btn-secondary" data-hall-pick="${escapeHtml(h.id || h.hallId)}" style="text-align:left;">
                                <div style="font-weight:700;">${escapeHtml(h.name || 'Hall')}</div>
                                <div style="opacity:0.8;font-size:0.85rem;">${escapeHtml(h.location || '')}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            container.querySelectorAll('[data-hall-pick]')?.forEach(btn => {
                btn.addEventListener('click', () => {
                    const pickId = btn.getAttribute('data-hall-pick');
                    if (hallFilter) hallFilter.value = pickId;
                    loadFindRoom();
                });
            });

            return;
        }

        const halls = await getCachedHalls();
        const hall = halls.find(h => (h.id || h.hallId) === hallId) || { id: hallId, hallId, name: 'Selected Hall' };

        // Rooms in hall
        let rooms = await roomService.getRoomsByHall(hallId);

        // Apply filters (client-side)
        const minCapacity = parseInt(capacityFilter?.value || '0', 10) || 0;
        if (minCapacity > 0) {
            rooms = rooms.filter(r => (parseInt(r.capacity || 0, 10) || 0) >= minCapacity);
        }

        const feature = featuresFilter?.value || '';
        if (feature === 'projector') rooms = rooms.filter(r => Boolean(r.hasProjector));
        if (feature === 'sockets') rooms = rooms.filter(r => (parseInt(r.workingSockets || 0, 10) || 0) >= 6);
        if (feature === 'speaker') rooms = rooms.filter(r => Boolean(r.hasMicSpeaker));

        if (!rooms.length) {
            container.innerHTML = '<p class="empty-state">No rooms match these filters.</p>';
            return;
        }

        const dayOfWeek = getDayOfWeek(date);

        // Bookings for date (includes permanent + one-time events)
        const allBookings = await bookingService.getBookingsForDate(date, dayOfWeek);
        const roomIdSet = new Set(rooms.map(r => r.roomId || r.id).filter(Boolean));

        const blocks = [];
        for (const b of allBookings || []) {
            const roomId = b.roomId || b.roomID;
            if (!roomIdSet.has(roomId)) continue;

            // Transform temporarily-free permanent bookings into a visible "tempfree" block
            if (b.type === 'permanent' && Array.isArray(b.temporaryFreeDates) && b.temporaryFreeDates.includes(date)) {
                blocks.push({
                    ...b,
                    type: 'tempfree',
                    title: 'Temporarily Free'
                });
                continue;
            }

            blocks.push(b);
        }

        // Unavailability (admin)
        const allUnavailability = await roomService.getAllUnavailability();
        const reasonLabels = {
            maintenance: 'Maintenance',
            cleaning: 'Cleaning',
            student_study: 'Free for Student Study',
            closed: 'Closed'
        };

        for (const u of allUnavailability || []) {
            const roomId = u.roomId || u.roomID;
            if (!roomIdSet.has(roomId)) continue;
            if (u.hallId && u.hallId !== hallId) continue;

            const matches = u.type === 'date'
                ? (u.date === date)
                : (parseInt(u.dayOfWeek || 0, 10) === dayOfWeek);

            if (!matches) continue;

            blocks.push({
                ...u,
                type: 'unavailable',
                reasonLabel: reasonLabels[u.reason] || u.reason || 'Unavailable'
            });
        }

        renderRoomDayGrid('availableRoomsList', date, hall, rooms, blocks, {
            title: `${hall.name || 'Lecture Hall'} • Room Schedules`
        });
    } catch (error) {
        console.error('Error loading find room:', error);
        container.innerHTML = '<p class="empty-state">Failed to load room availability.</p>';
        showToast('error', 'Failed to load room availability');
    }
}

async function getCachedHalls() {
    if (cachedHalls) return cachedHalls;
    cachedHalls = await roomService.getAllHalls();
    return cachedHalls;
}

async function getCachedRooms() {
    if (cachedRooms) return cachedRooms;
    cachedRooms = await roomService.getAllRooms();
    return cachedRooms;
}

async function ensureFindRoomHallsLoaded() {
    if (cachedHallOptionsLoaded) return;

    const hallFilter = document.getElementById('filterHall');
    if (!hallFilter) return;

    const halls = await getCachedHalls();
    const currentValue = hallFilter.value;

    hallFilter.innerHTML = '<option value="">All Lecture Halls</option>' +
        halls.map(h => `<option value="${escapeHtml(h.id || h.hallId)}">${escapeHtml(h.name || 'Hall')}</option>`).join('');

    if (currentValue) hallFilter.value = currentValue;
    cachedHallOptionsLoaded = true;
}

async function loadCourses() {
    const container = document.getElementById('coursesList');
    if (!container) return;

    try {
        const bookings = await getMyBookings();
        const courses = groupBookingsByCourse(bookings);

        if (courses.length === 0) {
            container.innerHTML = '<p class="empty-state">No courses found yet</p>';
            return;
        }

        container.innerHTML = courses.map(course => {
            const scheduleLines = course.items
                .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
                .slice(0, 4)
                .map(b => {
                    const when = b.type === 'permanent'
                        ? `${getDayName(b.dayOfWeek)} ${b.startTime}-${b.endTime}`
                        : `${b.date} ${b.startTime}-${b.endTime}`;
                    const where = `${b.roomName || ''}${b.hallName ? ` (${b.hallName})` : ''}`;
                    return `<div class="course-schedule-item"><span>${escapeHtml(when)}</span><span>${escapeHtml(where)}</span></div>`;
                })
                .join('');

            return `
                <div class="course-card">
                    <div class="course-card-header">
                        ${course.code ? `<div class="course-code">${escapeHtml(course.code)}</div>` : ''}
                        <div class="course-name">${escapeHtml(course.name)}</div>
                        <div class="course-instructor">Scheduled by your class rep/lecturer</div>
                    </div>
                    <div class="course-schedule">${scheduleLines}</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading courses:', error);
        container.innerHTML = '<p class="empty-state">Failed to load courses</p>';
    }
}

function groupBookingsByCourse(bookings) {
    const map = new Map();

    (bookings || []).forEach(b => {
        const name = (b.courseName || b.title || 'Untitled').trim();
        const code = (b.courseCode || '').trim();
        const key = `${code}::${name}`;

        if (!map.has(key)) {
            map.set(key, { name, code, items: [] });
        }
        map.get(key).items.push(b);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function getWeekRange(dateString) {
    const d = new Date(dateString);
    const day = d.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;

    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

function countClassesInRange(bookings, startDate, endDate) {
    // Count occurrences in the week range.
    // Permanent: count if its dayOfWeek falls within the range (0/1 occurrence per booking)
    // Event: count if date is within range
    const startIso = startDate.toISOString().split('T')[0];
    const endIso = endDate.toISOString().split('T')[0];

    let count = 0;

    for (const b of bookings || []) {
        if (b.type === 'event' && b.date && b.date >= startIso && b.date <= endIso) {
            count += 1;
            continue;
        }

        if (b.type === 'permanent' && Number.isFinite(b.dayOfWeek)) {
            // Count it once per week.
            count += 1;
        }
    }

    return count;
}

function debounce(fn, waitMs) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), waitMs);
    };
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function openRoomDetailsModal(room, hall) {
    const modalId = 'roomModal';
    const content = document.getElementById('roomModalContent');
    if (!content || !document.getElementById(modalId)) return;

    content.innerHTML = `
        <h2>${escapeHtml(room?.number || room?.roomNumber || 'Room')}</h2>
        <div class="room-details">
            <div class="detail-row"><strong>Hall:</strong> ${escapeHtml(hall?.name || '')}</div>
            ${hall?.location ? `<div class="detail-row"><strong>Location:</strong> ${escapeHtml(hall.location)}</div>` : ''}
            ${Number.isFinite(room?.capacity) ? `<div class="detail-row"><strong>Capacity:</strong> ${escapeHtml(room.capacity)} seats</div>` : ''}
            <div class="detail-row"><strong>Sockets:</strong> ${escapeHtml(room?.workingSockets || 0)}</div>
            <div class="detail-row"><strong>Projector:</strong> ${room?.hasProjector ? 'Yes' : 'No'}</div>
            <div class="detail-row"><strong>PA System:</strong> ${room?.hasMicSpeaker ? 'Yes' : 'No'}</div>
        </div>
    `;

    openModal(modalId);
}

function groupByRoomId(items) {
    const map = new Map();
    for (const item of items || []) {
        const roomId = item?.roomId || item?.roomID;
        if (!roomId) continue;
        if (!map.has(roomId)) map.set(roomId, []);
        map.get(roomId).push(item);
    }
    return map;
}

function isTimeWithinRange(time, startTime, endTime) {
    const t = toMinutesSafe(time);
    const s = toMinutesSafe(startTime);
    const e = toMinutesSafe(endTime);
    if (!Number.isFinite(t) || !Number.isFinite(s) || !Number.isFinite(e)) return false;
    return t >= s && t < e;
}

function toMinutesSafe(time) {
    const [h, m] = String(time || '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
}
