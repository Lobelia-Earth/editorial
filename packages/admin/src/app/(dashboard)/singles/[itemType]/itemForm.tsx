'use client';

import { Button } from '@/components/ui/button';
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
  EditorialDataObject,
  EditorialSchemaItem,
} from '@isardsat/editorial-common';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

export interface SinglesPageProps {
  fields: EditorialSchemaItem['fields'];
  data: EditorialDataObject;
}

export default function ItemForm({ fields, data }: SinglesPageProps) {
  const form = useForm({
    defaultValues: Object.fromEntries(
      Object.keys(fields).map((key) => [
        key,
        data[key as keyof EditorialDataObject] ?? null,
      ])
    ),
  });

  function onSubmit(values: object) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-96"
      >
        {Object.entries(fields).map(([key, value]) => {
          console.log(value);
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
                    {value.displayName}{' '}
                    {!value.isRequired && (
                      <span className="text-gray-400">(optional)</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={value.placeholder} {...field} />
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
