/**
 * Admin Portal Functionality
 * Handles all admin-specific operations
 */

import { showToast } from './components/Toast.js';
import { openModal, closeModal } from './components/Modal.js';
import * as roomService from './services/roomService.js';
import * as bookingService from './services/bookingService.js';
import * as userService from './services/userService.js';

let currentHallId = null;
let currentRoomId = null;
let deleteCallback = null;

/**
 * Initialize admin portal
 */
export function initAdmin() {
    console.log('initAdmin() called');
    try {
        console.log('Starting setupNavigation...');
        setupNavigation();
        console.log('Starting setupButtons...');
        setupButtons();
        console.log('Starting setupModals...');
        setupModals();
        console.log('Starting loadDashboard...');
        loadDashboard();
        console.log('initAdmin() complete');
    } catch (error) {
        console.error('Error in initAdmin:', error);
    }
}

/**
 * Setup navigation between views
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1); // Remove #
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show target view
            const views = document.querySelectorAll('.view');
            views.forEach(v => v.classList.remove('active'));
            
            const targetView = document.getElementById(`${target}View`);
            if (targetView) {
                targetView.classList.add('active');
                
                // Load data for the view
                switch(target) {
                    case 'dashboard':
                        loadDashboard();
                        break;
                    case 'halls':
                        loadHalls();
                        break;
                    case 'rooms':
                        loadRooms();
                        break;
                    case 'unavailable':
                        loadUnavailability();
                        break;
                }
            }
        });
    });
}

/**
 * Setup button click handlers
 */
function setupButtons() {
    console.log('Setting up admin buttons...');
    
    // Dashboard buttons
    document.getElementById('addHallBtn')?.addEventListener('click', () => openHallModal());
    document.getElementById('addRoomBtn')?.addEventListener('click', () => openRoomModal());
    document.getElementById('viewBookingsBtn')?.addEventListener('click', () => viewAllBookings());
    
    // View-specific buttons
    document.getElementById('newHallBtn')?.addEventListener('click', () => openHallModal());
    document.getElementById('newRoomBtn')?.addEventListener('click', () => openRoomModal());
    
    const bulkBtn = document.getElementById('bulkAddRoomsBtn');
    console.log('Bulk button element:', bulkBtn);
    if (bulkBtn) {
        console.log('Bulk add rooms button found, attaching listener');
        bulkBtn.addEventListener('click', () => {
            console.log('Bulk add rooms clicked');
            openBulkRoomModal();
        });
    } else {
        console.error('Bulk add rooms button not found');
    }
    
    document.getElementById('newUnavailabilityBtn')?.addEventListener('click', () => openUnavailabilityModal());
    
    // Hall filter in rooms view
    document.getElementById('filterHall')?.addEventListener('change', (e) => {
        loadRooms(e.target.value);
    });
    
    console.log('Admin buttons setup complete');
}

/**
 * Setup modal forms and handlers
 */
function setupModals() {
    // Hall form
    const hallForm = document.getElementById('hallForm');
    hallForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveHall();
    });
    
    // Room form
    const roomForm = document.getElementById('roomForm');
    roomForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRoom();
    });
    
    // Bulk room form
    const bulkRoomForm = document.getElementById('bulkRoomForm');
    bulkRoomForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveBulkRooms();
    });
    
    // Auto-generate prefix when hall is selected
    const bulkRoomHall = document.getElementById('bulkRoomHall');
    bulkRoomHall?.addEventListener('change', async (e) => {
        const hallId = e.target.value;
        if (hallId) {
            const hall = await roomService.getHall(hallId);
            if (hall) {
                const prefix = generateRoomPrefix(hall.name);
                document.getElementById('roomPrefix').value = prefix;
            }
        }
    });
    
    // Unavailability form
    const unavailabilityForm = document.getElementById('unavailabilityForm');
    unavailabilityForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUnavailability();
    });
    
    // Unavailability type toggle
    const unavailTypeRadios = document.querySelectorAll('input[name="unavailType"]');
    unavailTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const specificDateField = document.getElementById('specificDateField');
            const recurringDayField = document.getElementById('recurringDayField');
            
            if (e.target.value === 'date') {
                specificDateField?.classList.remove('hidden');
                recurringDayField?.classList.add('hidden');
                document.getElementById('unavailDate').required = true;
            } else {
                specificDateField?.classList.add('hidden');
                recurringDayField?.classList.remove('hidden');
                document.getElementById('unavailDate').required = false;
            }
        });
    });
    
    // Hall selection in unavailability form
    const unavailHall = document.getElementById('unavailHall');
    unavailHall?.addEventListener('change', async (e) => {
        const unavailRoom = document.getElementById('unavailRoom');
        const hallId = e.target.value;
        
        if (hallId) {
            const rooms = await roomService.getRoomsByHall(hallId);
            unavailRoom.disabled = false;
            unavailRoom.innerHTML = '<option value="">Select Room...</option>' +
                rooms.map(room => `<option value="${room.id}">${room.number}</option>`).join('');
        } else {
            unavailRoom.disabled = true;
            unavailRoom.innerHTML = '<option value="">Select Hall First...</option>';
        }
    });
    
    // Delete confirmation
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
        closeModal('deleteModal');
        deleteCallback = null;
    });
    
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
        if (deleteCallback) {
            await deleteCallback();
            deleteCallback = null;
        }
        closeModal('deleteModal');
    });
    
    // Close button handlers
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal('hallModal');
            closeModal('roomModal');
            closeModal('bulkRoomModal');
            closeModal('unavailabilityModal');
        });
    });
}

/**
 * Load dashboard data
 */
async function loadDashboard() {
    try {
        const [halls, bookings, users] = await Promise.all([
            roomService.getAllHalls(),
            bookingService.getAllBookings(),
            userService.getAllUsers()
        ]);
        
        // Count rooms
        let totalRooms = 0;
        for (const hall of halls) {
            const rooms = await roomService.getRoomsByHall(hall.id);
            totalRooms += rooms.length;
        }
        
        // Update statistics
        document.getElementById('totalHalls').textContent = halls.length;
        document.getElementById('totalRooms').textContent = totalRooms;
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalBookings').textContent = bookings.length;
        
        // Load recent activity
        loadRecentActivity(bookings);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

/**
 * Load recent activity
 */
function loadRecentActivity(bookings) {
    const container = document.getElementById('recentActivity');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<p class="empty-state">No recent activity</p>';
        return;
    }
    
    // Sort by creation date, most recent first
    const recentBookings = bookings
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10);
    
    container.innerHTML = recentBookings.map(booking => `
        <div class="activity-item">
            <div class="activity-icon">📅</div>
            <div class="activity-details">
                <strong>${booking.title}</strong>
                <p>${booking.roomName} - ${booking.hallName}</p>
                <span class="activity-time">${formatDate(booking.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

/**
 * Load lecture halls
 */
async function loadHalls() {
    const container = document.getElementById('hallsList');
    container.innerHTML = '<p class="loading">Loading...</p>';
    
    try {
        const halls = await roomService.getAllHalls();
        
        if (halls.length === 0) {
            container.innerHTML = '<p class="empty-state">No lecture halls yet. Add your first hall to get started.</p>';
            return;
        }
        
        container.innerHTML = halls.map(hall => `
            <div class="card item-card">
                <div class="card-header">
                    <h3>${hall.name}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="window.editHall('${hall.id}')" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="window.deleteHall('${hall.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Location:</strong> ${hall.location}</p>
                    <p><strong>Rooms:</strong> <span id="hall-rooms-${hall.id}">Loading...</span></p>
                </div>
            </div>
        `).join('');
        
        // Load room counts for each hall
        halls.forEach(async (hall) => {
            const rooms = await roomService.getRoomsByHall(hall.id);
            const countElement = document.getElementById(`hall-rooms-${hall.id}`);
            if (countElement) {
                countElement.textContent = rooms.length;
            }
        });
        
    } catch (error) {
        console.error('Error loading halls:', error);
        container.innerHTML = '<p class="error-state">Failed to load lecture halls</p>';
        showToast('Failed to load lecture halls', 'error');
    }
}

/**
 * Load rooms
 */
async function loadRooms(filterHallId = '') {
    const container = document.getElementById('roomsList');
    container.innerHTML = '<p class="loading">Loading...</p>';
    
    try {
        const halls = await roomService.getAllHalls();
        
        // Populate hall filter if not already done
        const filterSelect = document.getElementById('filterHall');
        if (filterSelect && filterSelect.options.length === 1) {
            halls.forEach(hall => {
                const option = document.createElement('option');
                option.value = hall.id;
                option.textContent = hall.name;
                filterSelect.appendChild(option);
            });
        }
        
        // Load rooms
        let allRooms = [];
        if (filterHallId) {
            allRooms = await roomService.getRoomsByHall(filterHallId);
        } else {
            for (const hall of halls) {
                const rooms = await roomService.getRoomsByHall(hall.id);
                allRooms.push(...rooms.map(r => ({ ...r, hallName: hall.name })));
            }
        }
        
        if (allRooms.length === 0) {
            container.innerHTML = '<p class="empty-state">No rooms yet. Add rooms to lecture halls to get started.</p>';
            return;
        }
        
        container.innerHTML = allRooms.map(room => `
            <div class="card item-card">
                <div class="card-header">
                    <h3>${room.number}</h3>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="window.editRoom('${room.id}')" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="window.deleteRoom('${room.id}')" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="card-body">
                    <p><strong>Hall:</strong> ${room.hallName || 'Unknown'}</p>
                    <p><strong>Capacity:</strong> ${room.capacity} seats</p>
                    <div class="room-features">
                        <span class="feature-badge">${room.workingSockets || 0} 🔌 Sockets</span>
                        ${room.hasProjector ? '<span class="feature-badge">📽️ Projector</span>' : ''}
                        ${room.hasMicSpeaker ? '<span class="feature-badge">🎤 PA System</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading rooms:', error);
        container.innerHTML = '<p class="error-state">Failed to load rooms</p>';
        showToast('Failed to load rooms', 'error');
    }
}

/**
 * Load unavailability records
 */
async function loadUnavailability() {
    const container = document.getElementById('unavailabilityList');
    container.innerHTML = '<p class="loading">Loading...</p>';
    
    try {
        const unavailability = await roomService.getAllUnavailability();
        
        if (unavailability.length === 0) {
            container.innerHTML = '<p class="empty-state">No unavailability records</p>';
            return;
        }
        
        container.innerHTML = unavailability.map(record => `
            <div class="card item-card">
                <div class="card-header">
                    <h3>${record.roomName}</h3>
                    <button class="btn-icon" onclick="window.deleteUnavailability('${record.id}')" title="Delete">🗑️</button>
                </div>
                <div class="card-body">
                    <p><strong>Hall:</strong> ${record.hallName}</p>
                    <p><strong>Type:</strong> ${record.type === 'date' ? 'Specific Date' : 'Recurring'}</p>
                    ${record.type === 'date' 
                        ? `<p><strong>Date:</strong> ${record.date}</p>`
                        : `<p><strong>Day:</strong> ${getDayName(record.dayOfWeek)}</p>`
                    }
                    <p><strong>Time:</strong> ${record.startTime} - ${record.endTime}</p>
                    <p><strong>Reason:</strong> ${formatReason(record.reason)}</p>
                    ${record.customMessage ? `<p><strong>Note:</strong> ${record.customMessage}</p>` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading unavailability:', error);
        container.innerHTML = '<p class="error-state">Failed to load unavailability records</p>';
        showToast('Failed to load unavailability records', 'error');
    }
}

/**
 * Open hall modal for add/edit
 */
async function openHallModal(hallId = null) {
    currentHallId = hallId;
    const modal = document.getElementById('hallModal');
    const title = document.getElementById('hallModalTitle');
    const form = document.getElementById('hallForm');
    
    form.reset();
    
    if (hallId) {
        title.textContent = 'Edit Lecture Hall';
        const hall = await roomService.getHall(hallId);
        document.getElementById('hallName').value = hall.name;
        document.getElementById('hallLocation').value = hall.location;
    } else {
        title.textContent = 'Add Lecture Hall';
    }
    
    openModal('hallModal');
}

/**
 * Save hall (create or update)
 */
async function saveHall() {
    const name = document.getElementById('hallName').value.trim();
    const location = document.getElementById('hallLocation').value.trim();
    
    if (!name || !location) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const hallData = { name, location };
        
        if (currentHallId) {
            await roomService.updateHall(currentHallId, hallData);
            showToast('Lecture hall updated successfully', 'success');
        } else {
            await roomService.createHall(hallData);
            showToast('Lecture hall created successfully', 'success');
        }
        
        closeModal('hallModal');
        loadHalls();
        loadDashboard();
        
    } catch (error) {
        console.error('Error saving hall:', error);
        showToast('Failed to save lecture hall', 'error');
    }
}

/**
 * Open room modal for add/edit
 */
async function openRoomModal(roomId = null) {
    currentRoomId = roomId;
    const modal = document.getElementById('roomModal');
    const title = document.getElementById('roomModalTitle');
    const form = document.getElementById('roomForm');
    const hallSelect = document.getElementById('roomHall');
    
    form.reset();
    
    // Load halls into select
    const halls = await roomService.getAllHalls();
    hallSelect.innerHTML = '<option value="">Select Hall...</option>' +
        halls.map(hall => `<option value="${hall.id}">${hall.name}</option>`).join('');
    
    if (roomId) {
        title.textContent = 'Edit Room';
        const room = await roomService.getRoom(roomId);
        hallSelect.value = room.hallId;
        document.getElementById('roomNumber').value = room.number;
        document.getElementById('roomCapacity').value = room.capacity;
        document.getElementById('workingSockets').value = room.workingSockets || 0;
        document.getElementById('hasProjector').checked = room.hasProjector || false;
        document.getElementById('hasMicSpeaker').checked = room.hasMicSpeaker || false;
    } else {
        title.textContent = 'Add Room';
    }
    
    openModal('roomModal');
}

/**
 * Save room (create or update)
 */
async function saveRoom() {
    const hallId = document.getElementById('roomHall').value;
    const number = document.getElementById('roomNumber').value.trim();
    const capacity = parseInt(document.getElementById('roomCapacity').value);
    const workingSockets = parseInt(document.getElementById('workingSockets').value) || 0;
    const hasProjector = document.getElementById('hasProjector').checked;
    const hasMicSpeaker = document.getElementById('hasMicSpeaker').checked;
    
    if (!hallId || !number || !capacity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const roomData = {
            hallId,
            number,
            capacity,
            workingSockets,
            hasProjector,
            hasMicSpeaker
        };
        
        if (currentRoomId) {
            await roomService.updateRoom(currentRoomId, roomData);
            showToast('Room updated successfully', 'success');
        } else {
            await roomService.createRoom(roomData);
            showToast('Room created successfully', 'success');
        }
        
        closeModal('roomModal');
        loadRooms();
        loadDashboard();
        
    } catch (error) {
        console.error('Error saving room:', error);
        showToast('Failed to save room', 'error');
    }
}

/**
 * Open bulk room modal
 */
async function openBulkRoomModal() {
    const form = document.getElementById('bulkRoomForm');
    const hallSelect = document.getElementById('bulkRoomHall');
    
    form.reset();
    
    // Load halls into select
    const halls = await roomService.getAllHalls();
    hallSelect.innerHTML = '<option value="">Select Hall...</option>' +
        halls.map(hall => `<option value="${hall.id}">${hall.name}</option>`).join('');
    
    openModal('bulkRoomModal');
}

/**
 * Save bulk rooms
 */
async function saveBulkRooms() {
    const hallId = document.getElementById('bulkRoomHall').value;
    const prefix = document.getElementById('roomPrefix').value.trim();
    const startNum = parseInt(document.getElementById('roomStartNum').value);
    const endNum = parseInt(document.getElementById('roomEndNum').value);
    const capacity = parseInt(document.getElementById('bulkRoomCapacity').value);
    const workingSockets = parseInt(document.getElementById('bulkWorkingSockets').value) || 0;
    const hasProjector = document.getElementById('bulkHasProjector').checked;
    const hasMicSpeaker = document.getElementById('bulkHasMicSpeaker').checked;
    
    if (!hallId || !prefix || !startNum || !endNum || !capacity) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (startNum > endNum) {
        showToast('Start number must be less than or equal to end number', 'error');
        return;
    }
    
    const count = endNum - startNum + 1;
    if (count > 100) {
        showToast('Cannot create more than 100 rooms at once', 'error');
        return;
    }
    
    try {
        showToast(`Creating ${count} rooms...`, 'info');
        
        const promises = [];
        for (let i = startNum; i <= endNum; i++) {
            const roomData = {
                hallId,
                number: `${prefix} ${i}`,
                capacity,
                workingSockets,
                hasProjector,
                hasMicSpeaker
            };
            promises.push(roomService.createRoom(roomData));
        }
        
        await Promise.all(promises);
        
        showToast(`Successfully created ${count} rooms!`, 'success');
        closeModal('bulkRoomModal');
        loadRooms();
        loadDashboard();
        
    } catch (error) {
        console.error('Error creating bulk rooms:', error);
        showToast('Failed to create some rooms', 'error');
    }
}

/**
 * Generate room prefix from hall name
 * Takes first letter of each capitalized word
 */
function generateRoomPrefix(hallName) {
    if (!hallName) return '';
    
    // Split by spaces and get first letter of each word that starts with uppercase
    const words = hallName.trim().split(/\s+/);
    const prefix = words
        .filter(word => word.length > 0 && word[0] === word[0].toUpperCase())
        .map(word => word[0].toUpperCase())
        .join('');
    
    return prefix || hallName.substring(0, 3).toUpperCase();
}

/**
 * Open unavailability modal
 */
async function openUnavailabilityModal() {
    const form = document.getElementById('unavailabilityForm');
    const hallSelect = document.getElementById('unavailHall');
    
    form.reset();
    
    // Load halls into select
    const halls = await roomService.getAllHalls();
    hallSelect.innerHTML = '<option value="">Select Hall...</option>' +
        halls.map(hall => `<option value="${hall.id}">${hall.name}</option>`).join('');
    
    openModal('unavailabilityModal');
}

/**
 * Save unavailability record
 */
async function saveUnavailability() {
    const hallId = document.getElementById('unavailHall').value;
    const roomId = document.getElementById('unavailRoom').value;
    const type = document.querySelector('input[name="unavailType"]:checked').value;
    const startTime = document.getElementById('unavailStart').value;
    const endTime = document.getElementById('unavailEnd').value;
    const reason = document.getElementById('unavailReason').value;
    const customMessage = document.getElementById('unavailMessage').value.trim();
    
    if (!hallId || !roomId || !startTime || !endTime || !reason) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const unavailData = {
            hallId,
            roomId,
            type,
            startTime,
            endTime,
            reason,
            customMessage
        };
        
        if (type === 'date') {
            unavailData.date = document.getElementById('unavailDate').value;
        } else {
            unavailData.dayOfWeek = parseInt(document.getElementById('unavailDay').value);
        }
        
        await roomService.createUnavailability(unavailData);
        showToast('Unavailability record created successfully', 'success');
        
        closeModal('unavailabilityModal');
        loadUnavailability();
        
    } catch (error) {
        console.error('Error saving unavailability:', error);
        showToast('Failed to save unavailability record', 'error');
    }
}

/**
 * View all bookings
 */
function viewAllBookings() {
    // TODO: Implement bookings view
    showToast('Bookings view coming soon', 'info');
}

/**
 * Delete hall
 */
window.deleteHall = async function(hallId) {
    deleteCallback = async () => {
        try {
            await roomService.deleteHall(hallId);
            showToast('Lecture hall deleted successfully', 'success');
            loadHalls();
            loadDashboard();
        } catch (error) {
            console.error('Error deleting hall:', error);
            showToast('Failed to delete lecture hall', 'error');
        }
    };
    
    document.getElementById('deleteMessage').textContent = 
        'Are you sure you want to delete this lecture hall? All rooms in this hall will also be deleted.';
    openModal('deleteModal');
};

/**
 * Edit hall
 */
window.editHall = function(hallId) {
    openHallModal(hallId);
};

/**
 * Delete room
 */
window.deleteRoom = async function(roomId) {
    deleteCallback = async () => {
        try {
            await roomService.deleteRoom(roomId);
            showToast('Room deleted successfully', 'success');
            loadRooms();
            loadDashboard();
        } catch (error) {
            console.error('Error deleting room:', error);
            showToast('Failed to delete room', 'error');
        }
    };
    
    document.getElementById('deleteMessage').textContent = 
        'Are you sure you want to delete this room? All bookings for this room will also be deleted.';
    openModal('deleteModal');
};

/**
 * Edit room
 */
window.editRoom = function(roomId) {
    openRoomModal(roomId);
};

/**
 * Delete unavailability
 */
window.deleteUnavailability = async function(unavailId) {
    deleteCallback = async () => {
        try {
            await roomService.deleteUnavailability(unavailId);
            showToast('Unavailability record deleted successfully', 'success');
            loadUnavailability();
        } catch (error) {
            console.error('Error deleting unavailability:', error);
            showToast('Failed to delete unavailability record', 'error');
        }
    };
    
    document.getElementById('deleteMessage').textContent = 
        'Are you sure you want to delete this unavailability record?';
    openModal('deleteModal');
};

// Helper functions
function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getDayName(dayNum) {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum] || 'Unknown';
}

function formatReason(reason) {
    const reasons = {
        'maintenance': 'Maintenance',
        'cleaning': 'Cleaning',
        'student_study': 'Free for Student Study',
        'closed': 'Completely Closed'
    };
    return reasons[reason] || reason;
}
