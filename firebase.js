// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCrUnJH7u5HjSMMZNCIB8eAYTiwtzfWXFQ",
  authDomain: "lovevault-e5af0.firebaseapp.com",
  projectId: "lovevault-e5af0",
  storageBucket: "lovevault-e5af0.firebasestorage.app",
  messagingSenderId: "82414783390",
  appId: "1:82414783390:web:d991818db092e4f873e48f"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);

// Services
const db = firebase.firestore();
const auth = firebase.auth();