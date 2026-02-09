/**
 * Authentication Module
 * Handles user signup, login, logout, and session management
 */

import { auth, db } from './firebase-config.js';
import { showToast } from './components/Toast.js';
import { validateIndexNumber, validateEmail } from './utils/validation.js';

function getAppBasePath() {
    const pathname = window.location.pathname || '/';
    if (pathname.endsWith('/')) return pathname;
    const lastSlash = pathname.lastIndexOf('/');
    return lastSlash >= 0 ? pathname.slice(0, lastSlash + 1) : '/';
}

function toAppUrl(relativePath) {
    const clean = String(relativePath || '').replace(/^\/+/, '');
    return `${getAppBasePath()}${clean}`;
}

function getAuthErrorMessage(error) {
    const code = error?.code || '';
    if (code === 'auth/unauthorized-domain') {
        return 'This domain is not authorized for Firebase Auth. In Firebase Console → Authentication → Settings → Authorized domains, add: angelicgeoove.github.io';
    }

    return error?.message || 'Authentication failed. Please try again.';
}

/**
 * Sign up a new user
 */
export async function signup(userData) {
    try {
        const { email, password, name, indexNumber, role, isLecturer, managedPrefixes } = userData;

        // Validate index number format (skip for lecturers)
        if (indexNumber && !validateIndexNumber(indexNumber)) {
            throw new Error('Invalid index number format. Use XX/XXX/XX/XXXX');
        }

        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Prepare user data
        const userDoc = {
            userId: user.uid,
            email,
            name,
            role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add index number if provided (not lecturers)
        if (indexNumber) {
            userDoc.indexNumber = indexNumber.toUpperCase();
        }

        // Add staff-specific fields
        if (role === 'staff') {
            userDoc.isLecturer = isLecturer || false;
            userDoc.managedIndexPrefixes = managedPrefixes || [];
        }

        // If student, find and assign to matching staff
        if (role === 'student' && indexNumber) {
            const prefix = extractIndexPrefix(indexNumber);
            const matchingStaff = await findMatchingStaff(prefix);
            userDoc.assignedToStaff = matchingStaff;
        }

        // Save user document to Firestore
        await db.collection('users').doc(user.uid).set(userDoc);

        showToast('success', 'Account created successfully!');
        return { success: true, user: userDoc };
    } catch (error) {
        console.error('Signup error:', error);
        const message = getAuthErrorMessage(error);
        showToast('error', message);
        return { success: false, error: message };
    }
}

/**
 * Login user
 */
export async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            throw new Error('User data not found');
        }

        const userData = userDoc.data();
        showToast('success', `Welcome back, ${userData.name}!`);

        // Redirect based on role
        redirectToPortal(userData.role);

        return { success: true, user: userData };
    } catch (error) {
        console.error('Login error:', error);
        const message = getAuthErrorMessage(error);
        showToast('error', message);
        return { success: false, error: message };
    }
}

/**
 * Logout user
 */
export async function logout() {
    try {
        await auth.signOut();
        showToast('success', 'Logged out successfully');
        window.location.href = toAppUrl('index.html');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('error', 'Failed to logout');
    }
}

/**
 * Check if user is authenticated and has correct role
 */
export async function checkAuth(requiredRole) {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                // Not logged in, redirect to login
                window.location.href = toAppUrl('index.html');
                reject('Not authenticated');
                return;
            }

            try {
                // Get user data
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    throw new Error('User data not found');
                }

                const userData = userDoc.data();

                // Check role
                if (requiredRole && userData.role !== requiredRole) {
                    showToast('error', 'Access denied');
                    redirectToPortal(userData.role);
                    reject('Wrong role');
                    return;
                }

                resolve(userData);
            } catch (error) {
                console.error('Auth check error:', error);
                window.location.href = toAppUrl('index.html');
                reject(error);
            }
        });
    });
}

/**
 * Get current user data
 */
export async function getCurrentUser() {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await db.collection('users').doc(user.uid).get();
    return userDoc.exists ? userDoc.data() : null;
}

/**
 * Extract index prefix from full index number
 * Example: CS/DVB/22/0001 -> CS/DVB/22
 */
function extractIndexPrefix(indexNumber) {
    const parts = indexNumber.split('/');
    return parts.slice(0, 3).join('/');
}

/**
 * Find staff members managing a specific index prefix
 */
async function findMatchingStaff(prefix) {
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'staff')
            .where('managedIndexPrefixes', 'array-contains', prefix)
            .get();

        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Error finding matching staff:', error);
        return [];
    }
}

/**
 * Redirect user to appropriate portal based on role
 */
function redirectToPortal(role) {
    const portals = {
        student: 'student.html',
        staff: 'staff.html',
        admin: 'admin.html'
    };

    const destinationPath = toAppUrl(portals[role] || 'index.html');
    if (window.location.pathname !== destinationPath) {
        window.location.href = destinationPath;
    }
}

/**
 * Update user profile
 */
export async function updateProfile(updates) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');

        await db.collection('users').doc(user.uid).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('success', 'Profile updated successfully');
        return { success: true };
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('error', 'Failed to update profile');
        return { success: false, error: error.message };
    }
}
