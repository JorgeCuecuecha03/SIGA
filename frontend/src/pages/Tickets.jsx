import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { 
  Ticket as TicketIcon, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  ExternalLink,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Store,
  Info,
  Archive,
  Settings,
  Tag
} from 'lucide-react';
import notify from '../utils/notifications';
import { AuthContext } from '../context/AuthContext';
import { formatMediaUrl } from '../utils/media';
import AltaTicket from './AltaTicket';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [variados, setVariados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const isLector = user?.rol === 'lector_gastos';
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [totales, setTotales] = useState({ pendientes_count: 0, monto_pendiente: 0, facturados_count: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTotales = async () => {
    try {
      const res = await api.get('tickets/totales/');
      setTotales(res.data);
    } catch (err) {
      console.error("Error al cargar totales de tickets", err);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('tickets/', {
        params: {
          page: currentPage,
          search: debouncedSearch
        }
      });
      if (res.data && res.data.results) {
        setTickets(res.data.results);
        setTotalTickets(res.data.count);
      } else {
        setTickets(res.data);
        setTotalTickets(res.data.length);
      }
    } catch (err) {
      console.error("Error cargando tickets", err);
      notify.error("No se pudieron cargar los tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const [vehiculosRes, cajasRes, variadosRes] = await Promise.all([
        api.get('vehiculos/', { params: { nopaged: true } }),
        api.get('cajas/', { params: { nopaged: true } }),
        api.get('variados/', { params: { nopaged: true } })
      ]);
      setVehiculos(vehiculosRes.data.results || vehiculosRes.data);
      setCajas(cajasRes.data.results || cajasRes.data);
      setVariados(variadosRes.data.results || variadosRes.data);
    } catch (err) {
      console.error("Error cargando catálogos", err);
    }
  };

  useEffect(() => {
    fetchCatalogs();
    fetchTotales();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, debouncedSearch]);

  const handleAltaSuccess = () => {
    setShowAltaModal(false);
    fetchTickets();
    fetchTotales();
  };

  const getUnidadInfo = (unidadId) => {
    return vehiculos.find(v => v.id === unidadId);
  };

  const getCajaInfo = (cajaId) => {
    return cajas.find(c => c.id === cajaId);
  };

  const getVariadoInfo = (variadoId) => {
    return variados.find(v => v.id === variadoId);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const currentTickets = tickets;
  const totalPages = Math.ceil(totalTickets / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getVisiblePages = (current, total, max = 6) => {
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
    let start = current - Math.floor(max / 2);
    start = Math.max(start, 1);
    let end = start + max - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - max + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <TicketIcon className="text-amber-500 shrink-0" size={32} />
            Control de Tickets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm lg:text-lg">Gestión de notas simples y folios físicos.</p>
        </div>
        
        {!isLector && (
          <button 
            onClick={() => setShowAltaModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 w-full md:w-auto"
          >
            <Plus size={20} />
            Nuevo Ticket
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pendientes de Facturar</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="text-amber-500 shrink-0" size={24} />
            {totales.pendientes_count}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Monto Pendiente</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500 shrink-0" size={24} />
            {totales.monto_pendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl sm:col-span-2 lg:col-span-1 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Ya Facturados</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="text-blue-500 shrink-0" size={24} />
            {totales.facturados_count}
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-slate-500 group-focus-within:text-amber-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar folio, descripción, taller, unidad o placas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-amber-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando tickets...</p>
        </div>
      ) : currentTickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6 shadow-sm">
          <div className="bg-slate-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <TicketIcon className="text-slate-400 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No se encontraron tickets</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm ? `No hay resultados para "${searchTerm}".` : "Aún no has registrado tickets o notas simples."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTickets.map((t) => {
            const unidad = getUnidadInfo(t.unidad);
            return (
              <div 
                key={t.id} 
                onClick={() => { setSelectedTicket(t); setShowDetailModal(true); }}
                className={`bg-white dark:bg-slate-900/40 backdrop-blur-sm border ${t.unidades_info?.length > 1 ? 'border-purple-500/50 shadow-purple-900/10' : (t.convertido_en_factura ? 'border-slate-200 dark:border-slate-800 opacity-75 grayscale-[0.3]' : 'border-amber-500/30')} rounded-3xl p-6 hover:border-amber-500 hover:scale-[1.01] transition-all group shadow-lg dark:shadow-2xl relative overflow-hidden flex flex-col cursor-pointer`}
              >
                {t.unidades_info?.length > 1 && (
                   <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg z-20">
                     Gasto Compartido
                   </div>
                )}
                
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Folio Interno</p>
                    <p className="text-amber-400 font-mono text-2xl font-black tracking-tight truncate">{t.folio_interno}</p>
                    <p className="text-slate-400 text-xs mt-1">Físico: <span className="text-slate-200 font-bold">{t.folio_emision}</span></p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {t.categoria && (
                        <div className="inline-block bg-amber-600/20 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-md border border-amber-500/20 truncate max-w-full">
                          {t.categoria}
                        </div>
                      )}
                      {t.archivo_escaneado && (
                        <div className="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-md border border-emerald-500/20">
                          <CheckCircle2 size={10} /> Remisión
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monto</p>
                    <p className="text-emerald-400 font-black text-2xl">${parseFloat(t.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="bg-amber-600/10 p-2 rounded-lg shrink-0">
                      <Truck className="text-amber-500" size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Asignación</p>
                      <p className={`text-sm font-bold truncate ${t.unidades_info?.length > 1 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                        {t.unidades_info?.length > 1 
                          ? `${t.unidades_info.length} Unidades: ${t.unidades_info.join(', ')}` 
                          : (unidad ? `Unidad: ${unidad.numero_economico}` : 'Gasto General')}
                      </p>
                      {t.caja_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Archive size={12} className="text-amber-500/80 shrink-0" />
                          Remolque: {t.caja_numero_economico}
                        </p>
                      )}
                      {t.variado_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Settings size={12} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                          Variado: {t.variado_numero_economico}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                      <Store className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Taller / Origen</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t.taller_nombre || t.proveedor_nombre || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700">
                      <Info className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Descripción</p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm italic truncate" title={t.descripcion}>
                        {t.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <p className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                    <Calendar size={14} className="text-slate-600" />
                    {new Date(t.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>

                  <div className="flex items-center gap-2">
                    {t.convertido_en_factura && (
                      <div className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 size={10} />
                        Facturado
                      </div>
                    )}
                    
                    {t.archivo_escaneado && (
                      <a 
                        href={formatMediaUrl(t.archivo_escaneado)} 
                        target="_blank" 
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-400 hover:text-amber-300 p-2 bg-amber-500/10 rounded-xl transition-colors shadow-lg"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          {getVisiblePages(currentPage, totalPages).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                currentPage === number 
                  ? 'bg-amber-600 text-white shadow-xl shadow-amber-900/20 scale-110' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {showAltaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-5xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar shadow-amber-500/5">
            <AltaTicket 
              onSuccess={handleAltaSuccess} 
              onClose={() => setShowAltaModal(false)} 
            />
          </div>
        </div>
      )}

      {/* Modal de Detalle de Ticket */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] shadow-amber-500/5">
            {/* Cabecera */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/20">
              <div className="flex items-center gap-4">
                <div className="bg-amber-600/10 p-3.5 rounded-2xl">
                  <TicketIcon className="text-amber-500" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Detalles de Ticket</h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">Folio Interno: <span className="text-amber-500 font-bold">{selectedTicket.folio_interno}</span></p>
                </div>
              </div>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedTicket(null); }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2.5 rounded-full transition-all"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow text-slate-700 dark:text-slate-300">
              {/* Resumen Superior */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Monto del Gasto</span>
                  <span className="text-2xl font-black text-emerald-500">${parseFloat(selectedTicket.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Estatus del Ticket</span>
                  <span className="mt-1">
                    {selectedTicket.convertido_en_factura ? (
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-xl border border-emerald-500/20 uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm">
                        <CheckCircle2 size={12} /> Facturado
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-500/20 uppercase tracking-widest inline-flex items-center gap-1.5 shadow-sm">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Información General */}
              <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Calendar size={14} /> Fecha de Registro</span>
                    <span className="font-semibold">{new Date(selectedTicket.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Hash size={14} /> Folio Físico (Emisión)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedTicket.folio_emision || 'N/A'}</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Store size={14} /> Taller / Proveedor (Origen)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedTicket.taller_nombre || selectedTicket.proveedor_nombre || 'No especificado'}</span>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Truck size={14} /> Unidad(es) Asignada(s)</span>
                  {selectedTicket.unidades_info?.length > 1 ? (
                    <div className="space-y-2 mt-1">
                      <p className="text-purple-600 dark:text-purple-400 font-bold text-xs">Gasto compartido entre {selectedTicket.unidades_info.length} unidades:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTicket.unidades_info.map((num, i) => (
                          <span key={i} className="bg-purple-600/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/20">
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedTicket.unidad_nombre 
                        ? `Unidad ${selectedTicket.unidad_nombre}` 
                        : (selectedTicket.unidad ? `Unidad ID: ${selectedTicket.unidad}` : 'Gasto General / Sin Unidad')}
                    </span>
                  )}
                </div>

                {selectedTicket.caja && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-indigo-600/10 p-2 rounded-xl mt-1">
                      <Archive className="text-indigo-500" size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">Caja / Remolque Relacionado</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {(() => {
                          const cajaObj = getCajaInfo(selectedTicket.caja);
                          return cajaObj 
                            ? `${cajaObj.numero_economico} - Placas: ${cajaObj.placas} ${cajaObj.tipo ? `(${cajaObj.tipo})` : ''}` 
                            : selectedTicket.caja_numero_economico || 'Caja asignada';
                        })()}
                      </span>
                      {(() => {
                        const cajaObj = getCajaInfo(selectedTicket.caja);
                        return cajaObj && (cajaObj.modelo || cajaObj.numero_serie) ? (
                          <span className="text-slate-500 text-xs mt-1 block">
                            {cajaObj.modelo ? `Modelo: ${cajaObj.modelo}` : ''}
                            {cajaObj.modelo && cajaObj.numero_serie ? ' | ' : ''}
                            {cajaObj.numero_serie ? `N/S: ${cajaObj.numero_serie}` : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {selectedTicket.variado && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-emerald-600/10 p-2 rounded-xl mt-1">
                      <Settings className="text-emerald-500" size={18} />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">Vehículo Variado / Maquinaria Relacionado</span>
                      <span className="font-semibold text-slate-900 dark:text-white block">
                        {(() => {
                          const varObj = getVariadoInfo(selectedTicket.variado);
                          return varObj 
                            ? `${varObj.numero_economico} - Placas: ${varObj.placas || 'N/A'} ${varObj.tipo ? `(${varObj.tipo})` : ''}` 
                            : selectedTicket.variado_numero_economico || 'Vehículo asignado';
                        })()}
                      </span>
                      {(() => {
                        const varObj = getVariadoInfo(selectedTicket.variado);
                        return varObj && (varObj.modelo || varObj.numero_serie) ? (
                          <span className="text-slate-500 text-xs mt-1 block">
                            {varObj.modelo ? `Modelo: ${varObj.modelo}` : ''}
                            {varObj.modelo && varObj.numero_serie ? ' | ' : ''}
                            {varObj.numero_serie ? `N/S: ${varObj.numero_serie}` : ''}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {selectedTicket.categoria && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Tag size={14} /> Categoría</span>
                    <span className="bg-amber-600/10 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-500/20 inline-block">
                      {selectedTicket.categoria}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1"><Info size={14} /> Descripción del Gasto</span>
                  <span className="text-slate-600 dark:text-slate-300 italic text-sm">{selectedTicket.descripcion || 'Sin descripción detallada.'}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              {selectedTicket.archivo_escaneado ? (
                <a 
                  href={formatMediaUrl(selectedTicket.archivo_escaneado)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-grow bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <ExternalLink size={20} />
                  VISUALIZAR REMISIÓN DIGITALIZADA
                </a>
              ) : (
                <div className="w-full text-center text-slate-400 text-xs py-4 italic border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  Sin documento adjunto o remisión escaneada.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
