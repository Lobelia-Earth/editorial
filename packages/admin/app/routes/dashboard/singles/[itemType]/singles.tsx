import {
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import type { Route } from "./+types/singles";
import ItemForm from "./itemForm";

export default function Singleton({ params }: Route.ComponentProps) {
  const { data: schema, isFetching: isSchemaFetching } = useGetSchemaTypeQuery(
    params.itemType
  );
  const { data: item, isFetching: isItemFetching } = useGetDataObjectQuery({
    itemType: params.itemType,
    id: "default",
  });

  if (isSchemaFetching || isItemFetching || !schema || !item) {
    return null;
  }

  return (
    <div className="flex flex-1 p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <ItemForm
          key={params.itemType}
          itemType={params.itemType}
          fields={schema.fields}
          data={item}
        />
      </div>
    </div>
  );
}
