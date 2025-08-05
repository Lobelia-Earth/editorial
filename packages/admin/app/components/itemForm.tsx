import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/datetime-picker";
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
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  EditorialDataItem,
  EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { Save } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FilePicker from "./FilePicker";
import MarkdownEditor from "./markdownEditor";
import { DatePicker } from "./ui/date-picker";
import URLInput from "./URLInput";

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
  const [createItem] = useCreateObjectMutation();
  const [updateItem] = useUpdateObjectMutation();

  const getDefaultValues = useCallback(
    (fields: EditorialSchemaItem["fields"]) => {
      return {
        id: data?.id ?? "",
        ...Object.fromEntries(
          Object.keys(fields).map((key) => [
            key,
            data?.[key] ?? (fields[key].type === "boolean" ? false : ""),
          ]),
        ),
      };
    },
    [data, fields],
  );

  const validationSchema = useMemo(() => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      id: z
        .string()
        .min(1, "ID is required")
        .regex(
          /^[a-z0-9-]+$/,
          "ID can only include lowercase letters and numbers",
        ),
    };

    Object.entries(fields).forEach(([key, field]) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "number":
          fieldSchema = z
            .string()
            .refine((val) => !isNaN(Number(val)), "Must be a valid number");
          break;
        case "url":
          fieldSchema = z.string().url("Must be a valid URL");
          break;
        case "date":
          fieldSchema = z.string();
          break;
        case "datetime":
          fieldSchema = z.string();
          break;
        default:
          fieldSchema = z.string();
      }

      if (!field.isRequired) {
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
    resolver: zodResolver(validationSchema),
    defaultValues: getDefaultValues(fields),
  });

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

  async function onSubmit(values: object) {
    if (isNew) {
      createItem({ ...values, type: itemType });
    } else {
      updateItem({ ...values, type: itemType });
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
          disabled={data?.id === "default"}
          rules={{ required: true }}
          render={({ field }) => {
            if (data?.id === "default") return <></>;

            return (
              <FormItem>
                <FormLabel className="flex gap-1 items-baseline">ID</FormLabel>
                <FormControl>
                  <Input
                    id="id"
                    placeholder="my-item-id"
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
                  required: value.isRequired,
                }}
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel className="flex gap-1 items-baseline">
                        {value.displayName}
                        {!value.isRequired && (
                          <span className="text-gray-400">(optional)</span>
                        )}
                      </FormLabel>
                      <FormControl id={key}>
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
                          />
                        ) : value.type === "url" ? (
                          <URLInput
                            id={key}
                            {...form.register(key)}
                            placeholder={value.placeholder ?? "https://"}
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
                            id={key}
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
                        ) : (
                          <Input
                            id={key}
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
          <Save /> Save
        </Button>
      </form>

      <UnsavedChangesGuard hasUnsavedChanges={form.formState.isDirty} />
    </Form>
  );
}
