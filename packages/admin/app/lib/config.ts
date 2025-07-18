export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  dbUsersPath: string;
}

export interface AdminConfig {
  firebase?: FirebaseConfig;
}

// This is kept for backward compatibility but should be replaced with RTK Query
export async function fetchAdminConfig(): Promise<AdminConfig> {
  const response = await fetch("/admin/config");

  if (!response.ok) {
    throw new Error(
      `Failed to fetch admin config: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}
