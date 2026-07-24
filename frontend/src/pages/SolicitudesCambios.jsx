import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileEdit, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Hash, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Eye
} from 'lucide-react';
import notify from '../utils/notifications';
import { formatMediaUrl } from '../utils/media';

const SolicitudesCambios = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  const [catalogs, setCatalogs] = useState({
    vehiculos: {},
    cajas: {},
    variados: {},
    talleres: {},
    proveedores: {},
    productos: {},
    tickets: {}
  });

  const fetchCatalogs = async () => {
    try {
      const [veh, caj, varis, tall, prov, prod, tick] = await Promise.all([
        api.get('vehiculos/'),
        api.get('cajas/'),
        api.get('variados/'),
        api.get('talleres/'),
        api.get('proveedores/'),
        api.get('productos/'),
        api.get('tickets/')
      ]);

      const toDict = (arr, keyField, valField) => 
        arr.reduce((acc, item) => ({ ...acc, [item[keyField]]: item[valField] }), {});

      setCatalogs({
        vehiculos: toDict(veh.data, 'id', 'numero_economico'),
        cajas: toDict(caj.data, 'id', 'numero_economico'),
        variados: toDict(varis.data, 'id', 'numero_economico'),
        talleres: toDict(tall.data, 'id', 'nombre'),
        proveedores: toDict(prov.data, 'id', 'nombre'),
        productos: toDict(prod.data, 'id', 'nombre'),
        tickets: toDict(tick.data, 'id', 'folio_interno')
      });
    } catch (err) {
      console.error("Error al cargar catálogos", err);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await api.get('solicitudes-cambio/');
      setSolicitudes(response.data);
    } catch (err) {
      console.error(err);
      notify.error('Error al cargar solicitudes de cambio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    fetchSolicitudes();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await api.post(`solicitudes-cambio/${id}/${action}/`);
      notify.success(`Solicitud ${action === 'aprobar' ? 'aprobada' : 'rechazada'} con éxito.`);
      fetchSolicitudes();
    } catch (err) {
      console.error(err);
      notify.error(`Error al ${action} la solicitud.`);
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12} /> Pendiente</span>;
      case 'Aprobada':
        return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12} /> Aprobada</span>;
      case 'Rechazada':
        return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12} /> Rechazada</span>;
      default:
        return null;
    }
  };

  const resolveValue = (key, value, originalData) => {
    if (value === null || value === undefined || value === '' || value === 'null') return 'Vacío';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    
    // Helper para mapear IDs a nombres
    const mapIdToName = (val, dict) => {
      const ids = Array.isArray(val) ? val : [val];
      return ids.map(id => dict[id] || id).join(', ');
    };

    if (key === 'unidad' || key === 'unidades') return mapIdToName(value, catalogs.vehiculos);
    if (key === 'caja' || key === 'cajas') return mapIdToName(value, catalogs.cajas);
    if (key === 'variado' || key === 'variados') return mapIdToName(value, catalogs.variados);
    if (key === 'taller') return catalogs.talleres[value] || value;
    if (key === 'proveedor') return catalogs.proveedores[value] || value;
    if (key === 'producto') return catalogs.productos[value] || value;
    if (key === 'ticket') return catalogs.tickets[value] || value;

    return value.toString();
  };

  const getOriginalValue = (key, facturaOriginal) => {
    if (!facturaOriginal) return null;
    if (key === 'unidad' || key === 'unidades') return facturaOriginal.unidad_nombre || facturaOriginal.unidades_info?.join(', ');
    if (key === 'caja' || key === 'cajas') return facturaOriginal.caja_numero_economico;
    if (key === 'variado' || key === 'variados') return facturaOriginal.variado_numero_economico;
    if (key === 'taller') return facturaOriginal.taller_nombre;
    if (key === 'proveedor') return facturaOriginal.proveedor_nombre;
    if (key === 'producto') return facturaOriginal.producto_nombre;
    if (key === 'ticket') return facturaOriginal.ticket_folio_interno;
    
    return facturaOriginal[key];
  };

  const renderChanges = (solicitud) => {
    const { cambios_propuestos, factura_original } = solicitud;
    if (!cambios_propuestos || typeof cambios_propuestos !== 'object') return <p className="text-sm text-slate-500">No hay detalles legibles.</p>;
    
    const fieldsToRender = Object.keys(cambios_propuestos).filter(key => 
      !['archivo_escaneado', 'detalles_unidades', 'unidades', 'cajas', 'variados'].includes(key)
    );

    if (fieldsToRender.length === 0) return <p className="text-sm text-slate-500">No hay cambios aplicables a la vista rápida.</p>;

    return (
      <div className="grid grid-cols-1 gap-4">
        {fieldsToRender.map((key) => {
          const propuesto = cambios_propuestos[key];
          const rawOriginal = factura_original[key];

          const normalizeForCompare = (val) => {
            if (val === null || val === undefined || val === 'null' || val === '') return '';
            if (Array.isArray(val)) return val.map(String).sort().join(',');
            return String(val);
          };

          const isChanged = normalizeForCompare(rawOriginal) !== normalizeForCompare(propuesto);

          if (!isChanged) return null;

          const original = getOriginalValue(key, factura_original);
          
          let renderedOriginal = resolveValue(key, original, true);
          let renderedPropuesto = resolveValue(key, propuesto, false);
          
          // Boolean normalize
          if (renderedOriginal === 'false') renderedOriginal = 'No';
          if (renderedOriginal === 'true') renderedOriginal = 'Sí';
          if (renderedPropuesto === 'false') renderedPropuesto = 'No';
          if (renderedPropuesto === 'true') renderedPropuesto = 'Sí';

          return (
            <div key={key} className="p-4 rounded-xl border transition-colors bg-amber-50/30 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3 border-b border-amber-100 dark:border-amber-800/30 pb-2">
                <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-500">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Modificado</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wider">Valor Original</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 break-all bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg" title={original}>
                    {renderedOriginal === 'Vacío' ? <span className="text-slate-400 italic">Vacío</span> : renderedOriginal}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold mb-1 uppercase tracking-wider text-amber-500">Nuevo Valor Propuesto</span>
                  <span className="text-sm font-bold break-all p-2 rounded-lg border text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50" title={propuesto}>
                    {renderedPropuesto === 'Vacío' ? <span className="text-slate-400 italic">Vacío</span> : renderedPropuesto}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600/10 p-3 rounded-2xl">
            <FileEdit className="text-amber-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Solicitudes de Cambio
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Revisa y autoriza las modificaciones a facturas solicitadas por los capturistas.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      ) : solicitudes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <AlertTriangle className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No hay solicitudes</h3>
          <p className="text-slate-500">Por el momento no tienes solicitudes de cambio pendientes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <div 
              key={solicitud.id}
              className={`bg-white dark:bg-slate-900 border ${solicitud.estado === 'Pendiente' ? 'border-amber-200 dark:border-amber-900/50 shadow-md' : 'border-slate-200 dark:border-slate-800 shadow-sm'} rounded-2xl overflow-hidden transition-all`}
            >
              {/* Header de la tarjeta */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setExpandedId(expandedId === solicitud.id ? null : solicitud.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${solicitud.estado === 'Pendiente' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    <FileEdit size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Hash size={14} className="text-slate-400" /> Factura {solicitud.factura_folio}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><User size={12} /> {solicitud.solicitante_nombre}</span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span>{new Date(solicitud.fecha_solicitud).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(solicitud.estado)}
                  {expandedId === solicitud.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </div>

              {/* Contenido expandible */}
              {expandedId === solicitud.id && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Motivo de la Solicitud</h4>
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl text-slate-700 dark:text-slate-300 italic">
                      "{solicitud.motivo}"
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Detalle de Cambios</h4>
                    {renderChanges(solicitud)}
                    {solicitud.nuevo_archivo_escaneado && (
                      <div className="mt-4 p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
                            <FileEdit size={16} />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Nuevo Archivo Adjunto</span>
                            <p className="text-xs text-slate-500 mt-0.5">El capturista adjuntó un nuevo documento escaneado.</p>
                          </div>
                        </div>
                        <a 
                          href={formatMediaUrl(solicitud.nuevo_archivo_escaneado)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                        >
                          <Eye size={14} /> Ver Documento
                        </a>
                      </div>
                    )}
                  </div>

                  {solicitud.estado === 'Pendiente' && (
                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(solicitud.id, 'rechazar'); }}
                        className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <XCircle size={16} /> Rechazar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAction(solicitud.id, 'aprobar'); }}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle size={16} /> Aprobar y Aplicar Cambios
                      </button>
                    </div>
                  )}
                  
                  {solicitud.estado !== 'Pendiente' && (
                     <div className="text-right text-xs text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-800">
                       Resuelta por: <span className="font-bold text-slate-700 dark:text-slate-300">{solicitud.autorizador_nombre}</span> el {new Date(solicitud.fecha_resolucion).toLocaleString()}
                     </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SolicitudesCambios;
