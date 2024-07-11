// @flow

/* eslint-env browser */

import socketio from 'socket.io-client';
import { notify, simplifyString } from 'giu';
import _t from '../gral/mady';
import { fixRanks } from '../gral/helpers';
import { firebase, getUserRolesForWeb } from '../gral/firebase';
import { getWebName, getUser } from '../reducers';

const DEBUG_DISABLE_LOGIN = true && process.env.NODE_ENV !== 'production';

// ================================================
// Startup
// ================================================
const startUp = () => async (dispatch: Function) => {
  await dispatch(getBasicData());
  if (DEBUG_DISABLE_LOGIN) {
    dispatch(initAuthDebug());
  } else {
    dispatch(initAuth());
  }
};

const shutDown = () => async (dispatch: Function) => {
  dispatch(closeSocket());
};

// ================================================
// Auth
// ================================================
const initAuth = () => (dispatch: Function, getState: Function) => {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const webName = getWebName(getState());
        const roles = await getUserRolesForWeb(user.email, webName); // may throw
        dispatch({ type: 'LOGIN_SUCCESS', user: user.email, roles });
        dispatch(initData(user.email));
        notifyLoginSuccess();
      } catch (err) {
        dispatch(logOut());
        notifyLoginFailed();
      }
    } else {
      dispatch({ type: 'LOGOUT' });
    }
  });
};

const initAuthDebug = () => (dispatch: Function) => {
  const email = 'guille@lobelia.earth';
  dispatch({
    type: 'LOGIN_SUCCESS',
    user: email,
    roles: ['developer', 'author'],
  });
  dispatch(initData(email));
  notifyLoginSuccess();
};

const logIn = (email: string, password: string) => async (
  dispatch: Function
) => {
  try {
    dispatch({ type: 'LOGIN_STARTED' });
    await firebase.auth().signInWithEmailAndPassword(email, password);
  } catch (err) {
    console.error(err); // eslint-disable-line
    dispatch(logOut());
    notifyLoginFailed();
  }
};

const logOut = () => (dispatch: Function) => {
  firebase.auth().signOut();
  closeSocket();
  dispatch({ type: 'LOGOUT' });
};

// ================================================
// Data
// ================================================
const initData = (user: string) => (dispatch: Function) => {
  try {
    initSocket(user, dispatch);
    dispatch(getData());
    dispatch(getFiles());
  } catch (err) {
    console.error(err); // eslint-disable-line
    dispatch(logOut()); // will also closeSocket()
  }
};

const getBasicData = () => async (dispatch: Function) => {
  const response = await fetch('/editorial/_basicData');
  const { result, webName, config, version } = await response.json();
  if (result !== 'ok') throw new Error('getBasicData failed');
  dispatch({ type: 'BASIC_DATA_RECEIVED', webName, version, config });
};

const getData = () => async (dispatch: Function) => {
  const response = await fetch('/editorial/_allData');
  const { result, data: items, schema } = await response.json();
  if (result !== 'ok') throw new Error('getData failed');
  fixRanks(schema, items);
  dispatch({ type: 'DATA_RECEIVED', items, schema });
};

const updateItem = (itemType: string, id: string, attrs: ?Object) => async (
  dispatch: Function
) => {
  const response = await post('/editorial/_updateItem', {
    itemType,
    id,
    attrs,
    socketId: getSocketId(),
  });
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
  dispatch({ type: 'ITEM_UPDATED', itemType, id, attrs });
  dispatch({ type: 'ITEM_JUST_SAVED', isJustSaved: true });
  setTimeout(() => {
    dispatch({ type: 'ITEM_JUST_SAVED', isJustSaved: false });
  }, 3000);
};

const buildAndDeploy = () => async (dispatch: Function, getState: Function) => {
  const user = getUser(getState());
  const response = await post('/editorial/_buildAndDeploy', { user });
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
};

const pullFromRepo = () => async (dispatch: Function, getState: Function) => {
  const user = getUser(getState());
  const response = await post('/editorial/_pullFromRepo', { user });
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
};

const pushToRepo = () => async (dispatch: Function, getState: Function) => {
  const user = getUser(getState());
  const response = await post('/editorial/_pushToRepo', { user });
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
};

const restartServer = () => async (dispatch: Function, getState: Function) => {
  const user = getUser(getState());
  await post('/editorial/_restart', { user });
  setTimeout(() => {
    window.location.reload();
  }, 10000);
};

const getFiles = () => async (dispatch: Function) => {
  const response = await fetch('/editorial/_fileList');
  const { result, files } = await response.json();
  if (result !== 'ok') throw new Error('getFiles failed');
  dispatch({ type: 'FILES_RECEIVED', files });
};

const uploadFiles = (files: any, basePath: string) => async (
  dispatch: Function
) => {
  const data = new FormData(); // eslint-disable-line
  data.append('basePath', basePath);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = simplifyString(file.name)
      .replace(/_/gi, '-')
      .replace(/\s/gi, '-')
      .replace(/[^a-z0-9-.]/gi, '');
    data.append(`files.${i}`, file, filename);
  }
  const response = await fetch('/editorial/_fileUpload', {
    body: data,
    method: 'POST',
  });
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
  dispatch(getFiles());
};

const createDir = (name: string, basePath: string) => async (
  dispatch: Function
) => {
  const data = {
    name,
    basePath,
  };
  const response = await post('/editorial/_directoryCreate', data);
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
  dispatch(getFiles());
};

const deleteDir = (name: string) => async (dispatch: Function) => {
  const data = {
    name,
  };
  const response = await post('/editorial/_directoryDelete', data);
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
  dispatch(getFiles());
};

const deleteFile = (file: { name: string, url: ?string }) => async (
  dispatch: Function
) => {
  const response = await post('/editorial/_fileDelete', file);
  const { result, error } = await response.json();
  if (result !== 'ok') throw new Error(error);
  dispatch(getFiles());
};

// ================================================
// Server communications
// ================================================
const post = (url, data) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });

let socket;
const initSocket = (user, dispatch) => {
  socket = socketio.connect('/editorial');
  socket.on('REFRESH_DATA', ({ socketId } = {}) => {
    if (socketId === (socket: any).id) return;
    dispatch(getData());
  });
  socket.on('REFRESH_FILES', () => {
    dispatch(getFiles());
  });
  socket.on('CURRENT_USERS', (msg) => {
    const { users } = msg;
    dispatch({ type: 'CURRENT_USERS', users });
  });
  socket.emit('MY_USERNAME', { user });
};

const getSocketId = () => (socket ? socket.id : null);

const closeSocket = () => {
  if (socket) socket.close();
  socket = null;
};

// ================================================
// Helpers
// ================================================
const notifyLoginSuccess = () => {
  notify({ msg: _t('notif_Welcome back!'), type: 'success', icon: 'user' });
};

const notifyLoginFailed = () => {
  notify({ msg: _t('notif_Login failed'), type: 'error', icon: 'exclamation' });
};

const openFilesDrawer = () => (dispatch: Function) => {
  document.body.style.overflow = 'hidden';
  dispatch({ type: 'OPEN_FILES_DRAWER' });
};

const closeFilesDrawer = () => (dispatch: Function) => {
  document.body.style.overflow = 'auto';
  dispatch({ type: 'CLOSE_FILES_DRAWER' });
};

const setPreviewAllFiles = (isEnabled) => (dispatch: Function) => {
  dispatch({ type: 'SET_PREVIEW_ALL_FILES', isEnabled });
};

// ================================================
// Public
// ================================================
export {
  startUp,
  shutDown,
  // --
  initAuth,
  logIn,
  logOut,
  // --
  initData,
  getBasicData,
  getData,
  getFiles,
  updateItem,
  uploadFiles,
  deleteFile,
  createDir,
  deleteDir,
  buildAndDeploy,
  pullFromRepo,
  pushToRepo,
  restartServer,
  closeSocket,
  // --
  openFilesDrawer,
  closeFilesDrawer,
  setPreviewAllFiles,
};
