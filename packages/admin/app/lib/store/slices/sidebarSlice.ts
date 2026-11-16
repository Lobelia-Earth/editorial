import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";

export interface SidebarState {
  collectionsOpen: boolean;
  singlesOpen: boolean;
}

const initialState: SidebarState = {
  collectionsOpen: false,
  singlesOpen: false,
};

// Shared so the dashboard can open a sidebar group
const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    setCollectionsOpen: (state, action: PayloadAction<boolean>) => {
      state.collectionsOpen = action.payload;
    },
    setSinglesOpen: (state, action: PayloadAction<boolean>) => {
      state.singlesOpen = action.payload;
    },
  },
});

export const { setCollectionsOpen, setSinglesOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;
