"use client";

import { auth, firebaseDb } from "@/lib/auth";
import { clientEnv } from "@/lib/env";
import { useAppDispatch } from "@/lib/store/hooks";
import { setLoading, setRole, setUser } from "@/lib/store/slices/authSlice";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect } from "react";

export default function AuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const emailKey = user.email?.replace(/[.@]/g, "_");
        const editorRef = ref(
          firebaseDb,
          `${clientEnv.FIREBASE_DB_USERS_PATH}/${emailKey}`
        );
        const editorSnapshot = await get(editorRef);
        const editorData = editorSnapshot.val();

        dispatch(
          setUser({
            uid: user.uid,
            email: user.email!,
          })
        );
        dispatch(setRole(editorData));
      } else {
        dispatch(setUser(undefined));
      }

      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}
