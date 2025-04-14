import { clientEnv } from "@/lib/env";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { signOut } from "@/lib/store/slices/authSlice";
import {
  usePublishMutation,
  usePullMutation,
  usePushMutation,
} from "@/lib/store/slices/editorialApi";
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  ChevronDown,
  ExternalLink,
  Files,
  Grid,
  LogOut,
  Square,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Modal } from "./modal";
import SidebarSchemaItems from "./sidebarSchemaItems";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
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
} from "./ui/sidebar";

export default function AppSidebar() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [publish] = usePublishMutation();
  const [pull] = usePullMutation();
  const [push] = usePushMutation();
  const role = useAppSelector((state) => state.auth.role);

  return (
    <Sidebar className="z-50">
      <Modal isOpen={aboutModalOpen} setOpen={setAboutModalOpen} />

      <SidebarHeader className="h-14 justify-center">
        <SidebarGroup>
          <Link
            to="/admin/dashboard"
            className="text-3xl font-semibold tracking-tight transition-colors"
          >
            WEkEO
          </Link>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                defaultOpen={pathname.startsWith("/collections")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group">
                      <Grid />
                      <span>Collections</span>
                      <ChevronDown className="transition-transform ml-auto -mr-[2px] group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarSchemaItems href="/admin/dashboard/collections" />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible
                defaultOpen={pathname.startsWith("/singles")}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group">
                      <Square />
                      <span>Singles</span>
                      <ChevronDown className="transition-transform ml-auto -mr-[2px] group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarSchemaItems
                      href="/admin/dashboard/singles"
                      singleton
                    />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/admin/dashboard/files">
                    <Files />
                    <span>Files</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Blocks />
                  <span>Components</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {role === "developer" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => pull()}>
                      <ArrowDown />
                      <span>Pull from repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => push()}>
                      <ArrowUp />
                      <span>Push to repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => publish()}>
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
        <SidebarMenuButton asChild>
          <Link to={clientEnv.PREVIEW_URL}>
            Preview
            <ExternalLink className="ml-auto" />
          </Link>
        </SidebarMenuButton>
        <SidebarMenuButton onClick={() => setAboutModalOpen(true)}>
          About
        </SidebarMenuButton>
        <SidebarMenuButton onClick={() => dispatch(signOut())}>
          <LogOut />
          Log out
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
