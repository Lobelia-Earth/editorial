import * as Redux from 'redux';
import thunk from 'redux-thunk';
import { createLogger } from 'redux-logger';
import appReducer from '../reducers';

let store;

const createStore = () => {
  const logger = createLogger({ collapsed: true, duration: true });
  const addMiddlewares = Redux.applyMiddleware(thunk, logger);
  store = Redux.createStore(appReducer, addMiddlewares);
  return store;
};

const getState = () => store.getState();

// ==========================================
// Public API
// ==========================================
export default createStore;
export { getState };
