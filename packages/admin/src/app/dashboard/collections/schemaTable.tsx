'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeleteObjectMutation,
  useGetDataQuery,
  useGetSchemaTypeQuery,
} from '@/lib/store/slices/editorialApi';
import { cn } from '@/lib/utils';
import type { EditorialDataObject } from '@isardsat/editorial-common';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Circle, CircleCheck, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const columnHelper = createColumnHelper<EditorialDataObject>();

export const baseColumns = [
  columnHelper.accessor('id', {
    header() {
      return <span className="block w-48 max-w-48">ID</span>;
    },
    cell(props) {
      const content = props.getValue();

      return (
        <span
          title={content}
          className="block overflow-hidden text-ellipsis w-48 max-w-48 whitespace-nowrap"
        >
          {content}
        </span>
      );
    },
  }),
];

export interface SchemaTableProps {
  itemType: string;
}

export default function SchemaTable({ itemType }: SchemaTableProps) {
  const { push } = useRouter();

  const { data: schema } = useGetSchemaTypeQuery(itemType);
  const { data } = useGetDataQuery();

  const [trigger] = useDeleteObjectMutation();

  const actionColumn = useMemo(() => {
    return columnHelper.display({
      id: 'actions',
      header: () => <span className="flex justify-end ml-auto">Actions</span>,
      cell(props) {
        return (
          <div className="flex gap-2 justify-end">
            <button
              className="hover:text-red-500 p-1 hover:bg-muted rounded-sm"
              onClick={(event) => {
                event.stopPropagation();

                trigger({
                  type: itemType,
                  id: props.row.original.id,
                });
              }}
            >
              <Trash size={16} className="group-hover:text-red-400" />
              <span className="sr-only">Delete entry</span>
            </button>

            {/* <Button size="icon" variant="ghost" disabled className="group">
              <Ellipsis className="group-hover:text-red-400" />
              <span className="sr-only">Delete entry</span>
            </Button> */}
          </div>
        );
      },
    });
  }, [itemType, trigger]);

  const columns = useMemo(() => {
    if (!schema) return baseColumns;

    const fields = Object.entries(schema.fields);

    return [
      ...baseColumns,
      ...fields
        .filter(([, value]) => value.showInSummary)
        .map(([key, value]) =>
          columnHelper.accessor((row) => row[key], {
            id: key,
            header: value.displayName,
            cell(props) {
              switch (value.type) {
                case 'boolean':
                  return props.getValue() ? (
                    <CircleCheck className="text-green-600 mx-auto" size={14} />
                  ) : (
                    <Circle className="text-gray-300 mx-auto" size={14} />
                  );

                case 'date':
                  const date = new Date(props.getValue() as string);

                  return (
                    <span className="text-nowrap">
                      {date.toLocaleDateString()}
                    </span>
                  );
                case 'markdown':
                case 'string':
                  const content = props.getValue() as string;

                  return (
                    <span
                      title={content}
                      className="block w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {content}
                    </span>
                  );
                default:
                  break;
              }

              return props.getValue();
            },
          })
        ),
      actionColumn,
    ];
  }, [actionColumn, schema]);

  const schemaEntries = useMemo(
    () => (data ? Object.values(data[itemType]) : []),
    [itemType, data]
  );

  const table = useReactTable({
    data: schemaEntries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!schema || !data) return null;

  return (
    <div className="rounded-sm border overflow-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="cursor-pointer"
              onClick={() =>
                push(`/collections/${itemType}/${row.original.id}`)
              }
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn('h-10', {
                    'w-full': index == columns.length - 1,
                  })}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
              {/* <TableCell className="p-0 w-0" /> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
