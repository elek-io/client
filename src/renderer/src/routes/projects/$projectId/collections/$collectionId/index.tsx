import { Entry } from '@elek-io/core';
import { Button } from '@renderer/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import { Input } from '@renderer/components/ui/input';
import { Page } from '@renderer/components/ui/page';
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
import { useStore } from '@renderer/store';
import { formatDatetime } from '@renderer/util';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, Plus, Settings } from 'lucide-react';
import { ReactElement, useState } from 'react';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/'
)({
  component: ProjectCollectionIndexPage,
});

function ProjectCollectionIndexPage(): JSX.Element {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = useStore((state) => state.addNotification);
  const [pagination, setPagination] = useState({
    pageIndex: 0, // initial page index
    pageSize: 10, // default page size
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [filter, setFilter] = useState('');
  const dataQuery = useQuery({
    queryKey: ['entries', context.currentCollection.id, pagination, filter],
    queryFn: () =>
      context.core.entries.list({
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
        filter: filter,
        limit: pagination.pageSize,
        offset:
          pagination.pageIndex === 0
            ? 0
            : pagination.pageSize * pagination.pageIndex,
      }),
    placeholderData: keepPreviousData, // don't have 0 rows flash while changing pages/loading next page
  });
  const table = useReactTable({
    data:
      dataQuery.data?.list.map((entry) => {
        const row: { [x: string]: unknown } = {
          id: entry.id,
          created: formatDatetime(entry.created, context.currentUser.language)
            .relative,
          updated: formatDatetime(entry.updated, context.currentUser.language)
            .relative,
        };

        entry.values.map((value) => {
          row[value.definitionId] =
            value.content[context.currentProject.settings.language.default];
        });
        return row;
      }) ?? [],
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: dataQuery.data?.total,
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

  function Title(): string {
    return context.translate(
      'currentCollection.name.plural',
      context.currentCollection.name.plural
    );
  }

  function Description(): ReactElement {
    return (
      <>
        {context.translate(
          'currentCollection.description',
          context.currentCollection.description
        )}
      </>
    );
  }

  function Actions(): ReactElement {
    return (
      <>
        <Button
          onClick={() =>
            router.navigate({
              to: '/projects/$projectId/collections/$collectionId/create',
              params: {
                projectId: context.currentProject.id,
                collectionId: context.currentCollection.id,
              },
            })
          }
        >
          <Plus className="w-4 h-4 mr-2"></Plus>
          {`Create ${context.translate(
            'currentCollection.name.singular',
            context.currentCollection.name.singular
          )}`}
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            router.navigate({
              to: '/projects/$projectId/collections/$collectionId/update',
              params: {
                projectId: context.currentProject.id,
                collectionId: context.currentCollection.id,
              },
            })
          }
        >
          <Settings className="w-4 h-4 mr-2"></Settings>
          Configure
        </Button>
      </>
    );
  }

  function columns(): ColumnDef<Entry>[] {
    const columns: ColumnDef<Entry>[] =
      context.currentCollection.valueDefinitions.map((definition) => {
        return {
          accessorKey: definition.id,
          header: context.translate('definition.label', definition.label),
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

  function onRowClicked(id: string): void {
    router.navigate({
      to: '/projects/$projectId/collections/$collectionId/$entryId',
      params: {
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
        entryId: id,
      },
    });
  }

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
    >
      <div className="flex justify-end items-center p-6">
        <Input
          placeholder={`Filter ${context.translate(
            'currentCollection.name.plural',
            context.currentCollection.name.plural
          )}...`}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Visible Values
              <ChevronDown className="ml-2 h-4 w-4"></ChevronDown>
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
                    {/* @todo this is working but of the wrong type */}
                    {column.columnDef.header}
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => onRowClicked(row.original.id)}
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

      <div className="flex justify-end items-center p-6">
        <div className="flex-1 text-sm text-zinc-400">
          Showing{' '}
          {table
            .getFilteredRowModel()
            .rows.length.toLocaleString(context.currentUser.language)}{' '}
          of {table.getRowCount().toLocaleString(context.currentUser.language)}{' '}
          total{' '}
          {context.translate(
            'currentCollection.name.plural',
            context.currentCollection.name.plural
          )}{' '}
          (
          {table
            .getFilteredSelectedRowModel()
            .rows.length.toLocaleString(context.currentUser.language)}{' '}
          selected)
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              />
            </PaginationItem>

            {Array.from({ length: table.getPageCount() }).map(
              (value, index) => (
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
                disabled={!table.getCanNextPage()}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Page>
  );
}
