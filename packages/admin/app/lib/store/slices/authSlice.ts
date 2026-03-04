import { firebaseDb, getFirebaseInstance } from "@/lib/auth";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  signOut as firebaseSignOut,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import { createAppAsyncThunk } from "../hooks";
import { editorialApi } from "./editorialApi";

interface User {
  uid: string;
  email: string;
  role: string;
}

export interface AuthState {
  user?: User;
  isLoading: boolean;
  error?: string;
}

const initialState: AuthState = {
  isLoading: true,
};

export const loginUser = createAppAsyncThunk(
  "auth/login",
  async (
    {
      email,
      password,
      remember,
    }: { email: string; password: string; remember: boolean },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { auth } = getFirebaseInstance();
      const userCredential = await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      ).then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      });

      const adminConfigResult = await dispatch(
        editorialApi.endpoints.getConfig.initiate(undefined),
      ).unwrap();
      const emailKey = userCredential.user.email?.replace(/[.@]/g, "_");
      const editorRef = ref(
        firebaseDb,
        `${adminConfigResult.firebase?.dbUsersPath}/${emailKey}`,
      );
      const editorSnapshot = await get(editorRef);
      const editorData = editorSnapshot.val();

      if (!editorData) {
        throw new Error("Not authenticated");
      }

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email ?? email,
          role: editorData,
        },
      };
    } catch (error) {
      const { auth } = getFirebaseInstance();
      await firebaseSignOut(auth);

      if (error instanceof Error) {
        return rejectWithValue(error.message as string);
      }

      return rejectWithValue("Unknown error occured");
    }
  },
);

export const signOut = createAppAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      const { auth } = getFirebaseInstance();
      await firebaseSignOut(auth);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message as string);
      }

      return rejectWithValue("Unknown error occured");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | undefined>) => {
      state.isLoading = false;
      state.user = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = undefined;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(signOut.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.isLoading = false;
        state.user = undefined;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
  selectors: {
    selectUser: (state) => state.user,
  },
});

export const { setUser, setLoading, clearError } = authSlice.actions;
export const { selectUser } = authSlice.selectors;
export default authSlice.reducer;
