import CollectionItem from './collectionItem';

export interface CollectionItemPageProps {
  params: Promise<{ itemType: string; id: string }>;
}

export default async function CollectionItemPage({
  params,
}: CollectionItemPageProps) {
  const { itemType, id } = await params;

  return (
    <div className="flex flex-1 p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <CollectionItem itemType={itemType} id={id} />
      </div>
    </div>
  );
}
