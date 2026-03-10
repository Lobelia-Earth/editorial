import ItemForm from "@/components/itemForm";
import {
  useGetDataDiffQuery,
  useGetDataObjectQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import type {
  EditorialDataItem,
  EditorialDataItemStatus,
} from "@isardsat/editorial-common";
import { useMemo, useState } from "react";
import type { Route } from "./+types/dashboard.$collection.$document";

export default function CollectionItemPage({ params }: Route.ComponentProps) {
  const { collectionId, documentId } = params;
  const [itemStatus, setItemStatus] = useState<
    EditorialDataItemStatus | undefined
  >(undefined);
  const { data: schema, isFetching: isSchemaFetching } =
    useGetSchemaTypeQuery(collectionId);
  const { data: item, isFetching: isDataObjectFetching } =
    useGetDataObjectQuery({
      itemType: collectionId,
      id: documentId,
    });
  const { data: diffData } = useGetDataDiffQuery();

  const changedFields = useMemo(() => {
    if (!diffData) {
      setItemStatus(undefined);
      return [];
    }

    // Check if it's a singleton
    const single = diffData.singles[collectionId];
    if (single?.changedFields) {
      setItemStatus(single.status);
      return single.changedFields;
    }

    // Check collections
    const collection = diffData.collections[collectionId];
    if (!collection) {
      setItemStatus(undefined);
      return [];
    }

    const modifiedItem = collection.modified.find((m) => m.id === documentId);
    if (modifiedItem) {
      setItemStatus("modified");
      return modifiedItem.changedFields;
    }

    if (collection.added.find((m) => m.id === documentId)) {
      setItemStatus("added");
    }
    return [];
  }, [diffData, collectionId, documentId]);

  const productionData = useMemo(() => {
    if (!diffData) return [];

    // Check if it's a singleton
    const single = diffData.singles[collectionId];
    if (single?.production) {
      return single.production;
    }

    // Check collections
    const collection = diffData.collections[collectionId];
    if (!collection) return [];

    const modifiedItem = collection.modified.find((m) => m.id === documentId);
    if (modifiedItem) {
      return modifiedItem.production;
    }
    return [];
  }, [diffData, collectionId, documentId]);

  const isFetching = isSchemaFetching || isDataObjectFetching;

  if (!schema || isFetching) return null;

  return (
    <div className="overflow-auto scrollbar-stable">
      <div className="p-4 gap-4">
        <ItemForm
          key={`${collectionId}-${documentId}`}
          itemType={collectionId}
          fields={schema.fields}
          data={item ?? undefined}
          isSingleton={schema.singleton}
          changedFields={changedFields}
          productionData={productionData as EditorialDataItem}
          itemStatus={itemStatus}
        />
      </div>
    </div>
  );
}
