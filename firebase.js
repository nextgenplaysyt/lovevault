// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrUnJH7u5HjSMMZNCIB8eAYTiwtzfWXFQ",
  authDomain: "lovevault-e5af0.firebaseapp.com",
  projectId: "lovevault-e5af0",
  storageBucket: "lovevault-e5af0.firebasestorage.app",
  messagingSenderId: "82414783390",
  appId: "1:82414783390:web:d991818db092e4f873e48f"
};

// Initialize Firebase (compat version)
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();