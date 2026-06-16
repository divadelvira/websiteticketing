import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIn6YM03xF4_2i-7pIlKu8HvykdjCOtV4",
  authDomain: "website-ticketing-efef8.firebaseapp.com",
  projectId: "website-ticketing-efef8",
  storageBucket: "website-ticketing-efef8.firebasestorage.app",
  messagingSenderId: "916682712249",
  appId: "1:916682712249:web:7ea48f722bd663055be768",
  measurementId: "G-RMVHEME511"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
