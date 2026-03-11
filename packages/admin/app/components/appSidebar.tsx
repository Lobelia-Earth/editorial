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
  Loader2,
  LogOut,
  Square,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Modal } from "./modal";
import SidebarSchemaItems from "./sidebarSchemaItems";
import { Button } from "./ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false);
  const [publish, publishState] = usePublishMutation();
  const [pull, pullingState] = usePullMutation();
  const [push, pushingState] = usePushMutation();

  const { data: config } = useGetConfigQuery();
  const { data: schema } = useGetSchemaQuery();
  // const { data: appVersion } = useAppVersionCheckQuery();
  const appVersion = {
    current: __APP_VERSION__,
    latest: "6.21.0",
  };

  const hasCollections = useMemo(
    () => schema && !!Object.values(schema).find((entry) => !entry.singleton),
    [schema],
  );
  const hasSingles = useMemo(
    () => schema && !!Object.values(schema).find((entry) => entry.singleton),
    [schema],
  );

  const user = useAppSelector((state) => state.auth.user);

  // LocalStorage for dismissed version
  const dismissedVersion = localStorage.getItem("editorial-last-seen-version");

  const isNewVersionAvailable =
    appVersion && appVersion.latest !== __APP_VERSION__;

  const showNewVersionNotification =
    isNewVersionAvailable && appVersion.latest !== dismissedVersion;

  const dismissNewVersion = () => {
    if (appVersion?.latest) {
      localStorage.setItem("editorial-last-seen-version", appVersion.latest);
    }
    setNewVersionModalOpen(false);
  };
  const handleNewVersionOpen = () => {
    setNewVersionModalOpen(true);
  };

  const handleAboutOpen = () => {
    setAboutModalOpen(true);
  };

  const handlePublish = async (author: string) => {
    try {
      const result = await publish({ author }).unwrap();
      if (result) toast.success("Content published successfully.");
      else toast.error("Publishing failed.");
    } catch (err) {
      toast.error("Publishing failed.");
      console.error(err);
    }
  };

  const handlePull = async () => {
    try {
      const result = await pull().unwrap();
      if (result) toast.success("Content pulled successfully.");
      else toast.error("Pulling content failed.");
    } catch (err) {
      toast.error("Pulling content failed.");
      console.error(err);
    }
  };

  const handlePush = async (options: { author: string }) => {
    try {
      const result = await push(options).unwrap();
      if (result) toast.success("Content pushed successfully.");
      else toast.error("Pushing content failed.");
    } catch (err) {
      toast.error("Pushing content failed.");
      console.error(err);
    }
  };

  return (
    <Sidebar className="z-50">
      <Modal isOpen={aboutModalOpen} setOpen={setAboutModalOpen} />
      <Dialog open={newVersionModalOpen} onOpenChange={setNewVersionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update available</DialogTitle>
            <DialogDescription>
              A new Editorial version is ready to install.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current version</span>
              <span className="font-medium">{__APP_VERSION__}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Latest version</span>
              <span className="font-semibold">{appVersion?.latest}</span>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full cursor-pointer" onClick={() => {}}>
              Upgrade now
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link
                to="https://github.com/Lobelia-Earth/editorial/blob/main/packages/admin/CHANGELOG.md"
                target="_blank"
                rel="noreferrer"
              >
                View changelog
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full text-muted-foregroundn cursor-pointer"
              onClick={dismissNewVersion}
            >
              Don't show again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroupLabel>Actions</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {user?.role === "developer" && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    onClick={handlePull}
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
                  onClick={() => handlePublish(user.email)}
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

        <SidebarSeparator />

        <SidebarMenuButton asChild>
          <Link to={config?.previewUrl as string}>
            Preview
            <ExternalLink className="ml-auto" />
          </Link>
        </SidebarMenuButton>

        <SidebarMenuButton onClick={handleAboutOpen}>About </SidebarMenuButton>

        <SidebarMenuButton
          className="cursor-pointer"
          onClick={() => dispatch(signOut())}
        >
          <LogOut />
          Log out
        </SidebarMenuButton>

        <div
          data-slot="sidebar-group-label"
          data-sidebar="group-label"
          className="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0"
        >
          <button
            type="button"
            onClick={handleNewVersionOpen}
            disabled={!isNewVersionAvailable || user?.role !== "developer"}
            className="inline-flex items-center cursor-pointer disabled:cursor-default"
          >
            <span>Editorial v{__APP_VERSION__}</span>
            {showNewVersionNotification && user?.role === "developer" && (
              <span
                className="inline-block align-middle ml-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                aria-label={`New version ${appVersion?.latest} available`}
                title={`New version ${appVersion?.latest} available`}
              />
            )}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
