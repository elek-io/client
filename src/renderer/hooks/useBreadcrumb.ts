import { useMatches, type AnyRoute } from '@tanstack/react-router';
import { createContext, useContext, useEffect } from 'react';

import type { Breadcrumb } from '@renderer/providers/BreadcrumbProvider';

export interface BreadcrumbContextValue {
  breadcrumbs: Breadcrumb[];
  setBreadcrumb: (path: string, label: string) => void;
  clearBreadcrumb: (path: string) => void;
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(
  null
);

export function useBreadcrumb(
  route?: AnyRoute,
  label?: string | undefined
): BreadcrumbContextValue {
  const context = useContext(BreadcrumbContext);
  const matches = useMatches();

  if (context === null) {
    throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
  }

  const { setBreadcrumb, clearBreadcrumb } = context;

  const match = route
    ? matches.find((match) => match.routeId === route.id)
    : null;
  const path = match?.pathname ?? '';

  useEffect(() => {
    if (!route || !path) return;

    if (label !== undefined && label !== '') {
      setBreadcrumb(path, label);
    }

    return () => {
      clearBreadcrumb(path);
    };
  }, [route, path, label, setBreadcrumb, clearBreadcrumb]);

  return context;
}
