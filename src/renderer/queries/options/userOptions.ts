import { queryOptions } from '@tanstack/react-query';

import { customMutationOptions } from '../util';

export const userOptions = {
  get: () =>
    queryOptions({
      queryKey: ['user'],
      queryFn: async () => {
        return await window.ipc.core.user.get();
      },
      throwOnError: true,
    }),
  set: customMutationOptions({
    mutationFn: window.ipc.core.user.set,
    meta: {
      method: 'set',
      objectType: 'user',
    },
    onSuccess: (updatedUser, _variables, _result, context) => {
      context.client.setQueryData(['user'], updatedUser);
    },
  }),
};
