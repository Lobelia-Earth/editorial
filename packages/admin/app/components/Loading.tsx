import { Spinner } from "./ui/spinner";

export interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Loading Editorial...",
}: LoadingProps) {
  return (
    <div className="flex gap-1 items-center justify-center min-h-screen">
      <Spinner size="28px" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
