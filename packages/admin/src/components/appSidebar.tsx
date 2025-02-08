'use client';

import {
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Files,
  Grid,
  Image,
  Square,
  Upload,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import { Button } from './ui/button';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import Link from 'next/link';
import SidebarSchemaItems from './sidebarSchemaItems';
import { usePathname } from 'next/navigation';

const actions = [
  {
    title: 'Publish',
    url: '#',
    icon: Upload,
  },
] as const;

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="z-50">
      <SidebarHeader className="h-14 justify-center">
        <SidebarGroup>
          <h2 className="text-3xl font-semibold tracking-tight transition-colors">
            WEkEO
          </h2>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group">
                      <Square />
                      <span>Singles</span>
                      <ChevronDown className="transition-transform ml-auto -mr-[2px] group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarSchemaItems href="/singles" singleton />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/collections">
                      <Grid />
                      <span>Collections</span>
                    </Link>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-180">
                      <ChevronDown />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarSchemaItems href="/collections" />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/files">
                    <Files />
                    <span>Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actions.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup></SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="text-sidebar-foreground">
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
