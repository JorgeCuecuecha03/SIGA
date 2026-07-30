import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Download, Search, Check, X, FileText, Trash2, Printer, Store, Banknote, PlusCircle, History } from 'lucide-react';
import { toast } from 'sonner';

export default function ContraRecibosEfectivo() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  
  // Catálogos
  const [proveedores, setProveedores] = useState([]);
  const [talleres, setTalleres] = useState([]);
  
  // Estado para nuevo contra recibo
  const [origenTipo, setOrigenTipo] = useState('proveedor');
  const [origenId, setOrigenId] = useState('');
  const [resicoAplicado, setResicoAplicado] = useState(false);
  const [facturas, setFacturas] = useState([]);
  
  const [busquedaEntidad, setBusquedaEntidad] = useState('');
  const [mostrarDropdownEntidad, setMostrarDropdownEntidad] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  
  // Historial
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

  const entidades = [
    ...proveedores.map(p => ({ ...p, tipo: 'proveedor' })),
    ...talleres.map(t => ({ ...t, tipo: 'taller' }))
  ];

  const entidadesFiltradas = entidades.filter(e => {
    const searchLower = busquedaEntidad.toLowerCase();
    return (
      (e.nombre && e.nombre.toLowerCase().includes(searchLower)) ||
      (e.razon_social && e.razon_social.toLowerCase().includes(searchLower)) ||
      (e.rfc && e.rfc.toLowerCase().includes(searchLower))
    );
  });

  const seleccionarEntidad = (entidad) => {
    setEntidadSeleccionada(entidad);
    setOrigenTipo(entidad.tipo);
    setOrigenId(entidad.id);
    setBusquedaEntidad(entidad.razon_social || entidad.nombre);
    setMostrarDropdownEntidad(false);
  };

  const [nuevaFactura, setNuevaFactura] = useState({
    folio_factura: '',
    fecha_emision: '',
    importe: '',
    estado: 'Aceptada',
    motivo_rechazo: '',
    observacion: ''
  });

  useEffect(() => {
    fetchCatalogos();
    fetchHistorial();
  }, []);

  const fetchCatalogos = async () => {
    try {
      const [provRes, tallRes] = await Promise.all([
        api.get('proveedores/'),
        api.get('talleres/')
      ]);
      setProveedores(provRes.data);
      setTalleres(tallRes.data);
    } catch (error) {
      toast.error('Error al cargar catálogos');
    }
  };

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const res = await api.get('contra-recibos/');
      setHistorial(res.data.results || res.data);
    } catch (error) {
      toast.error('Error al cargar historial de contra recibos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFactura = () => {
    if (!nuevaFactura.folio_factura || !nuevaFactura.fecha_emision || !nuevaFactura.importe) {
      toast.warning('Por favor completa los datos básicos de la factura (folio, fecha, importe).');
      return;
    }
    if (nuevaFactura.estado === 'Rechazada' && !nuevaFactura.motivo_rechazo && !nuevaFactura.observacion) {
      toast.warning('Por favor especifica un motivo u observación para el rechazo.');
      return;
    }

    setFacturas([...facturas, { ...nuevaFactura }]);
    setNuevaFactura({
      folio_factura: '',
      fecha_emision: '',
      importe: '',
      estado: 'Aceptada',
      motivo_rechazo: '',
      observacion: ''
    });
  };

  const handleRemoveFactura = (index) => {
    setFacturas(facturas.filter((_, i) => i !== index));
  };

  const handleSaveAndPrint = async () => {
    if(!window.confirm('¿Estás seguro de guardar e imprimir el contra recibo de pago en efectivo?')) return;
    if (!origenId) {
      toast.error('Por favor selecciona un proveedor o taller.');
      return;
    }
    if (facturas.length === 0) {
      toast.error('Agrega al menos una factura al contra recibo.');
      return;
    }

    const payload = {
      proveedor: origenTipo === 'proveedor' ? origenId : null,
      taller: origenTipo === 'taller' ? origenId : null,
      resico_aplicado: resicoAplicado,
      total_facturas: facturas.length,
      subtotal: facturas.reduce((sum, f) => sum + parseFloat(f.importe || 0), 0),
      facturas_detalle: facturas.map(f => ({
        folio_factura: f.folio_factura,
        fecha_emision: f.fecha_emision,
        importe: parseFloat(f.importe),
        estado: f.estado,
        motivo_rechazo: f.motivo_rechazo,
        observacion: f.observacion
      }))
    };

    try {
      setLoading(true);
      const res = await api.post('contra-recibos/', payload);
      toast.success('Contra recibo generado exitosamente');
      
      // Descargar PDF
      downloadPDF(res.data.id, res.data.folio);
      
      // Reset form
      setOrigenId('');
      setBusquedaEntidad('');
      setEntidadSeleccionada(null);
      setResicoAplicado(false);
      setFacturas([]);
      setActiveTab('history');
      fetchHistorial();
      
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el contra recibo');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (id, folio) => {
    try {
      const res = await api.get(`contra-recibos/${id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${folio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Error al descargar el PDF');
    }
  };

  const totalImporte = facturas.reduce((sum, f) => sum + parseFloat(f.importe || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center gap-2">
            <Banknote className="text-emerald-500" size={28} />
            Contra Recibos - Pagos en Efectivo
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Generación y control de contra recibos para pagos en efectivo directo.
          </p>
        </div>
        
        <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'new'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="relative">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Store size={14} /> Taller / Proveedor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-400" size={16} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar taller o proveedor..."
                    value={busquedaEntidad}
                    onChange={(e) => {
                      setBusquedaEntidad(e.target.value);
                      if (!e.target.value) {
                         setEntidadSeleccionada(null);
                         setOrigenId('');
                      }
                    }}
                    onFocus={() => setMostrarDropdownEntidad(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdownEntidad(false), 200)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  
                  {mostrarDropdownEntidad && (
                    <div 
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {entidadesFiltradas.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 italic">
                          No se encontraron resultados
                        </div>
                      ) : (
                        entidadesFiltradas.map(e => (
                          <button
                            key={`${e.tipo}-${e.id}`}
                            type="button"
                            onClick={() => seleccionarEntidad(e)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                          >
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold text-sm">
                                {e.razon_social || e.nombre}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                <span className="uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                  {e.tipo === 'taller' ? 'Taller' : 'Proveedor'}
                                </span>
                                {e.rfc && <span>RFC: {e.rfc}</span>}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-end mb-2">
                <div className="flex items-center">
                  <input
                    id="resico_efectivo"
                    type="checkbox"
                    checked={resicoAplicado}
                    onChange={(e) => setResicoAplicado(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <label htmlFor="resico_efectivo" className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Aplica RESICO
                  </label>
                </div>
              </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Folio Factura / Nota</label>
                <input
                  type="text"
                  value={nuevaFactura.folio_factura}
                  onChange={(e) => setNuevaFactura({...nuevaFactura, folio_factura: e.target.value})}
                  placeholder="Ej. F-12345"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Fecha Emisión</label>
                <input
                  type="date"
                  value={nuevaFactura.fecha_emision}
                  onChange={(e) => setNuevaFactura({...nuevaFactura, fecha_emision: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white transition-all outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Importe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevaFactura.importe}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, importe: e.target.value})}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 block">Estado</label>
                <select
                  value={nuevaFactura.estado}
                  onChange={(e) => setNuevaFactura({...nuevaFactura, estado: e.target.value})}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white transition-all outline-none"
                >
                  <option value="Aceptada">Aceptada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </div>
            </div>
            
            {nuevaFactura.estado === 'Rechazada' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest mb-2 block">Motivo del Rechazo</label>
                  <input
                    type="text"
                    value={nuevaFactura.motivo_rechazo}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, motivo_rechazo: e.target.value})}
                    placeholder="Ej. Datos fiscales incorrectos"
                    className="w-full rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 px-4 py-2.5 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:text-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-2 block">Observación (Qué cambiar)</label>
                  <input
                    type="text"
                    value={nuevaFactura.observacion}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, observacion: e.target.value})}
                    placeholder="Ej. Corregir código postal"
                    className="w-full rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10 px-4 py-2.5 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:text-white transition-all outline-none"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                onClick={handleAddFactura}
                className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar a la lista
              </button>
            </div>
          </div>

          {/* List of Invoices added */}
          {facturas.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Importe</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Detalles</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {facturas.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {f.folio_factura}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{f.fecha_emision}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-white font-bold">${parseFloat(f.importe).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          f.estado === 'Aceptada' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {f.estado === 'Aceptada' ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                          {f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">
                        {f.estado === 'Rechazada' ? (
                          <span title={`${f.motivo_rechazo} - ${f.observacion}`}>
                            {f.motivo_rechazo || 'Sin motivo'}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleRemoveFactura(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Totales:</td>
                    <td className="px-4 py-3 text-left text-lg font-black text-emerald-600 dark:text-emerald-500">
                      ${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan="3" className="px-4 py-3 text-left text-sm text-slate-500 font-medium">
                      {facturas.length} {facturas.length === 1 ? 'documento' : 'documentos'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mb-6">
              <FileText className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Sin facturas o notas</h3>
              <p className="mt-1 text-xs text-slate-500">Agrega documentos al contra recibo en efectivo usando el formulario.</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setFacturas([]);
                setOrigenId('');
                setBusquedaEntidad('');
                setEntidadSeleccionada(null);
              }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Limpiar Todo
            </button>
            <button
              onClick={handleSaveAndPrint}
              disabled={loading || facturas.length === 0 || !origenId}
              className={`inline-flex items-center px-6 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white transition-all active:scale-95 ${
                loading || facturas.length === 0 || !origenId
                  ? 'bg-emerald-400/50 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Guardar e Imprimir
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-400 dark:bg-slate-700"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Historial de Contra Recibos</h2>
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Buscar por folio o proveedor..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-emerald-500 focus:border-emerald-500 block bg-slate-50 dark:bg-slate-950 dark:text-white outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proveedor/Taller</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Documentos</th>
                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  {historial.length > 0 ? historial.map((cr) => (
                    <tr key={cr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {cr.folio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        {new Date(cr.fecha_creacion).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {cr.proveedor_nombre || cr.taller_nombre || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {cr.total_facturas}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                        ${parseFloat(cr.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => downloadPDF(cr.id, cr.folio)}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 inline-flex items-center gap-1 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        No hay contra recibos generados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
