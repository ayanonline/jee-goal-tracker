// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCg8vXMI05D4ryToib-BOBY78fmtYYx9fM",
    authDomain: "jee-goal-tracker.firebaseapp.com",
    projectId: "jee-goal-tracker",
    storageBucket: "jee-goal-tracker.firebasestorage.app",
    messagingSenderId: "815411618034",
    appId: "1:815411618034:web:d72fb161c1f53a83fbf06b",
    measurementId: "G-MBKNZYCEJT"
};

// Initialize Firebase
try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Initialize Firestore
    let db = firebase.firestore();

    // Enable persistence with multi-tab support
    db.enablePersistence({
        synchronizeTabs: true
    }).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Persistence failed - multiple tabs open');
        } else if (err.code === 'unimplemented') {
            console.warn('Persistence not supported in this browser');
        }
    });

    // Make db available globally
    window.db = db;
    
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Authentication state observer
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        // Load data for the current user
        loadGoals(new Date().toISOString().split('T')[0]);
    } else {
        // User is signed out
        console.log('User is signed out');
        const authContainer = document.getElementById('authContainer');
        const mainContent = document.getElementById('mainContent');
        
        if (authContainer && mainContent) {
            authContainer.style.display = 'flex';
            mainContent.style.display = 'none';
        } else {
            console.error('Required DOM elements not found');
        }
    }
});

// Show authentication message
function showAuthMessage(message, isError = true) {
    const messageDiv = document.getElementById('authMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.style.color = isError ? '#ff6b6b' : '#4caf50';
        // Auto-hide success messages after 3 seconds
        if (!isError) {
            setTimeout(() => {
                messageDiv.textContent = '';
            }, 3000);
        }
    }
}

// Sign up function
function signUp() {
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const signUpBtn = document.getElementById('signUpBtn');
    
    // Clear previous messages
    showAuthMessage('');
    
    // Basic validation
    if (!email) {
        showAuthMessage('Please enter an email address');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAuthMessage('Please enter a valid email address');
        return;
    }
    
    if (!password) {
        showAuthMessage('Please enter a password');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters');
        return;
    }
    
    // Disable button and show loading state
    if (signUpBtn) {
        signUpBtn.disabled = true;
        signUpBtn.innerHTML = '<span class="loading">Signing Up...</span>';
    }
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User signed up successfully
            console.log('User signed up:', userCredential.user.uid);
            // User is automatically signed in after sign up
        })
        .catch((error) => {
            console.error('Sign up error:', error);
            let errorMessage = 'An error occurred during sign up.';
            
            // More user-friendly error messages
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered. Please sign in instead.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password should be at least 6 characters.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            alert(errorMessage);
        })
        .finally(() => {
            // Re-enable button
            if (signUpBtn) {
                signUpBtn.disabled = false;
                signUpBtn.innerHTML = 'Sign Up';
            }
        });
}

// Sign in function
function signIn() {
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const signInBtn = document.getElementById('signInBtn');
    
    // Clear previous messages
    showAuthMessage('');
    
    // Basic validation
    if (!email) {
        showAuthMessage('Please enter your email address');
        return;
    }
    
    if (!password) {
        showAuthMessage('Please enter your password');
        return;
    }
    
    // Disable button and show loading state
    if (signInBtn) {
        signInBtn.disabled = true;
        signInBtn.innerHTML = '<span class="loading">Signing In...</span>';
    }
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User signed in successfully
            console.log('User signed in:', userCredential.user.uid);
            showAuthMessage('Signed in successfully', false);
        })
        .catch((error) => {
            console.error('Sign in error:', error);
            let errorMessage = 'An error occurred during sign in.';
            
            // More user-friendly error messages
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email. Please sign up first.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            alert(errorMessage);
        })
        .finally(() => {
            // Re-enable button
            if (signInBtn) {
                signInBtn.disabled = false;
                signInBtn.innerHTML = 'Sign In';
            }
        });
}

// Sign out function
// Handle sign out from the account dropdown
function setupSignOut() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent dropdown from closing
        
        // Show loading state
        const originalText = logoutBtn.innerHTML;
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing Out...';
        logoutBtn.style.pointerEvents = 'none';
        
        firebase.auth().signOut()
            .then(() => {
                console.log('User signed out');
                // Redirect to login page or reload
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Sign out error:', error);
                alert('Error signing out: ' + error.message);
                // Reset button state
                logoutBtn.innerHTML = originalText;
                logoutBtn.style.pointerEvents = 'auto';
            });
    });
}

// Initialize sign out functionality
document.addEventListener('DOMContentLoaded', () => {
    setupSignOut();
});
