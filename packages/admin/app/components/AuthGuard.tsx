import { useAppSelector } from "@/lib/store/hooks";
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/");
    }
  }, [isLoading, navigate, user]);

  if (isLoading || !user) return null;

  return children;
}
