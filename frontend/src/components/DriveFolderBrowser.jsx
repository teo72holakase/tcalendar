import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function DriveFolderBrowser({ resource, rootId, onBack }) {
  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(rootId)}#list`;

  return (
    <section className="space-y-5" aria-labelledby="drive-browser-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="btn btn-quiet btn-sm"><ArrowLeft size={16} aria-hidden="true" /> Recursos</button>
          <div className="min-w-0">
            <h2 id="drive-browser-title" className="truncate text-xl font-bold">{resource.title}</h2>
            <p className="text-sm text-muted">Carpeta compartida de Google Drive</p>
          </div>
        </div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm">
          <ExternalLink size={16} aria-hidden="true" /> Abrir en Drive
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <iframe
          title={`Contenido de la carpeta ${resource.title}`}
          src={embedUrl}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-[70vh] min-h-[32rem] w-full border-0 bg-white"
        />
      </div>
      <p className="text-sm text-muted">Drive controla la navegación y los permisos. Si no aparece el contenido, verificá que la carpeta esté compartida con quienes tienen el enlace.</p>
    </section>
  );
}
