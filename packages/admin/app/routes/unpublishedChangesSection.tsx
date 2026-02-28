import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetDataDiffQuery,
  useGetSchemaQuery,
} from "@/lib/store/slices/editorialApi";
import { cn, formatTime, statusColors } from "@/lib/utils";
import { type EditorialDataItemStatus } from "@isardsat/editorial-common";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router";

type UnpublishedItem = {
  id: string;
  type: string;
  status: EditorialDataItemStatus;
  updatedAt?: string;
};

const columnHelper = createColumnHelper<UnpublishedItem>();

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
  columnHelper.accessor("type", {
    header: "Type",
    cell(props) {
      return <span className="capitalize">{props.getValue()}</span>;
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell(props) {
      const status = props.getValue();

      return (
        <Badge className={cn("capitalize", statusColors[status])}>
          {status}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell(props) {
      const value = props.getValue();
      return value ? formatTime(new Date(value)) : "-";
    },
  }),
];

export default function UnpublishedChangesSection() {
  const { data: diffData } = useGetDataDiffQuery();
  const { data: schema } = useGetSchemaQuery();

  const flatData = useMemo(() => {
    if (!diffData || !schema) return [];

    const items: UnpublishedItem[] = [];

    // Process collections
    for (const [type, collection] of Object.entries(diffData.collections)) {
      for (const added of collection.added) {
        items.push({
          id: added.id,
          type,
          status: "added",
          updatedAt: added.updatedAt,
        });
      }

      for (const modified of collection.modified) {
        items.push({
          id: modified.id,
          type,
          status: "modified",
          updatedAt: modified.updatedAt,
        });
      }

      for (const deleted of collection.deleted) {
        items.push({
          id: deleted.id,
          type,
          status: "deleted",
          updatedAt: undefined,
        });
      }
    }

    // Process singles
    for (const [type, single] of Object.entries(diffData.singles)) {
      items.push({
        id: single.preview?.id || single.production?.id || type,
        type,
        status: single.status,
        updatedAt: single.updatedAt,
      });
    }

    // Sort by updatedAt (most recent first)
    return items.toSorted((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return a.updatedAt > b.updatedAt ? -1 : 1;
    });
  }, [diffData, schema]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (table.getRowCount() === 0) {
    return null;
  }

  const renderRow = (
    row: (typeof table.getRowModel.arguments.rows)[number],
  ) => {
    const isDeleted = row.original.status === "deleted";

    const rowContent = (
      <TableRow
        key={row.id}
        className={cn("grid")}
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))`,
        }}
      >
        {row.getVisibleCells().map((cell: any) => (
          <TableCell key={cell.id} className={cn("p-2")}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );

    if (isDeleted) {
      return (
        <div key={`${row.original.type}-${row.original.id}`}>{rowContent}</div>
      );
    }

    return (
      <Link
        key={`${row.original.type}-${row.original.id}`}
        to={`/admin/dashboard/${row.original.type}/${row.original.id}`}
      >
        {rowContent}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-4 last:mb-20">
      <h2 className="scroll-mt-[4.5rem] text-xl font-semibold leading-none capitalize">
        Unpublished Changes
      </h2>
      <div className="rounded-sm border overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(150px, 1fr))`,
                }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
          <TableBody>{table.getRowModel().rows.map(renderRow)}</TableBody>
        </Table>
      </div>
    </div>
  );
}
