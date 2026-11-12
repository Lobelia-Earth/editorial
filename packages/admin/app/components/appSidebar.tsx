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
  ChevronDown,
  ExternalLink,
  Files,
  Grid,
  Loader2,
  LogOut,
  Square,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { toast } from "sonner";
import { Modal } from "./modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
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
  SidebarSeparator,
} from "./ui/sidebar";

export default function AppSidebar() {
  const dispatch = useAppDispatch();
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [publish, publishState] = usePublishMutation();
  const [pull, pullingState] = usePullMutation();
  const [push, pushingState] = usePushMutation();

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

  // Open the group that contains the current route, e.g. after a reload
  const { pathname } = useLocation();
  const activeEntry = useMemo(() => {
    const key = pathname.match(/^\/admin\/dashboard\/([^/]+)/)?.[1];
    return key ? schema?.[key] : undefined;
  }, [pathname, schema]);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [singlesOpen, setSinglesOpen] = useState(false);

  useEffect(() => {
    if (!activeEntry) return;
    if (activeEntry.singleton) setSinglesOpen(true);
    else setCollectionsOpen(true);
  }, [activeEntry]);

  const handlePublish = async (author: string) => {
    try {
      const result = await publish({ author }).unwrap();
      if (result) {
        toast.success("Content published successfully.");
      } else {
        toast.error("Publishing failed.");
      }
    } catch (err) {
      toast.error("Publishing failed.");
      console.error(err);
    }
  };

  const handlePull = async () => {
    try {
      const result = await pull().unwrap();
      if (result) {
        toast.success("Content pulled successfully.");
      } else {
        toast.error("Pulling content failed.");
      }
    } catch (err) {
      toast.error("Pulling content failed.");
      console.error(err);
    }
  };

  const handlePush = async (options: { author: string }) => {
    try {
      const result = await push(options).unwrap();
      if (result) {
        toast.success("Content pushed successfully.");
      } else {
        toast.error("Pushing content failed.");
      }
    } catch (err) {
      toast.error("Pushing content failed.");
      console.error(err);
    }
  };

  return (
    <Sidebar className="z-50">
      <Modal isOpen={aboutModalOpen} setOpen={setAboutModalOpen} />

      <AlertDialog
        open={publishConfirmOpen}
        onOpenChange={setPublishConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish content?</AlertDialogTitle>
            <AlertDialogDescription>
              All unpublished changes will go live on the site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => user && handlePublish(user.email)}
            >
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to keep editing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => dispatch(signOut())}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SidebarHeader className="h-14 justify-center">
        <SidebarGroup>
          <Link
            to="/admin/dashboard"
            className="truncate text-lg font-semibold tracking-tight text-sidebar-foreground transition-colors hover:text-sidebar-foreground/70"
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
                open={collectionsOpen}
                onOpenChange={setCollectionsOpen}
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

              <Collapsible
                className="group/collapsible"
                disabled={!hasSingles}
                open={singlesOpen}
                onOpenChange={setSinglesOpen}
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
                    <SidebarSchemaItems singleton />
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <NavLink to="/admin/dashboard/files">
                  {({ isActive }) => (
                    <SidebarMenuButton isActive={isActive} asChild>
                      <div>
                        <Files />
                        <span>Files</span>
                      </div>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="p-0">
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user?.role === "developer" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      disabled={pullingState.isLoading}
                      onClick={() => handlePull()}
                    >
                      {pullingState.isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <ArrowDown />
                      )}
                      <span>Pull from repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      disabled={pushingState.isLoading}
                      onClick={() => handlePush({ author: user.email })}
                    >
                      {pushingState.isLoading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <ArrowUp />
                      )}
                      <span>Push to repo</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    disabled={publishState.isLoading}
                    onClick={() => setPublishConfirmOpen(true)}
                  >
                    {publishState.isLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Upload />
                    )}
                    <span>Publish</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-0" />

        {config?.previewUrl && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href={config.previewUrl} target="_blank" rel="noreferrer">
                  <span>Preview</span>
                  <ExternalLink className="ml-auto" />
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <div className="flex items-center gap-2 py-1 pl-2">
          <div className="grid flex-1 text-sm leading-tight">
            <span className="truncate font-medium">{user?.email}</span>
            <span className="truncate text-xs capitalize text-sidebar-foreground/70">
              {user?.role}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 cursor-pointer"
            title="Log out"
            aria-label="Log out"
            onClick={() => setLogoutConfirmOpen(true)}
          >
            <LogOut />
          </Button>
        </div>

        <button
          type="button"
          className="cursor-pointer self-start px-2 text-xs text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
          onClick={() => setAboutModalOpen(true)}
        >
          Editorial v{__APP_VERSION__}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
