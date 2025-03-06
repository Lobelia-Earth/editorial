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
import {
  useCreateObjectMutation,
  useUpdateObjectMutation,
} from '@/lib/store/slices/editorialApi';
import type {
  EditorialDataItem,
  EditorialSchemaItem,
} from '@isardsat/editorial-common';
import { Save } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import MarkdownEditor from './markdownEditor';

export interface SinglesPageProps {
  itemType: string;
  fields: EditorialSchemaItem['fields'];
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
    (fields: EditorialSchemaItem['fields']) => {
      return {
        id: data?.id ?? '',
        ...Object.fromEntries(
          Object.keys(fields).map((key) => [key, data?.[key] ?? ''])
        ),
      };
    },
    [data]
  );

  const form = useForm<Record<string, string>>({
    defaultValues: getDefaultValues(fields),
  });

  async function onSubmit(values: object) {
    if (isNew) {
      createItem({ ...values, type: itemType });
    } else {
      updateItem({ ...values, type: itemType });
    }
  }

  const flagFields = useMemo(() => {
    return Object.entries(fields).filter(
      ([, value]) => value.type === 'boolean'
    );
  }, [fields]);

  useEffect(() => {
    const newValues = getDefaultValues(fields);

    if (form.formState.isDirty) {
      form.reset(newValues);
    }
  }, [data, fields, form, getDefaultValues]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-[800px]"
      >
        <FormField
          name="id"
          control={form.control}
          disabled={data?.id === 'default'}
          rules={{ required: true }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex gap-1 items-baseline">ID</FormLabel>
              <FormControl>
                <Input placeholder="url-slug" {...field} />
              </FormControl>
              {data?.id !== 'default' && (
                <FormDescription>
                  Choose a descriptive ID, since it will be part of the URL
                </FormDescription>
              )}
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
                              checked={field.value as unknown as boolean}
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

        <Button disabled={!form.formState.isDirty && !isNew} type="submit">
          <Save /> Save
        </Button>
      </form>
    </Form>
  );
}
