import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { signOut } from "@/lib/store/slices/authSlice";
import {
  useGetConfigQuery,
  useGetSchemaQuery,
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
import { useMemo, useState } from "react";
import { Link } from "react-router";
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
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [publish] = usePublishMutation();
  const [pull] = usePullMutation();
  const [push] = usePushMutation();

  const { data: config } = useGetConfigQuery();
  const { data: schema } = useGetSchemaQuery();
  // const { data: filesTotalSize } = useGetFilesTotalSizeQuery();

  const hasCollections = useMemo(
    () => schema && !!Object.values(schema).find((entry) => !entry.singleton),
    [schema],
  );
  const hasSingles = useMemo(
    () => schema && !!Object.values(schema).find((entry) => entry.singleton),
    [schema],
  );

  const user = useAppSelector((state) => state.auth.user);

  return (
    <Sidebar className="z-50">
      <Modal isOpen={aboutModalOpen} setOpen={setAboutModalOpen} />

      <SidebarHeader className="h-14 justify-center">
        <SidebarGroup>
          <Link
            to="/admin/dashboard"
            className="text-3xl font-semibold tracking-tight transition-colors"
          >
            {config?.name}
          </Link>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                className="group/collapsible"
                disabled={!hasCollections}
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
                    <SidebarSchemaItems />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible" disabled={!hasSingles}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group">
                      <Square />
                      <span>Singles</span>
                      <ChevronDown className="transition-transform ml-auto -mr-[2px] group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarSchemaItems singleton />
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
              {user?.role === "developer" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      onClick={() => pull()}
                    >
                      <ArrowDown />
                      <span>Pull from repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      onClick={() => push({ author: user.email })}
                    >
                      <ArrowUp />
                      <span>Push to repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    onClick={() => publish({ author: user.email })}
                  >
                    <Upload />
                    <span>Publish</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup></SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuButton asChild>
          <Link to={config?.previewUrl as string}>
            Preview
            <ExternalLink className="ml-auto" />
          </Link>
        </SidebarMenuButton>
        <SidebarMenuButton
          className="cursor-pointer"
          onClick={() => setAboutModalOpen(true)}
        >
          About
        </SidebarMenuButton>
        <SidebarMenuButton
          className="cursor-pointer"
          onClick={() => dispatch(signOut())}
        >
          <LogOut />
          Log out
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
