import type { UseQueryResult } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import type { UserContextValue } from '@renderer/hooks/useUser';
import { type TranslateContentProps } from '@renderer/providers/ProjectProvider';

import type { Project } from '@elek-io/core';

export type ProjectContextValue = UserContextValue & {
  projectId: string;
  projectQuery: UseQueryResult<Project>;
  translateContent: (props: TranslateContentProps) => string;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }

  return context;
}
