import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import type { Persistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase exposes this function in its React Native runtime entry, but omits
// it from the package's shared TypeScript declarations.
const { getReactNativePersistence } = require("firebase/auth") as {
  getReactNativePersistence: (storage: typeof ReactNativeAsyncStorage) => Persistence;
};

const firebaseConfig = {
  apiKey: "AIzaSyD4NdTF7jzXyok5I_DvILrzRQGAsk47Zqk",
  authDomain: "clients-app-ee09b.firebaseapp.com",
  projectId: "clients-app-ee09b",
  storageBucket: "clients-app-ee09b.firebasestorage.app",
  messagingSenderId: "630618752962",
  appId: "1:630618752962:android:22e55168e176052b33385b",
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);

export default { auth };
