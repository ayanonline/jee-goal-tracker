// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = passwordInput.nextElementSibling;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Toggle between login and signup forms
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginForm.classList.toggle('active');
    signupForm.classList.toggle('active');
    
    // Clear messages when switching forms
    document.getElementById('loginMessage').textContent = '';
    document.getElementById('signupMessage').textContent = '';
    
    // Reset forms
    document.getElementById('loginFormElement').reset();
    document.getElementById('signupFormElement').reset();
}

// Show auth message with animation
function showAuthMessage(message, type = 'error', formType = 'login') {
    const messageElement = document.getElementById(`${formType}Message`);
    messageElement.textContent = message;
    messageElement.className = 'auth-message';
    messageElement.classList.add(type, 'show');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 5000);
}

// Enhanced signIn function
async function signIn() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const signInBtn = document.querySelector('#loginForm .btn-primary');
    
    if (!email || !password) {
        showAuthMessage('Please fill in all fields', 'error', 'login');
        return;
    }
    
    try {
        const originalBtnText = signInBtn.innerHTML;
        signInBtn.disabled = true;
        signInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        
        await firebase.auth().signInWithEmailAndPassword(email, password);
        // Success handled by auth state observer
    } catch (error) {
        console.error('Sign in error:', error);
        let message = 'Failed to sign in. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            message = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password. Please try again.';
        } else if (error.code === 'auth/too-many-requests') {
            message = 'Too many failed attempts. Please try again later or reset your password.';
        }
        
        showAuthMessage(message, 'error', 'login');
    } finally {
        signInBtn.disabled = false;
        signInBtn.innerHTML = originalBtnText || '<span class="btn-text">Sign In</span><i class="fas fa-arrow-right"></i>';
    }
}

// Enhanced signUp function
async function signUp() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const signUpBtn = document.querySelector('#signupForm .btn-primary');
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
        showAuthMessage('Please fill in all fields', 'error', 'signup');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match', 'error', 'signup');
        return;
    }
    
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters long', 'error', 'signup');
        return;
    }
    
    try {
        const originalBtnText = signUpBtn.innerHTML;
        signUpBtn.disabled = true;
        signUpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Set display name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Show success message and switch to login form
        showAuthMessage('Account created successfully! Please sign in.', 'success', 'signup');
        setTimeout(() => {
            toggleAuthForm();
        }, 2000);
        
    } catch (error) {
        console.error('Sign up error:', error);
        let message = 'Failed to create account. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
            message = 'An account with this email already exists.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Please enter a valid email address.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak. Please choose a stronger password.';
        }
        
        showAuthMessage(message, 'error', 'signup');
    } finally {
        signUpBtn.disabled = false;
        signUpBtn.innerHTML = originalBtnText || '<span class="btn-text">Sign Up</span>';
    }
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Form toggle buttons
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', toggleAuthForm);
    }
    
    if (switchToLogin) {
        switchToLogin.addEventListener('click', toggleAuthForm);
    }
    
    // Handle password reset
    function handlePasswordReset() {
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        const oobCode = urlParams.get('oobCode');

        // If we're on the reset password page, let that page handle it
        if (window.location.pathname.includes('reset-password.html')) {
            return;
        }

        // Handle password reset from email link
        if (mode === 'resetPassword' && oobCode) {
            window.location.href = `reset-password.html?mode=resetPassword&oobCode=${oobCode}`;
        }
    }

    // Forgot password - Firebase v9 Compat
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const email = prompt('Please enter your email address:');
            if (!email) return;
            
            try {
                // Basic email validation
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    showAuthMessage('Please enter a valid email address', 'error', 'login');
                    return;
                }
                
                // Show loading state
                const btnText = forgotPasswordBtn.innerHTML;
                forgotPasswordBtn.disabled = true;
                forgotPasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                
                // Get auth instance
                const auth = firebase.auth();
                
                // Send password reset email
                await auth.sendPasswordResetEmail(email, {
                    url: `${window.location.origin}/reset-password.html`,
                    handleCodeInApp: false
                });
                
                showAuthMessage('Password reset email sent! Please check your inbox and spam folder.', 'success', 'login');
                
            } catch (error) {
                console.error('Password reset error:', error);
                let message = 'Error sending password reset email. Please try again.';
                
                switch(error.code) {
                    case 'auth/user-not-found':
                        message = 'No user found with this email address.';
                        break;
                    case 'auth/invalid-email':
                        message = 'The email address is not valid.';
                        break;
                    case 'auth/too-many-requests':
                        message = 'Too many attempts. Please try again later.';
                        break;
                    case 'auth/unauthorized-domain':
                        message = 'This domain is not authorized. Please contact support.';
                        break;
                    default:
                        console.log('Full error:', error);
                }
                
                showAuthMessage(message, 'error', 'login');
            } finally {
                if (forgotPasswordBtn) {
                    forgotPasswordBtn.disabled = false;
                    forgotPasswordBtn.innerHTML = 'Forgot password?';
                }
            }
        });
    }

    // Check for password reset on page load
    handlePasswordReset();
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Only create ripple if button is not disabled
            if (this.disabled) return;
            
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 1000);
        });
    });
    
    // Initialize with login form active
    document.getElementById('loginForm').classList.add('active');
});
