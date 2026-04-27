'use client';

import { useTransition } from 'react';
import { atribuirResponsavel } from './actions';
import type { User } from '@/lib/types';

export default function ResponsavelSelect({
  solicitacaoId,
  responsavelAtual,
  users,
}: {
  solicitacaoId: number;
  responsavelAtual: number | null;
  users: User[];
}) {
  const [pending, start] = useTransition();

  return (
    <select
      defaultValue={responsavelAtual ?? ''}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.append('responsavel_id', e.target.value);
        start(async () => {
          await atribuirResponsavel(solicitacaoId, fd);
        });
      }}
      className="input !text-xs !py-1 !px-2 w-44"
    >
      <option value="">— Sem responsável —</option>
      {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
    </select>
  );
}
