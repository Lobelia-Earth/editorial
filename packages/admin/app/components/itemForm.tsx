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
import UnsavedChangesGuard from "@/components/unsavedChangesGuard";
import {
  useCreateObjectMutation,
  useUpdateObjectMutation,
} from "@/lib/store/slices/editorialApi";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  EditorialDataItem,
  EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { RGBColorSchema } from "@isardsat/editorial-common";
import { Save } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
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
  data?: EditorialDataItem;
  isNew?: boolean;
}

export default function ItemForm({
  itemType,
  fields,
  data,
  isNew,
}: SinglesPageProps) {
  const navigate = useNavigate();

  const [createItem] = useCreateObjectMutation();
  const [updateItem] = useUpdateObjectMutation();

  const defaultValues = useMemo(() => {
    return {
      id: data?.id ?? "",
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
            return [key, String(value)];
          }

          // Default values for new items
          return [key, fieldType === "boolean" ? "false" : ""];
        }),
      ),
    };
  }, [data, fields]);

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
        default:
          fieldSchema = z.string();
      }

      if (field.optional) {
        fieldSchema = fieldSchema.optional().or(z.literal(""));
      } else if (field.type !== "boolean") {
        fieldSchema = (fieldSchema as z.ZodString).min(
          1,
          `${field.displayName} is required`,
        );
      }

      schemaShape[key] = fieldSchema;
    });

    return z.object(schemaShape);
  }, [fields]);

  const form = useForm<Record<string, string>>({
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

  async function onSubmit(values: Record<string, string>) {
    // Convert field values to their proper types
    const processedValues: Record<string, any> = {
      ...values,
      isDraft: values.isDraft === "true",
      type: itemType,
    };

    // Convert number fields from strings to numbers
    Object.entries(fields).forEach(([key, field]) => {
      if (field.type === "number" && values[key]) {
        processedValues[key] = Number(values[key]);
      } else if (field.type === "boolean") {
        processedValues[key] = values[key] === "true";
      }
    });

    if (isNew) {
      const payload = await createItem(processedValues);

      if (!("error" in payload)) {
        navigate(`/admin/dashboard/${itemType}/${payload.data.id}`);
      }
    } else {
      await updateItem(processedValues);
      form.reset(values);
    }
  }

  const flagFields = useMemo(
    () =>
      Object.entries(fields).filter(([, value]) => value.type === "boolean"),
    [fields],
  );

  return (
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
                className={cn(data?.id === "default" && "hidden")}
              >
                <FormLabel className="flex gap-1 items-baseline">ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="item-id"
                    {...form.register("id")}
                    {...field}
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
                data?.id === "default" && "hidden",
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
                      <FormItem className="flex flex-col items-start">
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
            return (
              <FormField
                key={key}
                name={key}
                control={form.control}
                rules={{
                  required: !value.optional,
                }}
                render={({ field }) => {
                  return (
                    <FormItem id={key}>
                      <FormLabel className="flex gap-1 items-baseline">
                        {value.displayName}
                        {value.optional && (
                          <span className="text-gray-400">(optional)</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        {value.type === "markdown" ? (
                          <MarkdownEditor
                            name={key}
                            register={form.register}
                            className="h-52"
                            markdown={field.value}
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
                          />
                        ) : value.type === "string" && value.isUploadedFile ? (
                          <FilePicker
                            id={key}
                            name={key}
                            register={form.register}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        ) : value.type === "date" ? (
                          <DatePicker
                            {...form.register(key)}
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onDateChange={(date) => {
                              field.onChange(
                                date ? date.toISOString() : undefined,
                              );
                            }}
                            placeholder={value.placeholder ?? "Select date"}
                          />
                        ) : value.type === "datetime" ? (
                          <DateTimePicker
                            id={key}
                            {...form.register(key)}
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onDateTimeChange={(date) => {
                              field.onChange(
                                date ? date.toISOString() : undefined,
                              );
                            }}
                            placeholder={
                              value.placeholder ?? "Select date and time"
                            }
                          />
                        ) : value.type === "color" ? (
                          <ColorPicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={value.placeholder}
                          />
                        ) : value.type === "number" ? (
                          <Input
                            {...form.register(key, { valueAsNumber: true })}
                            type="number"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={value.placeholder}
                          />
                        ) : (
                          <Input
                            {...form.register(key)}
                            placeholder={value.placeholder}
                            {...field}
                          />
                        )}
                      </FormControl>
                      {value.displayExtra && (
                        <FormDescription>{value.displayExtra}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            );
          })}

        <Button disabled={!form.formState.isDirty && !isNew} type="submit">
          <Save /> {form.watch("isDraft") === "true" ? "Save Draft" : "Save"}
        </Button>
      </form>

      <UnsavedChangesGuard
        hasUnsavedChanges={
          !form.formState.isSubmitting && form.formState.isDirty
        }
      />
    </Form>
  );
}
