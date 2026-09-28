'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Campo de senha com botão de mostrar/ocultar. Digitar senha às cegas é a
 * maior fonte de erro em cadastro e login, ainda mais no celular.
 */
export default function CampoSenha({
  name,
  required = false,
  minLength,
  placeholder,
  autoComplete,
  id,
}: {
  name: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        name={name}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input pr-10"
      />
      <button
        type="button"
        onClick={() => setVisivel(v => !v)}
        title={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visivel}
        // tabIndex -1: não atrapalha quem navega pelo teclado entre os campos
        tabIndex={-1}
        className="absolute inset-y-0 right-0 px-3 flex items-center
                   text-slate-muted hover:text-navy-700 transition-colors"
      >
        {visivel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
