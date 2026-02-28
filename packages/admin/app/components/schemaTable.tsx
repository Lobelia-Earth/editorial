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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

import {
  useDeleteObjectMutation,
  useGetDataQuery,
  useGetSchemaTypeQuery,
} from "@/lib/store/slices/editorialApi";
import { cn, formatTime } from "@/lib/utils";
import type { EditorialDataItem } from "@isardsat/editorial-common";
import type { SortingFn } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import clsx from "clsx";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  Circle,
  CircleCheck,
  CircleCheckIcon,
  CircleIcon,
  ExternalLink,
  FileImageIcon,
  LetterTextIcon,
  ListChecksIcon,
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
  multiselect: ListChecksIcon,
  string: LetterTextIcon,
  url: ExternalLink,
};

const columnHelper = createColumnHelper<EditorialDataItem>();

const dateSortingFn: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = rowA.getValue(columnId);
  const b = rowB.getValue(columnId);

  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  return new Date(a as string).getTime() - new Date(b as string).getTime();
};

export const baseColumns = [
  columnHelper.accessor("id", {
    header() {
      return (
        <span className="flex items-center max-w-48">
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
        <div className="flex items-center max-w-48">
          <CalendarIcon className="text-gray-500 h-4" /> Last updated
        </div>
      );
    },
    sortingFn: dateSortingFn,

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
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [trigger] = useDeleteObjectMutation();

  const actionColumn = useMemo(() => {
    return columnHelper.display({
      id: "actions",
      header: () => <span className="flex justify-end ml-auto"></span>,
      cell(props) {
        return (
          <div
            className="flex gap-2 justify-end"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="hover:text-red-500 p-1 hover:bg-muted rounded-sm">
                  <Trash size={16} />
                  <span className="sr-only">Delete entry</span>
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete <i>{props.row.original.id}</i>?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this object.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    onClick={() =>
                      trigger({
                        type: itemType,
                        id: props.row.original.id,
                      })
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
      enableSorting: false,
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
            sortingFn:
              value.type === "date" || value.type === "datetime"
                ? dateSortingFn
                : "alphanumeric",

            header() {
              const Comp = value.isUploadedFile
                ? FileImageIcon
                : (TypeIconMap[value.type] ?? React.Fragment);

              return (
                <div className="flex items-center ">
                  <Comp className="text-gray-500 h-4 flex-shrink-0" />

                  {value.displayName}
                </div>
              );
            },
            cell(props) {
              const cellValue = props.getValue() as string | string[];

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
                      to={cellValue as string}
                      className="flex items-center w-48 hover:text-blue-500 overflow-hidden text-ellipsis whitespace-nowrap"
                      title={cellValue as string}
                    >
                      {cellValue}
                    </Link>
                  );
                case "datetime":
                  if (!cellValue) return "--";

                  return (
                    <span className=" text-nowrap" title={cellValue as string}>
                      {new Date(cellValue as string).toLocaleString(undefined, {
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
                    <span className="text-nowrap" title={cellValue as string}>
                      {formatTime(new Date(cellValue as string))}
                    </span>
                  );
                case "select":
                  if (!cellValue) return "--";

                  return (
                    <span
                      title={cellValue as string}
                      className="inline-flex items-center px-2 py-0.5 font-medium max-w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {cellValue}
                    </span>
                  );
                case "multiselect":
                  if (
                    !cellValue ||
                    (Array.isArray(cellValue) && cellValue.length === 0)
                  )
                    return "--";

                  const values = Array.isArray(cellValue)
                    ? cellValue
                    : [cellValue];
                  const displayText = values.join(", ");

                  return (
                    <span
                      title={displayText}
                      className="flex items-center gap-1 w-48 overflow-hidden"
                    >
                      {values.slice(0, 3).map((val, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-0.5 py-0.5 font-medium  whitespace-nowrap"
                        >
                          {val}
                        </span>
                      ))}
                      {values.length > 3 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          +{values.length - 3}
                        </span>
                      )}
                    </span>
                  );
                case "markdown":
                case "string":
                  if (value.isUploadedFile) {
                    return (
                      <span
                        title={cellValue as string}
                        className="flex items-center w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        <ExternalLink className="h-4 shrink-0" /> {cellValue}
                      </span>
                    );
                  }

                  return (
                    <span
                      title={cellValue as string}
                      className="block w-48 overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {cellValue}
                    </span>
                  );
                default:
                  return Array.isArray(cellValue)
                    ? cellValue.join(", ")
                    : cellValue;
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
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
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
                <TableHead
                  key={header.id}
                  className={clsx(
                    "bg-background transition-colors",
                    header.column.getCanSort() &&
                      "hover:bg-gray-100 cursor-default",
                  )}
                  onClick={() => {
                    console.log("sorting", header.column.getIsSorted());
                    header.column.toggleSorting(
                      header.column.getIsSorted() === "asc",
                    );
                  }}
                >
                  <div className="flex items-center w-full overflow-hidden">
                    <span
                      className="block overflow-hidden text-ellipsis whitespace-nowrap"
                      title={header.column.columnDef.header?.toString?.() ?? ""}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </span>
                    {header.column.getCanSort() &&
                      (header.column.getIsSorted() === "asc" ? (
                        <ArrowUp className="ml-2 h-4 w-4 text-foreground" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDown className="ml-2 h-4 w-4 text-foreground" />
                      ) : (
                        <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />
                      ))}
                  </div>
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
