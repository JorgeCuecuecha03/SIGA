import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Ticket as TicketIcon, 
  Upload, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  FileText,
  Store,
  Info,
  Search,
  FilePlus,
  Archive
} from 'lucide-react';
import notify from '../utils/notifications';
import { PDFDocument } from 'pdf-lib';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AltaTicket = ({ onSuccess, onClose }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [variados, setVariados] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: '',
    monto: '',
    unidad: '',
    caja: '',
    variado: '',
    producto: '',
    taller: '',
    proveedor: '',
    descripcion: '',
    categoria: 'Otro',
    unidades: []
  });
  const [busquedaUnidad, setBusquedaUnidad] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [generatedFolio, setGeneratedFolio] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [escanearRemision, setEscanearRemision] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('vehiculos/'),
      api.get('productos/'),
      api.get('talleres/'),
      api.get('proveedores/'),
      api.get('cajas/'),
      api.get('variados/')
    ])
    .then(([vehiculosRes, productosRes, talleresRes, proveedoresRes, cajasRes, variadosRes]) => {
      setVehiculos(vehiculosRes.data);
      setProductos(productosRes.data);
      setTalleres(talleresRes.data);
      setProveedores(proveedoresRes.data);
      setCajas(cajasRes.data);
      setVariados(variadosRes.data);
      setEntidades([
        ...talleresRes.data.map(t => ({ ...t, tipo: 'taller' })),
        ...proveedoresRes.data.map(p => ({ ...p, tipo: 'proveedor' }))
      ]);
    })
    .catch(err => console.error("Error cargando datos:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'entidad' && value) {
      const [tipo, id] = value.split('_');
      const entidadObj = entidades.find(e => e.tipo === tipo && e.id === parseInt(id));
      setFormData(prev => ({
        ...prev,
        taller: tipo === 'taller' ? id : '',
        proveedor: tipo === 'proveedor' ? id : '',
        categoria: tipo === 'taller' ? 'Mantenimiento' : (entidadObj?.categoria || prev.categoria || 'Otro')
      }));
      return;
    } else if (name === 'entidad' && !value) {
      setFormData(prev => ({ ...prev, taller: '', proveedor: '' }));
      return;
    }
    if (name === 'unidad' && value) {
      if (value.startsWith('caja_')) {
        const cajaId = value.split('_')[1];
        setFormData(prev => ({
          ...prev,
          caja: cajaId,
          variado: '',
          unidad: '',
          unidades: []
        }));
      } else if (value.startsWith('variado_')) {
        const variadoId = value.split('_')[1];
        setFormData(prev => ({
          ...prev,
          variado: variadoId,
          caja: '',
          unidad: '',
          unidades: []
        }));
      } else {
        const vId = parseInt(value.split('_')[1] || value);
        setFormData(prev => ({
          ...prev,
          unidad: vId.toString(),
          unidades: [vId],
          caja: '',
          variado: ''
        }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (scannedFiles.length >= 20) {
        notify.error('Límite de documentos alcanzado (máximo 20 páginas)');
        return;
      }
      setScannedFiles(prev => [...prev, file]);
    }
  };

  const handleScan = async (profile = 'brother') => {
    if (scannedFiles.length >= 20) {
      notify.error('Límite de escaneo alcanzado (máximo 20 páginas)');
      return;
    }
    setScanning(true);
    try {
      const response = await fetch(`http://localhost:3001/api/scan?profile=${profile}`);
      if (!response.ok) throw new Error('Fallo al conectar con el escáner');
      const blob = await response.blob();
      const file = new File([blob], `escaneo_${Date.now()}.pdf`, { type: "application/pdf" });
      setScannedFiles(prev => [...prev, file]);
      notify.success('Página escaneada correctamente');
    } catch (err) {
      notify.error('Fallo al conectar con el escáner. Verifica NAPS2.');
    } finally {
      setScanning(false);
    }
  };

  const mergePDFs = async (files) => {
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        if (file.type === 'application/pdf') {
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } else if (file.type.startsWith('image/')) {
          let image;
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await mergedPdf.embedJpg(arrayBuffer);
          } else if (file.type === 'image/png') {
            image = await mergedPdf.embedPng(arrayBuffer);
          } else {
            continue; // Ignorar otros tipos de imagen
          }
          
          // Crear una página con las dimensiones de la imagen
          const page = mergedPdf.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }
      const mergedPdfBytes = await mergedPdf.save();
      return new File([mergedPdfBytes], `remision_${Date.now()}.pdf`, { type: "application/pdf" });
    } catch (err) {
      console.error("Error al unir documentos:", err);
      throw new Error("No se pudieron unir los documentos. Asegúrate de que sean PDFs o imágenes válidas.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!window.confirm('¿Estás seguro de registrar este ticket y generar el folio?')) return;
    setLoading(true);
    setGeneratedFolio('');

    const data = new FormData();
    data.append('fecha', formData.fecha);
    data.append('monto', formData.monto);
    if (formData.unidad) data.append('unidad', formData.unidad);
    if (formData.caja) data.append('caja', formData.caja);
    if (formData.variado) data.append('variado', formData.variado);
    if (formData.producto) data.append('producto', formData.producto);
    if (formData.taller) data.append('taller', formData.taller);
    if (formData.proveedor) data.append('proveedor', formData.proveedor);
    data.append('descripcion', formData.descripcion || '');
    data.append('categoria', formData.categoria);
    
    formData.unidades.forEach(uId => {
      data.append('unidades', uId);
    });

    // Procesar archivos escaneados
    if (scannedFiles.length > 0) {
      if (scannedFiles.length === 1) {
        data.append('archivo_escaneado', scannedFiles[0]);
      } else {
        try {
          const mergedFile = await mergePDFs(scannedFiles);
          data.append('archivo_escaneado', mergedFile);
        } catch (err) {
          notify.error(err.message);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const res = await api.post('tickets/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify.success(`Ticket registrado: ${res.data.folio_interno}`);
      setGeneratedFolio(res.data.folio_interno);
      
      if (onSuccess) {
        onSuccess(res.data);
      }
      setFormData({ fecha: '', monto: '', unidad: '', caja: '', variado: '', producto: '', taller: '', proveedor: '', descripcion: '', categoria: 'Otro', unidades: [] });
      setScannedFiles([]);
      setBusquedaUnidad('');
    } catch (err) {
      console.error("Error al guardar ticket:", err);
      notify.error("Error al guardar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter(v => 
    v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
  );

  const cajasFiltradas = cajas.filter(c => 
    c.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    c.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
  );

  const variadosFiltrados = variados.filter(v => 
    v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    v.tipo?.toLowerCase().includes(busquedaUnidad.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600/10 p-3 rounded-2xl">
            <TicketIcon className="text-amber-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Registro de Ticket / Nota</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ingresa los datos para generar el folio de seguimiento físico.</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={escanearRemision ? "grid grid-cols-1 lg:grid-cols-4 gap-6 items-start w-full" : "max-w-2xl mx-auto space-y-6 w-full"}>
        <div className={escanearRemision ? "lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl w-full" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl w-full"}>
          <div className="space-y-4">
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 p-4 rounded-xl mb-4 shadow-sm">
              <p className="text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Folio del Sistema</p>
              <p className="text-slate-900 dark:text-white text-lg font-black font-mono">SE GENERARÁ AL GUARDAR</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 italic">Este folio deberá anotarse en la nota física para su rastreo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Fecha del Ticket
                </label>
                <input
                  required
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Taller / Proveedor
                </label>
                <select
                  required
                  name="entidad"
                  value={formData.taller ? `taller_${formData.taller}` : formData.proveedor ? `proveedor_${formData.proveedor}` : ''}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Selecciona Taller o Proveedor...</option>
                  {entidades.map(e => (
                    <option key={`${e.tipo}_${e.id}`} value={`${e.tipo}_${e.id}`} className="bg-white dark:bg-slate-900">
                      {e.nombre} ({e.tipo === 'taller' ? 'Taller' : 'Proveedor'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Info size={14} /> Descripción Breve
              </label>
              <input
                required
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej. Cambio de balatas delanteras"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
              />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Truck size={14} /> Unidad o Caja Relacionada
                </label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Eco o placas..."
                    value={busquedaUnidad}
                    onChange={(e) => {
                      setBusquedaUnidad(e.target.value);
                      setMostrarDropdownUnidad(true);
                    }}
                    onFocus={() => setMostrarDropdownUnidad(true)}
                    onBlur={() => setMostrarDropdownUnidad(false)}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-amber-500/50 outline-none transition-all shadow-sm"
                  />
                </div>
                <select
                  name="unidad"
                  value={formData.caja ? `caja_${formData.caja}` : formData.variado ? `variado_${formData.variado}` : formData.unidad ? `vehiculo_${formData.unidad}` : ''}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer text-sm font-bold"
                >
                  <option value="" className="bg-white dark:bg-slate-900">
                    {busquedaUnidad 
                      ? `Resultados (${vehiculosFiltrados.length + cajasFiltradas.length + variadosFiltrados.length})` 
                      : 'Seleccionar...'}
                  </option>
                  
                  {vehiculosFiltrados.length > 0 && (
                    <optgroup label="Unidades" className="bg-white dark:bg-slate-900 text-slate-400 font-bold text-xs">
                      {vehiculosFiltrados.map(v => (
                        <option key={`vehiculo_${v.id}`} value={`vehiculo_${v.id}`} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-normal">{v.numero_economico}</option>
                      ))}
                    </optgroup>
                  )}
                  
                  {cajasFiltradas.length > 0 && (
                    <optgroup label="Remolques / Cajas" className="bg-white dark:bg-slate-900 text-indigo-400 font-bold text-xs">
                      {cajasFiltradas.map(c => (
                        <option key={`caja_${c.id}`} value={`caja_${c.id}`} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-normal">{c.numero_economico} (Caja)</option>
                      ))}
                    </optgroup>
                  )}

                  {variadosFiltrados.length > 0 && (
                    <optgroup label="Vehículos Variados / Maquinaria" className="bg-white dark:bg-slate-900 text-emerald-400 font-bold text-xs">
                      {variadosFiltrados.map(v => (
                        <option key={`variado_${v.id}`} value={`variado_${v.id}`} className="bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-normal">{v.numero_economico} ({v.tipo || 'Variado'})</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {(formData.unidades.length > 0 || formData.caja || formData.variado) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.unidades.map(uId => {
                      const v = vehiculos.find(veh => veh.id === uId);
                      return v ? (
                        <div key={`vehiculo-${uId}`} className="flex items-center gap-2 bg-amber-600/20 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in zoom-in-95 duration-200">
                          <span>Unidad: {v.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => {
                              const newUnidades = prev.unidades.filter(id => id !== uId);
                              return {
                                ...prev,
                                unidades: newUnidades,
                                unidad: newUnidades.length > 0 ? newUnidades[0].toString() : ''
                              };
                            })}
                            className="hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                    {formData.caja && (() => {
                      const c = cajas.find(caj => caj.id === parseInt(formData.caja));
                      return c ? (
                        <div key={`caja-${c.id}`} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-500 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in zoom-in-95 duration-200">
                          <span>Remolque: {c.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, caja: '' }))}
                            className="hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })()}
                    {formData.variado && (() => {
                      const v = variados.find(varObj => varObj.id === parseInt(formData.variado));
                      return v ? (
                        <div key={`variado-${v.id}`} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold animate-in fade-in zoom-in-95 duration-200">
                          <span>Variado: {v.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, variado: '' }))}
                            className="hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                {formData.unidades.length > 1 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-2 italic flex items-center gap-1">
                    <Info size={10} /> Nota compartida entre {formData.unidades.length} unidades.
                  </p>
                )}
              </div>
            </div>          </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Tag size={14} /> Categoría del Ticket
                </label>
                <select
                  required
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Otro" className="bg-white dark:bg-slate-900">Selecciona una categoría...</option>
                  <option value="Mantenimiento" className="bg-white dark:bg-slate-900">Mantenimiento</option>
                  <option value="Refacciones" className="bg-white dark:bg-slate-900">Refacciones</option>
                  <option value="Administrativo" className="bg-white dark:bg-slate-900">Administrativo</option>
                  <option value="Llantas" className="bg-white dark:bg-slate-900">Llantas</option>
                  <option value="Operativo" className="bg-white dark:bg-slate-900">Operativo</option>
                  <option value="Combustible" className="bg-white dark:bg-slate-900">Combustible</option>
                  <option value="Otro" className="bg-white dark:bg-slate-900">Otro</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl mt-4">
              <input
                type="checkbox"
                id="escanearRemision"
                checked={escanearRemision}
                onChange={(e) => {
                  setEscanearRemision(e.target.checked);
                  if (!e.target.checked) {
                    setScannedFiles([]);
                  }
                }}
                className="w-5 h-5 accent-amber-500 rounded border-slate-350 dark:border-slate-750 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="escanearRemision" className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                ¿Desea escanear o adjuntar una remisión a este ticket?
              </label>
            </div>

            {!escanearRemision && (
              <button
                disabled={loading}
                type="submit"
                className="w-full mt-6 py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Spinner /> : <TicketIcon size={24} />}
                <span className="text-lg">REGISTRAR Y GENERAR FOLIO</span>
              </button>
            )}
          </div>
        </div>

        {escanearRemision && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-amber-500 transition-colors relative min-h-[250px] shadow-sm">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
                accept="image/*,.pdf"
                disabled={scannedFiles.length >= 20}
              />
              
              <div className="bg-amber-600/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <Upload className="text-amber-500" size={24} />
              </div>
              
              {scannedFiles.length > 0 ? (
                <div className="w-full space-y-3 relative z-20">
                  <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <CheckCircle size={12} /> {scannedFiles.length}/20 {scannedFiles.length === 1 ? 'Documento' : 'Documentos'} Listos
                  </p>
                  
                  <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {scannedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2 rounded-xl group/item hover:border-amber-500/50 transition-all">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="bg-amber-600/10 p-1.5 rounded-lg">
                            <FilePlus size={12} className="text-amber-500" />
                          </div>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                            {file.name}
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setScannedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-600 hover:text-rose-500 p-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handleScan('brother')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en alimentador"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>ALIMENTADOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScan('brother1')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 text-[10px] font-black rounded-lg border border-amber-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en cristal"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>CRISTAL</span>
                    </button>
                  </div>
                    
                    <button 
                      type="button" 
                      onClick={() => setScannedFiles([])}
                      className="text-rose-400 text-[9px] font-bold hover:underline uppercase tracking-tighter"
                    >
                      Limpiar todo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 relative z-20 w-full px-4">
                  <p className="text-slate-900 dark:text-white font-semibold text-base">Adjuntar Remisión</p>
                  <div className="relative flex items-center py-1">
                      <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                      <span className="flex-shrink-0 mx-3 text-slate-400 dark:text-slate-600 text-[10px] font-bold">O</span>
                      <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handleScan('brother')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 dark:hover:bg-amber-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                      title="Escanear en alimentador"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>ALIMENTADOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScan('brother1')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 dark:hover:bg-amber-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                      title="Escanear en cristal"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>CRISTAL</span>
                    </button>
                  </div>
                  <a
                    href="/agente_escaner.zip"
                    download
                    className="text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 underline text-[10px] font-bold block mt-2 text-center"
                  >
                    ¿No tienes el asistente local? Descárgalo aquí
                  </a>
                </div>
              )}
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? <Spinner /> : <TicketIcon size={24} />}
              <span className="text-lg">REGISTRAR Y GENERAR FOLIO</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AltaTicket;
