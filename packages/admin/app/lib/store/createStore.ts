import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "./slices/authSlice";
import { editorialApi } from "./slices/editorialApi";

export function createStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [editorialApi.reducerPath]: editorialApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(editorialApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
}
