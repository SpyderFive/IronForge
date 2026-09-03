import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJDpQHX9HRD97LEIvS5hL4HzqAY6CFiv4",
  authDomain: "ironforge-55594.firebaseapp.com",
  projectId: "ironforge-55594",
  storageBucket: "ironforge-55594.firebasestorage.app",
  messagingSenderId: "110189576617",
  appId: "1:110189576617:web:bbbaa25a2440e42b5744b8"
};
let app;
let auth: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (e) {
  console.log("Firebase initialization skipped in sandbox environment.");
}

export { auth };