import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyBSnjvJdUkka7g1IadUlbPOCeE-KT9O_iA",
    authDomain: "ma-service-40f97.firebaseapp.com",
    projectId: "ma-service-40f97",
    storageBucket: "ma-service-40f97.firebasestorage.app",
    messagingSenderId: "955015176286",
    appId: "1:955015176286:web:cdd9a970e6e4aa6cb914cf",
    measurementId: "G-LD64Q1N0GQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Expose services globally for legacy scripts
window.firebase = {
    app,
    auth,
    db,
    analytics,
    // Expose common functions
    initializeApp,
    deleteApp,
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    config: firebaseConfig
};

console.log("Firebase Initialized");
window.dispatchEvent(new Event('firebase-initialized'));
