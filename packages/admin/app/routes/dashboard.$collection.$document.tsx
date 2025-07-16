import ItemForm from "@/components/itemForm";
import {
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import type { Route } from "./+types/dashboard.$collection.$document";

export default function CollectionItemPage({ params }: Route.ComponentProps) {
  const { collectionId, documentId } = params;

  const { data: schema, isFetching: isSchemaFetching } =
    useGetSchemaTypeQuery(collectionId);
  const { data: item, isFetching: isDataObjectFetching } =
    useGetDataObjectQuery({
      itemType: collectionId,
      id: documentId,
    });

  const isFetching = isSchemaFetching || isDataObjectFetching;

  if (!schema || !item || isFetching) return null;

  return (
    <div className="overflow-auto">
      <div className="flex p-4 gap-4">
        <ItemForm
          key={`${collectionId}-${documentId}`}
          itemType={collectionId}
          fields={schema.fields}
          data={item}
        />
      </div>
    </div>
  );
}
