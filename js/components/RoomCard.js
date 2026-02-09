/**
 * Room Card Component
 * Renders individual room cards
 */

import { formatTime } from '../utils/dateUtils.js';

/**
 * Create a room card element
 */
export function createRoomCard(room, hall, availability = null) {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.dataset.roomId = room.roomId;

    const statusClass = availability?.isAvailable ? 'available' : 'booked';
    const statusText = availability?.isAvailable ? 'Available' : 'Booked';

    card.innerHTML = `
        <div class="room-card-header">
            <div>
                <div class="room-card-title">${room.roomNumber}</div>
                <div class="room-card-subtitle">${hall?.name || 'Unknown Hall'}</div>
            </div>
            <div class="room-card-status ${statusClass}">${statusText}</div>
        </div>
        <div class="room-card-body">
            <p>Capacity: ${room.capacity} seats</p>
            ${availability && !availability.isAvailable ? 
                `<p>Available at: ${formatTime(availability.nextAvailableTime)}</p>` : ''}
        </div>
        <div class="room-card-features">
            ${createFeatureIcon('socket', room.features?.workingSockets, `${room.features?.workingSockets || 0} sockets`)}
            ${createFeatureIcon('projector', room.features?.hasProjector, 'Projector')}
            ${createFeatureIcon('speaker', room.features?.hasMicSpeaker, 'PA System')}
        </div>
    `;

    // Click handler
    card.addEventListener('click', () => {
        showRoomDetails(room, hall);
    });

    return card;
}

/**
 * Create feature icon
 */
function createFeatureIcon(type, value, label) {
    if (!value) return '';

    const icons = {
        socket: '🔌',
        projector: '🎦',
        speaker: '🔊'
    };

    return `
        <div class="room-feature" title="${label}">
            <span class="room-feature-icon-inline">${icons[type] || '•'}</span>
            <span>${type === 'socket' ? value : label}</span>
        </div>
    `;
}

/**
 * Show room details in modal
 */
function showRoomDetails(room, hall) {
    // This would open a modal with full room details
    console.log('Show room details:', room, hall);
    
    // Example implementation:
    // import { openModal } from './Modal.js';
    // const content = document.getElementById('roomModalContent');
    // content.innerHTML = renderRoomDetails(room, hall);
    // openModal('roomModal');
}

/**
 * Render detailed room information
 */
export function renderRoomDetails(room, hall) {
    return `
        <h3>${room.roomNumber}</h3>
        <p><strong>Lecture Hall:</strong> ${hall?.name || 'Unknown'}</p>
        <p><strong>Location:</strong> ${hall?.location || 'N/A'}</p>
        <p><strong>Capacity:</strong> ${room.capacity} seats</p>
        
        <h4>Features</h4>
        <ul>
            <li>Working Electricity Sockets: ${room.features?.workingSockets || 0}</li>
            <li>Projector: ${room.features?.hasProjector ? 'Yes ✓' : 'No ✗'}</li>
            <li>PA System / Mic & Speaker: ${room.features?.hasMicSpeaker ? 'Yes ✓' : 'No ✗'}</li>
        </ul>
    `;
}
