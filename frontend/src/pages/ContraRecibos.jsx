import React, { useState, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';
import { Plus, Download, Search, Check, X, FileText, Trash2, Printer, Save, History, PlusCircle, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function ContraRecibos() {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  
  // Catálogos
  const [proveedores, setProveedores] = useState([]);
  const [talleres, setTalleres] = useState([]);
  
  // Estado para nuevo contra recibo
  const [origenTipo, setOrigenTipo] = useState('proveedor');
  const [origenId, setOrigenId] = useState('');
  const [resicoAplicado, setResicoAplicado] = useState(false);
  const [facturas, setFacturas] = useState([]);
  
  // Estado para el formulario de factura en línea
  
  const [busquedaEntidad, setBusquedaEntidad] = useState('');
  const [mostrarDropdownEntidad, setMostrarDropdownEntidad] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);

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
    descuento: '',
    estado: 'Aceptada',
    motivo_rechazo: '',
    observacion: ''
  });
  const [mostrarDescuento, setMostrarDescuento] = useState(false);

  // Historial
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);

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

    setFacturas([...facturas, { ...nuevaFactura, descuento: nuevaFactura.descuento || '0' }]);
    setNuevaFactura({
      folio_factura: '',
      fecha_emision: '',
      importe: '',
      descuento: '',
      estado: 'Aceptada',
      motivo_rechazo: '',
      observacion: ''
    });
    setMostrarDescuento(false);
  };

  const handleRemoveFactura = (index) => {
    setFacturas(facturas.filter((_, i) => i !== index));
  };

  const handleSaveAndPrint = async () => {
    if(!window.confirm('¿Estás seguro de guardar e imprimir el contra recibo?')) return;
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
        descuento: parseFloat(f.descuento || 0),
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
  const totalDescuento = facturas.reduce((sum, f) => sum + parseFloat(f.descuento || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            Contra Recibos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Recepción y control de facturas de proveedores
          </p>
        </div>
        
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'new'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Nuevo
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Invoices Section with General Data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generar Contra Recibo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Store size={14} /> Taller / Proveedor
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="text-gray-500/40" size={12} />
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
      setBusquedaEntidad('');
      setEntidadSeleccionada(null);
                        }
                      }}
                      onFocus={() => setMostrarDropdownEntidad(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdownEntidad(false), 200)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    />
                    
                    {mostrarDropdownEntidad && (
                      <div 
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                      >
                        {entidadesFiltradas.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 italic">
                            No se encontraron resultados
                          </div>
                        ) : (
                          entidadesFiltradas.map(e => (
                            <button
                              key={`${e.tipo}-${e.id}`}
                              type="button"
                              onClick={() => seleccionarEntidad(e)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-750 last:border-0 transition-colors group"
                            >
                              <div>
                                <div className="text-gray-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm">
                                  {e.razon_social || e.nombre}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                  <span className="uppercase font-semibold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[9px]">
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
                      id="resico"
                      type="checkbox"
                      checked={resicoAplicado}
                      onChange={(e) => setResicoAplicado(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="resico" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Aplica RESICO
                    </label>
                  </div>
                </div>
            </div>

            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Folio Factura</label>
                  <input
                    type="text"
                    value={nuevaFactura.folio_factura}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, folio_factura: e.target.value})}
                    placeholder="Ej. F-12345"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    value={nuevaFactura.fecha_emision}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, fecha_emision: e.target.value})}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Importe</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevaFactura.importe}
                      onChange={(e) => setNuevaFactura({...nuevaFactura, importe: e.target.value})}
                      placeholder="0.00"
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</label>
                  <select
                    value={nuevaFactura.estado}
                    onChange={(e) => setNuevaFactura({...nuevaFactura, estado: e.target.value})}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="Aceptada">Aceptada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                </div>
              </div>
              
              {nuevaFactura.estado === 'Rechazada' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-medium text-red-500 dark:text-red-400 mb-1">Motivo del Rechazo</label>
                    <input
                      type="text"
                      value={nuevaFactura.motivo_rechazo}
                      onChange={(e) => setNuevaFactura({...nuevaFactura, motivo_rechazo: e.target.value})}
                      placeholder="Ej. Datos fiscales incorrectos"
                      className="w-full rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-500 dark:text-amber-400 mb-1">Observación (Qué cambiar)</label>
                    <input
                      type="text"
                      value={nuevaFactura.observacion}
                      onChange={(e) => setNuevaFactura({...nuevaFactura, observacion: e.target.value})}
                      placeholder="Ej. Corregir código postal a 90640"
                      className="w-full rounded-md border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:text-white"
                    />
                  </div>
                </div>
              )}
              
              {mostrarDescuento && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descuento Aplicado</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={nuevaFactura.descuento}
                        onChange={(e) => setNuevaFactura({...nuevaFactura, descuento: e.target.value})}
                        placeholder="0.00"
                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={() => setMostrarDescuento(!mostrarDescuento)}
                  className="inline-flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-sm font-medium rounded-md transition-colors"
                >
                  {mostrarDescuento ? 'Ocultar Descuento' : 'Agregar Descuento'}
                </button>
                <button
                  onClick={handleAddFactura}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar a la lista
                </button>
              </div>
            </div>

            {/* List of Invoices added */}
            {facturas.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desc.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IVA</th>
                      {resicoAplicado && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RESICO</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detalles</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {facturas.map((f, idx) => {
                      const gran_total = parseFloat(f.importe || 0);
                      const descuento = parseFloat(f.descuento || 0);
                      const subtotal_base = resicoAplicado ? (gran_total / 1.1475) : (gran_total / 1.16);
                      const subtotal = subtotal_base + descuento;
                      const iva = subtotal_base * 0.16;
                      const resico = resicoAplicado ? (subtotal_base * 0.0125) : 0;
                      
                      return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            {f.folio_factura}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{f.fecha_emision}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                          {descuento > 0 ? `-$${descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        {resicoAplicado && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-600 dark:text-amber-400">-${resico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">${gran_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            f.estado === 'Aceptada' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {f.estado === 'Aceptada' ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                            {f.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                          {f.estado === 'Rechazada' ? (
                            <span title={`${f.motivo_rechazo} - ${f.observacion}`}>
                              {f.motivo_rechazo || 'Sin motivo'}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveFactura(idx)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Total Descuentos:</td>
                      <td className="px-4 py-3 text-left text-sm font-bold text-red-600 dark:text-red-400">
                        {totalDescuento > 0 ? `-$${totalDescuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td colSpan={resicoAplicado ? 2 : 1} className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">Gran Total a Pagar:</td>
                      <td className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        ${totalImporte.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td colSpan="3" className="px-4 py-3 text-left text-sm text-gray-500 dark:text-gray-400">
                        {facturas.length} factura(s)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay facturas</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Agrega las facturas usando el formulario superior.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => {
                setFacturas([]);
                setOrigenId('');
      setBusquedaEntidad('');
      setEntidadSeleccionada(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Limpiar Todo
            </button>
            <button
              onClick={handleSaveAndPrint}
              disabled={loading || facturas.length === 0 || !origenId}
              className={`inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors ${
                loading || facturas.length === 0 || !origenId
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in duration-300">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historial de Contra Recibos</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por folio o proveedor..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 block w-64 bg-gray-50 dark:bg-gray-700 dark:text-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor/Taller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Facturas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {historial.length > 0 ? historial.map((cr) => (
                    <tr key={cr.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {cr.folio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(cr.fecha_creacion).toLocaleDateString('es-MX', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {cr.proveedor_nombre || cr.taller_nombre || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {cr.total_facturas}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${parseFloat(cr.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => downloadPDF(cr.id, cr.folio)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center justify-end w-full"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
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
