import { X, Trash2 } from 'lucide-react';

const EventDetailsModal = ({ open, onClose, event, onDelete, canDelete, loading, error }) => {
  if (!open || !event) return null;

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{event.title}</h2>
            <p className="text-sm text-slate-500">Detalles del evento</p>
          </div>
          <button className="text-slate-500 hover:text-slate-900" onClick={onClose}>
            <X size={22} />
          </button>
        </div>
        <div className="grid gap-3">
          <p className="text-sm text-slate-700"><strong>Descripción:</strong> {event.description || 'Sin descripción'}</p>
          <p className="text-sm text-slate-700"><strong>Temas:</strong> {event.topics || 'No especificado'}</p>
          <p className="text-sm text-slate-700"><strong>Pedido por:</strong> {event.assignedBy || 'No especificado'}</p>
          <p className="text-sm text-slate-700"><strong>Fecha de entrega:</strong> {new Date(event.dueDate).toLocaleDateString()}</p>
          <p className="text-sm text-slate-700"><strong>Fecha solicitada:</strong> {event.requestedDate ? new Date(event.requestedDate).toLocaleDateString() : 'No especificado'}</p>
          <p className="text-sm text-slate-700"><strong>Creado por:</strong> {event.createdBy?.username || 'Usuario'}</p>
          {error && <div className="rounded-xl bg-rose-100 p-3 text-sm text-rose-700">{error}</div>}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100">
            Cerrar
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(event)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Trash2 size={16} /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
