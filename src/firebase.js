import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAVr202BB_LeNyis4byoqC15hYoV1sucAY",
  authDomain: "mneme-d708d.firebaseapp.com",
  projectId: "mneme-d708d",
  storageBucket: "mneme-d708d.firebasestorage.app",
  messagingSenderId: "256850692061",
  appId: "1:256850692061:web:478b43822a8c238108d834"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
