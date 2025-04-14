import {
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import ItemForm from "@/routes/dashboard/singles/[itemType]/itemForm";
import type { Route } from "./+types/collectionItem";

export default function CollectionItemPage({ params }: Route.ComponentProps) {
  const { data: schema } = useGetSchemaTypeQuery(params.collectionId);
  const { data: item } = useGetDataObjectQuery({
    itemType: params.collectionId,
    id: params.documentId,
  });

  if (!schema || !item) return null;

  return (
    <div className="flex flex-1 overflow-auto h-full p-4 gap-4">
      <div className="flex flex-col flex-1 gap-8">
        <ItemForm
          itemType={params.collectionId}
          fields={schema.fields}
          data={item}
        />
      </div>
    </div>
  );
}
