'use client';

import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import Link from 'next/link';
import { SidebarMenuSub, SidebarMenuSubButton } from './ui/sidebar';

export interface SidebarSchemaItemsProps {
  href: string;
  singleton?: boolean;
}

export default function SidebarSchemaItems({
  href,
  singleton,
}: SidebarSchemaItemsProps) {
  const { data: schema } = useGetSchemaQuery();

  if (!schema) return null;

  return (
    <>
      {Object.entries(schema)
        .filter(([, value]) => (singleton ? value.singleton : !value.singleton))
        .map(([key, value]) => (
          <SidebarMenuSub key={key}>
            <SidebarMenuSubButton asChild>
              <Link
                href={
                  singleton ? `${href}/${key}` : `${href}#${value.displayName}`
                }
              >
                <span className="inline-block overflow-hidden whitespace-nowrap text-ellipsis text-nowrap w-full">
                  {value.displayName}
                </span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSub>
        ))}
    </>
  );
}
