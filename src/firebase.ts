// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBp6MYYrluCJf3DUCLclEm1XFslwfmoZak",
  authDomain: "facebookclone-ffdee.firebaseapp.com",
  projectId: "facebookclone-ffdee",
  storageBucket: "facebookclone-ffdee.firebasestorage.app",
  messagingSenderId: "249524775581",
  appId: "1:249524775581:web:6ab27836eb9b99ef2b8274",
  measurementId: "G-YY03RGTC2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);