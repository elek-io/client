import { formatTimestamp } from '@/util';
import { Entry } from '@elek-io/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Settings } from 'lucide-react';
import { ReactElement, useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import { Page } from '../../../../../components/ui/page';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../../../../components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../../components/ui/table';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/'
)({
  component: ProjectCollectionIndexPage,
});

function ProjectCollectionIndexPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);
  const [pagination, setPagination] = useState({
    pageIndex: 0, // initial page index
    pageSize: 15, // default page size
  });
  const dataQuery = useQuery({
    queryKey: ['data', pagination],
    queryFn: () =>
      context.core.entries.list({
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
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
          language: entry.language,
          created: formatTimestamp(entry.created, context.currentUser.locale.id)
            .relative,
          updated: formatTimestamp(entry.updated, context.currentUser.locale.id)
            .relative,
        };

        entry.values.map((value) => {
          row[value.definitionId] = value.content;
        });
        return row;
      }) ?? [],
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: dataQuery.data?.total,
    onPaginationChange: setPagination, // update the pagination state when internal APIs mutate the pagination state
    state: {
      pagination,
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

  function columns() {
    const columns: ColumnDef<Entry>[] =
      context.currentCollection.valueDefinitions.map((definition) => {
        return {
          accessorKey: definition.id,
          header: context.translate('definition.name', definition.name),
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

  function onRowClicked(id: string, language: string) {
    router.navigate({
      to: '/projects/$projectId/collections/$collectionId/$entryId/$entryLanguage',
      params: {
        projectId: context.currentProject.id,
        collectionId: context.currentCollection.id,
        entryId: id,
        entryLanguage: language,
      },
    });
  }

  return (
    <Page
      title={Title()}
      description={<Description></Description>}
      actions={<Actions></Actions>}
      layout="overlap-card-no-space"
    >
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
                onClick={() =>
                  onRowClicked(row.original.id, row.original.language)
                }
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
            .rows.length.toLocaleString(context.currentUser.locale.id)}{' '}
          of {table.getRowCount().toLocaleString(context.currentUser.locale.id)}{' '}
          total{' '}
          {context.translate(
            'currentCollection.name.plural',
            context.currentCollection.name.plural
          )}{' '}
          (
          {table
            .getFilteredSelectedRowModel()
            .rows.length.toLocaleString(context.currentUser.locale.id)}{' '}
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
