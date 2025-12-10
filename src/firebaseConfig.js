import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC-Bs0eC_ESo1SWLQsCM9Wc-HvHaj8C9Qk',
  authDomain: 'cardwebsite-4be73.firebaseapp.com',
  projectId: 'cardwebsite-4be73',
  storageBucket: 'cardwebsite-4be73.firebasestorage.app',
  messagingSenderId: '217295192911',
  appId: '1:217295192911:web:d31d8246cc1004dfdcbb3a',
  measurementId: 'G-BLWDK5N98L',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null; // safe for SSR/build

export { analytics, db };
export default app;

