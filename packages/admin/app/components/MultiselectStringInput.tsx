import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type ControllerRenderProps } from "react-hook-form";
import SortableChips from "./SortableChips";

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
      <SortableChips
        values={choicesArray}
        onChange={(newValues) => field.onChange(newValues.join(","))}
        placeholder={value.placeholder ?? "Select items..."}
      />
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
