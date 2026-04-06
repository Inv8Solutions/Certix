import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDa59Rf1MPrTfPhaQeiPYAet28lVeRdF1Q",
  authDomain: "cerix-5a2c0.firebaseapp.com",
  projectId: "cerix-5a2c0",
  storageBucket: "cerix-5a2c0.firebasestorage.app",
  messagingSenderId: "111035286176",
  appId: "1:111035286176:web:12ea96c8b2d4bb21c1ffc5",
  measurementId: "G-LHT1PZ6YBR",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

export function getFirebaseAnalytics(): Analytics | null {
  if (typeof window === "undefined") {
    return null;
  }

  return getAnalytics(app);
}
