// Imported first to ensure cascading rules work properly.
import "./app.css";
import { Toaster } from "./components/ui/sonner";

import AuthListener from "@/components/AuthListener";
import FirebaseInitializer from "@/components/FirebaseInitializer";
import StoreProvider from "@/components/providers/StoreProvider";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [];

export function meta({}: Route.MetaArgs) {
  return [{ title: "Editorial Admin" }, { name: "robots", content: "noindex" }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="min-h-screen">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <Meta />
        <Links />
      </head>
      <body
        className={`h-full min-h-screen bg-background font-sans antialiased`}
      >
        <StoreProvider>
          <FirebaseInitializer>
            <AuthListener />
            {children}
          </FirebaseInitializer>
        </StoreProvider>
        <Toaster position="bottom-right" richColors />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
