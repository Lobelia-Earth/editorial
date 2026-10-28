import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import UnsavedChangesGuard from "@/components/unsavedChangesGuard";
import {
  useCreateObjectMutation,
  useGetDataQuery,
  useUpdateObjectMutation,
} from "@/lib/store/slices/editorialApi";
import { cn, statusColors } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getFieldDefaultValue,
  getFieldValidationSchema,
  hasFieldChoices,
  resolveFieldChoices,
} from "@/lib/fieldUtils";
import {
  type EditorialDataItem,
  type EditorialDataItemStatus,
  type EditorialSchemaItem,
} from "@isardsat/editorial-common";
import { Loader2, RotateCcw, Save } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import SchemaFormField from "./schemaFormField";

export interface SinglesPageProps {
  itemType: string;
  fields: EditorialSchemaItem["fields"];
  isSingleton?: boolean;
  data?: EditorialDataItem;
  productionData?: EditorialDataItem;
  isNew?: boolean;
  changedFields?: string[];
  itemStatus?: EditorialDataItemStatus;
}

export default function ItemForm({
  itemType,
  fields,
  isSingleton,
  data,
  productionData,
  isNew,
  changedFields = [],
  itemStatus,
}: SinglesPageProps) {
  const navigate = useNavigate();
  const { hash } = useLocation();

  const [createItem] = useCreateObjectMutation();
  const [updateItem] = useUpdateObjectMutation();

  const { data: allData } = useGetDataQuery();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"single" | "all" | null>(null);
  const [pendingFieldKey, setPendingFieldKey] = useState<string | null>(null);

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
        Object.entries(fields).map(([key, field]) => [
          key,
          getFieldDefaultValue(field, data?.[key]),
        ]),
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
      schemaShape[key] = getFieldValidationSchema(field);
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

  const applyRestoreFieldToProduction = React.useCallback(
    (fieldKey: string) => {
      if (!productionData) {
        toast.error("Production values are not available.");
        return;
      }

      const prodRaw = (productionData as Record<string, unknown>)[fieldKey];

      form.setValue(fieldKey, prodRaw as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      form.trigger(fieldKey);

      toast.success(
        `Restored "${fields[fieldKey]?.displayName ?? fieldKey}" to published value.`,
      );
    },
    [productionData, form, fields],
  );

  const applyRestoreAllChangedToProduction = React.useCallback(() => {
    if (!productionData) {
      toast.error("Production values are not available.");
      return;
    }

    if (!changedFields.length) return;

    changedFields.forEach((fieldKey) => {
      const prodRaw = (productionData as Record<string, unknown>)[fieldKey];

      form.setValue(fieldKey, prodRaw as any, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });

    toast.success("Restored modified fields to published values.");
  }, [productionData, changedFields, form]);

  const requestRestoreField = React.useCallback((fieldKey: string) => {
    setPendingFieldKey(fieldKey);
    setConfirmMode("single");
    setConfirmOpen(true);
  }, []);

  const requestRestoreAll = React.useCallback(() => {
    setPendingFieldKey(null);
    setConfirmMode("all");
    setConfirmOpen(true);
  }, []);

  const onConfirmRestore = React.useCallback(() => {
    if (confirmMode === "single" && pendingFieldKey) {
      applyRestoreFieldToProduction(pendingFieldKey);
    } else if (confirmMode === "all") {
      applyRestoreAllChangedToProduction();
    }

    setConfirmOpen(false);
    setConfirmMode(null);
    setPendingFieldKey(null);
    onSubmit(form.getValues(), false);
  }, [
    confirmMode,
    pendingFieldKey,
    applyRestoreFieldToProduction,
    applyRestoreAllChangedToProduction,
  ]);

  async function onSubmit(
    values: Record<string, string | string[]>,
    showNotification = true,
  ) {
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

    try {
      // New singletons are created in the page dashboard.$collection.$document.tsx,
      // so isNew is not passed for singletons, we determine creation vs update based on presence of data
      if (isNew || (isSingleton && !data)) {
        const payload = await createItem(processedValues).unwrap();
        if (showNotification) {
          toast.success("Item created successfully.");
        }
        navigate(`/admin/dashboard/${itemType}/${payload.id}`);
        return;
      }

      const currentId = data?.id;
      const newId = processedValues.id;
      const idChanged = currentId !== newId;
      if (!currentId) return;

      const payload = await updateItem({
        ...processedValues,
        id: currentId,
        type: itemType,
        newId: idChanged ? newId : undefined,
      }).unwrap();
      if (showNotification) {
        toast.success("Item updated successfully.");
      }
      if (idChanged) {
        navigate(`/admin/dashboard/${itemType}/${payload.id}`);
        return;
      }

      form.reset(values);
    } catch (err: any) {
      if (err.status === 409) {
        form.setError("id", {
          type: "manual",
          message: "An item with this ID already exists.",
        });
      }
      toast.error(isNew ? "Failed to create item." : "Failed to update item.");
      console.error(err);
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (form.formState.isDirty || isNew) {
          form.handleSubmit((values) => onSubmit(values))();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form, isNew, onSubmit]);

  const flagFields = useMemo(
    () =>
      Object.entries(fields).filter(([, value]) => value.type === "boolean"),
    [fields],
  );

  // Pre-resolve all field choices (including referenced ones)
  const resolvedChoicesMap = useMemo(() => {
    const map: Record<string, string[]> = {};

    Object.entries(fields).forEach(([key, field]) => {
      if (hasFieldChoices(field)) {
        map[key] = resolveFieldChoices(field, allData);
      }
    });

    return map;
  }, [fields, allData]);

  const changedFieldStyles =
    "outline outline-1 outline-yellow-400 outline-offset-4 rounded-sm";

  const ModifiedMessage = ({ fieldKey }: { fieldKey: string }) => (
    <span className="inline-flex items-center gap-1 text-yellow-800 text-xs">
      (modified)
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-4 w-4"
        onClick={() => requestRestoreField(fieldKey)}
        title="Restore published value"
      >
        <RotateCcw size={12} className="text-black" />
        <span className="sr-only">Restore {fieldKey} to production</span>
      </Button>
    </span>
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
            {changedFields.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={requestRestoreAll}
                title="Restore all fields to published values"
              >
                <RotateCcw size={14} />
                <span className="sr-only">
                  Restore all modified fields to published values
                </span>
              </Button>
            )}
          </div>
        )}
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
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
                    {isFieldChanged("id") && <ModifiedMessage fieldKey="id" />}
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
                        <ModifiedMessage fieldKey="isDraft" />
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
                                  <ModifiedMessage fieldKey={key} />
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
            .map(([key, value]) => (
              <SchemaFormField
                key={key}
                name={key}
                schemaField={value}
                resolvedChoices={resolvedChoicesMap[key] ?? []}
                className={cn(isFieldChanged(key) && changedFieldStyles)}
                labelExtra={
                  isFieldChanged(key) && (
                    <span className="text-yellow-600 text-xs">
                      <ModifiedMessage fieldKey={key} />
                    </span>
                  )
                }
              />
            ))}

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

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMode === "all"
                ? "Restore all modified fields?"
                : "Restore this field?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMode === "all"
                ? `This will restore ${changedFields.length} modified ${changedFields.length === 1 ? "field" : "fields"} to published values.`
                : `This will restore "${pendingFieldKey ? (fields[pendingFieldKey]?.displayName ?? pendingFieldKey) : "field"}" to its published value.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmRestore}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
