import { auth, firebaseDb } from "@/lib/auth";
import { useAppDispatch } from "@/lib/store/hooks";
import { setLoading, setRole, setUser } from "@/lib/store/slices/authSlice";
import { useGetConfigQuery } from "@/lib/store/slices/editorialApi";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { useEffect } from "react";

export default function AuthListener() {
  const dispatch = useAppDispatch();
  const { data: adminConfig } = useGetConfigQuery();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && adminConfig?.firebase) {
        const emailKey = user.email?.replace(/[.@]/g, "_");
        const editorRef = ref(
          firebaseDb,
          `${adminConfig.firebase.dbUsersPath}/${emailKey}`,
        );
        const editorSnapshot = await get(editorRef);
        const editorData = editorSnapshot.val();

        dispatch(
          setUser({
            uid: user.uid,
            email: user.email!,
          }),
        );
        dispatch(setRole(editorData));
      } else {
        dispatch(setUser(undefined));
      }

      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch, adminConfig]);

  return null;
}
