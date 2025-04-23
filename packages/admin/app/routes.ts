import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  ...prefix("/admin", [
    index("routes/home.tsx"),
    layout("routes/dashboard._layout.tsx", [
      route("dashboard", "routes/dashboard.tsx"),
      route(
        "dashboard/:collectionId/new",
        "routes/dashboard.$collection.new.tsx"
      ),
      route("dashboard/:collectionId", "routes/dashboard.$collection.tsx"),
      route(
        "dashboard/:collectionId/:documentId",
        "routes/dashboard.$collection.$document.tsx"
      ),
      route("dashboard/files", "routes/dashboard.files.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
