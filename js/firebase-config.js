// Firebase bootstrap for the Preparation Tracker app.
// The public Firebase config is safe to ship in a browser app; access is
// controlled by Firebase Authentication and Firestore security rules.
const firebaseConfig = {
    apiKey: "AIzaSyCg8vXMI05D4ryToib-BOBY78fmtYYx9fM",
    authDomain: "jee-goal-tracker.firebaseapp.com",
    databaseURL: "https://jee-goal-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "jee-goal-tracker",
    storageBucket: "jee-goal-tracker.firebasestorage.app",
    messagingSenderId: "815411618034",
    appId: "1:815411618034:web:3eed956674db82aafbf06b",
    measurementId: "G-HM7DH13653"
};

(function initializeFirebase() {
    if (typeof firebase === "undefined") {
        console.error("Firebase SDK was not loaded.");
        return;
    }

    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    window.firebaseApp = app;

    if (firebase.auth) {
        window.auth = firebase.auth();
    }

    if (firebase.firestore) {
        const db = firebase.firestore();
        db.enablePersistence({ synchronizeTabs: true }).catch((error) => {
            if (error.code === "failed-precondition") {
                console.info("Offline persistence is available in one tab at a time.");
            } else if (error.code === "unimplemented") {
                console.info("Offline persistence is not supported in this browser.");
            }
        });

        window.db = db;
    }
})();
