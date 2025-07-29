"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useDeleteObjectMutation,
  useGetDataQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import { cn, formatTime } from "@/lib/utils";
import type { EditorialDataItem } from "@isardsat/editorial-common";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Circle, CircleCheck, Trash } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

const columnHelper = createColumnHelper<EditorialDataItem>();

export const baseColumns = [
  columnHelper.accessor("id", {
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

export const baseLastColumns = [
  columnHelper.accessor("updatedAt", {
    header() {
      return <span>Last updated</span>;
    },
    cell(props) {
      return formatTime(new Date(props.getValue()));
    },
  }),
];

export interface SchemaTableProps {
  itemType: string;
}

export default function SchemaTable({ itemType }: SchemaTableProps) {
  const { data: schema } = useGetSchemaTypeQuery(itemType);
  const { data } = useGetDataQuery();

  const [trigger] = useDeleteObjectMutation();

  const actionColumn = useMemo(() => {
    return columnHelper.display({
      id: "actions",
      header: () => <span className="flex justify-end ml-auto"></span>,
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

            {/* <button
              className="hover:text-red-500 p-1 hover:bg-muted rounded-sm"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <Ellipsis className="group-hover:text-red-400" />
              <span className="sr-only">Delete entry</span>
            </button> */}
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
                case "boolean":
                  const Comp = props.getValue() ? CircleCheck : Circle;

                  return (
                    <span className="flex justify-center items-center h-full text-nowrap">
                      <Comp
                        className={clsx(
                          "mx-auto",
                          props.getValue() ? "text-green-600" : "text-gray-300",
                        )}
                        size={14}
                      />
                    </span>
                  );
                case "date":
                  const value = props.getValue();

                  if (!value) return "--";

                  return (
                    <span className="text-nowrap">
                      {formatTime(new Date(value as string))}
                    </span>
                  );
                case "markdown":
                case "string":
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
                  return props.getValue();
              }
            },
          }),
        ),
      ...baseLastColumns,
      actionColumn,
    ];
  }, [actionColumn, schema]);

  const schemaEntries = useMemo(
    () => (data?.[itemType] ? Object.values(data[itemType]) : []),
    [itemType, data],
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
        <TableHeader className="sticky top-0 z-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
              }}
              key={headerGroup.id}
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="bg-background">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <Link
              to={`/admin/dashboard/${itemType}/${row.original.id}`}
              key={row.id}
            >
              <TableRow
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
                }}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableCell
                    key={cell.id}
                    className={cn("h-10", {
                      "w-full": index == columns.length - 1,
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            </Link>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
