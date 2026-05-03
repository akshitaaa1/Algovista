import { auth } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let isAuthChecked = false;

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {

    const signupBtn = document.querySelector('.signup-btn');
    const loginBtn = document.querySelector('.login-btn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (signupBtn) signupBtn.addEventListener('click', signup);
    if (loginBtn) loginBtn.addEventListener('click', login);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
});


// ✅ SIGNUP
async function signup() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        return;
    }

    try {
        showLoading(true);

        await createUserWithEmailAndPassword(auth, email, password);

        showToast("Account created successfully!", "success");

        // ✅ DO NOT manually redirect here
        // Let onAuthStateChanged handle it

    } catch (e) {
        showLoading(false);
        handleAuthError(e);
    }
}


// ✅ LOGIN
async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    try {
        showLoading(true);

        await signInWithEmailAndPassword(auth, email, password);

        showToast("Login successful!", "success");

        // ✅ No redirect here

    } catch (e) {
        showLoading(false);
        handleAuthError(e);
    }
}


// ✅ LOGOUT
async function logout() {
    try {
        await signOut(auth);
        showToast("Logged out successfully", "success");
    } catch (e) {
        showToast("Logout failed", "error");
    }
}


// ✅ AUTH STATE HANDLER (MAIN FIX)
onAuthStateChanged(auth, (user) => {
    const path = window.location.pathname;

    isAuthChecked = true;

    // 🔁 If logged in → go to dashboard
    if (user && path === "/") {
        window.location.href = "/dashboard";
    }

    // 🔒 If NOT logged in → block dashboard
    if (!user && path === "/dashboard") {
        window.location.href = "/";
    }

    // 👤 Show email on dashboard
    if (user && path === "/dashboard") {
        const userEmail = document.getElementById('userEmail');
        if (userEmail) {
            userEmail.textContent = user.email;
        }
    }

    showLoading(false);
});


// ================= UTILITIES =================

function handleAuthError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/operation-not-allowed': 'Enable Email/Password in Firebase',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/user-not-found': 'No account found',
        'auth/wrong-password': 'Incorrect password',
        'auth/network-request-failed': 'Check your internet connection'
    };

    const message = errorMessages[error.code] || error.message;
    showToast(message, "error");
    console.error(error);
}


function showToast(message, type = "info") {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


function showLoading(show) {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.disabled = show;
        if (show) {
            btn.innerHTML = 'Please wait...';
        }
    });
}