import { TIPOS_SUGERIDOS } from './constantes';
import type { Parceiro } from '@/lib/types';

/** Campos do parceiro, compartilhados entre o cadastro e a edição. */
export default function ParceiroCampos({ parceiro }: { parceiro?: Parceiro }) {
  const p = parceiro;
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Nome do parceiro</label>
          <input
            name="nome"
            required
            defaultValue={p?.nome}
            className="input"
            placeholder="Ex: Lavanderia Bem Limpo"
          />
        </div>
        <div>
          <label className="label">Tipo de parceiro</label>
          <input
            name="tipo"
            list="tipos-parceiro"
            defaultValue={p?.tipo ?? ''}
            className="input"
            placeholder="Ex: Hotel / pousada"
          />
          <datalist id="tipos-parceiro">
            {TIPOS_SUGERIDOS.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Pessoa de contato</label>
          <input name="responsavel" defaultValue={p?.responsavel ?? ''} className="input" placeholder="Ex: Marcos" />
        </div>
        <div>
          <label className="label">Telefone / WhatsApp</label>
          <input name="telefone" defaultValue={p?.telefone ?? ''} className="input" placeholder="(12) 99999-0000" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" name="email" defaultValue={p?.email ?? ''} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Instagram</label>
          <input name="instagram" defaultValue={p?.instagram ?? ''} className="input" placeholder="@parceiro" />
        </div>
        <div>
          <label className="label">Cidade</label>
          <input name="cidade" defaultValue={p?.cidade ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input name="endereco" defaultValue={p?.endereco ?? ''} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={p?.status ?? 'prospeccao'} className="input">
            <option value="prospeccao">Prospecção</option>
            <option value="em_negociacao">Em negociação</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className="label">Data de ativação</label>
          <input type="date" name="data_ativacao" defaultValue={p?.data_ativacao ?? ''} className="input" />
          <p className="text-[11px] text-slate-muted mt-1">
            Se ficar em branco e o status for &quot;ativo&quot;, usamos a data de hoje.
          </p>
        </div>
        <div>
          <label className="label">Comissão (%)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            name="comissao_pct"
            defaultValue={p?.comissao_pct ?? 0}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea name="observacoes" rows={3} defaultValue={p?.observacoes ?? ''} className="input" />
      </div>
    </>
  );
}
