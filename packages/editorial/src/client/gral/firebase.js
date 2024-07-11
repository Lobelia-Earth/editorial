import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

// Firebase config
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyABCthtosgdR2ccIt8Fi3xfKJhiJo1EzTo',
  authDomain: 'web-editor-ca399.firebaseapp.com',
  databaseURL: 'https://web-editor-ca399.firebaseio.com',
  projectId: 'web-editor-ca399',
  storageBucket: '',
  messagingSenderId: '940670473661',
};

// ================================================
// Main
// ================================================
const init = () => {
  firebase.initializeApp(FIREBASE_CONFIG);
};

const getUserRolesForWeb = async (user: string, webName: string) => {
  const key = user.replace(/[.@]/g, '_');
  const value = await getValue(`/editors/${webName}/${key}`);
  if (!value) throw new Error('UNAUTHORIZED');
  return value === true ? [] : value.split(',');
};

const getValue = async (dataPath) => {
  const snapshot = await firebase.database().ref(dataPath).once('value');
  return snapshot.val();
};

const resetPassword = async (email: string) =>
  firebase.auth().sendPasswordResetEmail(email);

// ================================================
// Public
// ================================================
export default init;
export { firebase, getUserRolesForWeb, resetPassword };
