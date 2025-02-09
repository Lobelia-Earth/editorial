'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import React from 'react';

export default function Breadcrumbs() {
  const pathname = usePathname();

  const { data: schema } = useGetSchemaQuery();

  if (!schema) return null;

  return (
    <>
      {pathname.split('/').map((value, index, array) => {
        return (
          <React.Fragment key={value}>
            {array.length > 2 && index >= 2 && (
              <ChevronRight size={12} className="text-gray-500 pt-[1px]" />
            )}
            <p
              key={value}
              className="text-sm leading-none tracking-tight capitalize text-gray-500 last:text-foreground"
            >
              {schema[value] ? schema[value].displayName : value}
            </p>
          </React.Fragment>
        );
      })}
    </>
  );
}
