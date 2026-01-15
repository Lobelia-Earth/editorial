import { Input } from "@/components/ui/input";
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
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  CalendarIcon,
  Circle,
  CircleCheck,
  CircleCheckIcon,
  CircleIcon,
  ExternalLink,
  FileImageIcon,
  LetterTextIcon,
  ListIcon,
  Trash,
} from "lucide-react";

import React, { useMemo, useState, type FunctionComponent } from "react";
import { Link } from "react-router";

const TypeIconMap: Record<string, FunctionComponent> = {
  boolean: CircleCheckIcon,
  date: CalendarIcon,
  datetime: CalendarIcon,
  markdown: LetterTextIcon,
  select: ListIcon,
  string: LetterTextIcon,
  url: ExternalLink,
};

const columnHelper = createColumnHelper<EditorialDataItem>();

export const baseColumns = [
  columnHelper.accessor("id", {
    header() {
      return (
        <span className="flex items-center w-48 max-w-48">
          <CircleIcon className="text-gray-500 h-4" /> ID
        </span>
      );
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
      return (
        <div className="flex items-center w-48 max-w-48">
          <CalendarIcon className="text-gray-500 h-4" /> Last updated
        </div>
      );
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
            header() {
              const Comp = value.isUploadedFile
                ? FileImageIcon
                : (TypeIconMap[value.type] ?? React.Fragment);

              return (
                <div className="flex items-center">
                  <Comp className="text-gray-500 h-4" />

                  {value.displayName}
                </div>
              );
            },
            cell(props) {
              const cellValue = props.getValue() as string;

              switch (value.type) {
                case "boolean":
                  const Comp = cellValue ? CircleCheck : Circle;

                  return (
                    <span className="flex justify-center items-center h-full text-nowrap">
                      <Comp
                        className={clsx(
                          "mx-auto",
                          cellValue ? "text-green-600" : "text-gray-300",
                        )}
                        size={14}
                      />
                    </span>
                  );
                case "url":
                  if (!cellValue) return "--";

                  return (
                    <Link
                      to={cellValue}
                      className="flex items-center w-48 hover:text-blue-500 overflow-hidden text-ellipsis whitespace-nowrap"
                      title={cellValue}
                    >
                      {cellValue}
                    </Link>
                  );
                case "datetime":
                  if (!cellValue) return "--";

                  return (
                    <span className="text-nowrap" title={cellValue}>
                      {new Date(cellValue).toLocaleString(undefined, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: undefined,
                      })}
                    </span>
                  );
                case "date":
                  if (!cellValue) return "--";

                  return (
                    <span className="text-nowrap" title={cellValue}>
                      {formatTime(new Date(cellValue))}
                    </span>
                  );
                case "markdown":
                case "string":
                  if (value.isUploadedFile) {
                    return (
                      <span
                        title={cellValue}
                        className="flex items-center w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        <ExternalLink className="h-4 shrink-0" /> {cellValue}
                      </span>
                    );
                  }

                  return (
                    <span
                      title={cellValue}
                      className="block w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {cellValue}
                    </span>
                  );
                default:
                  return cellValue;
              }
            },
          }),
        ),
      ...baseLastColumns,
      actionColumn,
    ];
  }, [actionColumn, schema]);

  const schemaEntries = useMemo(
    () =>
      data?.[itemType]
        ? Object.values(data[itemType]).sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
        : [],
    [itemType, data],
  );

  const table = useReactTable({
    data: schemaEntries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  if (!schema || !data) return null;

  return (
    <div className="rounded-sm border overflow-auto">
      {schema.filterBy &&
        Object.entries(schema.fields).find(
          ([key]) => key === schema.filterBy,
        ) && (
          <div className="flex items-center py-2 pl-2 ">
            <Input
              placeholder={`Filter ${schema.filterBy}...`}
              value={
                (table
                  .getColumn(schema.filterBy)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn(schema.filterBy || "")
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm rounded-sm"
            />
          </div>
        )}

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
                className={cn(
                  "grid",
                  row.original.isDraft && "bg-orange-50 hover:bg-orange-100",
                )}
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn("h-10")}>
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
