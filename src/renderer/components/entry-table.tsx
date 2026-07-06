import { useRouter } from '@tanstack/react-router';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Input } from '@renderer/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@renderer/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@renderer/components/ui/table';
import { useProject } from '@renderer/hooks/useProject';

import {
  extractText,
  flattenFieldDefinitions,
  type Collection,
  type Entry,
  type PaginatedList,
  type Project,
} from '@elek-io/core';

// A table row: the fixed columns plus one loosely typed cell per field slug.
type EntryRow = {
  id: string;
  created: string;
  updated: string;
} & Record<string, unknown>;

export function EntryTable({
  project,
  collection,
  entries,
}: {
  project: Project;
  collection: Collection;
  entries: PaginatedList<Entry>;
}): React.JSX.Element {
  const router = useRouter();
  const { formatDatetime, translateContent } = useProject();
  const [filter, setFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0, // initial page index
    pageSize: 10, // default page size
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  function columns(): ColumnDef<EntryRow>[] {
    const columns: ColumnDef<EntryRow>[] = flattenFieldDefinitions(
      collection.fieldDefinitions
    ).map((definition) => {
      return {
        accessorKey: definition.slug,
        header: translateContent({
          key: 'definition.label',
          record: definition.label,
        }),
      };
    });

    columns.push(
      {
        accessorKey: 'created',
        header: 'Created',
      },
      {
        accessorKey: 'updated',
        header: 'Updated',
      }
      // {
      //   id: 'actions',
      //   header: 'Actions',
      //   cell: ({ row }) => {
      //     return <Button>Test</Button>;
      //   },
      // }
    );

    return columns;
  }
  const fieldTypeBySlug = new Map(
    flattenFieldDefinitions(collection.fieldDefinitions).map((definition) => [
      definition.slug,
      definition.fieldType,
    ])
  );
  const table = useReactTable({
    data: entries.list.map((entry) => {
      const row: EntryRow = {
        id: entry.id,
        created: formatDatetime({ datetime: entry.created }).relative,
        updated: formatDatetime({ datetime: entry.updated }).relative,
      };

      for (const [slug, value] of Object.entries(entry.values)) {
        if (value.valueType === 'reference') {
          // Reference content is an array of { id, objectType } objects,
          // which cannot be rendered directly - show a count instead
          const references =
            value.content[project.settings.language.default] ?? [];
          const fieldType = fieldTypeBySlug.get(slug);
          const noun =
            fieldType === 'asset'
              ? references.length === 1
                ? 'Asset'
                : 'Assets'
              : fieldType === 'entry'
                ? references.length === 1
                  ? 'Entry'
                  : 'Entries'
                : references.length === 1
                  ? 'Reference'
                  : 'References';
          row[slug] =
            references.length === 0
              ? undefined
              : `${String(references.length)} ${noun}`;
        } else if (value.valueType === 'mdast') {
          // Structured markdown content - show its plain text
          const tree = value.content[project.settings.language.default];
          row[slug] =
            tree === null || tree === undefined ? undefined : extractText(tree);
        } else {
          // Content is a per-language record for translatable values; index it by
          // the default language.
          row[slug] = (value.content as Record<string, unknown>)[
            project.settings.language.default
          ];
        }
      }

      return row;
    }),
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: entries.total,
    onPaginationChange: setPagination, // update the pagination state when internal APIs mutate the pagination state
    onColumnVisibilityChange: setColumnVisibility,
    // getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      columnVisibility,
      // globalFilter: columnFilter,
      // columnFilters: columnFilter,
    },
  });

  async function onRowClicked(id: string): Promise<void> {
    await router.navigate({
      to: '/projects/$projectId/collections/$collectionId/$entryId/update',
      params: {
        projectId: project.id,
        collectionId: collection.id,
        entryId: id,
      },
    });
  }

  return (
    <>
      <div className="flex items-center justify-end p-6">
        <Input
          placeholder={`Filter ${translateContent({
            key: 'currentCollection.name.plural',
            record: collection.name.plural,
          })}...`}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Visible Values
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={async () => onRowClicked(row.original.id)}
                className="hover:cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-end p-6">
        <div className="flex-1 text-sm text-zinc-400">
          Showing {table.getFilteredRowModel().rows.length} of{' '}
          {table.getRowCount()} total{' '}
          {translateContent({
            key: 'currentCollection.name.plural',
            record: collection.name.plural,
          })}{' '}
          ({table.getFilteredSelectedRowModel().rows.length} selected)
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={table.getCanPreviousPage() === false}
              />
            </PaginationItem>

            {Array.from({ length: table.getPageCount() }).map(
              (_value, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <PaginationItem key={index + 1}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(index)}
                    isActive={pagination.pageIndex === index}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            {/* <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem> */}
            <PaginationItem>
              <PaginationNext
                onClick={() => table.nextPage()}
                disabled={table.getCanNextPage() === false}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}

export function EntryTableSkeleton(): React.JSX.Element {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-1/4 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-10 w-full rounded bg-zinc-200 dark:bg-zinc-700"
          />
        ))}
      </div>
    </div>
  );
}
