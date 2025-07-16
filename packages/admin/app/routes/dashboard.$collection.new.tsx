import ItemForm from "@/components/itemForm";
import { useGetSchemaTypeQuery } from "@/lib/store/slices/editorialApi";
import type { Route } from "./+types/dashboard.$collection.new";

export default function Page({ params }: Route.ComponentProps) {
  const { collectionId } = params;

  const { data: schema } = useGetSchemaTypeQuery(collectionId);

  if (!schema) return null;

  return (
    <div className="overflow-auto">
      <div className="flex p-4 gap-4">
        <ItemForm itemType={collectionId} fields={schema.fields} isNew={true} />
      </div>
    </div>
  );
}
