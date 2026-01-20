'use client';

import { useUserRole } from './use-user-role';

export function useIsAdmin() {
  const { role, isLoading } = useUserRole();
  const isAdmin = role === 'admin';

  return { isAdmin, isLoading };
}
