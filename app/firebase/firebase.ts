import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4NdTF7jzXyok5I_DvILrzRQGAsk47Zqk",
  authDomain: "clients-app-ee09b.firebaseapp.com",
  projectId: "clients-app-ee09b",
  storageBucket: "clients-app-ee09b.firebasestorage.app",
  messagingSenderId: "630618752962",
  appId: "1:630618752962:android:22e55168e176052b33385b", //  ده Android App ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default { auth };
