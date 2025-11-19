import { ProjectUtilContext } from '@root/src/renderer/hooks/useProjectUtil';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import React from 'react';

import { importedLocales } from '@renderer/lib/utils';
import queryOptions from '@renderer/queries/options';

import type { TranslatableString } from '@elek-io/core';

export interface TranslateContentProps {
  key: string;
  record: TranslatableString;
}

export interface FormatDatetimeProps {
  datetime: string | null | undefined;
}

export function ProjectUtilProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { data: project, isPending: isProjectPending } = useQuery(
    queryOptions.projects.read({ id: projectId })
  );
  const { data: user, isPending: isUserPending } = useQuery(
    queryOptions.user.get()
  );

  /**
   * Returns given TranslatableString in the language of the current user
   *
   * Used to translate user defined content of Collections and Entries.
   *
   * If the current users translation is not available,
   * it shows it in the default language of the project.
   * If this is not available either, show the 'en' value.
   * If this is also not available, show the key instead along with a note,
   * that a translation should be added.
   */
  const translateContent = React.useCallback(
    ({ key, record }: TranslateContentProps) => {
      if (user !== undefined && user !== null) {
        const toUserLanguage = record[user.language];
        if (toUserLanguage !== undefined) {
          return toUserLanguage;
        }
      }

      if (project !== undefined) {
        const toProjectsDefaultLanguage =
          record[project.settings.language.default];
        if (toProjectsDefaultLanguage !== undefined) {
          return toProjectsDefaultLanguage;
        }
      }

      const toEnglish = record['en'];
      if (toEnglish !== undefined) {
        return toEnglish;
      }

      return key;
    },
    [user, project]
  );

  /**
   * Formats given datetime string to be human readable
   * and be in the user selected locale
   */
  const formatDatetime = React.useCallback(
    ({ datetime }: FormatDatetimeProps) => {
      if (
        datetime === null ||
        datetime === undefined ||
        user === null ||
        user === undefined
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
          locale: importedLocales[user.language],
        }),
        absolute: format(datetime, 'Pp', {
          locale: importedLocales[user.language],
        }),
      };
    },
    [user]
  );

  return (
    <ProjectUtilContext.Provider
      value={{
        translateContent,
        formatDatetime,
        isLoading: isProjectPending || isUserPending,
      }}
    >
      {children}
    </ProjectUtilContext.Provider>
  );
}
