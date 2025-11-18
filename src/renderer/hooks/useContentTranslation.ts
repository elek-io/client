import { createContext, useContext } from 'react';

import type { TranslatableString } from '@elek-io/core';

interface ContentTranslationContextValue {
  translate: (props: { key: string; record: TranslatableString }) => string;
  isLoading: boolean;
}

export const ContentTranslationContext =
  createContext<ContentTranslationContextValue | null>(null);

export function useContentTranslation(): (props: {
  key: string;
  record: TranslatableString;
}) => string {
  const context = useContext(ContentTranslationContext);

  if (!context) {
    throw new Error(
      'useContentTranslation must be used within ContentTranslationProvider'
    );
  }

  return context.translate;
}
