"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetDataQuery } from "@/lib/store/slices/editorialApi";
import { cn } from "@/lib/utils";
import type { EditorialDataItem } from "@isardsat/editorial-common";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { useNavigate } from "react-router";

type RecentDataObject = EditorialDataItem & {
  type: string;
};

const columnHelper = createColumnHelper<RecentDataObject>();

export const columns = [
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
  columnHelper.accessor("createdAt", {
    header: "Created At",
    cell(props) {
      return new Date(props.getValue()).toLocaleString();
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated At",
    cell(props) {
      return new Date(props.getValue()).toLocaleString();
    },
  }),
];

export default function RecentActivity() {
  const navigate = useNavigate();

  const { data } = useGetDataQuery();

  const flatData = useMemo(() => {
    if (!data) return [];

    const items = Object.entries(data).reduce((acc, [type, item]) => {
      return acc.concat(Object.values(item).map((i) => ({ ...i, type })));
    }, [] as RecentDataObject[]);

    const sortedItems = items.toSorted((a, b) => {
      return a.updatedAt > b.updatedAt ? -1 : 1;
    });

    return sortedItems.slice(0, 6);
  }, [data]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
              onClick={() => {
                if (row.original.id === "default") {
                  navigate(`/dashboard/singles/${row.original.type}`);
                } else {
                  navigate(
                    `/dashboard/collections/${row.original.type}/${row.original.id}`
                  );
                }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn("p-2")}>
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
