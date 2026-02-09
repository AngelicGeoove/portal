/**
 * Firebase Configuration
 * =====================================================
 * This file initializes Firebase for the UCC Portal
 * 
 * TODO: Replace with your Firebase project configuration
 * Get this from: Firebase Console > Project Settings > Web App
 * =====================================================
 */

// Import Firebase SDK (when using CDN, these are global)
// When using npm/modules:
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration - unispace-scheduler
 * Project configured and ready to use
 */
const firebaseConfig = {
    apiKey: "AIzaSyDDI_zq151iarHssuUITD4M_2yYDVubfXY",
    authDomain: "unispace-scheduler.firebaseapp.com",
    projectId: "unispace-scheduler",
    storageBucket: "unispace-scheduler.firebasestorage.app",
    messagingSenderId: "188901170075",
    appId: "1:188901170075:web:689cfd920715997acd5f3e",
    measurementId: "G-L60SWRXY33"
};

// Initialize Firebase
let app, auth, db;

try {
    // Using compat version (for CDN)
    if (typeof firebase !== 'undefined') {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('Firebase initialized successfully (compat mode)');
    } else {
        console.error('Firebase SDK not loaded. Please include Firebase scripts in your HTML.');
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
}

/**
 * Firebase Security Rules Setup
 * =====================================================
 * After setting up Firebase, configure these security rules
 * in Firebase Console > Firestore Database > Rules
 * 
 * Copy the rules from DEVELOPMENT_PLAN.md Section 5
 * =====================================================
 */

// Export Firebase instances
export { app, auth, db };
