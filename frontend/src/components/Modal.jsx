import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// <dialog> nativo: foco, Esc / gesto "atrás", fondo inerte y capa superior los resuelve el navegador.
// Safari aún no cierra tocando fuera (closedby="any"): se cubre con el respaldo de abajo.
const supportsClosedBy = typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype;
const isOutside = (e, el) => {
  const r = el.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

const Modal = ({ open, onClose, title, subtitle, titleId, size = 'max-w-md', children }) => {
  const ref = useRef(null);
  const pressedOutside = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      closedby="any"
      onClose={onClose}
      onPointerDown={supportsClosedBy ? undefined : (e) => { pressedOutside.current = isOutside(e, e.currentTarget); }}
      onPointerUp={supportsClosedBy ? undefined : (e) => { if (pressedOutside.current && isOutside(e, e.currentTarget)) e.currentTarget.close(); }}
      className={`sheet ${size}`}
    >
      {open && (
        <div className="p-5 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="break-words text-2xl font-bold">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <X size={22} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
};

export default Modal;
