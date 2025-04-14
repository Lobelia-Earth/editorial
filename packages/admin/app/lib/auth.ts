import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyABCthtosgdR2ccIt8Fi3xfKJhiJo1EzTo',
  authDomain: 'web-editor-ca399.firebaseapp.com',
  databaseURL: 'https://web-editor-ca399.firebaseio.com',
  projectId: 'web-editor-ca399',
  storageBucket: '',
  messagingSenderId: '940670473661',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firebaseDb = getDatabase(app);
