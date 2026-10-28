import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { FieldInputFormValues, SchemaField } from "@/lib/fieldUtils";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import BlocksField from "./blocksField";
import FieldInput from "./fieldInput";

export interface SchemaFormFieldProps {
  /** Form path of the field, also used as the element id */
  name: string;
  schemaField: SchemaField;
  resolvedChoices: string[];
  className?: string;
  /** Extra content rendered next to the label, e.g. a modified marker */
  labelExtra?: ReactNode;
}

/**
 * Renders a schema field with its label, input, description and validation
 * message. Must be used inside a <Form>.
 */
export default function SchemaFormField({
  name,
  schemaField,
  resolvedChoices,
  className,
  labelExtra,
}: SchemaFormFieldProps) {
  const form = useFormContext<FieldInputFormValues>();

  if (schemaField.type === "blocks") {
    return (
      <BlocksField
        name={name}
        schemaField={schemaField}
        className={className}
        labelExtra={labelExtra}
      />
    );
  }

  return (
    <FormField
      name={name}
      control={form.control}
      rules={{
        required: !schemaField.optional,
      }}
      render={({ field }) => (
        <FormItem id={name} className={className}>
          <FormLabel className="flex gap-1 items-baseline">
            {schemaField.displayName}
            {schemaField.optional && (
              <span className="text-gray-400">(optional)</span>
            )}
            {labelExtra}
          </FormLabel>
          <FieldInput
            name={name}
            schemaField={schemaField}
            field={field}
            resolvedChoices={resolvedChoices}
          />
          {schemaField.displayExtra && (
            <FormDescription>{schemaField.displayExtra}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
