import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBfzrxipENVpBBbf0pJhqJl2rwEdzDGmuQ",
  authDomain: "dark-matter-world.firebaseapp.com",
  projectId: "dark-matter-world",
  storageBucket: "dark-matter-world.firebasestorage.app",
  messagingSenderId: "811998812222",
  appId: "1:811998812222:web:b78d3b1e4cf15a140dd96f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };