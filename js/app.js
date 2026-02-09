/**
 * Main Application Entry Point
 * Initializes the application based on current page
 */

import { initRouter } from './router.js';
import { logout } from './auth.js';

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // GitHub Pages typically serves from a repo subfolder (e.g. /portal/)
    // so pathname may be '/portal/' instead of '/'. Prefer DOM detection.
    const isAuthPage = !!document.getElementById('loginFormElement');

    if (isAuthPage || path.includes('index.html') || path === '/' || path.endsWith('/')) {
        initLoginPage();
    } else if (path.includes('student.html')) {
        initStudentPortal();
    } else if (path.includes('staff.html')) {
        initStaffPortal();
    } else if (path.includes('admin.html')) {
        initAdminPortal();
    }
});

/**
 * Initialize login page
 */
function initLoginPage() {
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const signupRoleSelect = document.getElementById('signupRole');
    const staffFields = document.getElementById('staffFields');
    const logoSecret = document.getElementById('logoSecret');

    // Toggle between login and signup forms
    showSignupLink?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // Show/hide staff fields based on role selection
    signupRoleSelect?.addEventListener('change', (e) => {
        if (e.target.value === 'staff') {
            staffFields.classList.remove('hidden');
        } else {
            staffFields.classList.add('hidden');
        }
    });

    // Handle lecturer checkbox - hide index number for lecturers
    const isLecturerCheckbox = document.getElementById('isLecturer');
    const indexNumberField = document.getElementById('indexNumberField');
    const indexNumberInput = document.getElementById('signupIndexNumber');
    
    isLecturerCheckbox?.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Lecturer - hide index number field
            indexNumberField?.classList.add('hidden');
            indexNumberInput.required = false;
            indexNumberInput.value = ''; // Clear any entered value
        } else {
            // Class rep - show index number field
            indexNumberField?.classList.remove('hidden');
            indexNumberInput.required = true;
        }
    });

    // Secret admin access (triple-click or Ctrl+Alt+A)
    let clickCount = 0;
    let clickTimer;

    logoSecret?.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);

        if (clickCount === 3) {
            enableAdminSignup();
            clickCount = 0;
        }

        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 1000);
    });

    // Keyboard shortcut for admin
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'a') {
            enableAdminSignup();
        }
    });

    // Enable admin signup mode
    function enableAdminSignup() {
        // Switch to signup form
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        
        // Add visual indicator
        const header = document.querySelector('.auth-header h1');
        if (header) {
            header.textContent = '🔐 Admin Account Setup';
            header.style.color = '#ef4444';
        }
        
        // Add instruction message
        let instruction = document.getElementById('adminInstruction');
        if (!instruction) {
            instruction = document.createElement('div');
            instruction.id = 'adminInstruction';
            instruction.className = 'alert alert-warning';
            instruction.style.marginBottom = '1rem';
            instruction.innerHTML = `
                <strong>Admin Setup Instructions:</strong><br>
                1. Create your account below<br>
                2. Go to Firebase Console → Firestore → users collection<br>
                3. Find your user document and change role from "student" to "admin"<br>
                4. Logout and login again to access admin portal
            `;
            signupForm.insertBefore(instruction, signupForm.querySelector('h2').nextSibling);
        }
    }

    // Handle form submissions (actual auth logic in auth.js)
    setupAuthForms();
}

/**
 * Initialize student portal
 */
function initStudentPortal() {
    initRouter();
    setupLogout();

    // Student-specific initialization
    (async () => {
        try {
            console.log('Importing student.js...');
            const studentModule = await import('./student.js');
            console.log('Calling initStudent...');
            await studentModule.initStudent();
            console.log('Student portal initialized');
        } catch (error) {
            console.error('Error initializing student:', error);
        }
    })();
}

/**
 * Initialize staff portal
 */
async function initStaffPortal() {
    console.log('initStaffPortal() called');
    initRouter();
    setupLogout();
    
    try {
        // Staff-specific initialization
        console.log('Importing staff.js...');
        const staffModule = await import('./staff.js');
        console.log('staff.js imported:', staffModule);
        console.log('Calling initStaff...');
        await staffModule.initStaff();
        console.log('Staff portal initialized');
    } catch (error) {
        console.error('Error initializing staff:', error);
    }
}

/**
 * Initialize admin portal
 */
async function initAdminPortal() {
    console.log('initAdminPortal() called');
    initRouter();
    setupLogout();
    
    try {
        // Admin-specific initialization
        console.log('Importing admin.js...');
        const adminModule = await import('./admin.js');
        console.log('admin.js imported:', adminModule);
        console.log('Calling initAdmin...');
        adminModule.initAdmin();
        console.log('Admin portal initialized');
    } catch (error) {
        console.error('Error initializing admin:', error);
    }
}

/**
 * Setup authentication form handlers
 */
function setupAuthForms() {
    const loginFormElement = document.getElementById('loginFormElement');
    const signupFormElement = document.getElementById('signupFormElement');

    // Login form handler
    loginFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const { login } = await import('./auth.js');
        await login(email, password);
    });

    // Signup form handler
    signupFormElement?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const indexNumber = document.getElementById('signupIndexNumber').value;
        const password = document.getElementById('signupPassword').value;
        const role = document.getElementById('signupRole').value;
        
        let userData = {
            email,
            password,
            name,
            role
        };

        // If staff, get additional fields
        if (role === 'staff') {
            const isLecturer = document.getElementById('isLecturer')?.checked || false;
            const managedPrefixesText = document.getElementById('managedPrefixes')?.value || '';
            
            const { validateManagedPrefixes } = await import('./utils/validation.js');
            const managedPrefixes = validateManagedPrefixes(managedPrefixesText);
            
            userData.isLecturer = isLecturer;
            userData.managedPrefixes = managedPrefixes;
            
            // Only add index number for class reps (not lecturers)
            if (!isLecturer && indexNumber) {
                userData.indexNumber = indexNumber;
            } else if (!isLecturer && !indexNumber) {
                const { showToast } = await import('./components/Toast.js');
                showToast('error', 'Class Reps must have an index number');
                return;
            }
        } else {
            // Students always need index number
            userData.indexNumber = indexNumber;
        }

        const { signup } = await import('./auth.js');
        const result = await signup(userData);
        
        if (result.success) {
            // Clear form
            signupFormElement.reset();
        }
    });

    console.log('Auth forms ready');
}

/**
 * Setup logout button
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', async () => {
        await logout();
    });
}
