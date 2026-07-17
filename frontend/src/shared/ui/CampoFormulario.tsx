import type {
  LucideIcon,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

interface CampoFormularioProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  icono: LucideIcon;
  onChange: (valor: string) => void;

  type?: "text" | "password" | "email";
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
  botonFinal?: ReactNode;
}

function CampoFormulario({
  id,
  label,
  value,
  placeholder,
  icono: Icono,
  onChange,
  type = "text",
  autoComplete,
  error,
  disabled = false,
  botonFinal,
}: CampoFormularioProps) {
  const idError = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="
          mb-2 block text-sm
          font-semibold text-slate-700
        "
      >
        {label}
      </label>

      <div className="relative">
        <Icono
          size={19}
          className="
            pointer-events-none absolute
            left-4 top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? idError : undefined
          }
          onChange={(evento) =>
            onChange(evento.target.value)
          }
          className={`
            h-12 w-full rounded-xl
            border bg-white
            pl-11 text-sm text-slate-900
            outline-none transition-all
            placeholder:text-slate-400
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            ${
              botonFinal
                ? "pr-12"
                : "pr-4"
            }
            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                : "border-slate-300 focus:border-roma-500 focus:ring-4 focus:ring-roma-100"
            }
          `}
        />

        {botonFinal && (
          <div
            className="
              absolute right-2 top-1/2
              -translate-y-1/2
            "
          >
            {botonFinal}
          </div>
        )}
      </div>

      {error && (
        <p
          id={idError}
          className="
            mt-2 text-xs font-medium
            text-red-600
          "
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default CampoFormulario;