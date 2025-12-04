import React from 'react';

import { ProjectContext } from '@renderer/hooks/useProject';
import { useQueryNoError } from '@renderer/hooks/useQueryNoError';
import { useUser } from '@renderer/hooks/useUser';
import queryOptions from '@renderer/queries/options';

import type { TranslatableString } from '@elek-io/core';

export interface TranslateContentProps {
  key: string;
  record: TranslatableString;
}

export function ProjectProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const { userQuery, formatDatetime } = useUser();
  const projectQuery = useQueryNoError(
    queryOptions.projects.read({ id: projectId })
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
      if (userQuery.isPending === false && userQuery.data !== null) {
        const toUserLanguage = record[userQuery.data.language];
        if (toUserLanguage !== undefined) {
          return toUserLanguage;
        }
      }

      if (projectQuery.isPending === false) {
        const toProjectsDefaultLanguage =
          record[projectQuery.data.settings.language.default];
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
    [userQuery, projectQuery]
  );

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        userQuery,
        projectQuery,
        formatDatetime,
        translateContent,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
