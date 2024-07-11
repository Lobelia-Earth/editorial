import { combineReducers } from 'redux';
import { set as timmSet, omit, setIn } from 'timm';

// ==========================================
// Login
// ==========================================
const loginStatus = (state = null, action) => {
  if (action.type === 'LOGIN_STARTED') return 'LOGGING_IN';
  if (action.type === 'LOGIN_SUCCESS') return 'LOGGED_IN';
  if (action.type === 'LOGOUT') return 'LOGGED_OUT';
  return state;
};

const user = (state = null, action) => {
  if (action.type === 'LOGIN_SUCCESS') return action.user;
  if (action.type === 'LOGOUT') return null;
  return state;
};

const roles = (state = null, action) => {
  if (action.type === 'LOGIN_SUCCESS') return action.roles;
  if (action.type === 'LOGOUT') return null;
  return state;
};

// ==========================================
// Data
// ==========================================
const webName = (state = null, action) => {
  if (action.type === 'BASIC_DATA_RECEIVED') return action.webName;
  return state;
};

const version = (state = null, action) => {
  if (action.type === 'BASIC_DATA_RECEIVED') return action.version;
  return state;
};

const items = (state = null, action) => {
  if (action.type === 'LOGOUT') return null;
  if (action.type === 'DATA_RECEIVED') {
    return {
      ...action.items,
      _stringified: JSON.stringify(action.items),
    };
  }
  if (action.type === 'ITEM_UPDATED') {
    const { itemType, id: originalId, attrs } = action;
    let out = state;
    if (attrs) {
      const { id } = attrs;
      if (id !== originalId) {
        out = timmSet(out, itemType, omit(out[itemType] || {}, [originalId]));
      }
      out = setIn(out, [itemType, id], attrs);
    } else {
      out = timmSet(out, itemType, omit(out[itemType] || {}, [originalId]));
    }
    return {
      ...out,
      _stringified: JSON.stringify(out),
    };
  }
  return state;
};

const schema = (state = null, action) => {
  if (action.type === 'LOGOUT') return null;
  if (action.type === 'DATA_RECEIVED') return action.schema;
  return state;
};

const config = (state = null, action) => {
  if (action.type === 'BASIC_DATA_RECEIVED') return action.config;
  return state;
};

const curUsers = (state = [], action) => {
  if (action.type === 'LOGOUT') return [];
  if (action.type === 'CURRENT_USERS') return action.users;
  return state;
};

const files = (state = null, action) => {
  if (action.type === 'LOGOUT') return null;
  if (action.type === 'FILES_RECEIVED') return action.files;
  if (action.type === 'FILES_UPDATED') return action.files;
  return state;
};

const isJustSaved = (state = false, action) => {
  if (action.type === 'ITEM_JUST_SAVED') return action.isJustSaved;
  return state;
};

const isFilesDrawerOpen = (state = false, action) => {
  if (action.type === 'OPEN_FILES_DRAWER') return true;
  if (action.type === 'CLOSE_FILES_DRAWER') return false;
  return state;
};

const isPreviewAllFiles = (state = false, action) => {
  if (action.type === 'SET_PREVIEW_ALL_FILES') return action.isEnabled;
  return state;
};

// ==========================================
// Reducer
// ==========================================
const reducer = combineReducers({
  loginStatus,
  user,
  roles,
  // --
  webName,
  version,
  items,
  schema,
  config,
  curUsers,
  files,
  isJustSaved,
  isFilesDrawerOpen,
  isPreviewAllFiles,
});

// ==========================================
// Public
// ==========================================
export default reducer;

// Selectors
export const getLoginStatus = (state) => state.loginStatus;
export const getUser = (state) => state.user;
export const getRoles = (state) => state.roles;
// --
export const getWebName = (state) => state.webName;
export const getVersion = (state) => state.version;
export const getItems = (state) => state.items;
export const getSchema = (state) => state.schema;
export const getConfig = (state) => state.config;
export const getCurUsers = (state) => state.curUsers;
export const getFiles = (state) => state.files;
export const getIsJustSaved = (state) => state.isJustSaved;
export const getIsFilesDrawerOpen = (state) => state.isFilesDrawerOpen;
export const getIsPreviewAllFiles = (state) => state.isPreviewAllFiles;
