import type { createStore } from "./createStore";

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppGetState = AppStore["getState"];
export type AppDispatch = AppStore["dispatch"];
