import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetDataQuery,
  useGetSchemaQuery,
} from "@/lib/store/slices/editorialApi";
import { cn, formatTime } from "@/lib/utils";
import type { EditorialDataItem } from "@isardsat/editorial-common";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { Link } from "react-router";

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
    header: "Created",
    cell(props) {
      return formatTime(new Date(props.getValue()));
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: "Updated",
    cell(props) {
      return formatTime(new Date(props.getValue()));
    },
  }),
];

export default function DraftsSection() {
  const { data } = useGetDataQuery();
  const { data: schema } = useGetSchemaQuery();

  const flatData = useMemo(() => {
    if (!data || !schema) return [];

    const items = Object.entries(data).reduce((acc, [type, item]) => {
      return acc.concat(
        Object.values(item)
          .filter((item) => item.isDraft)
          .map((i) => ({ ...i, type })),
      );
    }, [] as RecentDataObject[]);

    const sortedItems = items.toSorted((a, b) => {
      return a.updatedAt > b.updatedAt ? -1 : 1;
    });

    return sortedItems.slice(0, 6);
  }, [data, schema]);

  const table = useReactTable({
    data: flatData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (table.getRowCount() === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 last:mb-20">
      <h2 className="scroll-mt-[4.5rem] text-xl font-semibold leading-none capitalize">
        Drafts
      </h2>

      <div className="rounded-sm border overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
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
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <Link
                key={row.original.id}
                to={`/admin/dashboard/${row.original.type}/${row.original.id}`}
              >
                <TableRow
                  key={row.id}
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(200px, 1fr))`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("p-2")}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                  {/* <TableCell className="p-0 w-0" /> */}
                </TableRow>
              </Link>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
