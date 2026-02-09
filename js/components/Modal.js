/**
 * Modal Component
 * Handles modal dialogs
 */

/**
 * Open a modal
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal ${modalId} not found`);
        return;
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Setup close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtns = modal.querySelectorAll('.modal-cancel');

    closeBtn?.addEventListener('click', () => closeModal(modalId));
    
    cancelBtns.forEach(btn => {
        btn.addEventListener('click', () => closeModal(modalId));
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });

    // Close on escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal(modalId);
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Close a modal
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('show');
    document.body.style.overflow = '';

    // Clear modal content if needed
    const contentDiv = modal.querySelector('[id$="Content"]');
    if (contentDiv) {
        // Optionally clear dynamic content
        // contentDiv.innerHTML = '';
    }
}

/**
 * Create a confirmation modal
 */
export function showConfirmation(title, message, onConfirm, onCancel = null) {
    const modal = document.getElementById('deleteModal') || createConfirmationModal();
    
    const titleEl = modal.querySelector('h2');
    const messageEl = modal.querySelector('p');
    const confirmBtn = modal.querySelector('#confirmDeleteBtn');
    const cancelBtn = modal.querySelector('#cancelDeleteBtn');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    // Remove old event listeners by cloning
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        if (onConfirm) onConfirm();
        closeModal('deleteModal');
    });

    newCancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        closeModal('deleteModal');
    });

    openModal('deleteModal');
}

/**
 * Create confirmation modal if it doesn't exist
 */
function createConfirmationModal() {
    const modal = document.createElement('div');
    modal.id = 'deleteModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-small">
            <h2>Confirm Action</h2>
            <p id="deleteMessage">Are you sure?</p>
            <div class="form-actions">
                <button class="btn btn-secondary" id="cancelDeleteBtn">Cancel</button>
                <button class="btn btn-danger" id="confirmDeleteBtn">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

/**
 * Show a loading modal
 */
export function showLoadingModal(message = 'Loading...') {
    let modal = document.getElementById('loadingModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loadingModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-small" style="text-align: center;">
                <div class="spinner"></div>
                <p id="loadingMessage">${message}</p>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const messageEl = modal.querySelector('#loadingMessage');
    if (messageEl) messageEl.textContent = message;

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Hide loading modal
 */
export function hideLoadingModal() {
    const modal = document.getElementById('loadingModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}
