import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { 
  FilePlus, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  ExternalLink,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Filter,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Store,
  Info,
  X,
  Ticket as TicketIcon,
  TrendingUp,
  Tag,
  Pencil,
  Archive,
  XCircle,
  Settings,
  Download
} from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '../components/ui/chart';
import AltaFactura from './AltaFactura';
import notify from '../utils/notifications';
import { AuthContext } from '../context/AuthContext';
import { formatMediaUrl } from '../utils/media';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const categoryChartConfig = {
  value: {
    label: "Monto",
  },
  "Mantenimiento": {
    label: "Mantenimiento",
    color: "#3b82f6",
  },
  "Refacciones": {
    label: "Refacciones",
    color: "#14b8a6",
  },
  "Llantas": {
    label: "Llantas",
    color: "#10b981",
  },
  "Combustible": {
    label: "Combustible",
    color: "#f59e0b",
  },
  "Operativo": {
    label: "Operativo",
    color: "#ef4444",
  },
  "Administrativo": {
    label: "Administrativo",
    color: "#8b5cf6",
  },
  "Otro": {
    label: "Otro",
    color: "#ec4899",
  },
  "Sin Categoría": {
    label: "Sin Categoría",
    color: "#64748b",
  }
};

const Facturacion = () => {
  const [facturas, setFacturas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [variados, setVariados] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const isLector = user?.rol === 'lector_gastos' || user?.rol === 'jefe_logistica';
  const [searchTerm, setSearchTerm] = useState('');
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeChart, setActiveChart] = useState('categoria');
  // Cancel invoice UI state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [facturaToCancel, setFacturaToCancel] = useState(null);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [candidatos, setCandidatos] = useState([]);
  const [selectedReemplazo, setSelectedReemplazo] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // 'week', 'month', 'year', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState({ total: 0, count: 0, units: 0, chart_data: [] });
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const getFormatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateParams = () => {
    let fecha_inicio = null;
    let fecha_fin = null;
    
    if (dateRange === 'week') {
      const day = referenceDate.getDay();
      const diffToFriday = (day + 2) % 7;
      const start = new Date(referenceDate);
      start.setDate(referenceDate.getDate() - diffToFriday);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      fecha_inicio = getFormatDate(start);
      fecha_fin = getFormatDate(end);
    } else if (dateRange === 'month') {
      fecha_inicio = getFormatDate(new Date(selectedYear, selectedMonth, 1));
      fecha_fin = getFormatDate(new Date(selectedYear, selectedMonth + 1, 0));
    } else if (dateRange === 'year') {
      fecha_inicio = getFormatDate(new Date(selectedYear, 0, 1));
      fecha_fin = getFormatDate(new Date(selectedYear, 11, 31));
    }
    return { fecha_inicio, fecha_fin };
  };

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadCombinedPDF = async () => {
    try {
      setDownloadingPDF(true);
      const params = getDateParams();
      
      const response = await api.get('facturas/descargar_pdf_semana/', {
        params,
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facturas_${params.fecha_inicio}_a_${params.fecha_fin}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      notify.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error al descargar PDF:", error);
      notify.error("Ocurrió un error al generar el PDF combinado.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      const [vehiculosRes, cajasRes, variadosRes] = await Promise.all([
        api.get('vehiculos/'),
        api.get('cajas/'),
        api.get('variados/')
      ]);
      setVehiculos(vehiculosRes.data.results || vehiculosRes.data);
      setCajas(cajasRes.data.results || cajasRes.data);
      setVariados(variadosRes.data.results || variadosRes.data);
    } catch (err) {
      console.error("Error cargando catálogos", err);
    }
  };

  const fetchFacturasData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        ...getDateParams()
      };
      
      const [facturasRes, statsRes] = await Promise.all([
        api.get('facturas/', { params }),
        api.get('facturas/stats/', { params: getDateParams() })
      ]);
      
      if (facturasRes.data.results) {
        setFacturas(facturasRes.data.results);
        setTotalItems(facturasRes.data.count);
      } else {
        setFacturas(facturasRes.data);
        setTotalItems(facturasRes.data.length);
      }
      
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error cargando facturas", err);
      notify.error("No se pudieron cargar los datos de facturación.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    fetchFacturasData();
  }, [currentPage, searchTerm, dateRange, referenceDate, selectedMonth, selectedYear]);

  const fetchData = fetchFacturasData;

  const handleAltaSuccess = () => {
    setShowAltaModal(false);
    setEditingFactura(null);
    fetchData();
  };

  const handleEdit = (e, factura) => {
    e.stopPropagation();
    setEditingFactura(factura);
    setShowAltaModal(true);
  };

  // Fetch replacement candidates when a factura is selected for cancellation
  useEffect(() => {
    if (facturaToCancel) {
      api.get(`facturas/${facturaToCancel.id}/candidatos/`)
        .then(res => setCandidatos(res.data))
        .catch(err => console.error('Error fetching candidatos', err));
    } else {
      setCandidatos([]);
    }
  }, [facturaToCancel]);

  const handleCancelFactura = async (id) => {
    try {
      await api.post(`facturas/${id}/cancelar/`, {
        motivo: cancelMotivo,
        factura_reemplazo_id: selectedReemplazo?.id || null,
      });
      notify.success('Factura cancelada exitosamente');
      setShowCancelModal(false);
      setFacturaToCancel(null);
      setCancelMotivo('');
      setSelectedReemplazo(null);
      fetchData();
    } catch (err) {
      console.error('Error cancelando factura', err);
      notify.error('No se pudo cancelar la factura');
    }
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

  const chartDataConFills = (stats.chart_data || []).map((item, index) => ({
    ...item,
    fill: categoryChartConfig[item.name]?.color || COLORS[index % COLORS.length]
  }));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, referenceDate, selectedMonth, selectedYear]);

  const currentFacturas = facturas;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

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
            <FilePlus className="text-blue-500 shrink-0" size={32} />
            Facturación
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm lg:text-lg">Gestión de comprobantes fiscales y gastos generales.</p>
        </div>
        
        {!isLector && (
          <button 
            onClick={() => setShowAltaModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 w-full md:w-auto"
          >
            <Plus size={20} />
            Nueva Factura
          </button>
        )}
      </div>

      {/* Date Filter Selector and Specific Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex bg-white dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md backdrop-blur-xl shadow-sm">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'year', label: 'Año' },
            { id: 'all', label: 'Todo' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                dateRange === r.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-300'
              }`}
            >
              {r.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Specific Selectors based on Range */}
        {dateRange === 'week' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <button 
              onClick={() => {
                const d = new Date(referenceDate);
                d.setDate(d.getDate() - 7);
                setReferenceDate(d);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-xl transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-2 flex flex-col items-center min-w-[140px]">
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter leading-none mb-1">Semana del</span>
              <span className="text-slate-900 dark:text-white text-xs font-black">
                {(() => {
                  const day = referenceDate.getDay();
                  const diffToFriday = (day + 2) % 7;
                  const start = new Date(referenceDate);
                  start.setDate(referenceDate.getDate() - diffToFriday);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  return `${start.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - ${end.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}`;
                })()}
              </span>
            </div>
            <button 
              onClick={() => {
                const d = new Date(referenceDate);
                d.setDate(d.getDate() + 7);
                setReferenceDate(d);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {dateRange === 'week' && (
          <button
            onClick={handleDownloadCombinedPDF}
            disabled={downloadingPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 animate-in slide-in-from-left-2 duration-300 ml-auto md:ml-0"
          >
            {downloadingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Descargar PDF Combinado
          </button>
        )}

        {dateRange === 'month' && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                <option key={i} value={i} className="bg-white dark:bg-slate-900">{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>
              ))}
            </select>
          </div>
        )}

        {dateRange === 'year' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <Calendar size={16} className="text-blue-500 ml-2" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-white text-xs font-black py-2 px-4 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <button 
          onClick={() => setShowChartsModal(true)}
          className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:border-emerald-500/50 transition-all group text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <BarChart3 className="text-emerald-500" size={16} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Total Facturado</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500 shrink-0" size={24} />
            {stats.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-500/50 font-bold mt-2 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <TrendingUp size={10} /> Ver análisis por categoría
          </p>
        </button>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:border-blue-500/30 transition-colors group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Comprobantes</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="text-blue-500 shrink-0" size={24} />
            {stats.count}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg sm:col-span-2 lg:col-span-1 hover:border-indigo-500/30 transition-colors group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Unidades con Gasto</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-indigo-500 shrink-0" size={24} />
            {stats.units}
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar folio, descripción, taller, RFC, emisor, unidad o placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-blue-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando facturación...</p>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6 shadow-xl">
          <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FilePlus className="text-slate-400 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No se encontraron facturas</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm ? `No hay resultados para "${searchTerm}".` : "Aún no has registrado facturas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFacturas.map((f) => {
            const unidad = getUnidadInfo(f.unidad);
            return (
              <div 
                key={f.id} 
                onClick={() => {
                  setSelectedFactura(f);
                  setShowDetailModal(true);
                }}
                className={`bg-white dark:bg-slate-900/40 backdrop-blur-sm border ${f.unidades_info?.length > 1 ? 'border-purple-500/50 shadow-purple-900/10' : 'border-slate-200 dark:border-slate-800'} rounded-3xl p-6 hover:border-blue-500 transition-all group shadow-lg dark:shadow-2xl flex flex-col relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
              >
                {f.unidades_info?.length > 1 && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">
                    Gasto Compartido
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Folio</p>
                    <p className="text-slate-900 dark:text-white font-mono text-2xl font-black tracking-tight truncate">{f.folio}</p>
                    {f.ticket_folio_interno && (
                      <p className="text-amber-500 text-[11px] font-mono font-bold mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block border border-amber-500/20">
                        Tk: {f.ticket_folio_interno}
                      </p>
                    )}
                    {f.categoria && (
                      <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-md mt-1 border border-blue-500/20 truncate max-w-full">
                        {f.categoria}
                      </div>
                    )}
                    {!f.categoria && f.producto_nombre && (
                      <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-md mt-1 border border-blue-500/20 truncate max-w-full">
                        {f.producto_categoria}: {f.producto_nombre}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monto</p>
                    <p className={`font-black text-2xl ${f.cancelado ? 'text-rose-400 line-through decoration-rose-400/50' : 'text-emerald-400'}`}>${parseFloat(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="bg-blue-600/10 p-2 rounded-lg shrink-0">
                      <Truck className="text-blue-500" size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Asignación</p>
                      <p className={`text-sm font-bold truncate ${f.unidades_info?.length > 1 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                        {f.unidades_info?.length > 1 
                          ? `${f.unidades_info.length} Unidades: ${f.unidades_info.join(', ')}` 
                          : (unidad ? `Tractor: ${unidad.numero_economico}` : 'Sin tractor asignado')}
                      </p>
                      {f.caja_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Archive size={12} className="text-indigo-400 shrink-0" />
                          Remolque: {f.caja_numero_economico}
                        </p>
                      )}
                      {f.variado_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Settings size={12} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                          Variado: {f.variado_numero_economico}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-100 dark:border-slate-700">
                      <Store className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Taller / Proveedor</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{f.taller_nombre || f.proveedor_nombre || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-100 dark:border-slate-700">
                      <Info className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Descripción</p>
                      <p className={`text-sm italic truncate ${f.cancelado ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`} title={f.cancelado ? `CANCELADA - ${f.descripcion || 'Sin descripción'}` : f.descripcion}>
                        {f.cancelado ? `CANCELADA - ${f.descripcion || 'Sin descripción'}` : (f.descripcion || 'Sin descripción')}
                      </p>
                      {f.cancelado && f.motivo_cancelacion && (
                        <p className="text-rose-400 text-xs mt-1 italic line-clamp-1" title={f.motivo_cancelacion}>
                          Motivo: {f.motivo_cancelacion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                      <Calendar size={14} className="text-slate-600" />
                      {new Date(f.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    
                    {(!f.cancelado && !isLector) && (
                      <button 
                        onClick={(e) => handleEdit(e, f)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                        title="Editar Factura"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {(!f.cancelado && !isLector) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setFacturaToCancel(f); setShowCancelModal(true); }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Cancelar Factura"
                        >
                          <XCircle size={16} />
                        </button>
                    )}
                  </div>
                  
                  {f.archivo_escaneado ? (
                    <a 
                      href={formatMediaUrl(f.archivo_escaneado)} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2"
                    >
                      Ver Doc <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-rose-400 text-[10px] font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">Sin Archivo</span>
                  )}
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
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 scale-110' 
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

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <div className="bg-rose-100 dark:bg-rose-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-rose-500" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">¿Cancelar factura?</h3>
            <p className="text-slate-500 text-center mb-4">Esta acción marcará la factura <strong>{facturaToCancel?.folio}</strong> como cancelada. Esta acción no se puede deshacer.</p>
            {/* Motivo input */}
            <div className="mb-4">
              <label className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                Motivo de cancelación <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Describe el motivo de la cancelación..."
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                className={`w-full h-24 p-3 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${!cancelMotivo.trim() ? 'border-rose-300 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700'}`}
              />
            </div>
            {/* Replacement selection - OBLIGATORIO */}
            <div className="mb-6">
              <label className="text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider mb-1.5 block">
                Factura de reemplazo <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedReemplazo?.id || ''}
                onChange={(e) => {
                  const sel = candidatos.find(c => c.id === parseInt(e.target.value));
                  setSelectedReemplazo(sel || null);
                }}
                className={`w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors ${!selectedReemplazo ? 'border-2 border-rose-400 dark:border-rose-700' : 'border border-emerald-400 dark:border-emerald-700'}`}
              >
                <option value="">— Selecciona una factura de reemplazo —</option>
                {candidatos.map(c => {
                  const vehiculo = c.unidad_nombre 
                    || (c.caja_numero_economico ? `Caja: ${c.caja_numero_economico}` : null)
                    || (c.variado_numero_economico ? `Variado: ${c.variado_numero_economico}` : null)
                    || (c.unidades_info?.length > 0 ? c.unidades_info.join(', ') : null)
                    || 'Sin asignación';
                  return (
                    <option key={c.id} value={c.id}>{c.folio} - ${parseFloat(c.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} - {vehiculo}</option>
                  );
                })}
              </select>
              {!selectedReemplazo && (
                <p className="text-rose-400 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> Es obligatorio seleccionar una factura de reemplazo
                </p>
              )}
              {candidatos.length === 0 && (
                <p className="text-amber-400 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={12} /> No hay facturas candidatas para reemplazo de esta unidad
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setFacturaToCancel(null); setCancelMotivo(''); setSelectedReemplazo(null); }}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => handleCancelFactura(facturaToCancel.id)}
                disabled={!cancelMotivo.trim() || !selectedReemplazo}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${!cancelMotivo.trim() || !selectedReemplazo ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60' : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20'}`}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {showAltaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-6xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
            <AltaFactura 
              onSuccess={handleAltaSuccess} 
              onClose={() => {
                setShowAltaModal(false);
                setEditingFactura(null);
              }} 
              factura={editingFactura}
              existingFacturas={facturas}
            />
          </div>
        </div>
      )}

      {showDetailModal && selectedFactura && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl p-0 shadow-2xl relative overflow-hidden shadow-blue-500/5">
            {/* Header del Modal */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/10 p-3 rounded-2xl">
                  <FilePlus className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Detalles de Factura</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Folio: {selectedFactura.folio}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Monto Total</p>
                  <p className={`text-3xl font-black ${selectedFactura.cancelado ? 'text-rose-500 line-through decoration-rose-500/50' : 'text-emerald-400'}`}>
                    ${parseFloat(selectedFactura.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Fecha de Emisión</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-end gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    {new Date(selectedFactura.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-xl">
                      <Truck className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Unidad(es) Asignada(s)</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFactura.detalles_unidades?.length > 0 ? (
                          <div className="space-y-2 mt-1 w-full">
                            {selectedFactura.detalles_unidades.map(detalle => (
                              <div key={detalle.id} className="flex justify-between items-center bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
                                <span className="text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
                                  {detalle.unidad_nombre || (detalle.caja_nombre ? `Caja: ${detalle.caja_nombre}` : `Variado: ${detalle.variado_nombre}`)}
                                </span>
                                <span className="text-slate-900 dark:text-white text-xs font-bold">${parseFloat(detalle.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        ) : selectedFactura.unidades_info?.length > 1 ? (
                          selectedFactura.unidades_info.map(uEco => (
                            <span key={uEco} className="bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {uEco}
                            </span>
                          ))
                        ) : (
                          <p className="text-slate-900 dark:text-white font-bold">
                            {getUnidadInfo(selectedFactura.unidad) 
                              ? `${getUnidadInfo(selectedFactura.unidad).numero_economico} (${getUnidadInfo(selectedFactura.unidad).placas})` 
                              : 'Sin unidad asignada'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                      <Store className="text-slate-500 dark:text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Taller / Proveedor</p>
                      <p className="text-slate-900 dark:text-white font-bold">{selectedFactura.taller_nombre || selectedFactura.proveedor_nombre || 'No especificado'}</p>
                      {selectedFactura.razon_social_emisor && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{selectedFactura.razon_social_emisor}</p>
                      )}
                      {selectedFactura.rfc_emisor && (
                        <p className="text-slate-500 text-xs font-mono mt-0.5">RFC: {selectedFactura.rfc_emisor}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedFactura.caja && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600/10 p-2 rounded-xl">
                        <Archive className="text-indigo-500" size={20} />
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase">Caja / Remolque Relacionado</p>
                        <p className="text-slate-900 dark:text-white font-bold">
                          {(() => {
                            const cajaObj = getCajaInfo(selectedFactura.caja);
                            return cajaObj 
                              ? `${cajaObj.numero_economico} - Placas: ${cajaObj.placas} ${cajaObj.tipo ? `(${cajaObj.tipo})` : ''}` 
                              : selectedFactura.caja_numero_economico || 'Caja asignada';
                          })()}
                        </p>
                        {(() => {
                          const cajaObj = getCajaInfo(selectedFactura.caja);
                          return cajaObj && (cajaObj.modelo || cajaObj.numero_serie) ? (
                            <p className="text-slate-500 text-xs mt-1">
                              {cajaObj.modelo ? `Modelo: ${cajaObj.modelo}` : ''}
                              {cajaObj.modelo && cajaObj.numero_serie ? ' | ' : ''}
                              {cajaObj.numero_serie ? `N/S: ${cajaObj.numero_serie}` : ''}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {selectedFactura.variado && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-600/10 p-2 rounded-xl">
                        <Settings className="text-emerald-500" size={20} />
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase">Vehículo Variado / Maquinaria Relacionado</p>
                        <p className="text-slate-900 dark:text-white font-bold">
                          {(() => {
                            const varObj = getVariadoInfo(selectedFactura.variado);
                            return varObj 
                              ? `${varObj.numero_economico} - Placas: ${varObj.placas || 'N/A'} ${varObj.tipo ? `(${varObj.tipo})` : ''}` 
                              : selectedFactura.variado_numero_economico || 'Vehículo asignado';
                          })()}
                        </p>
                        {(() => {
                          const varObj = getVariadoInfo(selectedFactura.variado);
                          return varObj && (varObj.modelo || varObj.numero_serie) ? (
                            <p className="text-slate-500 text-xs mt-1">
                              {varObj.modelo ? `Modelo: ${varObj.modelo}` : ''}
                              {varObj.modelo && varObj.numero_serie ? ' | ' : ''}
                              {varObj.numero_serie ? `N/S: ${varObj.numero_serie}` : ''}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                    <Tag className="text-slate-500 dark:text-slate-400" size={20} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-slate-500 text-[9px] font-bold uppercase">Categoría / Concepto</p>
                    <p className="text-slate-900 dark:text-white font-bold">
                      {selectedFactura.categoria || (
                        <>
                          <span className="text-blue-600 dark:text-blue-400">{selectedFactura.producto_categoria}:</span> {selectedFactura.producto_nombre || 'No especificado'}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {selectedFactura.ticket_folio_interno && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                    <div className="bg-amber-600/10 p-2 rounded-xl">
                      <TicketIcon className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Relacionado con Ticket</p>
                      <p className="text-amber-500 font-bold font-mono uppercase">{selectedFactura.ticket_folio_interno}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                  <Info size={14} /> Descripción del Gasto
                </p>
                <div className={`bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 italic text-sm leading-relaxed ${selectedFactura.cancelado ? 'text-rose-500 font-bold' : 'text-slate-600 dark:text-slate-300'}`}>
                  {selectedFactura.cancelado ? `CANCELADA - ${selectedFactura.descripcion || 'Sin descripción'}` : (selectedFactura.descripcion || 'Sin descripción adicional proporcionada.')}
                </div>
                {selectedFactura.cancelado && selectedFactura.motivo_cancelacion && (
                  <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-2xl border border-rose-100 dark:border-rose-900 mt-3">
                    <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                      Motivo de Cancelación
                    </p>
                    <p className="text-rose-600 dark:text-rose-400 text-sm leading-relaxed italic font-medium">
                      {selectedFactura.motivo_cancelacion}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              {selectedFactura.archivo_escaneado ? (
                <a 
                  href={formatMediaUrl(selectedFactura.archivo_escaneado)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <ExternalLink size={20} />
                  VISUALIZAR DOCUMENTO ORIGINAL
                </a>
              ) : (
                <div className="flex-grow bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700">
                  <AlertCircle size={20} />
                  SIN DOCUMENTO DIGITALIZADO
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChartsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowChartsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-2xl">
                  <BarChart3 className="text-emerald-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Análisis de Gastos</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                    {activeChart === 'categoria' ? 'Distribución por Categoría' : 'Distribución por Proveedor'}
                  </p>
                </div>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveChart('categoria')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeChart === 'categoria' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Categoría
                </button>
                <button
                  onClick={() => setActiveChart('proveedor')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeChart === 'proveedor' 
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Proveedor
                </button>
              </div>
            </div>

            {(() => {
              const currentChartData = activeChart === 'categoria' 
                ? chartDataConFills 
                : (stats.proveedor_chart_data || []).map((item, index) => ({
                    ...item,
                    fill: COLORS[index % COLORS.length]
                  }));

              if (currentChartData.length === 0) {
                return (
                  <div className="h-64 flex items-center justify-center text-slate-500 font-medium italic bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    No hay datos disponibles para esta selección
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-64 w-full">
                    <ChartContainer config={categoryChartConfig} className="h-full w-full">
                      <PieChart>
                        <Pie
                          data={currentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="rgba(0,0,0,0)"
                        >
                          {currentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent config={categoryChartConfig} formatter={(value) => `$${parseFloat(value).toLocaleString('es-MX', {minimumFractionDigits: 2})}`} />} />
                      </PieChart>
                    </ChartContainer>
                  </div>
                  
                  <div className="space-y-2.5 max-h-[16.5rem] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const total = currentChartData.reduce((acc, curr) => acc + curr.value, 0);
                      return currentChartData.map((item) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={item.name}>
                                  {activeChart === 'categoria' ? (categoryChartConfig[item.name]?.label || item.name) : item.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold">{percentage}%</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-4 font-mono">
                              ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
