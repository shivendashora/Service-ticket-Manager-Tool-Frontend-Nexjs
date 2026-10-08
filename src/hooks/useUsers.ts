'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usersApi } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

// /users is admin-only; for agents we only know about ourselves and assignees on tickets
export const useUsers = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(isAdmin);

  const fetchUsers = useCallback(
    () =>
      usersApi
        .list()
        .catch((): User[] => [])
        .then((list) => {
          setUsers(list);
          setLoading(false);
        }),
    []
  );

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const reload = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    await fetchUsers();
  }, [isAdmin, fetchUsers]);

  const byId = useMemo(() => {
    const map = new Map<number, User>(users.map((u) => [u.id, u]));
    if (user) map.set(user.id, user);
    return map;
  }, [users, user]);

  const nameOf = useCallback(
    (id: number | null | undefined) => {
      if (id === null || id === undefined) return '—';
      if (user && id === user.id) return `${user.name} (you)`;
      return byId.get(id)?.name ?? `User #${id}`;
    },
    [byId, user]
  );

  return { users, byId, nameOf, loading, reload, setUsers };
};
