'use client';

import { Grid, Image, Square, Upload } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './ui/sidebar';
import { Button } from './ui/button';

import SidebarLink from './sidebarLink';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import Link from 'next/link';
import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import { usePathname } from 'next/navigation';

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
