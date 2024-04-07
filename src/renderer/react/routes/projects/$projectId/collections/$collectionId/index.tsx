import { formatTimestamp } from '@/util';
import { Entry } from '@elek-io/shared';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Settings } from 'lucide-react';
import { ReactElement } from 'react';
import { Button } from '../../../../../components/ui/button';
import { Page } from '../../../../../components/ui/page';
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
  const table = useReactTable({
    data: data(),
    columns: columns(),
    getCoreRowModel: getCoreRowModel(),
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
          {`Create new ${context.translate(
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

  function data() {
    const rows = context.currentEntries.list.map((entry) => {
      const row: { [x: string]: string } = {
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
    });

    return rows;
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Page>
  );
}
