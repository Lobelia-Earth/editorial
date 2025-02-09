'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUpdateObjectMutation } from '@/lib/store/editorialApi';
import type {
  EditorialDataObject,
  EditorialSchemaItem,
} from '@isardsat/editorial-common';
import { Save } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import MarkdownEditor from './markdownEditor';

export interface SinglesPageProps {
  itemType: string;
  fields: EditorialSchemaItem['fields'];
  data: EditorialDataObject;
}

export default function ItemForm({ itemType, fields, data }: SinglesPageProps) {
  const [trigger] = useUpdateObjectMutation();

  const form = useForm({
    defaultValues: Object.fromEntries(
      Object.keys(fields).map((key) => [
        key,
        data[key as keyof EditorialDataObject] ?? '',
      ])
    ),
  });

  async function onSubmit(values: object) {
    trigger({ ...values, type: itemType, id: data.id });
  }

  const flagFields = useMemo(() => {
    return Object.entries(fields).filter(
      ([, value]) => value.type === 'boolean'
    );
  }, [fields]);

  useEffect(() => {
    const newValues = Object.fromEntries(
      Object.keys(fields).map((key) => [
        key,
        data[key as keyof EditorialDataObject] ?? '',
      ])
    );

    if (form.formState.isDirty) {
      form.reset(newValues);
    }
  }, [data, fields, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-[800px]"
      >
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
                              checked={field.value}
                              onCheckedChange={field.onChange}
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
          .filter(([, value]) => value.type !== 'boolean')
          .map(([key, value]) => {
            return (
              <FormField
                key={key}
                name={key}
                control={form.control}
                rules={{
                  required: value.isRequired,
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-baseline">
                      {value.displayName}
                      {!value.isRequired && (
                        <span className="text-gray-400">(optional)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      {value.type === 'markdown' ? (
                        <MarkdownEditor
                          className="h-52"
                          markdown={field.value}
                          onChange={field.onChange}
                          placeholder={value.placeholder}
                        />
                      ) : (
                        <Input placeholder={value.placeholder} {...field} />
                      )}
                    </FormControl>
                    {value.displayExtra && (
                      <FormDescription>{value.displayExtra}</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}

        <Button disabled={!form.formState.isDirty} type="submit">
          <Save /> Save
        </Button>
      </form>
    </Form>
  );
}
