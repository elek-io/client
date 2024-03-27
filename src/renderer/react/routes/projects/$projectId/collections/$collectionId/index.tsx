import { formatTimestamp } from '@elek-io/ui';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Plus, Settings } from 'lucide-react';
import { ReactElement } from 'react';
import { Button } from '../../../../../components/ui/button';
import { Page } from '../../../../../components/ui/page';

export const Route = createFileRoute(
  '/projects/$projectId/collections/$collectionId/'
)({
  component: ProjectCollectionIndexPage,
});

function ProjectCollectionIndexPage() {
  const router = useRouter();
  const context = Route.useRouteContext();
  const addNotification = context.store((state) => state.addNotification);

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

  function onEntryClicked(id: string, language: string) {
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
      {/* <p>Collection: {JSON.stringify(context.currentCollection, undefined, 2)}</p>
      <p>
        Collection Items:{' '}
        {JSON.stringify(context.currentCollectionItems, undefined, 2)}
      </p> */}
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th
              scope="col"
              className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
            >
              <a href="#" className="group inline-flex">
                Item
                <span className="invisible ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </a>
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
            >
              <a href="#" className="group inline-flex">
                Created
                <span className="ml-2 flex-none rounded bg-gray-200 text-gray-900 group-hover:bg-gray-300">
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </a>
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-0"
            >
              <a href="#" className="group inline-flex">
                Updated
                <span className="invisible ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                  <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </a>
            </th>
          </tr>
        </thead>
        <tbody className="-mx-4 divide-y divide-gray-200">
          {context.currentEntries?.list.length !== 0 ? (
            context.currentEntries?.list.map((entry, entryIndex) => {
              const createdTime = formatTimestamp(
                entry.created,
                context.currentUser.locale.id
              );
              const updatedTime = formatTimestamp(
                entry.updated,
                context.currentUser.locale.id
              );

              return (
                <tr
                  key={entry.id}
                  className={
                    entryIndex % 2 === 0
                      ? 'hover:bg-brand-50 hover:cursor-pointer'
                      : 'bg-gray-50 hover:bg-brand-50 hover:cursor-pointer'
                  }
                  onClick={() => onEntryClicked(entry.id, entry.language)}
                >
                  <td className="whitespace-nowrap px-3 py-4 text-sm sm:pl-0 text-gray-500">
                    {JSON.stringify(entry.valueReferences)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                    {createdTime.relative}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right sm:pr-0 text-gray-500">
                    {updatedTime.relative}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={3}
                className="whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500"
              >
                {`No ${context.translate(
                  'currentCollection.name.plural',
                  context.currentCollection.name.plural
                )} found`}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Page>
  );
}
