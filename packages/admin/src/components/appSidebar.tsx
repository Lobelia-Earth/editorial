'use client';

import { ChevronDown, Files, Grid, Square, Upload } from 'lucide-react';
import Link from 'next/link';
import SidebarSchemaItems from './sidebarSchemaItems';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
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
} from './ui/sidebar';

export default function AppSidebar() {
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
                      <Grid />
                      <span>Collections</span>
                      <ChevronDown className="transition-transform ml-auto -mr-[2px] group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarSchemaItems href="/collections" />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

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
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Upload />
                  <span>Publish</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
