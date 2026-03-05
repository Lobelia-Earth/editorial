import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { type ControllerRenderProps } from "react-hook-form";

type MultiselectStringInputProps = {
  hasMinMax?: number | false | undefined;
  field: ControllerRenderProps<Record<string, string | string[]>, string>;
  value: {
    choices?: string[];
    placeholder?: string;
    maxSelectedChoices?: number;
    minSelectedChoices?: number;
  };
  resolvedChoices: string[];
  key: string;
};

const MultiselectStringInput = ({
  field,
  value,
  resolvedChoices,
  key,
  hasMinMax,
}: MultiselectStringInputProps) => {
  const choicesArray = field.value
    ? String(field.value)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
        {choicesArray.length > 0 ? (
          choicesArray.map((selectedValue) => (
            <span
              key={selectedValue}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium bg-gray-100 text-black-800"
            >
              {selectedValue}
              <button
                type="button"
                onClick={() => {
                  const newValues = choicesArray.filter(
                    (v) => v !== selectedValue,
                  );
                  field.onChange(newValues.join(","));
                }}
                className="hover:bg-gray-200 rounded-sm p-0.5"
              >
                <X size={14} />
                <span className="sr-only">Remove {selectedValue}</span>
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">
            {value.placeholder ?? "Select items..."}
          </span>
        )}
      </div>
      {(!value.maxSelectedChoices ||
        choicesArray.length < value.maxSelectedChoices) && (
        <Select
          value=""
          onValueChange={(newValue) => {
            const currentValues = choicesArray;
            if (!currentValues.includes(newValue)) {
              field.onChange([...currentValues, newValue].join(","));
            }
          }}
        >
          <SelectTrigger id={key} className="w-full">
            <SelectValue placeholder="Add item..." />
          </SelectTrigger>
          <SelectContent>
            {resolvedChoices
              .filter((choice) => !choicesArray.includes(choice))
              .map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
      {hasMinMax && (
        <span
          className={cn(
            "text-xs",
            value.minSelectedChoices &&
              choicesArray.length < value.minSelectedChoices
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          {choicesArray.length}
          {value.minSelectedChoices && value.maxSelectedChoices
            ? `/${value.maxSelectedChoices} (min ${value.minSelectedChoices})`
            : value.minSelectedChoices
              ? ` selected (min ${value.minSelectedChoices})`
              : `/${value.maxSelectedChoices} selected`}
        </span>
      )}
    </div>
  );
};

export default MultiselectStringInput;
