import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl } from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldInputFormValues, SchemaField } from "@/lib/fieldUtils";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, X } from "lucide-react";
import React, { useState } from "react";
import { useFormContext, type ControllerRenderProps } from "react-hook-form";
import MultiselectStringInput from "./MultiselectStringInput";
import SortableChips from "./SortableChips";

const FilePicker = React.lazy(() => import("./FilePicker"));
const MarkdownEditor = React.lazy(() => import("./markdownEditor"));
const DatePicker = React.lazy(() => import("./ui/date-picker"));
const DateTimePicker = React.lazy(() => import("./ui/datetime-picker"));
const URLInput = React.lazy(() => import("./URLInput"));
const ColorPicker = React.lazy(() => import("./ColorPicker"));

const getSelectFieldState = (
  field: SchemaField,
  resolvedChoices: string[],
  inputText: string,
) => {
  const allowFreeInput =
    field.type === "select" && field.allowFreeInput === true;
  const hasChoicesConfigured =
    field.type === "select" &&
    Array.isArray(field.choicesFixed) &&
    field.choicesFixed.length > 0;

  return {
    shouldOnlyDropdown: field.type === "select" && !allowFreeInput,
    shouldMixedDropdown:
      field.type === "select" && allowFreeInput && hasChoicesConfigured,
    shouldOnlyTyping:
      field.type === "select" && allowFreeInput && !hasChoicesConfigured,
    filteredChoices: resolvedChoices.filter((choice) =>
      choice.toLowerCase().includes(inputText.toLowerCase()),
    ),
    canCreateFromInput: inputText.trim().length > 0,
  };
};

const getMultiselectFieldState = (
  field: SchemaField,
  resolvedChoices: string[],
  selectedValues: string[],
  inputText: string,
) => {
  const allowFreeInput =
    field.type === "multiselect" && field.allowFreeInput === true;
  const hasChoicesConfigured =
    field.type === "multiselect" &&
    Array.isArray(field.choicesFixed) &&
    field.choicesFixed.length > 0;
  const availableChoices = resolvedChoices.filter(
    (choice) => !selectedValues.includes(choice),
  );

  return {
    shouldOnlyDropdown: field.type === "multiselect" && !allowFreeInput,
    shouldMixedDropdown:
      field.type === "multiselect" && allowFreeInput && hasChoicesConfigured,
    shouldOnlyTyping:
      field.type === "multiselect" && allowFreeInput && !hasChoicesConfigured,
    availableChoices,
    filteredChoices: availableChoices.filter((choice) =>
      choice.toLowerCase().includes(inputText.toLowerCase()),
    ),
    canCreateFromInput:
      inputText.trim().length > 0 &&
      !selectedValues.includes(inputText.trim()) &&
      (!field.maxSelectedChoices ||
        selectedValues.length < field.maxSelectedChoices),
  };
};

const hasSelectionMinMax = (field: SchemaField) =>
  (field.type === "multiselect" ||
    (field.type === "string" && field.isMultiple && field.choicesFixed)) &&
  (field.minSelectedChoices || field.maxSelectedChoices);

const addMultiselectValue = (
  currentValues: string[],
  rawValue: string,
  maxSelectedChoices?: number,
) => {
  const nextValue = rawValue.trim();

  if (!nextValue) return currentValues;
  if (currentValues.includes(nextValue)) return currentValues;
  if (maxSelectedChoices && currentValues.length >= maxSelectedChoices) {
    return currentValues;
  }

  return [...currentValues, nextValue];
};

export interface FieldInputProps {
  /** Form path of the field, also used as the input id */
  name: string;
  schemaField: SchemaField;
  field: ControllerRenderProps<FieldInputFormValues, string>;
  resolvedChoices: string[];
}

/**
 * Renders the input for a single schema field, wrapped in a <FormControl>.
 * Must be used inside a <FormField> render and a <FormItem>.
 */
export default function FieldInput({
  name,
  schemaField,
  field,
  resolvedChoices,
}: FieldInputProps) {
  const form = useFormContext<FieldInputFormValues>();

  const [selectOpen, setSelectOpen] = useState(false);
  const [selectInputText, setSelectInputText] = useState("");
  const [multiselectOpen, setMultiselectOpen] = useState(false);
  const [inputText, setMultiselectInputText] = useState("");

  const selectedValues = (field.value as string[]) ?? [];
  const selectedCount = selectedValues.length;
  const selectState = getSelectFieldState(
    schemaField,
    resolvedChoices,
    selectInputText,
  );
  const multiselectState = getMultiselectFieldState(
    schemaField,
    resolvedChoices,
    selectedValues,
    inputText,
  );
  const hasMinMax = hasSelectionMinMax(schemaField);

  return (
    <FormControl>
      {schemaField.type === "boolean" ? (
        <Checkbox
          id={name}
          checked={field.value === "true"}
          onCheckedChange={(newCheckedState) => {
            field.onChange(newCheckedState === true ? "true" : "false");
          }}
        />
      ) : schemaField.type === "markdown" ? (
        <MarkdownEditor
          id={name}
          name={name}
          editorRef={field.ref}
          className="h-52"
          markdown={field.value as string}
          onChange={(value, initialChange) => {
            if (initialChange) return;

            field.onChange(value);
          }}
          placeholder={schemaField.placeholder}
          fieldDisplayName={schemaField.displayName}
        />
      ) : schemaField.type === "url" ? (
        <URLInput
          id={name}
          {...form.register(name)}
          placeholder={schemaField.placeholder ?? "https://example.website/"}
          {...field}
          value={field.value as string}
        />
      ) : schemaField.type === "string" && schemaField.isUploadedFile ? (
        <FilePicker
          id={name}
          name={name}
          register={form.register}
          value={field.value as string}
          onChange={field.onChange}
        />
      ) : schemaField.type === "date" ? (
        <DatePicker
          id={name}
          {...form.register(name)}
          date={field.value ? new Date(field.value as string) : undefined}
          onDateChange={(date) => {
            field.onChange(date ? date.toISOString() : "");
          }}
          placeholder={schemaField.placeholder ?? "Select date"}
          allowClear={schemaField.optional}
        />
      ) : schemaField.type === "datetime" ? (
        <div className="relative">
          <DateTimePicker
            id={name}
            {...form.register(name)}
            date={field.value ? new Date(field.value as string) : undefined}
            onDateTimeChange={(date) => {
              field.onChange(date ? date.toISOString() : "");
            }}
            placeholder={schemaField.placeholder ?? "Select date and time"}
            allowClear={schemaField.optional}
          />
        </div>
      ) : schemaField.type === "color" ? (
        <ColorPicker
          id={name}
          value={field.value as string}
          onChange={field.onChange}
          placeholder={schemaField.placeholder}
        />
      ) : schemaField.type === "number" ? (
        <Input
          id={name}
          {...form.register(name, { valueAsNumber: true })}
          type="number"
          value={field.value as string}
          onChange={field.onChange}
          placeholder={schemaField.placeholder}
        />
      ) : schemaField.type === "select" ? (
        <div className="flex gap-2">
          {selectState.shouldOnlyDropdown && (
            <Select
              value={field.value as string}
              onValueChange={field.onChange}
            >
              <SelectTrigger id={name} className="w-full">
                <SelectValue
                  placeholder={schemaField.placeholder ?? "Select an item..."}
                />
              </SelectTrigger>
              <SelectContent>
                {resolvedChoices.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {choice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectState.shouldMixedDropdown && (
            <Popover
              open={selectOpen}
              onOpenChange={(open) => setSelectOpen(open)}
            >
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={selectOpen}
                  className="w-full justify-between"
                >
                  {(field.value as string) ||
                    schemaField.placeholder ||
                    "Select or type..."}
                  <ChevronsUpDown className="opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command>
                  <CommandInput
                    value={selectInputText}
                    onValueChange={(newValue) => setSelectInputText(newValue)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;

                      event.preventDefault();
                      if (!selectState.canCreateFromInput) return;

                      field.onChange(selectInputText.trim());
                      setSelectInputText("");
                      setSelectOpen(false);
                    }}
                    placeholder="Select or type to add..."
                  />
                  <CommandList>
                    <CommandEmpty>
                      {selectState.canCreateFromInput
                        ? `Press Enter to use \"${selectInputText.trim()}\"`
                        : "No available items"}
                    </CommandEmpty>
                    <CommandGroup>
                      {selectState.filteredChoices.map((choice) => (
                        <CommandItem
                          key={choice}
                          value={choice}
                          onSelect={() => {
                            field.onChange(choice);
                            setSelectInputText("");
                            setSelectOpen(false);
                          }}
                        >
                          {choice}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {selectState.shouldOnlyTyping && (
            <Input
              id={name}
              placeholder={schemaField.placeholder ?? "Type a schemaField..."}
              {...field}
              value={field.value as string}
            />
          )}

          {schemaField.optional && field.value && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => field.onChange("")}
              className="shrink-0"
            >
              <X size={16} />
              <span className="sr-only">Clear selection</span>
            </Button>
          )}
        </div>
      ) : schemaField.type === "multiselect" ? (
        <div className="flex flex-col gap-2">
          <SortableChips
            values={selectedValues}
            onChange={(newValues) => field.onChange(newValues)}
            placeholder={schemaField.placeholder ?? "Add items..."}
          />
          {(!schemaField.maxSelectedChoices ||
            selectedCount < schemaField.maxSelectedChoices) && (
            <>
              {multiselectState.shouldOnlyDropdown && (
                <Select
                  value=""
                  onValueChange={(newValue) => {
                    const currentValues = selectedValues;
                    const nextValues = addMultiselectValue(
                      currentValues,
                      newValue,
                      schemaField.maxSelectedChoices,
                    );

                    if (nextValues !== currentValues) {
                      field.onChange(nextValues);
                    }
                  }}
                >
                  <SelectTrigger id={name} className="w-full">
                    <SelectValue
                      placeholder={schemaField.placeholder ?? "Select item..."}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {multiselectState.availableChoices.map((choice) => (
                      <SelectItem key={choice} value={choice}>
                        {choice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {multiselectState.shouldMixedDropdown && (
                <Popover
                  open={multiselectOpen}
                  onOpenChange={(open) => setMultiselectOpen(open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={multiselectOpen}
                      className="w-full justify-between"
                    >
                      {schemaField.placeholder ?? "Add item..."}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                      <CommandInput
                        value={inputText}
                        onValueChange={(newValue) =>
                          setMultiselectInputText(newValue)
                        }
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;

                          event.preventDefault();
                          if (!multiselectState.canCreateFromInput) return;

                          const nextValues = addMultiselectValue(
                            selectedValues,
                            inputText,
                            schemaField.maxSelectedChoices,
                          );

                          if (nextValues !== selectedValues) {
                            field.onChange(nextValues);
                            setMultiselectInputText("");
                          }
                        }}
                        placeholder="Select or type to add..."
                      />
                      <CommandList>
                        <CommandEmpty>
                          {multiselectState.canCreateFromInput
                            ? `Press Enter to add \"${inputText.trim()}\"`
                            : "No available items"}
                        </CommandEmpty>
                        <CommandGroup>
                          {multiselectState.filteredChoices.map((choice) => (
                            <CommandItem
                              key={choice}
                              value={choice}
                              onSelect={() => {
                                const nextValues = addMultiselectValue(
                                  selectedValues,
                                  choice,
                                  schemaField.maxSelectedChoices,
                                );

                                if (nextValues !== selectedValues) {
                                  field.onChange(nextValues);
                                }
                                setMultiselectInputText("");
                              }}
                            >
                              {choice}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {multiselectState.shouldOnlyTyping && (
                <Input
                  id={`${name}-custom-item`}
                  placeholder={
                    schemaField.placeholder ?? "Type an item and press Enter"
                  }
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;

                    event.preventDefault();
                    const currentValues = selectedValues;
                    const nextValues = addMultiselectValue(
                      currentValues,
                      event.currentTarget.value,
                      schemaField.maxSelectedChoices,
                    );

                    if (nextValues !== currentValues) {
                      field.onChange(nextValues);
                      event.currentTarget.value = "";
                    }
                  }}
                />
              )}
            </>
          )}
          {hasMinMax && (
            <span
              className={cn(
                "text-xs",
                schemaField.minSelectedChoices &&
                  selectedCount < schemaField.minSelectedChoices
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {selectedCount}
              {schemaField.minSelectedChoices && schemaField.maxSelectedChoices
                ? `/${schemaField.maxSelectedChoices} (min ${schemaField.minSelectedChoices})`
                : schemaField.minSelectedChoices
                  ? ` selected (min ${schemaField.minSelectedChoices})`
                  : `/${schemaField.maxSelectedChoices} selected`}
            </span>
          )}
        </div>
      ) : schemaField.type === "string" &&
        schemaField.isMultiple &&
        schemaField.choicesFixed ? (
        <MultiselectStringInput
          key={name}
          field={field}
          resolvedChoices={resolvedChoices}
          value={schemaField}
          hasMinMax={hasMinMax}
        />
      ) : (
        <Input
          id={name}
          {...form.register(name)}
          placeholder={schemaField.placeholder}
          {...field}
          value={field.value as string}
        />
      )}
    </FormControl>
  );
}
