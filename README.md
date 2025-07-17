# JEE Goal Tracker

A simple, mobile-friendly web application to help JEE aspirants track their daily study goals and progress with a beautiful dark UI and cloud sync.

## Features

- 🔐 Secure email/password authentication
- ☁️ Cloud sync with Firebase Firestore
- 📝 Add daily study goals with subject, topic, target, and time spent
- 📊 Track completion status of each goal
- 📅 View history of past goals by date
- 📱 Fully responsive design that works on mobile devices
- 🌓 Dark theme for comfortable studying

## How to Use

1. **Sign Up / Sign In**
   - Create a new account or sign in with your email and password

2. **Add a New Goal**
   - Select a subject (Physics, Chemistry, or Mathematics)
   - Enter the topic you're studying
   - Set your target (e.g., "Solve 30 problems")
   - Enter the time spent in hours
   - Click "Add Goal"

3. **Mark Goals as Complete**
   - Click the "Mark as Complete" button next to each goal
   - Completed goals will be crossed out

4. **View History**
   - Use the date picker to view goals from previous days
   - See your progress over time

## Firebase Setup

1. Create a new project in the [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
3. Set up Firestore Database:
   - Go to Firestore Database > Create Database
   - Start in production mode
   - Choose a location near you
4. Update Firebase configuration:
   - Go to Project Settings > General > Your apps
   - Register a new web app
   - Copy the Firebase configuration object
   - Replace the values in `js/firebase-config.js` with your Firebase config
5. Set up Firestore Security Rules (in Firestore > Rules tab):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /goals/{goal} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

## Local Development

1. Clone this repository
2. Set up Firebase as described above
3. Open `index.html` in a web server (you can use Live Server in VS Code or `python -m http.server`)
4. Start adding your study goals!

## Deployment

This application can be deployed to any static hosting service like Netlify, Vercel, or Firebase Hosting. For Firebase Hosting:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize project: `firebase init`
   - Select Hosting
   - Choose your project
   - Set public directory to `.`
   - Configure as a single-page app: Yes
   - Set up automatic builds: No
4. Deploy: `firebase deploy`

## Technologies Used

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+)
- Firebase Authentication
- Firebase Firestore (NoSQL database)
- Font Awesome for icons

## Browser Support

This app works on all modern browsers including:
- Chrome
- Firefox
- Safari
- Edge

## License

This project is open source and available under the [MIT License](LICENSE).
