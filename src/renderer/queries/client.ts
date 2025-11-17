import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import z from 'zod';

import { objectTypeSchema } from '@elek-io/core';

const logableMutationMetaSchema = z.object({
  method: z.enum(['create', 'update', 'delete', 'clone']),
  objectType: objectTypeSchema,
});

/**
 * Tanstack Query instance with agressive caching and
 * automatic display of a toast notification whenever a mutation succeeds or fails
 *
 * The display of a notification depends on the availability of the meta object with
 * method and objectType keys, which needs to be set on all mutationOptions inside
 * the `./options.ts` file.
 *
 * Additionally it logs all mutations with Core to enable full E2E debugging.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
    mutations: {
      onSuccess: (data, variables, result, context) => {
        const logableMutationMeta = logableMutationMetaSchema.safeParse(
          context.meta
        );

        if (logableMutationMeta.success) {
          toast.success(
            `${logableMutationMeta.data.method} ${logableMutationMeta.data.objectType}`
          );

          window.ipc.core.logger.info({
            source: 'desktop',
            message: `Successfully ${logableMutationMeta.data.method}ed ${logableMutationMeta.data.objectType}`,
            meta: {
              ...logableMutationMeta.data,
            },
          });
        } else {
          window.ipc.core.logger.error({
            source: 'desktop',
            message: 'Detected mutation without meta',
            meta: {
              data,
              variables,
              result,
              context,
            },
          });
        }
      },
      onError: (error, variables, result, context) => {
        const logableMutationMeta = logableMutationMetaSchema.safeParse(
          context.meta
        );

        if (logableMutationMeta.success) {
          toast.error(
            `${logableMutationMeta.data.method} ${logableMutationMeta.data.objectType}`
          );

          window.ipc.core.logger.error({
            source: 'desktop',
            message: `Failed to ${logableMutationMeta.data.method} ${logableMutationMeta.data.objectType}`,
            meta: {
              ...logableMutationMeta.data,
            },
          });
        } else {
          window.ipc.core.logger.error({
            source: 'desktop',
            message: 'Detected mutation without meta',
            meta: {
              error,
              variables,
              result,
              context,
            },
          });
        }
      },
    },
  },
});
