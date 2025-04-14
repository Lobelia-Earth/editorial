import type { Route } from "./+types/collection";
import CollectionsList from "./collectionsList";

export default function Collection({ params }: Route.ComponentProps) {
  return <CollectionsList itemType={params.collectionId} />;
}
