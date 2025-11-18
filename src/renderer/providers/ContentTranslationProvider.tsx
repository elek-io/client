import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { ContentTranslationContext } from '@renderer/hooks/useContentTranslation';
import queryOptions from '@renderer/queries/options';

import type { TranslatableString } from '@elek-io/core';

export function ContentTranslationProvider({
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

  const translate = React.useCallback(
    ({ key, record }: { key: string; record: TranslatableString }) => {
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

  return (
    <ContentTranslationContext.Provider
      value={{
        translate,
        isLoading: isProjectPending || isUserPending,
      }}
    >
      {children}
    </ContentTranslationContext.Provider>
  );
}
