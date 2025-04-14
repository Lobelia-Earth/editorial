import { useGetSchemaQuery } from "@/lib/store/slices/editorialApi";
import { useMemo } from "react";
import ItemForm from "../../../singles/[itemType]/itemForm";
import type { Route } from "../[id]/+types/collectionItem";

export default function NewCollectionItem({ params }: Route.ComponentProps) {
  const { data: schema } = useGetSchemaQuery();

  const itemFields = useMemo(() => {
    if (!schema) return null;

    return schema[params.collectionId].fields;
  }, [schema, params.collectionId]);

  if (!schema || !itemFields) return null;

  return (
    <div className="flex flex-1 overflow-hidden h-full p-4 gap-4">
      <div className="flex flex-col flex-1 gap-8">
        <ItemForm itemType={params.collectionId} fields={itemFields} isNew />
      </div>
    </div>
  );
}
