import NewCollectionItem from './newCollectionItem';

export interface CollectionItemPageProps {
  params: Promise<{ itemType: string; id: string }>;
}

export default async function CollectionItemPage({
  params,
}: CollectionItemPageProps) {
  const { itemType } = await params;

  return <NewCollectionItem itemType={itemType} />;
}
