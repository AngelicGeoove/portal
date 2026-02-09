/**
 * Booking Form Component
 * Handles the booking form UI and validation
 */

import { checkBookingConflict } from '../utils/conflictDetector.js';
import { showToast } from './Toast.js';

/**
 * Initialize booking form
 */
export function initBookingForm(formId, onSubmit) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error(`Form ${formId} not found`);
        return;
    }

    // Type radio buttons
    const typeRadios = form.querySelectorAll('input[name="bookingType"]');
    const permanentFields = form.querySelector('#permanentFields');
    const eventFields = form.querySelector('#eventFields');
    const dayOfWeekField = form.querySelector('#dayOfWeek');
    const eventDateField = form.querySelector('#eventDate');

    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'permanent') {
                permanentFields?.classList.remove('hidden');
                eventFields?.classList.add('hidden');
                dayOfWeekField.required = true;
                eventDateField.required = false;
            } else {
                permanentFields?.classList.add('hidden');
                eventFields?.classList.remove('hidden');
                dayOfWeekField.required = false;
                eventDateField.required = true;
            }
        });
    });

    // Hall selection populates rooms
    const hallSelect = form.querySelector('#lectureHall');
    const roomSelect = form.querySelector('#room');

    hallSelect?.addEventListener('change', async (e) => {
        const hallId = e.target.value;
        if (!hallId) {
            roomSelect.disabled = true;
            roomSelect.innerHTML = '<option value="">Select Hall First...</option>';
            return;
        }

        // Load rooms for this hall
        await loadRoomsForHall(hallId, roomSelect);
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = extractFormData(form);
        
        // Validate
        const validation = validateBookingForm(formData);
        if (!validation.valid) {
            showToast('error', validation.message);
            return;
        }

        // Call the onSubmit callback
        if (onSubmit) {
            await onSubmit(formData);
        }
    });

    return form;
}

/**
 * Extract form data
 */
function extractFormData(form) {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Get type from radio buttons
    const typeRadio = form.querySelector('input[name="bookingType"]:checked');
    data.type = typeRadio?.value || 'permanent';

    return data;
}

/**
 * Validate booking form
 */
function validateBookingForm(data) {
    if (!data.lectureHall || !data.room) {
        return { valid: false, message: 'Please select a lecture hall and room' };
    }

    if (!data.startTime || !data.endTime) {
        return { valid: false, message: 'Please select start and end times' };
    }

    // Validate time range
    if (data.startTime >= data.endTime) {
        return { valid: false, message: 'End time must be after start time' };
    }

    if (data.type === 'permanent' && !data.dayOfWeek) {
        return { valid: false, message: 'Please select a day of week' };
    }

    if (data.type === 'event' && !data.eventDate) {
        return { valid: false, message: 'Please select a date for the event' };
    }

    if (!data.courseName) {
        return { valid: false, message: 'Please enter a course/event name' };
    }

    if (!data.classSelect) {
        return { valid: false, message: 'Please select a class' };
    }

    return { valid: true };
}

/**
 * Load rooms for a hall (to be implemented with actual service)
 */
async function loadRoomsForHall(hallId, roomSelect) {
    roomSelect.disabled = true;
    roomSelect.innerHTML = '<option value="">Loading...</option>';

    try {
        // This would call the room service
        // import { getRoomsByHall } from '../services/roomService.js';
        // const rooms = await getRoomsByHall(hallId);
        
        // Mock data for now
        const rooms = [];

        roomSelect.innerHTML = '<option value="">Select Room...</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.roomId;
            option.textContent = room.roomNumber;
            roomSelect.appendChild(option);
        });

        roomSelect.disabled = false;
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomSelect.innerHTML = '<option value="">Error loading rooms</option>';
    }
}

/**
 * Reset booking form
 */
export function resetBookingForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        
        // Reset conditional fields
        const permanentFields = form.querySelector('#permanentFields');
        const eventFields = form.querySelector('#eventFields');
        
        permanentFields?.classList.remove('hidden');
        eventFields?.classList.add('hidden');

        // Reset room select
        const roomSelect = form.querySelector('#room');
        if (roomSelect) {
            roomSelect.disabled = true;
            roomSelect.innerHTML = '<option value="">Select Hall First...</option>';
        }
    }
}

/**
 * Display conflict warning
 */
export function showConflictWarning(conflicts) {
    const warningDiv = document.getElementById('conflictWarning');
    if (!warningDiv) return;

    const messageEl = warningDiv.querySelector('#conflictMessage');
    
    if (conflicts && conflicts.length > 0) {
        const messages = conflicts.map(c => 
            `• ${c.reason}: ${c.booking.courseName || c.booking.eventName}`
        ).join('<br>');
        
        messageEl.innerHTML = messages;
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }
}
