import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import React from 'react';

import { UserContext } from '@renderer/hooks/useUser';
import { importedLocales } from '@renderer/lib/utils';
import queryOptions from '@renderer/queries/options';

export interface FormatDatetimeProps {
  datetime: string | null | undefined;
}

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const userQuery = useQuery(queryOptions.user.get());

  /**
   * Formats given datetime string to be human readable
   * and be in the user selected locale
   */
  const formatDatetime = React.useCallback(
    ({ datetime }: FormatDatetimeProps) => {
      if (
        datetime === null ||
        datetime === undefined ||
        userQuery.data === null ||
        userQuery.data === undefined
      ) {
        // e.g. in case of a file not being updated yet
        // or the user data not being loaded yet, show a dash
        return {
          relative: '-',
          absolute: '-',
        };
      }

      return {
        relative: formatDistanceToNow(datetime, {
          addSuffix: true,
          locale: importedLocales[userQuery.data.language],
        }),
        absolute: format(datetime, 'Pp', {
          locale: importedLocales[userQuery.data.language],
        }),
      };
    },
    [userQuery.data]
  );

  return (
    <UserContext.Provider
      value={{
        userQuery,
        formatDatetime,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
