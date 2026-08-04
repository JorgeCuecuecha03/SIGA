import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { 
  Droplets, 
  Calendar, 
  DollarSign, 
  Plus, 
  Save, 
  Trash2, 
  Truck, 
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Activity,
  History,
  Clock,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  Loader2,
  Edit2,
  Check,
  XCircle,
  PlusCircle,
  Upload,
  FilePlus,
  Eye,
  Calculator
} from 'lucide-react';
import notify from '../utils/notifications';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';


const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const SumDesgloseHoverTooltip = ({ desglose, children }) => {
  const [show, setShow] = useState(false);

  if (!desglose || !Array.isArray(desglose) || desglose.length <= 1) {
    return children;
  }

  const total = desglose.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-900 text-white border border-slate-700/80 rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 pb-1 border-b border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Calculator size={12} /> Desglose de Suma
            </span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
              {desglose.length} tickets
            </span>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
            {desglose.map((val, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono py-0.5 px-1 rounded hover:bg-slate-800/50">
                <span className="text-[10px] text-slate-400 font-sans font-medium">Ticket {idx + 1}:</span>
                <span className="text-slate-200 font-bold">{parseFloat(val).toFixed(3)} L</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-emerald-400 font-mono">
            <span className="text-[10px] text-slate-400 uppercase font-sans">Total Sumado:</span>
            <span>{total.toFixed(3)} L</span>
          </div>

          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

const FuelSelect = ({ value, onChange, rowIndex, maxRows, handleGridKeyDown }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'magna', label: 'Magna' },
    { value: 'premium', label: 'Premium' },
    { value: 'electrico', label: 'Eléctrico' },
    { value: 'gas_lp', label: 'Gas LP' }
  ];
  const [highlightedIndex, setHighlightedIndex] = useState(
    Math.max(0, options.findIndex(o => o.value === value))
  );

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(Math.max(0, options.findIndex(o => o.value === value)));
    }
  }, [isOpen, value]);

  const handleKeyDown = (e) => {
    if (isOpen) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(options.length - 1, prev + 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // If they want to move horizontally while it's open
        e.preventDefault();
        setIsOpen(false);
        handleGridKeyDown(e, rowIndex, 'combustible', maxRows);
      }
    } else {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleGridKeyDown(e, rowIndex, 'combustible', maxRows);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  return (
    <div className="relative min-w-[120px]">
      <input 
        type="text"
        readOnly
        data-row={rowIndex}
        data-col="combustible"
        value={options.find(o => o.value === value)?.label || ''}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-left"
      />
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
          {options.map((opt, i) => (
            <div 
              key={opt.value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${i === highlightedIndex ? 'bg-blue-500 text-white' : 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Combustibles = () => {
  const { user } = useContext(AuthContext);
  const isLector = user?.rol === 'lector_gastos';

  const [fecha, setFecha] = useState('');
  const [precios, setPrecios] = useState({
    magna: '',
    premium: '',
    diesel: '',
    electrico: '0',
    gas_lp: ''
  });
  const [unidades, setUnidades] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  const [busquedaEspecial, setBusquedaEspecial] = useState('');
  const [busquedaEspecialFocus, setBusquedaEspecialFocus] = useState(false);
  const [activeTab, setActiveTab] = useState(isLector ? 'historial' : 'nuevo'); // 'nuevo', 'especial' o 'historial'
  const [historialTipo, setHistorialTipo] = useState('normal');
  const [historialEspecial, setHistorialEspecial] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fechaHistorial, setFechaHistorial] = useState(new Date().toISOString().split('T')[0]);

  // State for Evidencias Gas
  const [evidenciasGas, setEvidenciasGas] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
    const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [evidenciaForm, setEvidenciaForm] = useState({ folio_factura: '', monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], fecha_factura: new Date().toISOString().split('T')[0], archivo_escaneado: null });
  const [selectedEvidencias, setSelectedEvidencias] = useState([]);
  const [editingEvidenciaId, setEditingEvidenciaId] = useState(null);

  // State for Special Load
  const [cargaEspecial, setCargaEspecial] = useState({
    unidad: '',
    fecha: '',
    tipo_combustible: 'diesel',
    precio_unitario: '',
    litros: '',
    kilometraje: '',
    ignorar_kilometraje: false,
    km_equivocado: false,
    ultimo_kilometraje: 0
  });
  const [cargasEspecialesList, setCargasEspecialesList] = useState([]);
  
  // State for Calculator
  const [calculadoraIndex, setCalculadoraIndex] = useState(null);
  const [calculadoraValores, setCalculadoraValores] = useState(['', '']);
  
  // State for Block Details Modal
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isEditingBlock, setIsEditingBlock] = useState(false);
  const [isEditingBlockDate, setIsEditingBlockDate] = useState(false);
  const [editBlockDate, setEditBlockDate] = useState('');

  // State for adding/editing loads inside a block
  const [editingCargaId, setEditingCargaId] = useState(null);
  const [editCargaData, setEditCargaData] = useState({});
  const [showAddCarga, setShowAddCarga] = useState(false);
  const [newCargaData, setNewCargaData] = useState({
    unidad: '',
    fecha: '',
    tipo_combustible: 'diesel',
    litros: '',
    precio_unitario: '',
    kilometraje: '',
    ignorar_kilometraje: false,
    ignorar_kilometraje: false,
    km_equivocado: false
  });
  const [busquedaNuevaCarga, setBusquedaNuevaCarga] = useState('');
  const [busquedaNuevaCargaFocus, setBusquedaNuevaCargaFocus] = useState(false);
  const [busquedaLitros, setBusquedaLitros] = useState('');

  // States for Totalizador
  const [totalizadorData, setTotalizadorData] = useState([]);
  const [loadingTotalizador, setLoadingTotalizador] = useState(false);
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const offset = (day + 2) % 7; // Friday is 5. offset from Friday
    return new Date(date.setDate(date.getDate() - offset));
  };
  const getEndOfWeek = (d) => {
    const date = new Date(getStartOfWeek(d));
    return new Date(date.setDate(date.getDate() + 6));
  };
  const [totalizadorDateRef, setTotalizadorDateRef] = useState(new Date());
  
  const formatDateISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchUnidades();
    fetchPreciosDia(fecha);
  }, [fecha]);

  useEffect(() => {
    if (activeTab === 'evidencia') fetchEvidenciasGas();
      if (activeTab === 'historial') {
      if (historialTipo === 'normal') {
        fetchHistorial();
      } else if (historialTipo === 'especial') {
        fetchHistorialEspecial();
      } else if (historialTipo === 'totalizador') {
        fetchTotalizador();
      }
    }
  }, [activeTab, historialTipo, fechaHistorial, totalizadorDateRef]);

  useEffect(() => {
    const fetchKmAnterior = async () => {
      if (!cargaEspecial.unidad || !cargaEspecial.fecha) return;
      
      const is_variado = cargaEspecial.unidad.startsWith('v-');
      const unidadId = parseInt(cargaEspecial.unidad.split('-')[1]);
      
      try {
        const res = await api.get(`cargas-combustible/km_anterior/?unidad_id=${unidadId}&is_variado=${is_variado}&fecha=${cargaEspecial.fecha}`);
        let km = res.data.km_anterior || 0;
        
        // Revisar si ya hay cargas de esta unidad en la lista local (aún no guardadas en BD)
        const cargasLocales = cargasEspecialesList.filter(c => 
          c.unidad === unidadId && 
          c.is_variado === is_variado && 
          new Date(c.fecha) <= new Date(cargaEspecial.fecha) &&
          !c.ignorar_kilometraje &&
          c.kilometraje
        );

        if (cargasLocales.length > 0) {
          // Ordenar cronológicamente descendente para agarrar la más cercana a la fecha seleccionada
          cargasLocales.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          km = parseInt(cargasLocales[0].kilometraje);
        }
        
        setCargaEspecial(prev => {
          // Evitar bucles infinitos si no cambia
          if (prev.ultimo_kilometraje === km) return prev;
          
          // Si el kilometraje actual está vacío o era el default global de la unidad, lo sobreescribimos
          const unitGlobalKm = prev.is_variado 
            ? (unidades.find(u => `v-${u.id}` === prev.unidad)?.ultimo_kilometraje || 0)
            : (unidades.find(u => `t-${u.id}` === prev.unidad)?.ultimo_kilometraje || 0);
            
          const shouldUpdateInput = prev.km_equivocado || prev.kilometraje === '' || prev.kilometraje === unitGlobalKm;
          
          return {
            ...prev,
            ultimo_kilometraje: km,
            kilometraje: shouldUpdateInput ? km : prev.kilometraje
          };
        });
      } catch (err) {
        console.error("Error fetching km anterior", err);
      }
    };
    
    fetchKmAnterior();
  }, [cargaEspecial.unidad, cargaEspecial.fecha, cargasEspecialesList]);

  const fetchHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get(`bloques/por_dia/?fecha=${fechaHistorial}`);
      setHistorial(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching history", err);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchHistorialEspecial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get('cargas-combustible/historial_especiales/');
      setHistorialEspecial(res.data.results || res.data);
    } catch (err) {
      console.error("Error fetching special history", err);
      setHistorialEspecial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchTotalizador = async () => {
    setLoadingTotalizador(true);
    try {
      const start = getStartOfWeek(totalizadorDateRef);
      const end = getEndOfWeek(totalizadorDateRef);
      const res = await api.get(`cargas-combustible/totalizador_unidades/?fecha_inicio=${formatDateISO(start)}&fecha_fin=${formatDateISO(end)}`);
      setTotalizadorData(res.data);
    } catch(err) {
      console.error(err);
      notify.error("Error al cargar totalizador");
    } finally {
      setLoadingTotalizador(false);
    }
  };

  const fetchEvidenciasGas = async () => {
    setLoadingEvidencias(true);
    try {
      const res = await api.get('evidencias-gas/');
      setEvidenciasGas(res.data.results || res.data);
    } catch(err) {
      console.error(err);
      notify.error("Error al cargar evidencias de gas");
    } finally {
      setLoadingEvidencias(false);
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
            continue;
          }
          
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
      return new File([mergedPdfBytes], `evidencia_${evidenciaForm.folio_factura || 'escaneada'}.pdf`, { type: "application/pdf" });
    } catch (err) {
      console.error("Error al unir documentos:", err);
      throw new Error("No se pudieron unir los documentos. Asegúrate de que sean PDFs o imágenes válidas.");
    }
  };

  const handleEvidenciaFileChangeMulti = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (scannedFiles.length >= 20) {
        notify.error('Límite de documentos alcanzado (máximo 20 páginas)');
        return;
      }
      setScannedFiles(prev => [...prev, file]);
    }
  };

  const handleEvidenciaFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenciaForm({ ...evidenciaForm, archivo_escaneado: e.target.files[0] });
    }
  };

  const handleSubmitEvidencia = async (e) => {
    e.preventDefault();
    if(!window.confirm('¿Estás seguro de registrar esta evidencia?')) return;
    if(!evidenciaForm.folio_factura || !evidenciaForm.monto || !evidenciaForm.fecha) {
        notify.info("Completa los campos obligatorios");
        return;
    }
    const formData = new FormData();
    formData.append('folio_factura', evidenciaForm.folio_factura);
    formData.append('monto', evidenciaForm.monto);
    formData.append('fecha', evidenciaForm.fecha);
    if(evidenciaForm.fecha_factura) formData.append('fecha_factura', evidenciaForm.fecha_factura);
    if(evidenciaForm.descripcion) formData.append('descripcion', evidenciaForm.descripcion);
    if (scannedFiles.length > 0) {
      if (scannedFiles.length === 1) {
        formData.append('archivo_escaneado', scannedFiles[0]);
      } else {
        try {
          const mergedFile = await mergePDFs(scannedFiles);
          formData.append('archivo_escaneado', mergedFile);
        } catch (err) {
          notify.error(err.message);
          setLoading(false);
          return;
        }
      }
    } else if (evidenciaForm.archivo_escaneado && typeof evidenciaForm.archivo_escaneado !== 'string') {
       formData.append('archivo_escaneado', evidenciaForm.archivo_escaneado);
    }

    setLoading(true);
    try {
      if (editingEvidenciaId) {
        await api.patch(`evidencias-gas/${editingEvidenciaId}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        notify.success("Evidencia actualizada");
      } else {
        await api.post('evidencias-gas/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        notify.success("Evidencia registrada");
      }
      handleCancelEditEvidencia();
      fetchEvidenciasGas();
    } catch(err) {
      notify.error(editingEvidenciaId ? "Error al actualizar evidencia" : "Error al registrar evidencia");
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvidencia = (ev) => {
    setEditingEvidenciaId(ev.id);
    setEvidenciaForm({
      folio_factura: ev.folio_factura,
      monto: ev.monto,
      descripcion: ev.descripcion || '',
      fecha: ev.fecha,
      fecha_factura: ev.fecha_factura || new Date().toISOString().split('T')[0],
      archivo_escaneado: ev.archivo_escaneado
    });
    setScannedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditEvidencia = () => {
    setEditingEvidenciaId(null);
    setEvidenciaForm({ folio_factura: '', monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], fecha_factura: new Date().toISOString().split('T')[0], archivo_escaneado: null });
    setScannedFiles([]);
  };

  const handleDeleteEvidencia = async (id) => {
    if(!window.confirm("¿Eliminar esta evidencia?")) return;
    try {
      await api.delete(`evidencias-gas/${id}/`);
      notify.success("Evidencia eliminada");
      fetchEvidenciasGas();
    } catch(err) {
      notify.error("Error al eliminar evidencia");
    }
  };

  const handlePrevWeek = () => {
    const newDate = new Date(totalizadorDateRef);
    newDate.setDate(newDate.getDate() - 7);
    setTotalizadorDateRef(newDate);
  };
  const handleNextWeek = () => {
    const newDate = new Date(totalizadorDateRef);
    newDate.setDate(newDate.getDate() + 7);
    setTotalizadorDateRef(newDate);
  };

  const generarPDFTotalizador = () => {
    const doc = new jsPDF();
    const start = getStartOfWeek(totalizadorDateRef);
    const end = getEndOfWeek(totalizadorDateRef);
    const dateStr = `${start.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - ${end.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}`;

    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text("Reporte de Totalizador de Combustibles", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Semana del: ${dateStr}`, 14, 28);
    
    doc.text(`Fecha de impresión: ${new Date().toLocaleString('es-MX')}`, 14, 34);

    const tableBody = totalizadorData.map(item => [
      item.unidad_nombre,
      item.ultimo_km ? item.ultimo_km.toLocaleString('en-US') : "-",
      item.cantidad_cargas,
      parseFloat(item.total_litros).toFixed(3) + " L",
      "$" + parseFloat(item.total_monto).toLocaleString('es-MX', {minimumFractionDigits:2})
    ]);

    const granTotalLitros = totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0);
    const granTotalMonto = totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0);

    tableBody.push([
      "GRAN TOTAL",
      "-",
      totalizadorData.reduce((acc, curr) => acc + curr.cantidad_cargas, 0),
      granTotalLitros.toFixed(3) + " L",
      "$" + granTotalMonto.toLocaleString('es-MX', {minimumFractionDigits:2})
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Unidad', 'Último KM', 'Total Cargas', 'Total Litros', 'Monto Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }, // bg-blue-900
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      didParseCell: function (data) {
        if (data.row.index === tableBody.length - 1) {
           data.cell.styles.fontStyle = 'bold';
           data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    doc.save(`Totalizador_Combustible_${dateStr}.pdf`);
  };

  const toggleEvidenciaSelection = (id) => {
    setSelectedEvidencias(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const toggleAllEvidencias = () => {
    if (selectedEvidencias.length === evidenciasGas.length && evidenciasGas.length > 0) {
      setSelectedEvidencias([]);
    } else {
      setSelectedEvidencias(evidenciasGas.map(e => e.id));
    }
  };

  const exportarPDFEvidencias = () => {
    const selectedEvidenciasData = evidenciasGas.filter(e => selectedEvidencias.includes(e.id));
    if (selectedEvidenciasData.length === 0) {
      notify.warning('Selecciona al menos una evidencia para el reporte');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.text("REPORTE DE EVIDENCIAS DE GAS", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text("SIGA - Sistema de Gestión de Autotransporte", pageWidth / 2, 27, { align: 'center' });
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(15, 38, pageWidth - 15, 38);

    const totalMontoSelected = selectedEvidenciasData.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de Evidencias: ${selectedEvidenciasData.length}`, 15, 48);
    doc.text(`Suma Total: $${totalMontoSelected.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, 15, 54);

    const tableData = selectedEvidenciasData.map((ev) => [
      ev.folio_factura,
      ev.fecha,
      ev.fecha_factura || 'N/A',
      ev.descripcion || 'Sin descripción',
      `$${parseFloat(ev.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['Folio Factura', 'Fecha Carga', 'Fecha Factura', 'Descripción', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        4: { halign: 'right' }
      },
      foot: [[
        'TOTAL',
        '',
        '',
        '',
        `$${totalMontoSelected.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    doc.save(`Reporte_Evidencias_Gas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportarPDFTotalizadorGas = async () => {
    const selectedEvidenciasData = evidenciasGas.filter(e => selectedEvidencias.includes(e.id));
    if (selectedEvidenciasData.length === 0) {
      notify.warning('Selecciona al menos una evidencia para el reporte');
      return;
    }
    
    // Extraer fechas únicas de las evidencias seleccionadas
    const fechas = [...new Set(selectedEvidenciasData.map(e => e.fecha))];
    const fechasParam = fechas.join(',');

    try {
      setLoading(true);
      const res = await api.get(`cargas-combustible/totalizador_unidades/?fechas=${fechasParam}&tipo_combustible=gas_lp`);
      const data = res.data;

      if (!data || data.length === 0) {
        notify.info('No se encontraron cargas de Gas LP para las fechas seleccionadas');
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.setFont('helvetica', 'bold');
      doc.text("TOTALIZADOR DE GAS LP", pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text("SIGA - Sistema de Gestión de Autotransporte", pageWidth / 2, 27, { align: 'center' });
      doc.text(`Fechas: ${fechas.join(', ')}`, pageWidth / 2, 33, { align: 'center' });
      
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(15, 38, pageWidth - 15, 38);

      const tableBody = data.map(item => [
        item.unidad_nombre,
        item.ultimo_km ? item.ultimo_km.toLocaleString('en-US') : "-",
        item.cantidad_cargas,
        parseFloat(item.total_litros).toFixed(3) + " L",
        "$" + parseFloat(item.total_monto).toLocaleString('es-MX', {minimumFractionDigits:2})
      ]);

      const granTotalLitros = data.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0);
      const granTotalMonto = data.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0);

      tableBody.push([
        "GRAN TOTAL",
        "-",
        data.reduce((acc, curr) => acc + curr.cantidad_cargas, 0),
        granTotalLitros.toFixed(3) + " L",
        "$" + granTotalMonto.toLocaleString('es-MX', {minimumFractionDigits:2})
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Unidad', 'Último KM', 'Total Cargas', 'Total Litros', 'Monto Total']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // bg-emerald-500
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        didParseCell: function (dataParse) {
          if (dataParse.row.index === tableBody.length - 1) {
             dataParse.cell.styles.fontStyle = 'bold';
             dataParse.cell.styles.fillColor = [241, 245, 249];
          }
        }
      });

      doc.save(`Totalizador_GasLP_${new Date().toISOString().split('T')[0]}.pdf`);
      notify.success("Reporte generado con éxito");
    } catch(err) {
      console.error(err);
      notify.error("Error al generar totalizador de gas");
    } finally {
      setLoading(false);
    }
  };

  const exportHistorialToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.text("REPORTE DE CARGA DE COMBUSTIBLES", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text("SIGA - Sistema de Gestión de Autotransporte", pageWidth / 2, 27, { align: 'center' });
    doc.text(`Fecha del Reporte: ${fechaHistorial}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(15, 38, pageWidth - 15, 38);

    // Extract all individual loads from blocks
    const todasLasCargas = historial.flatMap(b => b.cargas || []);

    // Summary Stats
    const totalLitros = todasLasCargas.reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const totalMonto = todasLasCargas.reduce((acc, curr) => acc + parseFloat(curr.monto_total), 0);
    const totalCargas = todasLasCargas.length;
    
    const dieselL = todasLasCargas.filter(c => c.tipo_combustible === 'diesel').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const magnaL = todasLasCargas.filter(c => c.tipo_combustible === 'magna').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const premiumL = todasLasCargas.filter(c => c.tipo_combustible === 'premium').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const gasLpL = todasLasCargas.filter(c => c.tipo_combustible === 'gas_lp').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const electricoKwh = todasLasCargas.filter(c => c.tipo_combustible === 'electrico').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);

    // Render Stats
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen de Cargas:", 15, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Cargas: ${totalCargas}`, 15, 51);
    doc.text(`Total Litros/Equiv: ${totalLitros.toFixed(2)} L`, 15, 56);
    doc.text(`Importe Total: $${totalMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 15, 61);

    doc.text(`Diésel: ${dieselL.toFixed(2)} L`, 110, 51);
    doc.text(`Magna: ${magnaL.toFixed(2)} L`, 110, 56);
    doc.text(`Premium: ${premiumL.toFixed(2)} L`, 110, 61);
    let yOffsetRight = 66;
    if (gasLpL > 0) {
      doc.text(`Gas LP: ${gasLpL.toFixed(2)} L`, 110, yOffsetRight);
      yOffsetRight += 5;
    }
    if (electricoKwh > 0) {
      doc.text(`Eléctrico: ${electricoKwh.toFixed(2)} kWh`, 110, yOffsetRight);
      yOffsetRight += 5;
    }
    
    let currentY = Math.max(68, yOffsetRight + 2);

    // Table Data
    const tableData = todasLasCargas.map((carga) => [
      carga.unidad_detalle,
      carga.es_especial ? 'Especial' : 'Normal',
      carga.tipo_combustible.toUpperCase(),
      `${carga.litros} L`,
      `$${parseFloat(carga.precio_unitario).toFixed(2)}`,
      `$${parseFloat(carga.monto_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      carga.ignorar_kilometraje 
        ? 'No reg.' 
        : (carga.km_equivocado 
            ? `[KM Equiv.] ${parseInt(carga.kilometraje).toLocaleString()} KM` 
            : `${parseInt(carga.kilometraje).toLocaleString()} KM`),
      carga.fecha
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Unidad', 'Tipo', 'Combustible', 'Litros/Cant', 'Precio Unit.', 'Monto Total', 'Kilometraje', 'Fecha/Hora']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      foot: [[
        'TOTALES',
        '',
        '',
        `${totalLitros.toFixed(2)} L`,
        '',
        `$${totalMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        '',
        ''
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    doc.save(`Reporte_Combustibles_${fechaHistorial}.pdf`);
  };

  const fetchUnidades = async () => {
    try {
      const [resUnidades, resVariados] = await Promise.all([
        api.get(`vehiculos/?fecha=${fecha}&nopaged=true`),
        api.get(`variados/?fecha=${fecha}&nopaged=true`)
      ]);
      const mappedUnidades = resUnidades.data.map(u => ({ ...u, is_variado: false }));
      const mappedVariados = resVariados.data.map(v => ({ 
        ...v, 
        id: v.id, 
        is_variado: true, 
        marca: v.tipo || 'Vehículo Variado' 
      }));
      const sortedUnidades = [...mappedUnidades, ...mappedVariados].sort((a, b) => 
        (a.numero_economico || '').localeCompare(b.numero_economico || '', undefined, { numeric: true, sensitivity: 'base' })
      );
      setUnidades(sortedUnidades);
    } catch (err) {
      console.error("Error fetching units", err);
    }
  };

  const fetchPreciosDia = async (date) => {
    if (!date) {
      setPrecios({ magna: '', premium: '', diesel: '', electrico: '0', gas_lp: '' });
      return;
    }
    try {
      const res = await api.get(`precios-combustible/por_fecha/?fecha=${date}`);
      if (res.data) {
        setPrecios({
          magna: res.data.precio_magna,
          premium: res.data.precio_premium,
          diesel: res.data.precio_diesel,
          electrico: res.data.precio_electrico || '0',
          gas_lp: res.data.precio_gas_lp || ''
        });
      } else {
        setPrecios({ magna: '', premium: '', diesel: '', electrico: '0', gas_lp: '' });
      }
    } catch (err) {
      setPrecios({ magna: '', premium: '', diesel: '', electrico: '0', gas_lp: '' });
    }
  };

  const handleAddUnidad = (unidad) => {
    if (cargas.find(c => c.unidad === unidad.id && c.is_variado === unidad.is_variado)) return;
    
    const newCargas = [...cargas, {
      unidad: unidad.id,
      is_variado: unidad.is_variado,
      numero_economico: unidad.numero_economico,
      placas: unidad.placas,
      tipo_combustible: unidad.tipo_combustible || 'diesel',
      litros: '',
      kilometraje: '',
      ultimo_kilometraje: unidad.ultimo_kilometraje || 0,
      ignorar_kilometraje: unidad.ignorar_kilometraje || false,
      km_equivocado: false
    }];
    newCargas.sort((a, b) => (a.numero_economico || '').localeCompare(b.numero_economico || '', undefined, { numeric: true, sensitivity: 'base' }));
    setCargas(newCargas);
    setBusqueda('');
  };

  const handleRemoveCarga = (index) => {
    const newCargas = [...cargas];
    newCargas.splice(index, 1);
    setCargas(newCargas);
  };

  const handleGridKeyDown = (e, rowIndex, colName, maxRows) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      
      const cols = ['combustible', 'litros', 'kilometraje', 'ignorar_km', 'km_equivocado'];
      let r = rowIndex;
      let cIdx = cols.indexOf(colName);
      
      if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
      if (e.key === 'ArrowDown') r = Math.min(maxRows - 1, r + 1);
      
      let nextInput = null;
      
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
         let step = e.key === 'ArrowLeft' ? -1 : 1;
         let nextCIdx = cIdx + step;
         while(nextCIdx >= 0 && nextCIdx < cols.length) {
            let el = document.querySelector(`input[data-row="${r}"][data-col="${cols[nextCIdx]}"]`);
            if (el && !el.disabled) {
                nextInput = el;
                break;
            }
            nextCIdx += step;
         }
      } else {
         nextInput = document.querySelector(`input[data-row="${r}"][data-col="${colName}"]`);
      }
      
      if (nextInput && !nextInput.disabled) {
        nextInput.focus();
        if (nextInput.type !== 'checkbox') nextInput.select();
      }
    }
  };

  const handleCheckboxKeyDown = (e, idx, field, maxRows) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const checkbox = e.target;
      const newValue = !checkbox.checked;
      
      if (field === 'ignorar_km') {
        updateCarga(idx, 'ignorar_kilometraje', newValue);
      } else if (field === 'km_equivocado') {
        updateCarga(idx, 'km_equivocado', newValue);
        if (newValue) {
          updateCarga(idx, 'kilometraje', cargas[idx].ultimo_kilometraje || 0);
        }
      }
    } else {
      handleGridKeyDown(e, idx, field, maxRows);
    }
  };

  const updateCarga = (index, field, value) => {
    const newCargas = [...cargas];
    newCargas[index][field] = value;
    setCargas(newCargas);
  };

  const handleSubmit = async () => {
    if(!window.confirm('¿Estás seguro de guardar todas las cargas registradas?')) return;
    if (!fecha) {
      notify.info("Selecciona la fecha de carga.");
      return;
    }
    if (cargas.length === 0) {
      notify.info("Agrega al menos una carga.");
      return;
    }

    const typesUsed = new Set(cargas.map(c => c.tipo_combustible));
    
    if (typesUsed.has('magna') && !precios.magna) {
      notify.info("Ingresa el precio de Gasolina Magna para las cargas registradas.");
      return;
    }
    if (typesUsed.has('premium') && !precios.premium) {
      notify.info("Ingresa el precio de Gasolina Premium para las cargas registradas.");
      return;
    }
    if (typesUsed.has('diesel') && !precios.diesel) {
      notify.info("Ingresa el precio de Diésel para las cargas registradas.");
      return;
    }
    if (typesUsed.has('electrico') && !precios.electrico) {
      notify.info("Ingresa el precio de Eléctrico para las cargas registradas.");
      return;
    }
    if (typesUsed.has('gas_lp') && !precios.gas_lp) {
      notify.info("Ingresa el precio de Gas LP para las cargas registradas.");
      return;
    }

    for (let carga of cargas) {
      if (!carga.litros || (!carga.ignorar_kilometraje && !carga.km_equivocado && !carga.kilometraje)) {
        notify.error(`Faltan datos en la unidad ${carga.numero_economico}`);
        return;
      }
    }

    setLoading(true);

    try {
      const data = {
        fecha,
        precio_magna: precios.magna || 0,
        precio_premium: precios.premium || 0,
        precio_diesel: precios.diesel || 0,
        precio_electrico: precios.electrico || 0,
        precio_gas_lp: precios.gas_lp || 0,
        cargas: cargas.map(c => ({
          unidad: c.is_variado ? null : c.unidad,
          unidad_variada: c.is_variado ? c.unidad : null,
          tipo_combustible: c.tipo_combustible,
          litros: Number(parseFloat(c.litros).toFixed(3)),
          kilometraje: c.ignorar_kilometraje ? null : (parseInt(c.kilometraje) || 0),
          ignorar_kilometraje: c.ignorar_kilometraje,
          km_equivocado: c.km_equivocado || false
        }))
      };

      await api.post('cargas-combustible/registro_diario/', data);

      notify.success("Registros guardados correctamente");
      setCargas([]);
      setBusqueda('');
    } catch (err) {
      console.error("Error saving loads", err);
      notify.error("Error al guardar los registros.");
    } finally {
      setLoading(false);
    }
  };

  const recalculateEspecialList = (list) => {
    const groups = {};
    for (let c of list) {
       const key = `${c.is_variado?'v':'t'}-${c.unidad}`;
       if(!groups[key]) groups[key] = [];
       groups[key].push({...c});
    }
    
    let finalList = [];
    Object.values(groups).forEach(group => {
       group.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
       for(let i = 0; i < group.length; i++) {
           if(i > 0 && group[i-1].kilometraje && !group[i-1].ignorar_kilometraje) {
               group[i].ultimo_kilometraje = group[i-1].kilometraje;
           }
           if (group[i].kilometraje && !group[i].ignorar_kilometraje && group[i].ultimo_kilometraje) {
               const diff = parseInt(group[i].kilometraje) - parseInt(group[i].ultimo_kilometraje);
               group[i].alcance = diff > 0 ? diff : 0;
           } else {
               group[i].alcance = null;
           }
       }
       finalList.push(...group);
    });
    
    finalList.sort((a, b) => {
      const numComp = (a.numero_economico || '').localeCompare(b.numero_economico || '', undefined, { numeric: true, sensitivity: 'base' });
      if (numComp !== 0) return numComp;
      return new Date(a.fecha) - new Date(b.fecha);
    });
    return finalList;
  };

  const handleAddEspecialToList = (e) => {
    e.preventDefault();
    if (!cargaEspecial.unidad || !cargaEspecial.fecha || !cargaEspecial.precio_unitario || !cargaEspecial.litros || (!cargaEspecial.ignorar_kilometraje && !cargaEspecial.km_equivocado && !cargaEspecial.kilometraje)) {
      notify.info("Completa todos los campos requeridos.");
      return;
    }

    const is_variado = cargaEspecial.unidad.startsWith('v-');
    const unidadId = parseInt(cargaEspecial.unidad.split('-')[1]);
    const unidadObj = unidades.find(u => u.id === unidadId && u.is_variado === is_variado);
    if (!unidadObj) return;

    const newItem = {
      ...cargaEspecial,
      unidad: unidadId,
      is_variado: is_variado,
      numero_economico: unidadObj.numero_economico,
      placas: unidadObj.placas
    };

    setCargasEspecialesList(recalculateEspecialList([...cargasEspecialesList, newItem]));

    setCargaEspecial(prev => ({
      ...prev,
      unidad: '',
      litros: '',
      kilometraje: '',
      ignorar_kilometraje: false,
      km_equivocado: false,
      ultimo_kilometraje: 0
    }));
    setBusquedaEspecial('');
  };

  const handleRemoveEspecial = (index) => {
    const newList = [...cargasEspecialesList];
    newList.splice(index, 1);
    setCargasEspecialesList(recalculateEspecialList(newList));
  };

  const handleSubmitEspecial = async () => {
    if(!window.confirm('¿Estás seguro de guardar todas las cargas especiales?')) return;
    if (cargasEspecialesList.length === 0) {
      notify.info("Agrega cargas a la lista.");
      return;
    }

    setLoading(true);
    try {
      const payload = cargasEspecialesList.map(carga => ({
        unidad: carga.is_variado ? null : parseInt(carga.unidad),
        unidad_variada: carga.is_variado ? parseInt(carga.unidad) : null,
        fecha: carga.fecha,
        tipo_combustible: carga.tipo_combustible,
        precio_unitario: parseFloat(carga.precio_unitario),
        litros: Number(parseFloat(carga.litros).toFixed(3)),
        kilometraje: carga.ignorar_kilometraje ? null : (parseInt(carga.kilometraje) || 0),
        ignorar_kilometraje: carga.ignorar_kilometraje,
        es_especial: true,
        km_equivocado: carga.km_equivocado || false
      }));
      
      await api.post('cargas-combustible/registro_especial/', payload);
      
      notify.success("Cargas especiales guardadas");
      setCargasEspecialesList([]);
    } catch(err) {
      console.error("Error saving special loads", err);
      notify.error("Error al guardar las cargas especiales.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUnidades = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.placas?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAddNewCargaToBlock = async () => {
    if(!newCargaData.fecha || !newCargaData.unidad || !newCargaData.litros || !newCargaData.precio_unitario || (!newCargaData.ignorar_kilometraje && !newCargaData.km_equivocado && !newCargaData.kilometraje)){
      notify.info("Completa los campos obligatorios");
      return;
    }
    try {
      const is_variado = newCargaData.unidad.startsWith('v-');
      const unidadId = parseInt(newCargaData.unidad.split('-')[1]);
      
      const payload = {
        bloque: selectedBlock.id,
        unidad: is_variado ? null : unidadId,
        unidad_variada: is_variado ? unidadId : null,
        fecha: newCargaData.fecha,
        tipo_combustible: newCargaData.tipo_combustible,
        precio_unitario: parseFloat(newCargaData.precio_unitario),
        litros: parseFloat(newCargaData.litros),
        ignorar_kilometraje: newCargaData.ignorar_kilometraje,
        km_equivocado: newCargaData.km_equivocado,
        kilometraje: newCargaData.ignorar_kilometraje ? null : (parseInt(newCargaData.kilometraje) || 0),
        es_especial: selectedBlock.es_especial || false
      };
      
      await api.post('cargas-combustible/', payload);
      notify.success("Carga agregada al bloque");
      setShowAddCarga(false);
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al agregar carga");
    }
  };

  const refreshSelectedBlock = async () => {
    if (!selectedBlock) return;
    try {
      if (historialTipo === 'normal') {
        await fetchHistorial();
      } else {
        await fetchHistorialEspecial();
      }
      const blocksEndpoint = selectedBlock.es_especial ? `cargas-combustible/historial_especiales/?limit=50` : `bloques/por_dia/?fecha=${selectedBlock.fecha}`;
      const res = await api.get(blocksEndpoint);
      const updatedBlock = res.data.find(b => b.id === selectedBlock.id);
      if(updatedBlock){
        setSelectedBlock(updatedBlock);
      } else {
        setSelectedBlock(null);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleEditClick = (carga) => {
    setEditingCargaId(carga.id);
    setEditCargaData({
      litros: carga.litros,
      precio_unitario: carga.precio_unitario,
      kilometraje: carga.kilometraje || '',
      ignorar_kilometraje: carga.ignorar_kilometraje,
      km_equivocado: carga.km_equivocado
    });
  };

  const handleSaveEdit = async (cargaId) => {
    try {
      const payload = {
        litros: parseFloat(editCargaData.litros),
        precio_unitario: parseFloat(editCargaData.precio_unitario),
        ignorar_kilometraje: editCargaData.ignorar_kilometraje,
        km_equivocado: editCargaData.km_equivocado,
        kilometraje: editCargaData.ignorar_kilometraje ? null : (parseInt(editCargaData.kilometraje) || 0)
      };
      await api.patch(`cargas-combustible/${cargaId}/`, payload);
      notify.success("Carga actualizada");
      setEditingCargaId(null);
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al actualizar carga");
    }
  };

  const handleDeleteCargaInBlock = async (cargaId) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta carga?")) return;
    try {
      await api.delete(`cargas-combustible/${cargaId}/`);
      notify.success("Carga eliminada");
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al eliminar carga");
    }
  };

  const handleSaveBlockDate = async () => {
    if (!editBlockDate) return;
    try {
      await api.post(`bloques/${selectedBlock.id}/cambiar_fecha/`, { fecha: editBlockDate });
      notify.success("Fecha del bloque actualizada");
      setIsEditingBlockDate(false);
      setSelectedBlock(null);
      if (historialTipo === 'normal') {
        fetchHistorial();
      } else {
        fetchHistorialEspecial();
      }
    } catch (err) {
      notify.error("Error al actualizar la fecha del bloque");
    }
  };

  const filteredUnidadesEspecial = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busquedaEspecial.toLowerCase()) || 
    u.placas?.toLowerCase().includes(busquedaEspecial.toLowerCase())
  );

  const filteredUnidadesNuevaCarga = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busquedaNuevaCarga.toLowerCase()) || 
    u.placas?.toLowerCase().includes(busquedaNuevaCarga.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex bg-white dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 w-max mb-2 backdrop-blur-xl shadow-sm dark:shadow-inner">
        {!isLector && (
          <button 
            onClick={() => setActiveTab('nuevo')}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
              activeTab === 'nuevo' 
                ? 'text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {activeTab === 'nuevo' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={18} /> Nuevo Registro
            </span>
          </button>
        )}
        {!isLector && (
          <button 
            onClick={() => { setActiveTab('especial'); }}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
              activeTab === 'especial' 
                ? 'text-white shadow-lg shadow-amber-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {activeTab === 'especial' && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <AlertCircle size={18} /> Carga Especial
            </span>
          </button>
        )}
        <button 
          onClick={() => { setActiveTab('historial'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'historial' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'historial' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <History size={18} /> Historial de Cargas
          </span>
        </button>
        
        <button 
          onClick={() => { setActiveTab('evidencia'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'evidencia' 
              ? 'text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'evidencia' && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <CheckCircle2 size={18} /> Evidencia Gas
          </span>
        </button>
      </div>


      {activeTab === 'nuevo' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Droplets className="text-blue-500" size={32} />
                Carga de Combustibles
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registro diario de suministros por unidad</p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[
              { id: 'magna', label: 'Magna', color: 'bg-green-500/10 border-green-500/20 text-green-500' },
              { id: 'premium', label: 'Premium', color: 'bg-red-500/10 border-red-500/20 text-red-500' },
              { id: 'diesel', label: 'Diesel', color: 'bg-slate-700/20 border-slate-700/30 text-slate-400' },
              { id: 'gas_lp', label: 'Gas LP', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' }
            ].map(fuel => (
              <div key={fuel.id} className={`${fuel.color} border rounded-2xl p-5 flex flex-col gap-3 group transition-all hover:bg-opacity-20`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm uppercase tracking-wider">{fuel.label}</span>
                  <DollarSign size={18} />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01"
                    value={precios[fuel.id]}
                    onChange={(e) => setPrecios({...precios, [fuel.id]: e.target.value})}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`w-full bg-transparent border-none text-2xl font-bold p-0 focus:ring-0 ${fuel.color.split(' ')[2]} outline-none`}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">MXN/L</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl min-h-[400px] flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar unidad por económico o placa..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => setBusquedaFocus(true)}
                  onBlur={() => setTimeout(() => setBusquedaFocus(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredUnidades.length === 1) {
                      e.preventDefault();
                      handleAddUnidad(filteredUnidades[0]);
                      e.target.blur();
                    }
                  }}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                
                {(busquedaFocus || busqueda) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredUnidades.length > 0 ? (
                      filteredUnidades.map(u => (
                        <button 
                          key={`${u.is_variado ? 'v' : 't'}-${u.id}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddUnidad(u);
                          }}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{u.numero_economico}</div>
                            <div className="text-xs text-slate-500">{u.placas ? `${u.placas} - ` : ''}{u.marca}</div>
                          </div>
                          <Plus size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-slate-500 text-center">No se encontraron unidades</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {cargas.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Combustible</th>
                      <th className="px-6 py-4">Litros</th>
                      <th className="px-6 py-4">Kilometraje</th>
                      <th className="px-6 py-4">Monto Est.</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargas.map((carga, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-xs text-slate-500">{carga.placas}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <FuelSelect 
                            value={carga.tipo_combustible}
                            onChange={(val) => updateCarga(idx, 'tipo_combustible', val)}
                            rowIndex={idx}
                            maxRows={cargas.length}
                            handleGridKeyDown={handleGridKeyDown}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <SumDesgloseHoverTooltip desglose={carga.desglose_suma}>
                            <div className="flex items-center gap-2 relative">
                              <div className="relative">
                                <input 
                                  type="number"
                                  step="0.001"
                                  data-row={idx}
                                  data-col="litros"
                                  value={carga.litros}
                                  onChange={(e) => {
                                    updateCarga(idx, 'litros', e.target.value);
                                    if (carga.desglose_suma) {
                                      const newCargas = [...cargas];
                                      newCargas[idx].desglose_suma = null;
                                      setCargas(newCargas);
                                    }
                                  }}
                                  onKeyDown={(e) => handleGridKeyDown(e, idx, 'litros', cargas.length)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className={`w-24 bg-white dark:bg-slate-950 border ${carga.desglose_suma?.length > 1 ? 'border-amber-500/80 dark:border-amber-500/80 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'} rounded-xl pl-3 pr-6 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500`}
                                  placeholder="0.000"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">L</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCalculadoraIndex(calculadoraIndex === idx ? null : idx);
                                  setCalculadoraValores(['', '']);
                                }}
                                className={`p-2 rounded-xl transition-all ${carga.desglose_suma?.length > 1 ? 'bg-amber-500 text-white shadow-md' : calculadoraIndex === idx ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                                title={carga.desglose_suma?.length > 1 ? `Carga sumada (${carga.desglose_suma.length} tickets). Pasa el cursor para ver el desglose.` : "Calculadora de Litros"}
                              >
                                <Calculator size={16} />
                              </button>
                              
                              {calculadoraIndex === idx && (
                                <div className="absolute left-full top-0 ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 w-56 animate-in fade-in zoom-in duration-200">
                                  <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase flex items-center gap-2">
                                      <Calculator size={14} className="text-blue-500"/> Sumar Tickets
                                    </span>
                                    <button onClick={() => setCalculadoraIndex(null)} className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-md transition-colors"><X size={14}/></button>
                                  </div>
                                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar mb-3 pr-1">
                                    {calculadoraValores.map((val, i) => (
                                      <div key={i} className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">T{i+1}</span>
                                        <input 
                                          type="number"
                                          step="0.001"
                                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white"
                                          placeholder="0.000"
                                          value={val}
                                          onWheel={(e) => e.currentTarget.blur()}
                                          onChange={(e) => {
                                            const newVals = [...calculadoraValores];
                                            newVals[i] = e.target.value;
                                            setCalculadoraValores(newVals);
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <button 
                                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 mb-3 font-medium"
                                    onClick={() => setCalculadoraValores([...calculadoraValores, ''])}
                                  >
                                    <Plus size={14}/> Agregar Ticket
                                  </button>
                                  
                                  <button
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex justify-between items-center px-4 hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => {
                                      const validVals = calculadoraValores.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                                      const total = validVals.reduce((acc, curr) => acc + curr, 0);
                                      const newCargas = [...cargas];
                                      newCargas[idx].litros = total.toString();
                                      newCargas[idx].desglose_suma = validVals.length > 1 ? validVals : null;
                                      setCargas(newCargas);
                                      setCalculadoraIndex(null);
                                    }}
                                  >
                                    <span>Aplicar</span>
                                    <span>{calculadoraValores.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0).toFixed(3)} L</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </SumDesgloseHoverTooltip>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="1"
                                  data-row={idx}
                                  data-col="kilometraje"
                                  disabled={carga.ignorar_kilometraje || carga.km_equivocado}
                                  value={carga.kilometraje}
                                  onChange={(e) => updateCarga(idx, 'kilometraje', e.target.value ? parseInt(e.target.value) : '')}
                                  onKeyDown={(e) => handleGridKeyDown(e, idx, 'kilometraje', cargas.length)}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  className={`w-32 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 ${carga.ignorar_kilometraje || carga.km_equivocado ? 'opacity-30 cursor-not-allowed' : ''}`}
                                  placeholder="Km actual"
                                />
                                {!carga.ignorar_kilometraje && !carga.km_equivocado && <Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />}
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  data-row={idx}
                                  data-col="ignorar_km"
                                  checked={carga.ignorar_kilometraje}
                                  disabled={carga.km_equivocado}
                                  onChange={(e) => updateCarga(idx, 'ignorar_kilometraje', e.target.checked)}
                                  onKeyDown={(e) => handleCheckboxKeyDown(e, idx, 'ignorar_km', cargas.length)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-offset-slate-900 focus:ring-2 focus:ring-blue-500 disabled:opacity-30 cursor-pointer"
                                />
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  data-row={idx}
                                  data-col="km_equivocado"
                                  checked={carga.km_equivocado}
                                  disabled={carga.ignorar_kilometraje}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    updateCarga(idx, 'km_equivocado', checked);
                                    if (checked) {
                                      updateCarga(idx, 'kilometraje', carga.ultimo_kilometraje || 0);
                                    }
                                  }}
                                  onKeyDown={(e) => handleCheckboxKeyDown(e, idx, 'km_equivocado', cargas.length)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-2 focus:ring-amber-500 disabled:opacity-30 cursor-pointer"
                                />
                                <span className="text-[10px] text-amber-500 uppercase font-bold tracking-tighter">KM Equivocado</span>
                              </label>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Km anterior: <strong className="text-slate-700 dark:text-slate-300">{(carga.ultimo_kilometraje || 0).toLocaleString()} KM</strong>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 dark:text-white font-medium">
                            ${(carga.litros * (precios[carga.tipo_combustible] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveCarga(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="bg-slate-800/30 p-6 rounded-full mb-4">
                    <Droplets size={48} className="text-slate-700" />
                  </div>
                  <p className="text-lg font-medium">No has agregado ninguna carga</p>
                  <p className="text-sm">Usa el buscador para añadir unidades a este registro</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total de unidades</span>
                <span className="text-slate-900 dark:text-white text-2xl font-black">{cargas.length}</span>
              </div>

              <div className="flex items-center gap-4">

                <button 
                  onClick={handleSubmit}
                  disabled={loading || cargas.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Guardar Cargas
                </button>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'especial' ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-amber-500/20 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="text-amber-500" size={32} />
                Carga Especial
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registra cargas de múltiples días con fechas y costos personalizados.</p>
            </div>
          </div>

          <form onSubmit={handleAddEspecialToList} className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 space-y-6 backdrop-blur-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Unidad</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input 
                    type="text" 
                    required
                    placeholder="Buscar unidad por económico o placa..."
                    value={busquedaEspecial}
                    onChange={(e) => {
                      setBusquedaEspecial(e.target.value);
                      if (cargaEspecial.unidad) {
                        setCargaEspecial({ ...cargaEspecial, unidad: '', ultimo_kilometraje: 0, kilometraje: '', km_equivocado: false });
                      }
                    }}
                    onFocus={() => setBusquedaEspecialFocus(true)}
                    onBlur={() => setTimeout(() => setBusquedaEspecialFocus(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredUnidadesEspecial.length === 1) {
                        e.preventDefault();
                        const u = filteredUnidadesEspecial[0];
                        setCargaEspecial({
                          ...cargaEspecial,
                          unidad: `${u.is_variado ? 'v' : 't'}-${u.id}`
                        });
                        setBusquedaEspecial(u.numero_economico);
                        setBusquedaEspecialFocus(false);
                        e.target.blur();
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  />
                  {(busquedaEspecialFocus || busquedaEspecial) && !cargaEspecial.unidad && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredUnidadesEspecial.length > 0 ? (
                        filteredUnidadesEspecial.map(u => (
                          <button 
                            key={`${u.is_variado ? 'v' : 't'}-${u.id}`}
                            type="button"
                            onClick={() => {
                              const val = `${u.is_variado ? 'v' : 't'}-${u.id}`;
                              setCargaEspecial({
                                ...cargaEspecial,
                                unidad: val,
                                is_variado: u.is_variado,
                                ultimo_kilometraje: u.ultimo_kilometraje || 0,
                                kilometraje: '',
                                km_equivocado: false
                              });
                              setBusquedaEspecial(u.numero_economico);
                              setBusquedaEspecialFocus(false);
                            }}
                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-amber-500/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                          >
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold group-hover:text-amber-500">{u.numero_economico}</div>
                              <div className="text-xs text-slate-500">{u.placas ? `${u.placas} - ` : ''}{u.marca}</div>
                            </div>
                            <CheckCircle2 size={18} className="text-slate-400 group-hover:text-amber-500" />
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-slate-500 text-center text-sm">No se encontraron unidades</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Exacta de Carga</label>
                <input 
                  type="date" 
                  required
                  value={cargaEspecial.fecha}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, fecha: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Combustible</label>
                <select 
                  value={cargaEspecial.tipo_combustible}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, tipo_combustible: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="diesel">Diesel</option>
                  <option value="magna">Magna</option>
                  <option value="premium">Premium</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="gas_lp">Gas LP</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-amber-400 uppercase tracking-widest">Precio Especial (por Litro)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={cargaEspecial.precio_unitario}
                    onChange={(e) => setCargaEspecial({...cargaEspecial, precio_unitario: e.target.value})}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Litros Cargados</label>
                <SumDesgloseHoverTooltip desglose={cargaEspecial.desglose_suma}>
                  <div className="flex items-center gap-2 relative">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        required
                        step="0.001"
                        value={cargaEspecial.litros}
                        onChange={(e) => setCargaEspecial({...cargaEspecial, litros: e.target.value, desglose_suma: null})}
                        onWheel={(e) => e.currentTarget.blur()}
                        className={`w-full bg-white dark:bg-slate-950 border ${cargaEspecial.desglose_suma?.length > 1 ? 'border-amber-500/80 dark:border-amber-500/80 ring-1 ring-amber-500/30' : 'border-slate-200 dark:border-slate-700'} rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all`}
                        placeholder="0.000"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">L</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCalculadoraIndex(calculadoraIndex === 'especial' ? null : 'especial');
                        setCalculadoraValores(['', '']);
                      }}
                      className={`p-3 rounded-xl transition-all ${cargaEspecial.desglose_suma?.length > 1 ? 'bg-amber-500 text-white shadow-md' : calculadoraIndex === 'especial' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                      title={cargaEspecial.desglose_suma?.length > 1 ? `Carga sumada (${cargaEspecial.desglose_suma.length} tickets). Pasa el cursor para ver el desglose.` : "Calculadora de Litros"}
                    >
                      <Calculator size={18} />
                    </button>
                    {calculadoraIndex === 'especial' && (
                      <div className="absolute right-0 sm:left-full top-full sm:top-0 mt-2 sm:mt-0 sm:ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 w-56 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase flex items-center gap-2">
                            <Calculator size={14} className="text-amber-500"/> Sumar Tickets
                          </span>
                          <button type="button" onClick={() => setCalculadoraIndex(null)} className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded-md transition-colors"><X size={14}/></button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar mb-3 pr-1">
                          {calculadoraValores.map((val, i) => (
                            <div key={i} className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">T{i+1}</span>
                              <input 
                                type="number"
                                step="0.001"
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all dark:text-white"
                                placeholder="0.000"
                                value={val}
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={(e) => {
                                  const newVals = [...calculadoraValores];
                                  newVals[i] = e.target.value;
                                  setCalculadoraValores(newVals);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <button 
                          type="button"
                          className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1 mb-3 font-medium"
                          onClick={() => setCalculadoraValores([...calculadoraValores, ''])}
                        >
                          <Plus size={14}/> Agregar Ticket
                        </button>
                        
                        <button
                          type="button"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/30 flex justify-between items-center px-4 hover:scale-[1.02] active:scale-[0.98]"
                          onClick={() => {
                            const validVals = calculadoraValores.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
                            const total = validVals.reduce((acc, curr) => acc + curr, 0);
                            setCargaEspecial({
                              ...cargaEspecial,
                              litros: total.toString(),
                              desglose_suma: validVals.length > 1 ? validVals : null
                            });
                            setCalculadoraIndex(null);
                          }}
                        >
                          <span>Aplicar</span>
                          <span>{calculadoraValores.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0).toFixed(3)} L</span>
                        </button>
                      </div>
                    )}
                  </div>
                </SumDesgloseHoverTooltip>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Kilometraje (Opcional)</label>
                  <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                    <span>Km anterior: <strong className="text-slate-700 dark:text-slate-300">{(cargaEspecial.ultimo_kilometraje || 0).toLocaleString()} KM</strong></span>
                    {cargaEspecial.kilometraje && !cargaEspecial.ignorar_kilometraje && parseInt(cargaEspecial.kilometraje) > (cargaEspecial.ultimo_kilometraje || 0) && (
                      <span className="text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                        Alcance: {(parseInt(cargaEspecial.kilometraje) - (cargaEspecial.ultimo_kilometraje || 0)).toLocaleString()} KM
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="1"
                      disabled={cargaEspecial.ignorar_kilometraje || cargaEspecial.km_equivocado}
                      value={cargaEspecial.kilometraje}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, kilometraje: e.target.value})}
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 ${cargaEspecial.ignorar_kilometraje || cargaEspecial.km_equivocado ? 'opacity-30 cursor-not-allowed' : ''}`}
                      placeholder="Km actual"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">KM</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap bg-white dark:bg-slate-950 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox"
                      checked={cargaEspecial.ignorar_kilometraje}
                      disabled={cargaEspecial.km_equivocado}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, ignorar_kilometraje: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-30"
                    />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap bg-white dark:bg-slate-950 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox"
                      checked={cargaEspecial.km_equivocado}
                      disabled={cargaEspecial.ignorar_kilometraje}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCargaEspecial({
                          ...cargaEspecial,
                          km_equivocado: checked,
                          kilometraje: checked ? (cargaEspecial.ultimo_kilometraje || 0) : ''
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-30"
                    />
                    <span className="text-[10px] text-amber-500 uppercase font-bold tracking-tighter">KM Equivocado</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-end">
              <button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
              >
                <Plus size={18} />
                Agregar a la lista
              </button>
            </div>
          </form>

          {cargasEspecialesList.length > 0 && (
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Detalles</th>
                      <th className="px-6 py-4">Kilometraje</th>
                      <th className="px-6 py-4 text-right">Monto Calculado</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargasEspecialesList.map((carga, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-[10px] text-slate-500">{carga.fecha}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <SumDesgloseHoverTooltip desglose={carga.desglose_suma}>
                            <div className="flex flex-col cursor-help">
                              <span className="text-sm text-slate-300 font-medium uppercase">{carga.tipo_combustible}</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                {carga.litros}L a ${carga.precio_unitario}/L
                                {carga.desglose_suma?.length > 1 && (
                                  <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                    <Calculator size={10} /> {carga.desglose_suma.length} tickets
                                  </span>
                                )}
                              </span>
                            </div>
                          </SumDesgloseHoverTooltip>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-slate-500">Ant: <strong className="text-slate-400">{carga.ultimo_kilometraje}</strong></span>
                            <span className="text-slate-500">Act: <strong className="text-white">{carga.ignorar_kilometraje ? '---' : carga.kilometraje}</strong></span>
                            {carga.alcance > 0 && !carga.ignorar_kilometraje && (
                              <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 w-fit">
                                Alcance: {carga.alcance.toLocaleString()} KM
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-amber-400 font-black">
                            ${(parseFloat(carga.litros) * parseFloat(carga.precio_unitario)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveEspecial(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-sm">Total a guardar</span>
                  <span className="text-white text-2xl font-bold">{cargasEspecialesList.length}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSubmitEspecial}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-amber-900/20 hover:scale-105 active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Guardar Todas las Cargas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'historial' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <History className="text-blue-500" size={32} />
                Historial de Cargas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Consulta los registros de combustible por fecha</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Selector de Historial */}
              <div className="flex bg-slate-200/80 dark:bg-slate-900/50 p-1.5 rounded-full backdrop-blur-xl overflow-x-auto custom-scrollbar shadow-inner">
                <button 
                  onClick={() => setHistorialTipo('normal')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'normal' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Diarias
                </button>
                <button 
                  onClick={() => setHistorialTipo('especial')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'especial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Especiales
                </button>
                <button 
                  onClick={() => setHistorialTipo('totalizador')}
                  className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'totalizador' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                >
                  Totalizador
                </button>
              </div>

              {historialTipo === 'normal' && historial.length > 0 && (
                <button 
                  onClick={exportHistorialToPDF}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-3 rounded-2xl transition-all shadow-md text-sm font-bold active:scale-95"
                >
                  <Download size={18} />
                  Descargar PDF
                </button>
              )}
              {(historialTipo === 'normal' || historialTipo === 'especial') && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Search className="text-blue-500 dark:text-blue-400 ml-2" size={18} />
                  <input 
                    type="text"
                    placeholder="Buscar por litros..."
                    value={busquedaLitros}
                    onChange={(e) => setBusquedaLitros(e.target.value)}
                    className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 p-1 font-medium outline-none text-sm w-36"
                  />
                </div>
              )}
              {historialTipo === 'normal' && (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Filter className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
                  <input 
                    type="date" 
                    value={fechaHistorial}
                    onChange={(e) => setFechaHistorial(e.target.value)}
                    className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl shadow-sm">
            {loadingHistorial ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium">Cargando registros...</p>
              </div>
            ) : historialTipo === 'totalizador' ? (
                <div className="space-y-6">
                  {/* Controles de Totalizador */}
                  <div className="flex flex-col md:flex-row justify-between items-center bg-slate-100 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-950/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                      <button onClick={handlePrevWeek} className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <ChevronLeft size={20} />
                      </button>
                      <div className="px-6 py-2 text-center min-w-[200px]">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">Semana Del</p>
                        <p className="text-slate-900 dark:text-white font-bold text-lg whitespace-nowrap">
                          {getStartOfWeek(totalizadorDateRef).toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - {getEndOfWeek(totalizadorDateRef).toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}
                        </p>
                      </div>
                      <button onClick={handleNextWeek} className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                    
                    <button onClick={generarPDFTotalizador} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/50 active:scale-95">
                      <Download size={18} />
                      Descargar PDF
                    </button>
                  </div>

                  {/* Tabla Totalizador */}
                  <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider">Unidad</th>
                            <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-wider text-center">Último KM</th>
                            <th className="px-6 py-4 font-bold text-center uppercase text-xs tracking-wider">Total Cargas</th>
                            <th className="px-6 py-4 font-bold text-right text-blue-600 dark:text-blue-400 uppercase text-xs tracking-wider">Total Litros</th>
                            <th className="px-6 py-4 font-bold text-right text-emerald-600 dark:text-emerald-400 uppercase text-xs tracking-wider">Monto Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                          {loadingTotalizador ? (
                            <tr>
                              <td colSpan="4" className="px-6 py-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                                <p className="text-slate-500 dark:text-slate-400">Calculando totales...</p>
                              </td>
                            </tr>
                          ) : totalizadorData.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                No hay cargas registradas en esta semana.
                              </td>
                            </tr>
                          ) : (
                            <>
                              {totalizadorData.map((item) => (
                                <tr key={item.id_key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                  <td className="px-6 py-4 text-slate-900 dark:text-white font-bold text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.unidad_nombre}</td>
                                  <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                                    <span className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{item.ultimo_km ? item.ultimo_km.toLocaleString('en-US') : "-"}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                                    <span className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 group-hover:border-emerald-500/50 transition-colors">{item.cantidad_cargas}</span>
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-blue-600 dark:text-blue-300 font-bold text-base">
                                    {parseFloat(item.total_litros).toFixed(3)} L
                                  </td>
                                  <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold text-base">
                                    ${parseFloat(item.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                              {/* Gran Total Footer */}
                              <tr className="bg-slate-100 dark:bg-slate-800/90 border-t-2 border-emerald-500/30">
                                <td className="px-6 py-5 text-slate-900 dark:text-white font-black text-lg uppercase tracking-wider">Gran Total</td>
                                <td className="px-6 py-5 text-center text-slate-500 font-bold text-lg">-</td>
                                <td className="px-6 py-5 text-center text-slate-900 dark:text-white font-bold text-lg">
                                  {totalizadorData.reduce((acc, curr) => acc + curr.cantidad_cargas, 0)}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-blue-600 dark:text-blue-400 font-black text-lg">
                                  {totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0).toFixed(3)} L
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black text-lg">
                                  ${totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
            ) : historialTipo === 'normal' ? (
              historial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Bloque ID</th>
                      <th className="px-8 py-5">Hora de Registro</th>
                      <th className="px-8 py-5 text-right">Cant. Cargas</th>
                      <th className="px-8 py-5 text-right">Total Litros</th>
                      <th className="px-8 py-5 text-right">Monto Total</th>
                      <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historial.filter(bloque => {
                      if (!busquedaLitros) return true;
                      return bloque.cargas?.some(carga => carga.litros?.toString().includes(busquedaLitros));
                    }).map((bloque, idx) => (
                      <tr key={idx} className="group hover:bg-blue-600/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <History size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">Bloque #{bloque.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-slate-900 dark:text-slate-300 font-medium">{new Date(bloque.fecha_registro).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold">{bloque.cargas?.length || 0} unid.</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold font-mono">
                            {parseFloat(bloque.total_litros).toFixed(2)} L
                          </p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-blue-600 dark:text-blue-400 font-black font-mono text-lg">
                            ${parseFloat(bloque.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button 
                            onClick={() => setSelectedBlock(bloque)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/30 border-t border-slate-800">
                      <td colSpan="3" className="px-8 py-6 text-slate-500 font-bold text-sm uppercase">Totales del día</td>
                      <td className="px-8 py-6 text-right font-black text-white text-lg">
                        {historial.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0).toFixed(2)} <span className="text-slate-500 text-xs">L</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-emerald-400 text-2xl">
                        ${historial.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="bg-slate-800/30 p-8 rounded-full mb-6">
                  <Calendar size={64} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin registros para esta fecha</h3>
                <p className="text-slate-500 max-w-xs text-center">No se encontraron cargas de combustible para el día seleccionado.</p>
              </div>
            )
            ) : (
              historialEspecial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-amber-500 dark:text-amber-500/80 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Bloque Especial</th>
                      <th className="px-8 py-5">Rango de Fechas</th>
                      <th className="px-8 py-5 text-right">Cant. Cargas</th>
                      <th className="px-8 py-5 text-right">Total Litros</th>
                      <th className="px-8 py-5 text-right">Monto Total</th>
                      <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historialEspecial.filter(bloque => {
                      if (!busquedaLitros) return true;
                      return bloque.cargas?.some(carga => carga.litros?.toString().includes(busquedaLitros));
                    }).map((bloque, idx) => {
                      const fechas = bloque.cargas?.map(c => new Date(c.fecha + 'T12:00:00').getTime()) || [];
                      const minDate = fechas.length > 0 ? new Date(Math.min(...fechas)).toLocaleDateString('es-MX') : 'N/A';
                      const maxDate = fechas.length > 0 ? new Date(Math.max(...fechas)).toLocaleDateString('es-MX') : 'N/A';
                      const rangoFechas = minDate === maxDate ? minDate : `${minDate} - ${maxDate}`;
                      return (
                      <tr key={idx} className="group hover:bg-amber-600/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all">
                              <History size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">Bloque #{bloque.id}</p>
                              <p className="text-slate-500 text-[10px]">Guardado: {new Date(bloque.fecha_registro).toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-slate-900 dark:text-slate-300 font-medium">{rangoFechas}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold">{bloque.cargas?.length || 0} unid.</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold font-mono">
                            {parseFloat(bloque.total_litros).toFixed(2)} L
                          </p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-amber-500 font-black font-mono text-lg">
                            ${parseFloat(bloque.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button 
                            onClick={() => setSelectedBlock(bloque)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-amber-500 dark:text-amber-400 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="bg-slate-800/30 p-8 rounded-full mb-6">
                  <Activity size={64} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin cargas especiales</h3>
                <p className="text-slate-500 max-w-xs text-center">No se han registrado cargas especiales recientemente.</p>
              </div>
            ))}
          </div>
        </div>

      ) : activeTab === 'evidencia' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={32} />
                Evidencia de Cargas de Gas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Respaldo documental de facturas y tickets (No suma a gastos globales)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm backdrop-blur-xl h-max">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-6 flex items-center gap-2">
                <Plus size={20} className="text-emerald-500"/>
                Nueva Evidencia
              </h3>
              
              <form onSubmit={handleSubmitEvidencia} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Folio Factura</label>
                  <input type="text" required value={evidenciaForm.folio_factura} onChange={e => setEvidenciaForm({...evidenciaForm, folio_factura: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input type="number" step="0.01" required value={evidenciaForm.monto} onChange={e => setEvidenciaForm({...evidenciaForm, monto: e.target.value})} onWheel={(e) => e.currentTarget.blur()} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha de Carga</label>
                  <input type="date" required value={evidenciaForm.fecha} onChange={e => setEvidenciaForm({...evidenciaForm, fecha: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha de Factura</label>
                  <input type="date" required value={evidenciaForm.fecha_factura} onChange={e => setEvidenciaForm({...evidenciaForm, fecha_factura: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                  <textarea value={evidenciaForm.descripcion} onChange={e => setEvidenciaForm({...evidenciaForm, descripcion: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none h-24" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Archivo Escaneado</label>
                  <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-emerald-500 transition-colors relative min-h-[250px] shadow-sm">
            <input
              type="file"
              onChange={handleEvidenciaFileChangeMulti}
              className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
              accept="image/*,.pdf"
              disabled={scannedFiles.length >= 20}
            />
            
            <div className="bg-emerald-600/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="text-emerald-600 dark:text-emerald-500" size={24} />
            </div>
            
            {scannedFiles.length > 0 ? (
              <div className="w-full space-y-3 relative z-20">
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle2 size={12} /> {scannedFiles.length}/20 {scannedFiles.length === 1 ? 'Documento' : 'Documentos'} Listos
                </p>
                
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {scannedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2 rounded-xl group/item hover:border-emerald-500/50 transition-all">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-emerald-600/10 p-1.5 rounded-lg">
                          <FilePlus size={12} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                          {file.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          type="button"
                          onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name, isPdf: file.type === 'application/pdf' })}
                          className="text-slate-600 hover:text-emerald-500 p-1 transition-colors mr-1"
                          title="Previsualizar"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setScannedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-600 hover:text-rose-500 p-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => handleScan('brother')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en alimentador"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>ALIMENTADOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScan('brother1')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
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
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => handleScan('brother')}
                    disabled={scanning}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    title="Escanear en alimentador"
                  >
                    {scanning ? <Spinner /> : <FilePlus size={14} />}
                    <span>ALIMENTADOR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScan('brother1')}
                    disabled={scanning}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    title="Escanear en cristal"
                  >
                    {scanning ? <Spinner /> : <FilePlus size={14} />}
                    <span>CRISTAL</span>
                  </button>
                </div>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-600 text-xs font-medium">O</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="pointer-events-none">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block mb-1">Seleccionar Archivo</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">PDF, JPG o PNG (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {editingEvidenciaId ? 'Actualizar Evidencia' : 'Guardar Evidencia'}
                  </button>
                  {editingEvidenciaId && (
                    <button type="button" onClick={handleCancelEditEvidencia} className="px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-all">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Historial de Evidencias</h3>
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 px-3 rounded-full text-xs font-bold">
                    {evidenciasGas.length} registros
                  </span>
                </div>
                {selectedEvidencias.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={exportarPDFTotalizadorGas}
                      disabled={loading}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-xl transition-all shadow-md text-sm font-bold"
                    >
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                      Totalizador Gas LP
                    </button>
                    <button 
                      onClick={exportarPDFEvidencias}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all shadow-md text-sm font-bold"
                    >
                      <Download size={16} />
                      Generar Reporte ({selectedEvidencias.length})
                    </button>
                  </div>
                )}
              </div>
              
              {selectedEvidencias.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 border-b border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Suma total seleccionada:
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    ${evidenciasGas.filter(e => selectedEvidencias.includes(e.id)).reduce((acc, curr) => acc + parseFloat(curr.monto), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              <div className="overflow-x-auto flex-1">
                {loadingEvidencias ? (
                  <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                ) : evidenciasGas.length === 0 ? (
                  <div className="text-center p-12 text-slate-500 dark:text-slate-400">No hay evidencias registradas.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            checked={evidenciasGas.length > 0 && selectedEvidencias.length === evidenciasGas.length}
                            onChange={toggleAllEvidencias}
                          />
                        </th>
                        <th className="px-4 py-4 font-semibold">Folio</th>
                        <th className="px-4 py-4 font-semibold">Carga</th>
                        <th className="px-4 py-4 font-semibold">Factura</th>
                        <th className="px-4 py-4 font-semibold">Descripción</th>
                        <th className="px-6 py-4 font-semibold text-right">Monto</th>
                        <th className="px-6 py-4 font-semibold text-center">Archivo</th>
                        <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {evidenciasGas.map(ev => (
                        <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-4 text-center">
                            <input 
                              type="checkbox" 
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedEvidencias.includes(ev.id)}
                              onChange={() => toggleEvidenciaSelection(ev.id)}
                            />
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{ev.folio_factura}</td>
                          <td className="px-4 py-4 text-slate-500">{ev.fecha}</td>
                          <td className="px-4 py-4 text-slate-500">{ev.fecha_factura || 'N/A'}</td>
                          <td className="px-4 py-4 text-slate-500 max-w-xs truncate" title={ev.descripcion}>{ev.descripcion || '-'}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">${parseFloat(ev.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                          <td className="px-6 py-4 text-center">
                            {ev.archivo_escaneado ? (
                              <a href={ev.archivo_escaneado} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center justify-center"><Eye size={16} /></a>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleEditEvidencia(ev)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors mr-1">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteEvidencia(ev.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      

      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="text-blue-500" />
                    Detalles del Bloque
                  </h3>
                  {!isEditingBlockDate ? (
                    <button onClick={() => { setEditBlockDate(selectedBlock.fecha); setIsEditingBlockDate(true); }} className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      <Edit2 size={14} /> Fecha: {selectedBlock.fecha}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="date" value={editBlockDate} onChange={e => setEditBlockDate(e.target.value)} className="text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white" />
                      <button onClick={handleSaveBlockDate} className="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 p-1.5 rounded-lg transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setIsEditingBlockDate(false)} className="text-slate-600 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 p-1.5 rounded-lg transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ID: {selectedBlock.id} | Fecha Registro: {new Date(selectedBlock.fecha_registro).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedBlock(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Unidades</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBlock.cargas?.length || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Litros</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{parseFloat(selectedBlock.total_litros).toFixed(2)} L</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Monto Total</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                    ${parseFloat(selectedBlock.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Unidad</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold text-center">Fecha</th>
                      <th className="px-4 py-3 font-semibold text-right">Litros</th>
                      <th className="px-4 py-3 font-semibold text-right">Precio/L</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Kilometraje</th>
                      <th className="px-4 py-3 font-semibold text-right">Alcance (KM)</th>
                      <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {selectedBlock.cargas?.slice().sort((a, b) => {
                      const strA = a.unidad_detalle || `Eco ${a.unidad || a.unidad_variada || ''}`;
                      const strB = b.unidad_detalle || `Eco ${b.unidad || b.unidad_variada || ''}`;
                      return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
                    }).map((carga, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        {editingCargaId === carga.id ? (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {carga.unidad_detalle || `Eco ${carga.unidad || carga.unidad_variada}`}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{carga.tipo_combustible}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-center whitespace-nowrap text-xs">{new Date(carga.fecha + 'T12:00:00').toLocaleDateString('es-MX')}</td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-slate-900 dark:text-white"
                                value={editCargaData.litros} 
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={e => setEditCargaData({...editCargaData, litros: e.target.value})} 
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-slate-900 dark:text-white"
                                value={editCargaData.precio_unitario} 
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={e => setEditCargaData({...editCargaData, precio_unitario: e.target.value})} 
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ${(parseFloat(editCargaData.litros || 0) * parseFloat(editCargaData.precio_unitario || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-slate-900 dark:text-white mb-1"
                                value={editCargaData.kilometraje} 
                                onWheel={(e) => e.currentTarget.blur()}
                                onChange={e => setEditCargaData({...editCargaData, kilometraje: e.target.value})}
                                disabled={editCargaData.ignorar_kilometraje || editCargaData.km_equivocado}
                              />
                              <div className="flex justify-end gap-2">
                                <label className="text-[10px] flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <input type="checkbox" checked={editCargaData.km_equivocado} onChange={e=>setEditCargaData({...editCargaData, km_equivocado: e.target.checked})} /> Mal
                                </label>
                                <label className="text-[10px] flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <input type="checkbox" checked={editCargaData.ignorar_kilometraje} onChange={e=>setEditCargaData({...editCargaData, ignorar_kilometraje: e.target.checked})} /> Ign
                                </label>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              -
                            </td>
                            <td className="px-4 py-3 text-center flex justify-center gap-2">
                              <button onClick={() => handleSaveEdit(carga.id)} className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-1.5 rounded-lg"><Check size={18} /></button>
                              <button onClick={() => setEditingCargaId(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg"><XCircle size={18} /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                              {carga.unidad_detalle || `Eco ${carga.unidad || carga.unidad_variada}`}
                              {carga.es_especial && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase font-bold">Especial</span>}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{carga.tipo_combustible}</td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-center whitespace-nowrap text-xs font-medium">{new Date(carga.fecha + 'T12:00:00').toLocaleDateString('es-MX')}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{parseFloat(carga.litros).toFixed(2)} L</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${parseFloat(carga.precio_unitario).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ${parseFloat(carga.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {carga.ignorar_kilometraje ? (
                                <span className="text-slate-400 text-xs italic">Ignorado</span>
                              ) : carga.km_equivocado ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-amber-500 font-bold text-[10px] uppercase">Mal</span>
                                  <span className="font-mono text-amber-500">{carga.kilometraje}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="font-mono text-slate-600 dark:text-slate-300">
                                    {carga.kilometraje}
                                  </span>
                                  {carga.rendimiento > 0 && (
                                    <span className="text-[10px] font-bold text-emerald-500">
                                      {carga.rendimiento} km/l
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {carga.alcance !== null && carga.alcance !== undefined ? (
                                `${carga.alcance.toLocaleString()} KM`
                              ) : (
                                <span className="text-slate-400 font-normal text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center flex justify-center gap-1.5">
                              <button onClick={() => handleEditClick(carga)} className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-lg transition-colors" title="Editar carga">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteCargaInBlock(carga.id)} className="text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg transition-colors" title="Eliminar carga">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {(!selectedBlock.cargas || selectedBlock.cargas.length === 0) && (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                          No hay detalles disponibles para este bloque.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add New Carga to Block Form */}
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                {!showAddCarga ? (
                  <button onClick={() => setShowAddCarga(true)} className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 w-full border border-dashed border-blue-200 dark:border-blue-900/50 font-bold px-4 py-4 rounded-xl transition-all">
                    <PlusCircle size={20} /> Agregar carga olvidada a este bloque
                  </button>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><PlusCircle size={20} className="text-blue-500" /> Nueva Carga para Bloque #{selectedBlock.id}</h4>
                      <button onClick={() => setShowAddCarga(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Unidad</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                          <input 
                            type="text" 
                            required
                            placeholder="Buscar unidad..."
                            value={busquedaNuevaCarga}
                            onChange={(e) => {
                              setBusquedaNuevaCarga(e.target.value);
                              if (newCargaData.unidad) {
                                setNewCargaData({ ...newCargaData, unidad: '', kilometraje: '', km_equivocado: false });
                              }
                            }}
                            onFocus={() => setBusquedaNuevaCargaFocus(true)}
                            onBlur={() => setTimeout(() => setBusquedaNuevaCargaFocus(false), 200)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && filteredUnidadesNuevaCarga.length === 1) {
                                e.preventDefault();
                                const u = filteredUnidadesNuevaCarga[0];
                                const val = `${u.is_variado ? 'v' : 't'}-${u.id}`;
                                setNewCargaData({
                                  ...newCargaData,
                                  unidad: val,
                                  kilometraje: u.ultimo_kilometraje || '',
                                  km_equivocado: false
                                });
                                setBusquedaNuevaCarga(u.numero_economico);
                                setBusquedaNuevaCargaFocus(false);
                                e.target.blur();
                              }
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 p-2.5 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                          {(busquedaNuevaCargaFocus || busquedaNuevaCarga) && !newCargaData.unidad && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                              {filteredUnidadesNuevaCarga.length > 0 ? (
                                filteredUnidadesNuevaCarga.map(u => (
                                  <button 
                                    key={`${u.is_variado ? 'v' : 't'}-${u.id}`}
                                    type="button"
                                    onClick={() => {
                                      const val = `${u.is_variado ? 'v' : 't'}-${u.id}`;
                                      setNewCargaData({
                                        ...newCargaData,
                                        unidad: val,
                                        kilometraje: u.ultimo_kilometraje || '',
                                        km_equivocado: false
                                      });
                                      setBusquedaNuevaCarga(u.numero_economico);
                                      setBusquedaNuevaCargaFocus(false);
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-500/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                                  >
                                    <div>
                                      <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-500 text-sm">{u.numero_economico}</div>
                                      <div className="text-xs text-slate-500">{u.placas ? `${u.placas} - ` : ''}{u.marca}</div>
                                    </div>
                                    <CheckCircle2 size={16} className="text-slate-400 group-hover:text-blue-500" />
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 text-slate-500 text-center text-xs">No se encontraron unidades</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                        <input type="date" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" value={newCargaData.fecha} onChange={e => setNewCargaData({...newCargaData, fecha: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Combustible</label>
                        <select className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" value={newCargaData.tipo_combustible} onChange={e => setNewCargaData({...newCargaData, tipo_combustible: e.target.value})}>
                          <option value="magna">Magna</option>
                          <option value="premium">Premium</option>
                          <option value="diesel">Diesel</option>
                          <option value="electrico">Eléctrico</option>
                          <option value="gas_lp">Gas LP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Precio Unit.</label>
                        <input type="number" step="0.01" onWheel={(e) => e.currentTarget.blur()} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" value={newCargaData.precio_unitario} onChange={e => setNewCargaData({...newCargaData, precio_unitario: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Litros</label>
                        <input type="number" step="0.001" onWheel={(e) => e.currentTarget.blur()} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" value={newCargaData.litros} onChange={e => setNewCargaData({...newCargaData, litros: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Kilometraje</label>
                        <input type="number" onWheel={(e) => e.currentTarget.blur()} className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white disabled:opacity-50" value={newCargaData.kilometraje} onChange={e => setNewCargaData({...newCargaData, kilometraje: e.target.value})} disabled={newCargaData.ignorar_kilometraje || newCargaData.km_equivocado} />
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                          <input type="checkbox" checked={newCargaData.km_equivocado} onChange={e=>setNewCargaData({...newCargaData, km_equivocado: e.target.checked})} className="rounded text-blue-500 w-4 h-4" /> KM Equivocado
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                          <input type="checkbox" checked={newCargaData.ignorar_kilometraje} onChange={e=>setNewCargaData({...newCargaData, ignorar_kilometraje: e.target.checked})} className="rounded text-blue-500 w-4 h-4" /> Ignorar KM
                        </label>
                      </div>
                      <div className="flex items-end">
                        <button onClick={handleAddNewCargaToBlock} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                          <Save size={18} /> Guardar Carga
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedBlock(null)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={18} className="text-blue-500" />
                Previsualización: {previewFile.name}
              </h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[500px]">
              {previewFile.isPdf ? (
                <iframe src={previewFile.url} className="w-full h-full rounded-xl border-0" title="PDF Preview" />
              ) : (
                <img src={previewFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Combustibles;
