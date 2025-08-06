import { ExternalLink } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";
import { Input } from "./ui/input";

export default function URLInput({ ...props }: ComponentProps<"input">) {
  return (
    <div className="relative flex justify-center items-center">
      <Input {...props} />

      {props.value && (
        <Link
          to={props.value as string}
          className="flex items-center absolute right-0 mr-3"
        >
          <ExternalLink className="h-4 bg-white hover:text-blue-500" />
        </Link>
      )}
    </div>
  );
}
