import { initializeFirebase } from "@/lib/auth";
import { useGetConfigQuery } from "@/lib/store/slices/editorialApi";
import { useEffect, useState } from "react";
import Loading from "./Loading";

interface FirebaseInitializerProps {
  children: React.ReactNode;
}

/**
 * Currently the only method of authentication in Editorial, in theory we should
 * provide different middlewares/providers and/or support people plugging their
 * own in.
 */
export default function FirebaseInitializer({
  children,
}: FirebaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { data: config, error: queryError, isLoading } = useGetConfigQuery();

  useEffect(() => {
    if (isLoading) return;

    if (queryError) {
      console.error("Failed to fetch firebase config:", queryError);
      return;
    }

    if (config) {
      try {
        if (!config.firebase) {
          throw new Error("Firebase configuration not found in admin config");
        }

        initializeFirebase(config.firebase);
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize Firebase:", err);
      }
    }
  }, [config, queryError, isLoading]);

  if (queryError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Firebase Initialization Error
          </h2>
          <p className="text-gray-600">
            {queryError instanceof Error
              ? queryError.message
              : "Failed to fetch admin config"}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !isInitialized) return <Loading />;

  return <>{children}</>;
}
