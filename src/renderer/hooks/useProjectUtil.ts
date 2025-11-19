import {
  type FormatDatetimeProps,
  type TranslateContentProps,
} from '@root/src/renderer/providers/ProjectUtilProvider';
import { createContext, useContext } from 'react';

interface ProjectUtilContextValue {
  formatDatetime: (props: FormatDatetimeProps) => {
    relative: string;
    absolute: string;
  };
  translateContent: (props: TranslateContentProps) => string;
  isLoading: boolean;
}

export const ProjectUtilContext = createContext<ProjectUtilContextValue | null>(
  null
);

export function useProjectUtil(): ProjectUtilContextValue {
  const context = useContext(ProjectUtilContext);

  if (!context) {
    throw new Error('useProjectUtil must be used within ProjectUtilProvider');
  }

  return {
    formatDatetime: context.formatDatetime,
    translateContent: context.translateContent,
    isLoading: context.isLoading,
  };
}
