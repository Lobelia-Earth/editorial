import { configureStore } from '@reduxjs/toolkit';
import { editorialApi } from './editorialApi';
import { setupListeners } from '@reduxjs/toolkit/query';

export function createStore() {
  const store = configureStore({
    reducer: {
      [editorialApi.reducerPath]: editorialApi.reducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(editorialApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
}
