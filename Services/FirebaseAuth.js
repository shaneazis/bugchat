// FirebaseConfig.js
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQh2pahblHKSd1YqKKaWqxo3GS226Qg3E",
  authDomain: "msgapp-7122f.firebaseapp.com",
  projectId: "msgapp-7122f",
  storageBucket: "msgapp-7122f.appspot.com",
  messagingSenderId: "351668971427",
  appId: "1:351668971427:web:d23026f3383bfb4d625c16",
  measurementId: "G-17ZRJZTRJ4",
};

// Initialize Firebase app and services
let app;
let auth;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };