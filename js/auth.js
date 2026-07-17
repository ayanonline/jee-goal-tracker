(function () {
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function getAuth() {
        if (typeof firebase === "undefined" || !firebase.auth) {
            throw new Error("Firebase Auth is not available.");
        }
        return firebase.auth();
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function setButtonLoading(button, loadingText) {
        if (!button) return () => {};

        const originalHtml = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;

        return () => {
            button.disabled = false;
            button.innerHTML = originalHtml;
        };
    }

    function showAuthMessage(message, type = "error", formType = "login") {
        const messageElement = getElement(`${formType}Message`);
        if (!messageElement) return;

        messageElement.textContent = message;
        messageElement.className = "auth-message";
        messageElement.classList.add(type, "show");

        window.clearTimeout(messageElement.hideTimer);
        messageElement.hideTimer = window.setTimeout(() => {
            messageElement.classList.remove("show");
        }, 6000);
    }

    function togglePasswordVisibility(inputId) {
        const input = getElement(inputId);
        if (!input) return;

        const icon = input.parentElement?.querySelector(".toggle-password");
        input.type = input.type === "password" ? "text" : "password";

        if (icon) {
            icon.classList.toggle("fa-eye", input.type === "password");
            icon.classList.toggle("fa-eye-slash", input.type !== "password");
        }
    }

    function toggleAuthForm() {
        const loginForm = getElement("loginForm");
        const signupForm = getElement("signupForm");
        const loginFormElement = getElement("loginFormElement");
        const signupFormElement = getElement("signupFormElement");

        loginForm?.classList.toggle("active");
        signupForm?.classList.toggle("active");
        loginFormElement?.reset();
        signupFormElement?.reset();

        ["loginMessage", "signupMessage"].forEach((id) => {
            const message = getElement(id);
            if (message) {
                message.textContent = "";
                message.className = "auth-message";
            }
        });
    }

    async function signIn() {
        const email = getElement("loginEmail")?.value.trim() || "";
        const password = getElement("loginPassword")?.value || "";
        const signInBtn = document.querySelector("#loginForm .btn-primary");

        if (!EMAIL_PATTERN.test(email)) {
            showAuthMessage("Enter a valid email address.", "error", "login");
            return;
        }

        if (!password) {
            showAuthMessage("Enter your password.", "error", "login");
            return;
        }

        const restoreButton = setButtonLoading(signInBtn, "Signing in...");

        try {
            await getAuth().signInWithEmailAndPassword(email, password);
        } catch (error) {
            const messages = {
                "auth/user-not-found": "No account exists with this email.",
                "auth/wrong-password": "The password is incorrect.",
                "auth/invalid-email": "Enter a valid email address.",
                "auth/too-many-requests": "Too many attempts. Try again later or reset your password."
            };
            showAuthMessage(messages[error.code] || "Unable to sign in. Please try again.", "error", "login");
        } finally {
            restoreButton();
        }
    }
    
    async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();

    try {
        const result = await getAuth().signInWithPopup(provider);
        console.log(result.user);
    } catch (error) {
    console.log("ERROR CODE:", error.code);
    console.log("ERROR MESSAGE:", error.message);
    console.log(error);

    const messages = {
        "auth/popup-closed-by-user": "Sign-in cancelled.",
        "auth/account-exists-with-different-credential":
            "An account already exists with this email using another sign-in method."
    };

    showAuthMessage(
        messages[error.code] || "Google sign-in failed.",
        "error",
        "login"
    );
}
    }

    async function signUp() {
        const name = getElement("signupName")?.value.trim() || "";
        const email = getElement("signupEmail")?.value.trim() || "";
        const password = getElement("signupPassword")?.value || "";
        const confirmPassword = getElement("signupConfirmPassword")?.value || "";
        const signUpBtn = document.querySelector("#signupForm .btn-primary");

        if (name.length < 2) {
            showAuthMessage("Enter your full name.", "error", "signup");
            return;
        }

        if (!EMAIL_PATTERN.test(email)) {
            showAuthMessage("Enter a valid email address.", "error", "signup");
            return;
        }

        if (password.length < 6) {
            showAuthMessage("Password must be at least 6 characters.", "error", "signup");
            return;
        }

        if (password !== confirmPassword) {
            showAuthMessage("Passwords do not match.", "error", "signup");
            return;
        }

        const restoreButton = setButtonLoading(signUpBtn, "Creating account...");

        try {
            const credential = await getAuth().createUserWithEmailAndPassword(email, password);
            await credential.user.updateProfile({ displayName: name });
            showAuthMessage("Account created. You can sign in now.", "success", "signup");

            window.setTimeout(() => {
                toggleAuthForm();
                getElement("loginEmail").value = email;
            }, 1200);
        } catch (error) {
            const messages = {
                "auth/email-already-in-use": "An account with this email already exists.",
                "auth/invalid-email": "Enter a valid email address.",
                "auth/weak-password": "Choose a stronger password."
            };
            showAuthMessage(messages[error.code] || "Unable to create account. Please try again.", "error", "signup");
        } finally {
            restoreButton();
        }
    }

    async function requestPasswordReset() {
        const loginEmail = getElement("loginEmail")?.value.trim() || "";
        const email = window.prompt("Enter the email address on your account:", loginEmail);
        if (!email) return;

        if (!EMAIL_PATTERN.test(email)) {
            showAuthMessage("Enter a valid email address.", "error", "login");
            return;
        }

        try {
            await getAuth().sendPasswordResetEmail(email, {
                url: `${window.location.origin}/reset-password.html`
            });
            showAuthMessage("Password reset email sent. Check your inbox.", "success", "login");
        } catch (error) {
            const messages = {
                "auth/user-not-found": "No account exists with this email.",
                "auth/invalid-email": "Enter a valid email address.",
                "auth/too-many-requests": "Too many attempts. Please try again later.",
                "auth/unauthorized-domain": "This domain is not authorized in Firebase."
            };
            showAuthMessage(messages[error.code] || "Unable to send reset email.", "error", "login");
        }
    }

    function redirectResetLinksToResetPage() {
        if (window.location.pathname.includes("reset-password.html")) return;

        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const oobCode = params.get("oobCode");

        if (mode === "resetPassword" && oobCode) {
            window.location.href = `reset-password.html?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`;
        }
    }

    function setupAuthUi() {
    getElement("switchToSignup")?.addEventListener("click", (event) => {
        event.preventDefault();
        toggleAuthForm();
    });

    getElement("switchToLogin")?.addEventListener("click", (event) => {
        event.preventDefault();
        toggleAuthForm();
    });

    getElement("forgotPasswordBtn")?.addEventListener("click", (event) => {
        event.preventDefault();
        requestPasswordReset();
    });

    getElement("googleSignInBtn")?.addEventListener("click", signInWithGoogle);

    getElement("loginForm")?.classList.add("active");
    redirectResetLinksToResetPage();

    getAuth().getRedirectResult()
        .then((result) => {
            if (result.user) {
                console.log("Google Sign-In successful:", result.user);
            }
        })
        .catch((error) => {
            console.error(error);
            showAuthMessage("Google Sign-In failed.", "error", "login");
        });
}

window.signIn = signIn;
window.signUp = signUp;
window.signInWithGoogle = signInWithGoogle;
window.togglePasswordVisibility = togglePasswordVisibility;
window.showAuthMessage = showAuthMessage;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupAuthUi);
} else {
    setupAuthUi();
}
})();
