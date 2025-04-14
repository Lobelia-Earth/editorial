"use client";

import { auth } from "@/lib/auth";
import { useAppDispatch } from "@/lib/store/hooks";
import { setLoading, setUser } from "@/lib/store/slices/authSlice";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";

export default function AuthListener() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email!,
          })
        );
      } else {
        dispatch(setUser(undefined));
      }

      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
}
