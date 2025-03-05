import { auth } from '@/lib/auth';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  browserLocalPersistence,
  signOut as firebaseSignOut,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';

interface User {
  uid: string;
  email: string;
}

export interface AuthState {
  user?: User;
  isLoading: boolean;
  error?: string;
}

const initialState: AuthState = {
  isLoading: true,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (
    {
      email,
      password,
      remember,
    }: { email: string; password: string; remember: boolean },
    { rejectWithValue }
  ) => {
    try {
      const userCredential = await setPersistence(
        auth,
        remember ? browserLocalPersistence : inMemoryPersistence
      ).then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email ?? email,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOut = createAsyncThunk(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await firebaseSignOut(auth);
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
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
        state.user = action.payload;
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
});

export const { setUser, setLoading, clearError } = authSlice.actions;
export default authSlice.reducer;
