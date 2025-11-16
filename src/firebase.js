import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCZdF5goQaRKnJrtW8low_Hucud-dtb56U",
  authDomain: "cloudjamz-90a37.firebaseapp.com",
  projectId: "cloudjamz-90a37",
  storageBucket: "cloudjamz-90a37.firebasestorage.app",
  messagingSenderId: "868160188617",
  appId: "1:868160188617:web:56caef8cce8f5d96f29d18",
  measurementId: "G-TJHBX8QT0Y"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
