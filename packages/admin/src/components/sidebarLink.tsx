'use client';

import { cn } from '@/lib/utils';
import { Grid, Image, LucideIcon, Square } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenuItem, SidebarMenuButton } from './ui/sidebar';

const icons = {
  square: Square,
  grid: Grid,
  image: Image,
} as const;

export interface SidebarLinkProps {
  title: string;
  url: string;
  icon: keyof typeof icons;
}

export default function SidebarLink({ url, icon, title }: SidebarLinkProps) {
  const pathname = usePathname();
  const Icon = icons[icon];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link
          href={url}
          className={pathname.startsWith(url) ? 'text-blue-500' : ''}
        >
          <Icon />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
