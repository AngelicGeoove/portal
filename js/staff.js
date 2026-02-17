/**
 * Staff Portal Functionality
 * Handles booking creation, management, and scheduling for staff/lecturers
 */

import { showToast } from './components/Toast.js';
import { openModal, closeModal } from './components/Modal.js';
import * as roomService from './services/roomService.js';
import * as bookingService from './services/bookingService.js';
import { getDayOfWeek, timeRangesOverlap } from './utils/dateUtils.js';
import { auth, db } from './firebase-config.js';
import { renderTimeline } from './components/Timeline.js';
import { renderRoomDayGrid } from './components/RoomDayGrid.js';
import { renderWeeklyTimetable } from './components/WeeklyTimetable.js';
import { getCurrentDate, getWeekStart, addWeeks } from './utils/dateUtils.js';

export let currentUser = null;
let currentBookingId = null;
let bookingsCache = [];
let bookingById = new Map();
let calendarMode = 'full'; // 'full' | 'current'
let cachedHalls = null;
let cachedCalendarHallOptionsLoaded = false;

/**
 * Initialize staff portal
 */
export async function initStaff() {
    console.log('initStaff() called');
    try {
        // Wait for auth state to be ready
        await waitForAuth();
        
        // Get current user data
        currentUser = await getCurrentUserData();
        console.log('Current user:', currentUser);
        
        // Display user info
        document.getElementById('userName').textContent = currentUser.name || 'Staff';
        document.getElementById('staffName').textContent = currentUser.name || '';
        document.getElementById('staffIndex').textContent = currentUser.indexNumber || 'No Index';
        document.getElementById('staffRole').textContent = currentUser.isLecturer ? 'Lecturer' : 'Class Rep';
        document.getElementById('userType').textContent = currentUser.isLecturer ? 'Lecturer' : 'Class Rep';
        
        setupNavigation();
        setupButtons();

        loadDashboard();
        
        console.log('Staff portal initialized');
    } catch (error) {
        console.error('Error in initStaff:', error);
        showToast('error', 'Failed to initialize staff portal');
    }
}

/**
 * Wait for Firebase auth to be ready
 */
function waitForAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            if (user) resolve(user);
            else reject(new Error('No user logged in'));
        });
    });
}

/**
 * Get current user data from Firestore
 */
async function getCurrentUserData() {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) throw new Error('User data not found');
    
    return { id: doc.id, ...doc.data() };
}

/**
 * Setup navigation between views
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const views = document.querySelectorAll('.view');
            views.forEach(v => v.classList.remove('active'));
            
            const viewId = target.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) + 'View';
            const targetView = document.getElementById(viewId);
            
            if (targetView) {
                targetView.classList.add('active');
                
                switch(target) {
                    case 'dashboard': loadDashboard(); break;
                    case 'bookings': loadMyBookings(); break;
                    case 'calendar': loadCalendar(); break;
                    case 'new-booking': loadNewBookingForm(); break;
                }
            }
        });
    });
}

/**
 * Setup button click handlers
 */
function setupButtons() {
    document.getElementById('quickBookBtn')?.addEventListener('click', () => navigateToView('new-booking'));
    document.getElementById('viewScheduleBtn')?.addEventListener('click', () => navigateToView('calendar'));
    document.getElementById('cancelBookingBtn')?.addEventListener('click', () => navigateToView('dashboard'));

        // Seed Data (Prototype)
    document.getElementById('seedBookingsBtn')?.addEventListener('click', async () => {
        console.log('Seed button clicked. CurrentUser:', currentUser);
        if (!confirm('Add sample bookings to your schedule?')) return;
        
        try {
            const { showToast } = await import('./components/Toast.js');
            showToast('info', 'Creating bookings...', 'Please wait');
            
            const { seedBookingsForStaff } = await import('./utils/seedData.js');
            // Pass the currentUser explicitly
            const result = await seedBookingsForStaff(currentUser);
            
            if (result.success) {
                showToast('success', result.message);
                loadMyBookings();
            } else {
                console.error('Seed failed:', result.error);
                showToast('error', result.error);
            }
        } catch (err) {
            console.error(err);
            const { showToast } = await import('./components/Toast.js');
            showToast('error', 'Failed to seed bookings');
        }
    });

    // Calendar controls - week navigation
    const prevWeekBtn = document.getElementById('prevWeekBtnCalendar');
    const nextWeekBtn = document.getElementById('nextWeekBtnCalendar');
    const dateInput = document.getElementById('calendarDate');
    const hallFilter = document.getElementById('calendarHallFilter');

    if (dateInput && !dateInput.value) {
        dateInput.value = getWeekStart(getCurrentDate());
    }

    prevWeekBtn?.addEventListener('click', () => {
        const current = dateInput?.value || getCurrentDate();
        const newDate = addWeeks(getWeekStart(current), -1);
        if (dateInput) dateInput.value = newDate;
        loadCalendar();
    });

    nextWeekBtn?.addEventListener('click', () => {
        const current = dateInput?.value || getCurrentDate();
        const newDate = addWeeks(getWeekStart(current), 1);
        if (dateInput) dateInput.value = newDate;
        loadCalendar();
    });

    dateInput?.addEventListener('change', () => {
        // Snap to week start
        const weekStart = getWeekStart(dateInput.value);
        dateInput.value = weekStart;
        loadCalendar();
    });
    hallFilter?.addEventListener('change', () => loadCalendar());
}

/**
 * Navigate to a specific view
 */
function navigateToView(viewName) {
    document.querySelector(`a[href="#${viewName}"]`)?.click();
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        const bookings = await bookingService.getBookingsByUser(currentUser.id);
        
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const thisWeekBookings = bookings.filter(b => {
            const bookingDate = b.date ? new Date(b.date) : null;
            return bookingDate && bookingDate >= weekStart && bookingDate <= weekEnd;
        });
        
        const managedClasses = currentUser.managedIndexPrefixes?.length || 0;
        
        document.getElementById('totalBookings').textContent = bookings.length;
        document.getElementById('upcomingBookings').textContent = thisWeekBookings.length;
        document.getElementById('managedClasses').textContent = managedClasses;
        
        loadUpcomingBookingsToday();
        loadManagedClassesList();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('error', 'Failed to load dashboard data');
    }
}

/**
 * Load upcoming bookings for today
 */
async function loadUpcomingBookingsToday() {
    const container = document.getElementById('upcomingBookingsToday');
    if (!container) return;
    
    try {
        const bookings = await bookingService.getBookingsByUser(currentUser.id);
        const today = new Date().toISOString().split('T')[0];
        const dayOfWeek = new Date().getDay() || 7;
        
        const todayBookings = bookings
            .filter(b => {
                if (b.type === 'permanent') {
                    if (b.dayOfWeek !== dayOfWeek) return false;
                    if (Array.isArray(b.temporaryFreeDates) && b.temporaryFreeDates.includes(today)) return false;
                    return true;
                }
                return b.date === today;
            })
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        if (todayBookings.length === 0) {
            container.innerHTML = '<p class="empty-state">No bookings today</p>';
            return;
        }
        
        container.innerHTML = todayBookings.map(booking => `
            <div class="booking-item">
                <div class="booking-time">${booking.startTime} - ${booking.endTime}</div>
                <div class="booking-details">
                    <strong>${booking.courseName || booking.title || 'Untitled'}</strong>
                    <p>${booking.roomName} - ${booking.hallName}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading upcoming bookings:', error);
        container.innerHTML = '<p class="error-state">Failed to load bookings</p>';
    }
}

/**
 * Load managed classes list
 */
async function loadManagedClassesList() {
    const container = document.getElementById('managedClassesList');
    if (!container) return;
    
    try {
        const prefixes = currentUser.managedIndexPrefixes || [];
        
        if (prefixes.length === 0) {
            container.innerHTML = '<p class="empty-state">No managed classes</p>';
            return;
        }
        
        container.innerHTML = prefixes.map(prefix => `
            <div class="class-item">
                <div class="class-prefix">${prefix}</div>
                <div class="class-info">Students will see matching schedules</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading managed classes:', error);
        container.innerHTML = '<p class="error-state">Failed to load classes</p>';
    }
}

/**
 * Load My Bookings view
 */
async function loadMyBookings() {
    const tableBody = document.getElementById('bookingsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    try {
        const bookings = await bookingService.getBookingsByUser(currentUser.id);
        bookingsCache = bookings;
        bookingById = new Map(bookings.map(b => [String(b.id || b.bookingId), b]));
        
        if (bookings.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No bookings yet. Create your first booking!</td></tr>';
            return;
        }
        
        tableBody.innerHTML = bookings.map(booking => {
            const dayDate = booking.type === 'permanent' ? getDayName(booking.dayOfWeek) : formatDate(booking.date);
            const typeBadge = booking.type === 'permanent' ? 'Permanent' : 'Event';
            const classInfo = booking.indexPrefix || 'N/A';
            const bookingId = booking.id || booking.bookingId;
            
            return `
                <tr>
                    <td><span class="badge badge-${booking.type === 'permanent' ? 'primary' : 'secondary'}">${typeBadge}</span></td>
                    <td>${booking.courseName || booking.title || 'Untitled'}</td>
                    <td>${booking.roomName} (${booking.hallName})</td>
                    <td>${dayDate}</td>
                    <td>${booking.startTime} - ${booking.endTime}</td>
                    <td>${classInfo}</td>
                    <td>
                        ${booking.type === 'permanent'
                            ? `<button class="btn btn-sm btn-secondary" onclick="window.openTempFreeModal('${bookingId}')">Temp Free</button>`
                            : ''
                        }
                        <button class="btn btn-sm btn-secondary" onclick="window.editBooking('${bookingId}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="window.deleteBooking('${bookingId}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="error-state">Failed to load bookings</td></tr>';
        showToast('error', 'Failed to load bookings');
    }
}

/**
 * Load Calendar view - Weekly Timetable
 */
async function loadCalendar() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading...</p>';

    try {
        await ensureCalendarHallsLoaded();

        const dateInput = document.getElementById('calendarDate');
        const hallFilter = document.getElementById('calendarHallFilter');

        let weekStartDate = dateInput?.value || getCurrentDate();
        // Snap to week start (Monday)
        weekStartDate = getWeekStart(weekStartDate);
        if (dateInput && dateInput.value !== weekStartDate) {
            dateInput.value = weekStartDate;
        }

        const hallId = hallFilter?.value || '';

        // Get bookings for the week (all 7 days)
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStartDate);
            d.setDate(d.getDate() + i);
            weekDates.push(d.toISOString().slice(0, 10));
        }

        // Fetch bookings for all days in the week
        const bookingsPromises = weekDates.map((date, idx) => 
            bookingService.getBookingsForDate(date, idx + 1)
        );
        const bookingsArrays = await Promise.all(bookingsPromises);
        const allBookings = bookingsArrays.flat();

        // Filter by hall if selected
        let filteredBookings = allBookings;
        if (hallId) {
            filteredBookings = allBookings.filter(b => b.hallId === hallId);
        }

        // Determine title
        let title = 'Weekly Schedule';
        if (hallId) {
            const halls = await getCachedHalls();
            const hall = (halls || []).find(h => (h.id || h.hallId) === hallId);
            title = hall ? `${hall.name} - Weekly Schedule` : 'Weekly Schedule';
        } else {
            title = 'All Halls - Weekly Schedule';
        }

        renderWeeklyTimetable('calendarContainer', weekStartDate, filteredBookings, {
            title
        });
    } catch (error) {
        console.error('Error loading calendar:', error);
        container.innerHTML = '<p class="empty-state">Failed to load calendar</p>';
        showToast('error', 'Failed to load calendar');
    }
}

async function getCachedHalls() {
    if (cachedHalls) return cachedHalls;
    cachedHalls = await roomService.getAllHalls();
    return cachedHalls;
}

async function ensureCalendarHallsLoaded() {
    if (cachedCalendarHallOptionsLoaded) return;
    const hallFilter = document.getElementById('calendarHallFilter');
    if (!hallFilter) return;

    const halls = await getCachedHalls();
    const current = hallFilter.value;

    hallFilter.innerHTML = '<option value="">All Halls</option>' +
        halls.map(h => `<option value="${escapeHtml(h.id || h.hallId)}">${escapeHtml(h.name || 'Hall')}</option>`).join('');

    if (current) hallFilter.value = current;
    cachedCalendarHallOptionsLoaded = true;
}

/**
 * Load New Booking form
 */
async function loadNewBookingForm() {
    try {
        const halls = await roomService.getAllHalls();
        const hallSelect = document.getElementById('lectureHall');
        
        if (hallSelect) {
            hallSelect.innerHTML = '<option value="">Select Hall...</option>' +
                halls.map(hall => `<option value="${hall.id}">${hall.name}</option>`).join('');
        }
        
        const classSelect = document.getElementById('classSelect');
        if (classSelect && currentUser.managedIndexPrefixes) {
            classSelect.innerHTML = '<option value="">Select Class...</option>' +
                currentUser.managedIndexPrefixes.map(prefix => 
                    `<option value="${prefix}">${prefix}</option>`
                ).join('');
        }
        
        setupBookingForm();
        
    } catch (error) {
        console.error('Error loading booking form:', error);
        showToast('error', 'Failed to load booking form');
    }
}

/**
 * Setup booking form handlers
 */
function setupBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;
    
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    const bookingForm = document.getElementById('bookingForm');
    
    const typeRadios = document.querySelectorAll('input[name="bookingType"]');
    const hallSelect = document.getElementById('lectureHall');
    const permanentFields = document.getElementById('permanentFields');
    const eventFields = document.getElementById('eventFields');
    
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'permanent') {
                permanentFields?.classList.remove('hidden');
                eventFields?.classList.add('hidden');
            } else {
                permanentFields?.classList.add('hidden');
                eventFields?.classList.remove('hidden');
            }
        });
    });
    
    hallSelect?.addEventListener('change', async (e) => {
        const roomSelect = document.getElementById('room');
        const hallId = e.target.value;
        
        if (hallId) {
            const rooms = await roomService.getRoomsByHall(hallId);
            roomSelect.disabled = false;
            roomSelect.innerHTML = '<option value="">Select Room...</option>' +
                rooms.map(room => `<option value="${room.id}">${room.number} (Capacity: ${room.capacity})</option>`).join('');
        } else {
            roomSelect.disabled = true;
            roomSelect.innerHTML = '<option value="">Select Hall First...</option>';
        }
    });
    
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveBooking();
    });
}

/**
 * Save booking
 */
async function saveBooking() {
    try {
        const type = document.querySelector('input[name="bookingType"]:checked').value;
        const courseName = document.getElementById('courseName').value.trim();
        const courseCode = document.getElementById('courseCode').value.trim();
        const hallId = document.getElementById('lectureHall').value;
        const roomId = document.getElementById('room').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const indexPrefix = document.getElementById('classSelect').value;
        
        if (!courseName || !hallId || !roomId || !startTime || !endTime || !indexPrefix) {
            showToast('error', 'Please fill in all required fields');
            return;
        }
        
        const hall = await roomService.getHall(hallId);
        const room = await roomService.getRoom(roomId);
        
        const bookingData = {
            userId: currentUser.id,
            staffId: currentUser.id,
            userName: currentUser.name,
            type,
            title: courseName,
            courseName,
            courseCode,
            hallId,
            hallName: hall.name,
            roomId,
            roomName: room.number,
            startTime,
            endTime,
            indexPrefix,
            isActive: true
        };
        
        if (type === 'permanent') {
            bookingData.dayOfWeek = parseInt(document.getElementById('dayOfWeek').value);
        } else {
            bookingData.date = document.getElementById('eventDate').value;
        }
        
        const conflicts = await checkBookingConflicts(bookingData);
        if (conflicts.length > 0) {
            document.getElementById('conflictWarning')?.classList.remove('hidden');
            document.getElementById('conflictMessage').textContent = conflicts[0].reason || 'This room is not available at the selected time.';
            showToast('error', 'Conflict detected!');
            return;
        }
        
        document.getElementById('conflictWarning')?.classList.add('hidden');
        
        const result = await bookingService.createBooking(bookingData);
        
        if (result.success) {
            showToast('success', 'Booking created successfully!');
            document.getElementById('bookingForm').reset();
            setTimeout(() => navigateToView('dashboard'), 1000);
        } else {
            showToast('error', result.error || 'Failed to create booking');
        }
        
    } catch (error) {
        console.error('Error saving booking:', error);
        showToast('error', 'Failed to create booking: ' + error.message);
    }
}

/**
 * Check for booking conflicts
 */
async function checkBookingConflicts(newBooking) {
    try {
        const [existingBookings, unavailablePeriods] = await Promise.all([
            bookingService.getBookingsByRoom(newBooking.roomId),
            roomService.getUnavailablePeriodsByRoom(newBooking.roomId)
        ]);

        const conflicts = [];

        // 1) Admin unavailability periods
        if (newBooking.type === 'event' && newBooking.date) {
            const dow = getDayOfWeek(newBooking.date);
            for (const p of unavailablePeriods || []) {
                const matches = p.type === 'date'
                    ? (p.date === newBooking.date)
                    : (parseInt(p.dayOfWeek || 0, 10) === dow);
                if (!matches) continue;
                if (timeRangesOverlap(p.startTime, p.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: p.customMessage || `Room is unavailable (${p.reason || 'blocked'}) at this time.`,
                        type: 'unavailable',
                        period: p
                    });
                }
            }
        }

        if (newBooking.type === 'permanent' && Number.isFinite(newBooking.dayOfWeek)) {
            for (const p of unavailablePeriods || []) {
                if (p.type === 'date') continue; // date-specific closures shouldn't block creating a recurring booking
                if (parseInt(p.dayOfWeek || 0, 10) !== parseInt(newBooking.dayOfWeek || 0, 10)) continue;
                if (timeRangesOverlap(p.startTime, p.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: p.customMessage || `Room is unavailable every ${getDayName(newBooking.dayOfWeek)} (${p.reason || 'blocked'}).`,
                        type: 'unavailable',
                        period: p
                    });
                }
            }
        }

        // 2) Booking overlaps (permanent/event cross-check)
        for (const existing of existingBookings || []) {
            const existingId = String(existing.id || existing.bookingId || '');
            if (existingId && currentBookingId && existingId === String(currentBookingId)) continue;

            // Event vs Event
            if (newBooking.type === 'event' && existing.type === 'event') {
                if (existing.date === newBooking.date && timeRangesOverlap(existing.startTime, existing.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: `Overlaps with another event booking (${existing.startTime}-${existing.endTime}).`,
                        type: 'booking',
                        booking: existing
                    });
                }
                continue;
            }

            // Permanent vs Permanent
            if (newBooking.type === 'permanent' && existing.type === 'permanent') {
                if (existing.dayOfWeek === newBooking.dayOfWeek && timeRangesOverlap(existing.startTime, existing.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: `Overlaps with an existing permanent booking (${getDayName(existing.dayOfWeek)} ${existing.startTime}-${existing.endTime}).`,
                        type: 'booking',
                        booking: existing
                    });
                }
                continue;
            }

            // Event vs Permanent
            if (newBooking.type === 'event' && existing.type === 'permanent') {
                const eventDow = getDayOfWeek(newBooking.date);
                if (existing.dayOfWeek !== eventDow) continue;
                if (Array.isArray(existing.temporaryFreeDates) && existing.temporaryFreeDates.includes(newBooking.date)) continue;
                if (timeRangesOverlap(existing.startTime, existing.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: `Overlaps with a permanent class (${getDayName(existing.dayOfWeek)} ${existing.startTime}-${existing.endTime}).`,
                        type: 'booking',
                        booking: existing
                    });
                }
                continue;
            }

            // Permanent vs Event (block if any existing event would overlap on its date)
            if (newBooking.type === 'permanent' && existing.type === 'event' && existing.date) {
                const eventDow = getDayOfWeek(existing.date);
                if (eventDow !== newBooking.dayOfWeek) continue;
                if (timeRangesOverlap(existing.startTime, existing.endTime, newBooking.startTime, newBooking.endTime)) {
                    conflicts.push({
                        reason: `Conflicts with an event on ${existing.date} (${existing.startTime}-${existing.endTime}).`,
                        type: 'booking',
                        booking: existing
                    });
                }
            }
        }

        return conflicts;
    } catch (error) {
        console.error('Error checking conflicts:', error);
        return [];
    }
}

window.deleteBooking = async function(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
        const result = await bookingService.deleteBooking(bookingId);
        if (result.success) {
            showToast('success', 'Booking deleted successfully');
            loadMyBookings();
            loadDashboard();
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        showToast('error', 'Failed to delete booking');
    }
};

window.openTempFreeModal = function (bookingId) {
    const booking = bookingById.get(String(bookingId)) || bookingsCache.find(b => String(b.id || b.bookingId) === String(bookingId));
    if (!booking) {
        showToast('error', 'Booking not found');
        return;
    }

    if (booking.type !== 'permanent') {
        showToast('info', 'Temporary free applies to permanent bookings only');
        return;
    }

    const content = document.getElementById('tempFreeContent');
    if (!content) {
        showToast('error', 'Temp free modal not found');
        return;
    }

    const existingDates = Array.isArray(booking.temporaryFreeDates) ? [...booking.temporaryFreeDates].sort() : [];
    const todayIso = new Date().toISOString().slice(0, 10);

    content.innerHTML = `
        <p><strong>${escapeHtml(booking.courseName || booking.title || 'Booking')}</strong></p>
        <p>${escapeHtml(booking.roomName || '')} • ${escapeHtml(booking.hallName || '')}</p>
        <p>${escapeHtml(getDayName(booking.dayOfWeek))} • ${escapeHtml(booking.startTime)}-${escapeHtml(booking.endTime)}</p>

        <div class="form-group" style="margin-top: 12px;">
            <label for="tempFreeDate">Date to mark free</label>
            <input type="date" id="tempFreeDate" value="${escapeHtml(todayIso)}">
            <small>This removes this class session for the selected date only.</small>
        </div>

        <div class="form-actions" style="margin-top: 12px;">
            <button class="btn btn-primary" id="tempFreeSaveBtn">Mark Temporarily Free</button>
            <button class="btn btn-secondary modal-cancel" type="button">Close</button>
        </div>

        <hr style="margin: 16px 0; border: none; border-top: 1px solid var(--border-color);" />
        <h3 style="margin: 0 0 8px;">Already Marked Free</h3>
        ${existingDates.length === 0
            ? '<p class="empty-state">No dates marked free yet.</p>'
            : `<div class="booking-list">${existingDates
                .map(d => `
                    <div class="booking-item" style="justify-content: space-between;">
                        <div class="booking-item-info">
                            <div class="booking-item-title">${escapeHtml(d)}</div>
                            <div class="booking-item-details">Click remove to restore the class on this date.</div>
                        </div>
                        <div class="booking-item-actions">
                            <button class="btn btn-sm btn-danger" data-remove-date="${escapeHtml(d)}">Remove</button>
                        </div>
                    </div>
                `).join('')}</div>`
        }
    `;

    const saveBtn = document.getElementById('tempFreeSaveBtn');
    saveBtn?.addEventListener('click', async () => {
        const date = document.getElementById('tempFreeDate')?.value;
        if (!date) {
            showToast('error', 'Please pick a date');
            return;
        }

        try {
            const result = await bookingService.markTemporarilyFree(bookingId, [date]);
            if (!result.success) {
                showToast('error', result.error || 'Failed to mark temporarily free');
                return;
            }

            showToast('success', 'Marked as temporarily free');
            // Refresh bookings cache and re-open modal with updated data
            await loadMyBookings();
            window.openTempFreeModal(bookingId);
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to mark temporarily free');
        }
    });

    content.querySelectorAll('[data-remove-date]')?.forEach(btn => {
        btn.addEventListener('click', async () => {
            const date = btn.getAttribute('data-remove-date');
            if (!date) return;
            try {
                const result = await bookingService.removeTemporarilyFree(bookingId, [date]);
                if (!result.success) {
                    showToast('error', result.error || 'Failed to remove date');
                    return;
                }
                showToast('success', 'Restored class for that date');
                await loadMyBookings();
                window.openTempFreeModal(bookingId);
            } catch (err) {
                console.error(err);
                showToast('error', 'Failed to remove date');
            }
        });
    });

    openModal('tempFreeModal');
};

window.editBooking = async function(bookingId) {
    showToast('info', 'Edit functionality coming soon');
};

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getDayName(dayNum) {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum] || 'Unknown';
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
}
