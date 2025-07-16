import { Button } from "@/components/ui/button";
import { useGetSchemaTypeQuery } from "@/lib/store/slices/editorialApi";
import { Plus } from "lucide-react";
import { Link } from "react-router";
import SchemaTable from "../components/schemaTable";
import type { Route } from "./+types/dashboard.$collection";

export default function CollectionsList({ params }: Route.ComponentProps) {
  const { collectionId } = params;

  const { data: schema, isFetching: isSchemaFetching } =
    useGetSchemaTypeQuery(collectionId);

  if (isSchemaFetching || !schema) return null;

  return (
    <div className="overflow-hidden flex flex-1 p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        <div className="flex flex-col h-full gap-4 last:mb-20">
          <div className="flex items-center">
            <h2
              className="scroll-mt-[4.5rem] text-xl font-semibold leading-none capitalize"
              id={schema.displayName}
            >
              {schema.displayName}
            </h2>

            <Button asChild variant="default" size="sm" className="ml-auto">
              <Link to={`/admin/dashboard/${collectionId}/new`}>
                <Plus />
                Create
              </Link>
            </Button>
          </div>

          <SchemaTable key={collectionId} itemType={collectionId} />
        </div>
      </div>
    </div>
  );
}
