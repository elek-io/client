import { useMatches } from '@tanstack/react-router';
import React, { useCallback, useMemo, useState } from 'react';

import { BreadcrumbContext } from '@renderer/hooks/useBreadcrumb';

export interface Breadcrumb {
  label: string;
  path: string;
}

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [breadcrumbMap, setBreadcrumbMap] = useState<Map<string, Breadcrumb>>(
    new Map()
  );
  const matches = useMatches();

  const breadcrumbs = useMemo(() => {
    return matches
      .map((match) => {
        const crumb = breadcrumbMap.get(match.pathname);
        if (crumb === undefined) return null;

        return crumb;
      })
      .filter((crumb): crumb is Breadcrumb => crumb !== null);
  }, [matches, breadcrumbMap]);

  const setBreadcrumb = useCallback((path: string, label: string) => {
    setBreadcrumbMap((prev) => {
      const next = new Map(prev);
      next.set(path, { path, label });
      return next;
    });
  }, []);

  const clearBreadcrumb = useCallback((path: string) => {
    setBreadcrumbMap((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumbs, setBreadcrumb, clearBreadcrumb }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}
