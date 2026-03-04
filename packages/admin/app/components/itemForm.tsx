import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnsavedChangesGuard from "@/components/unsavedChangesGuard";
import {
  useCreateObjectMutation,
  useGetDataQuery,
  useUpdateObjectMutation,
} from "@/lib/store/slices/editorialApi";
import { cn, statusColors } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getChoicesReference,
  RGBColorSchema,
  type EditorialDataItem,
  type EditorialDataItemStatus,
  type EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { Loader2, Save, X } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const FilePicker = React.lazy(() => import("./FilePicker"));
const MarkdownEditor = React.lazy(() => import("./markdownEditor"));
const DatePicker = React.lazy(() => import("./ui/date-picker"));
const DateTimePicker = React.lazy(() => import("./ui/datetime-picker"));
const URLInput = React.lazy(() => import("./URLInput"));
const ColorPicker = React.lazy(() => import("./ColorPicker"));

export interface SinglesPageProps {
  itemType: string;
  fields: EditorialSchemaItem["fields"];
  isSingleton?: boolean;
  data?: EditorialDataItem;
  isNew?: boolean;
  changedFields?: string[];
  itemStatus?: EditorialDataItemStatus;
}

export default function ItemForm({
  itemType,
  fields,
  isSingleton,
  data,
  isNew,
  changedFields = [],
  itemStatus,
}: SinglesPageProps) {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [createItem] = useCreateObjectMutation();
  const [updateItem] = useUpdateObjectMutation();
  const { data: allData } = useGetDataQuery();

  const isFieldChanged = (fieldKey: string) => changedFields.includes(fieldKey);

  useEffect(() => {
    if (!hash) return;

    const id = hash.slice(1);

    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: window.scrollY, behavior: "smooth" });
      element.focus();
    }
  }, [hash]);

  const defaultValues = useMemo(() => {
    return {
      id: isSingleton ? "default" : (data?.id ?? ""),
      isDraft: String(data?.isDraft ?? false),
      ...Object.fromEntries(
        Object.keys(fields).map((key) => {
          const fieldType = fields[key].type;
          const value = data?.[key];

          if (value !== undefined && value !== null) {
            // Convert existing data to string format
            if (fieldType === "boolean") {
              return [key, String(value)];
            }
            if (fieldType === "multiselect") {
              // Keep multiselect as array
              return [key, Array.isArray(value) ? value : [value]];
            }
            return [key, String(value)];
          }

          // Default values for new items
          if (fieldType === "boolean") {
            return [key, "false"];
          }
          if (fieldType === "multiselect") {
            return [key, []];
          }
          return [key, ""];
        }),
      ),
    };
  }, [data, fields, isSingleton]);

  const validationSchema = useMemo(() => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      id: z
        .string()
        .min(1, "ID is required")
        .regex(
          /^[a-z0-9-]+$/,
          "ID can only include lowercase letters and numbers",
        ),
      isDraft: z.string(),
    };

    Object.entries(fields).forEach(([key, field]) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "boolean":
          fieldSchema = z.enum(["true", "false"]);
          break;
        case "number":
          fieldSchema = z.number();
          break;
        case "url":
          fieldSchema = z.url("Must be a valid URL");
          break;
        case "date":
          fieldSchema = z.string();
          break;
        case "datetime":
          fieldSchema = z.string();
          break;
        case "color":
          fieldSchema = RGBColorSchema;
          break;
        case "select":
          // For referenced choices, use string validation instead of enum
          // since the choices are dynamic
          if (getChoicesReference(field.choicesFixed)) {
            fieldSchema = z.string();
          } else if (field.choicesFixed && field.choicesFixed.length > 0) {
            fieldSchema = z.enum(field.choicesFixed as [string, ...string[]]);
          } else {
            fieldSchema = z.string();
          }
          break;
        case "multiselect":
          fieldSchema = z.array(z.string());
          // Apply min/max constraints
          if (field.minSelectedChoices) {
            fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
              field.minSelectedChoices,
              `${field.displayName} requires at least ${field.minSelectedChoices} selection${field.minSelectedChoices > 1 ? "s" : ""}`,
            );
          }
          if (field.maxSelectedChoices) {
            fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).max(
              field.maxSelectedChoices,
              `${field.displayName} allows maximum ${field.maxSelectedChoices} selection${field.maxSelectedChoices > 1 ? "s" : ""}`,
            );
          }
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.optional) {
        if (field.type === "multiselect") {
          // Multiselect is already optional by allowing empty array
          // But if minSelectedChoices is set, it overrides optional
          if (!field.minSelectedChoices) {
            fieldSchema = fieldSchema.optional();
          }
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(""));
        }
      } else if (field.type === "multiselect" && !field.minSelectedChoices) {
        // If not optional and no minSelectedChoices, require at least 1
        fieldSchema = (fieldSchema as z.ZodArray<z.ZodString>).min(
          1,
          `${field.displayName} requires at least one selection`,
        );
      } else if (field.type !== "boolean" && field.type !== "select") {
        fieldSchema = (fieldSchema as z.ZodString).min(
          1,
          `${field.displayName} is required`,
        );
      }

      schemaShape[key] = fieldSchema;
    });

    return z.object(schemaShape);
  }, [fields]);

  const form = useForm<Record<string, string | string[]>>({
    resolver: zodResolver(validationSchema) as any,
    defaultValues: defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  useEffect(() => {
    if (!form) return;
    const hash = window.location.hash;
    if (hash) {
      form.setFocus(hash.substring(1));
    }
  }, [form]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (form.formState.isDirty || isNew) {
          form.handleSubmit(onSubmit)();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form, isNew, onSubmit]);

  async function onSubmit(values: Record<string, string | string[]>) {
    // Convert field values to their proper types
    const processedValues: Record<string, any> = {
      ...values,
      isDraft: values.isDraft === "true",
      type: itemType,
    };

    // Convert number fields from strings to numbers
    Object.entries(fields).forEach(([key, field]) => {
      if (field.type === "boolean") {
        processedValues[key] = values[key] === "true";
      }
      // multiselect values are already arrays, no conversion needed
    });

    if (isNew) {
      try {
        const payload = await createItem(processedValues);

        if (!("error" in payload)) {
          toast.success("Item created successfully.");
          navigate(`/admin/dashboard/${itemType}/${payload.data.id}`);
        } else {
          toast.error("Failed to create item.");
        }
      } catch (err) {
        toast.error("Failed to create item.");
        console.error(err);
      }
    } else {
      try {
        await updateItem(processedValues);
        toast.success("Item updated successfully.");
        form.reset(values);
      } catch (err) {
        toast.error("Failed to update item.");
        console.error(err);
      }
    }
  }

  const flagFields = useMemo(
    () =>
      Object.entries(fields).filter(([, value]) => value.type === "boolean"),
    [fields],
  );

  // Pre-resolve all field choices (including referenced ones)
  // If choices reference another fields, return the ids of the referenced data items
  // If choices are directly defined, return them as is
  const resolvedChoicesMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    Object.entries(fields).forEach(([key, field]) => {
      if (field.type === "select" || field.type === "multiselect") {
        const referencedKey = getChoicesReference(field.choicesFixed);
        if (referencedKey && allData) {
          const referencedData = allData[referencedKey];
          if (referencedData) {
            map[key] = Object.values(referencedData).map((item) => item.id);
          } else {
            map[key] = [];
          }
        } else {
          map[key] = field.choicesFixed || [];
        }
      }
    });

    return map;
  }, [fields, allData]);

  const changedFieldStyles =
    "outline outline-1 outline-yellow-400 outline-offset-4 rounded-sm";

  const ModifiedMessage = () => (
    <span className="text-yellow-800 text-xs">(modified)</span>
  );

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        {data && data.updatedAt && (
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground">Last updated:</p>
            <p className="text-sm">
              {new Date(data.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
        {itemStatus && (
          <div className="flex items-center gap-1">
            <p className="text-sm text-muted-foreground">Unpublished status:</p>
            <Badge className={cn("capitalize", statusColors[itemStatus])}>
              {itemStatus}
            </Badge>
          </div>
        )}
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 max-w-[800px] w-[800px]"
        >
          <FormField
            name="id"
            control={form.control}
            rules={{ required: true }}
            render={({ field }) => {
              return (
                <FormItem
                  id="id"
                  className={cn(
                    (data?.id === "default" || isSingleton) && "hidden",
                    isFieldChanged("id") && changedFieldStyles,
                  )}
                >
                  <FormLabel className="flex gap-1 items-baseline">
                    ID
                    {isFieldChanged("id") && <ModifiedMessage />}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="item-id"
                      {...form.register("id")}
                      {...field}
                      value={field.value as string}
                      onChange={(e) => {
                        const alphanumericValue = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/-+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");

                        field.onChange(alphanumericValue);
                      }}
                      onBlur={(e) => {
                        const trimmedValue = e.target.value
                          .trim()
                          .replace(/^-+|-+$/g, "");

                        field.onChange(trimmedValue);
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            name="isDraft"
            control={form.control}
            render={({ field }) => (
              <FormItem
                id="isDraft"
                className={cn(
                  "flex flex-col items-start",
                  (data?.id === "default" || isSingleton) && "hidden",
                  isFieldChanged("isDraft") && changedFieldStyles,
                )}
              >
                <div className="flex flex-row space-x-2">
                  <FormControl>
                    <Checkbox
                      id="isDraft"
                      {...form.register("isDraft")}
                      checked={field.value === "true"}
                      onCheckedChange={(newCheckedState) => {
                        field.onChange(
                          newCheckedState === true ? "true" : "false",
                        );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="flex gap-1 items-baseline">
                    Draft
                    {isFieldChanged("isDraft") && (
                      <span className="text-yellow-600 text-xs">
                        <ModifiedMessage />
                      </span>
                    )}
                  </FormLabel>
                </div>
                <FormDescription>
                  Draft items are not visible on the published site
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {flagFields.length > 0 && (
            <div className="flex flex-col gap-3">
              <FormLabel>Flags</FormLabel>
              <div className="flex flex-row flex-wrap gap-4">
                {flagFields.map(([key, value]) => {
                  return (
                    <FormField
                      key={key}
                      name={key}
                      control={form.control}
                      render={({ field }) => (
                        <FormItem
                          className={cn(
                            "flex flex-col items-start",
                            isFieldChanged(key) && changedFieldStyles,
                          )}
                        >
                          <div className="flex flex-row space-x-2">
                            <FormControl>
                              <Checkbox
                                id={key}
                                {...form.register(key)}
                                checked={field.value === "true"}
                                onCheckedChange={(newCheckedState) => {
                                  field.onChange(
                                    newCheckedState === true ? "true" : "false",
                                  );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="flex gap-1 items-baseline">
                              {value.displayName}
                              {isFieldChanged(key) && (
                                <span className="text-yellow-800 text-xs">
                                  <ModifiedMessage />
                                </span>
                              )}
                            </FormLabel>
                          </div>
                          {value.displayExtra && (
                            <FormDescription>
                              {value.displayExtra}
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {Object.entries(fields)
            .filter(([, value]) => value.type !== "boolean")
            .map(([key, value]) => {
              // Get resolved choices for select/multiselect fields
              const resolvedChoices = resolvedChoicesMap[key] ?? [];

              return (
                <FormField
                  key={key}
                  name={key}
                  control={form.control}
                  rules={{
                    required: !value.optional,
                  }}
                  render={({ field }) => {
                    const selectedCount =
                      (field.value as string[])?.length ?? 0;
                    const hasMinMax =
                      value.type === "multiselect" &&
                      (value.minSelectedChoices || value.maxSelectedChoices);

                    return (
                      <FormItem
                        id={key}
                        className={cn(
                          isFieldChanged(key) && changedFieldStyles,
                        )}
                      >
                        <FormLabel className="flex gap-1 items-baseline">
                          {value.displayName}
                          {value.optional && (
                            <span className="text-gray-400">(optional)</span>
                          )}
                          {isFieldChanged(key) && (
                            <span className="text-yellow-600 text-xs">
                              <ModifiedMessage />
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          {value.type === "markdown" ? (
                            <MarkdownEditor
                              id={key}
                              name={key}
                              register={form.register}
                              className="h-52"
                              markdown={field.value as string}
                              onChange={(value, initialChange) => {
                                if (initialChange) return;

                                field.onChange(value);
                              }}
                              placeholder={value.placeholder}
                              fieldDisplayName={value.displayName}
                            />
                          ) : value.type === "url" ? (
                            <URLInput
                              id={key}
                              {...form.register(key)}
                              placeholder={
                                value.placeholder ?? "https://example.website/"
                              }
                              {...field}
                              value={field.value as string}
                            />
                          ) : value.type === "string" &&
                            value.isUploadedFile ? (
                            <FilePicker
                              id={key}
                              name={key}
                              register={form.register}
                              value={field.value as string}
                              onChange={field.onChange}
                            />
                          ) : value.type === "date" ? (
                            <DatePicker
                              id={key}
                              {...form.register(key)}
                              date={
                                field.value
                                  ? new Date(field.value as string)
                                  : undefined
                              }
                              onDateChange={(date) => {
                                field.onChange(date ? date.toISOString() : "");
                              }}
                              placeholder={value.placeholder ?? "Select date"}
                              allowClear={value.optional}
                            />
                          ) : value.type === "datetime" ? (
                            <div className="relative">
                              <DateTimePicker
                                id={key}
                                {...form.register(key)}
                                date={
                                  field.value
                                    ? new Date(field.value as string)
                                    : undefined
                                }
                                onDateTimeChange={(date) => {
                                  field.onChange(
                                    date ? date.toISOString() : "",
                                  );
                                }}
                                placeholder={
                                  value.placeholder ?? "Select date and time"
                                }
                                allowClear={value.optional}
                              />
                            </div>
                          ) : value.type === "color" ? (
                            <ColorPicker
                              id={key}
                              value={field.value as string}
                              onChange={field.onChange}
                              placeholder={value.placeholder}
                            />
                          ) : value.type === "number" ? (
                            <Input
                              id={key}
                              {...form.register(key, { valueAsNumber: true })}
                              type="number"
                              value={field.value as string}
                              onChange={field.onChange}
                              placeholder={value.placeholder}
                            />
                          ) : value.type === "select" ? (
                            <div className="flex gap-2">
                              <Select
                                value={field.value as string}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger id={key} className="w-full">
                                  <SelectValue
                                    placeholder={
                                      value.placeholder ?? "Select an item..."
                                    }
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
                              {value.optional && field.value && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => field.onChange("")}
                                  className="shrink-0"
                                >
                                  <X size={16} />
                                  <span className="sr-only">
                                    Clear selection
                                  </span>
                                </Button>
                              )}
                            </div>
                          ) : value.type === "multiselect" ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2 min-h-[38px] p-2 border rounded-md bg-background">
                                {(field.value as string[])?.length > 0 ? (
                                  (field.value as string[]).map(
                                    (selectedValue) => (
                                      <span
                                        key={selectedValue}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium bg-gray-100 text-black-800"
                                      >
                                        {selectedValue}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newValues = (
                                              field.value as string[]
                                            ).filter(
                                              (v) => v !== selectedValue,
                                            );
                                            field.onChange(newValues);
                                          }}
                                          className="hover:bg-gray-200 rounded-sm p-0.5"
                                        >
                                          <X size={14} />
                                          <span className="sr-only">
                                            Remove {selectedValue}
                                          </span>
                                        </button>
                                      </span>
                                    ),
                                  )
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    {value.placeholder ?? "Select items..."}
                                  </span>
                                )}
                              </div>
                              {(!value.maxSelectedChoices ||
                                selectedCount < value.maxSelectedChoices) && (
                                <Select
                                  value=""
                                  onValueChange={(newValue) => {
                                    const currentValues =
                                      (field.value as string[]) || [];
                                    if (!currentValues.includes(newValue)) {
                                      field.onChange([
                                        ...currentValues,
                                        newValue,
                                      ]);
                                    }
                                  }}
                                >
                                  <SelectTrigger id={key} className="w-full">
                                    <SelectValue placeholder="Add item..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {resolvedChoices
                                      .filter(
                                        (choice) =>
                                          !(field.value as string[])?.includes(
                                            choice,
                                          ),
                                      )
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
                                      selectedCount < value.minSelectedChoices
                                      ? "text-destructive"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {selectedCount}
                                  {value.minSelectedChoices &&
                                  value.maxSelectedChoices
                                    ? `/${value.maxSelectedChoices} (min ${value.minSelectedChoices})`
                                    : value.minSelectedChoices
                                      ? ` selected (min ${value.minSelectedChoices})`
                                      : `/${value.maxSelectedChoices} selected`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Input
                              id={key}
                              {...form.register(key)}
                              placeholder={value.placeholder}
                              {...field}
                              value={field.value as string}
                            />
                          )}
                        </FormControl>
                        {value.displayExtra && (
                          <FormDescription>
                            {value.displayExtra}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              );
            })}

          <Button
            disabled={
              (!form.formState.isDirty && !isNew) || form.formState.isSubmitting
            }
            type="submit"
          >
            {form.formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            {form.formState.isSubmitting
              ? "Saving"
              : form.watch("isDraft") === "true"
                ? "Save Draft"
                : "Save"}
          </Button>
        </form>

        <UnsavedChangesGuard
          hasUnsavedChanges={
            !form.formState.isSubmitting && form.formState.isDirty
          }
        />
      </Form>
    </>
  );
}
