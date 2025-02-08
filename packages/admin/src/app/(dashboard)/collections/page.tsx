'use client';

import { useGetSchemaQuery } from '@/lib/store/editorialApi';
import SchemaTable from './schemaTable';

export default function CollectionsPage() {
  const { data: schema } = useGetSchemaQuery();

  if (!schema) return null;

  return (
    <div className="flex flex-1 h-full p-4 gap-4">
      <div className="flex flex-col overflow-hidden flex-1 gap-8">
        {Object.entries(schema)
          .filter(([, value]) => !value.singleton)
          .map(([key, value]) => (
            <div key={key} className="flex flex-col gap-4 last:mb-20">
              <h2
                className="scroll-mt-[4.5rem] text-xl font-semibold leading-none capitalize"
                id={value.displayName}
              >
                {value.displayName}
              </h2>
              <SchemaTable itemType={key} />
            </div>
          ))}
      </div>
    </div>
  );
}
