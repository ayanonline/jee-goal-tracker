# Preparation Tracker

A responsive study goal tracker for JEE aspirants. Students can sign in, plan daily goals, track completion, review history, and visualize subject priority with Firebase-backed sync.

## Features

- Secure email and password authentication with Firebase Auth
- Cloud-synced study goals with Firestore
- Daily goal tracking by subject, topic, target, and time spent
- Completion status, editing, deletion, and progress summaries
- Subject priority chart powered by Chart.js
- History view for previous study days
- Responsive dark interface for desktop and mobile

## Project Structure

```text
.
├── index.html              # Main app shell
├── reset-password.html     # Firebase password reset page
├── firestore.rules         # Firestore access rules
├── css/style.css           # App styling
├── js/firebase-config.js   # Firebase initialization
├── js/auth.js              # Sign in, sign up, and reset flows
├── js/app.js               # Goal dashboard behavior
├── js/chart.js             # Chart.js wrapper
├── pages/                  # About and contact pages
├── images/                 # Logo, background, and profile assets
└── favicon/                # PWA and browser icon assets
```

## Firebase Setup

1. Create a Firebase project.
2. Enable Email/Password in Authentication.
3. Create a Firestore database.
4. Replace the configuration in `js/firebase-config.js` if you use a different Firebase project.
5. Deploy the rules from `firestore.rules`.

The app stores goals in a top-level `goals` collection. Each goal document includes a `userId`, and the included rules only allow users to access their own goals.

## Local Development

Run a static server from the project root:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

This project can be deployed to any static host, including Firebase Hosting, Netlify, or Vercel. For Firebase Hosting, set the public directory to the project root.
