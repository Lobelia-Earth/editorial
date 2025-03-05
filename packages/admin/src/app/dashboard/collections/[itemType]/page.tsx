import CollectionsList from './collectionsList';

export interface CollectionsListPageProps {
  params: Promise<{ itemType: string }>;
}

export default async function CollectionsListPage({
  params,
}: CollectionsListPageProps) {
  const { itemType } = await params;

  return <CollectionsList itemType={itemType} />;
}
