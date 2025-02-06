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
} from './ui/sidebar';
import { Button } from './ui/button';

import SidebarLink from './sidebarLink';

const items = [
  {
    title: 'Singles',
    url: '/singles',
    icon: 'square',
  },
  {
    title: 'Collections',
    url: '/collections',
    icon: 'grid',
  },
  {
    title: 'Files',
    url: '/files',
    icon: 'image',
  },
] as const;

const actions = [
  {
    title: 'Publish',
    url: '#',
    icon: Upload,
  },
] as const;

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarGroup>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight transition-colors">
              WEkEO
            </h2>
            {/* <p className="text-xs leading-none tracking-wide text-muted-foreground">
              Editorial v6.0.0
            </p> */}
          </div>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarLink key={item.title} {...item} />
              ))}
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
