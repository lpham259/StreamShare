import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyBcknAbUsg6W8V_X1H0_awLr0SpM2ZXiB4",
    authDomain: "streamshare-1dbdf.firebaseapp.com",
    projectId: "streamshare-1dbdf",
    storageBucket: "streamshare-1dbdf.firebasestorage.app",
    messagingSenderId: "331839071103",
    appId: "1:331839071103:web:1907fd5c96b3afb23bb04a",
    measurementId: "G-3MM54CQ004"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');