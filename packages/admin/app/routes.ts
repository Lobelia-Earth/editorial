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
    layout("routes/dashboard/layout.tsx", [
      route("dashboard", "routes/dashboard/dashboard.tsx"),
      route(
        "dashboard/collections/:collectionId/new",
        "routes/dashboard/collections/[itemType]/new/newCollectionItem.tsx"
      ),
      route(
        "dashboard/collections/:collectionId",
        "routes/dashboard/collections/[itemType]/collection.tsx"
      ),
      route(
        "dashboard/collections/:collectionId/:documentId",
        "routes/dashboard/collections/[itemType]/[id]/collectionItem.tsx"
      ),
      route(
        "dashboard/singles/:itemType",
        "routes/dashboard/singles/[itemType]/singles.tsx"
      ),
      route("dashboard/files", "routes/dashboard/files/page.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
