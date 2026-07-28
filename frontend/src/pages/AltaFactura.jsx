import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  FilePlus, 
  Upload, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  Ticket as TicketIcon,
  Store,
  Info,
  Search,
  Archive,
  Eye,
  ExternalLink,
  X
} from 'lucide-react';
import notify from '../utils/notifications';
import { PDFDocument } from 'pdf-lib';
import { formatMediaUrl } from '../utils/media';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AltaFactura = ({ onSuccess, onClose, factura, existingFacturas = [] }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ticketsPendientes, setTicketsPendientes] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [variados, setVariados] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: '',
    monto: '',
    folio: '',
    unidad: '',
    caja: '',
    variado: '',
    producto: '',
    ticket: '',
    taller: '',
    proveedor: '',
    descripcion: '',
    archivo_escaneado: null,
    rfc_emisor: '',
    razon_social_emisor: '',
    categoria: 'Otro',
    unidades: [],
    cajas: [],
    variados: [],
    detalles_unidades: []
  });
  const [esPreventivo, setEsPreventivo] = useState(false);
  const [usaFechaDiferente, setUsaFechaDiferente] = useState(false);
  const [fechaServicio, setFechaServicio] = useState('');
  const [unidadesMantenimiento, setUnidadesMantenimiento] = useState([]);
  const [ivaIncluido, setIvaIncluido] = useState(false);
  const [resicoAplicado, setResicoAplicado] = useState(false);
  const [busquedaTicket, setBusquedaTicket] = useState('');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');
  const [mostrarDropdownUnidad, setMostrarDropdownUnidad] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [folioStatus, setFolioStatus] = useState({ error: '', warning: '' });
  const [busquedaEntidad, setBusquedaEntidad] = useState('');
  const [mostrarDropdownEntidad, setMostrarDropdownEntidad] = useState(false);
  
  const [existingFile, setExistingFile] = useState(null);
  const [replaceExistingScan, setReplaceExistingScan] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  const { user } = useContext(AuthContext);
  const isCapturista = user?.rol === 'capturista';
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoCambio, setMotivoCambio] = useState('');

  useEffect(() => {
    if (entidades.length > 0) {
      if (formData.taller) {
        const tallerObj = entidades.find(e => e.tipo === 'taller' && e.id === parseInt(formData.taller));
        if (tallerObj) setBusquedaEntidad(tallerObj.razon_social || tallerObj.nombre);
      } else if (formData.proveedor) {
        const provObj = entidades.find(e => e.tipo === 'proveedor' && e.id === parseInt(formData.proveedor));
        if (provObj) setBusquedaEntidad(provObj.razon_social || provObj.nombre);
      } else {
        setBusquedaEntidad('');
      }
    }
  }, [formData.taller, formData.proveedor, entidades]);


  useEffect(() => {
    Promise.all([
      api.get('vehiculos/', { params: { nopaged: true } }),
      api.get('productos/', { params: { nopaged: true } }),
      api.get('tickets/pendientes/'),
      api.get('talleres/', { params: { nopaged: true } }),
      api.get('proveedores/', { params: { nopaged: true } }),
      api.get('cajas/', { params: { nopaged: true } }),
      api.get('variados/', { params: { nopaged: true } })
    ]).then(([vehRes, prodRes, tickRes, tallRes, provRes, cajRes, varRes]) => {
      setVehiculos(vehRes.data.results || vehRes.data);
      setProductos(prodRes.data.results || prodRes.data);
      setTicketsPendientes(tickRes.data.results || tickRes.data);
      
      const talleresData = tallRes.data.results || tallRes.data;
      const provData = provRes.data.results || provRes.data;
      
      setTalleres(talleresData);
      setProveedores(provData);
      setCajas(cajRes.data.results || cajRes.data);
      setVariados(varRes.data.results || varRes.data);
      
      const combinedEntidades = [
        ...talleresData.map(t => ({...t, tipo: 'taller'})),
        ...provData.map(p => ({...p, tipo: 'proveedor'}))
      ];
      setEntidades(combinedEntidades);
    })
    .catch(err => console.error("Error cargando datos:", err));
  }, []);

  useEffect(() => {
    if (factura) {
      setFormData({
        fecha: factura.fecha,
        monto: factura.monto,
        folio: factura.folio,
        unidad: factura.unidad || (factura.unidades && factura.unidades.length > 0 ? '' : 'sin_unidad'),
        caja: factura.caja || '',
        variado: factura.variado || '',
        producto: factura.producto || '',
        ticket: factura.ticket || '',
        taller: factura.taller || '',
        proveedor: factura.proveedor || '',
        descripcion: factura.descripcion || '',
        archivo_escaneado: null,
        rfc_emisor: factura.rfc_emisor || '',
        razon_social_emisor: factura.razon_social_emisor || '',
        categoria: factura.categoria || 'Otro',
        unidades: factura.unidades || [],
        cajas: factura.cajas || [],
        variados: factura.variados || [],
        detalles_unidades: factura.detalles_unidades?.map(d => ({ 
          unidad: d.unidad, 
          caja: d.caja, 
          variado: d.variado, 
          monto: d.monto 
        })) || []
      });
      setEsPreventivo(factura.es_preventivo || false);
      setUsaFechaDiferente(!!factura.fecha_servicio && factura.fecha_servicio !== factura.fecha);
      setFechaServicio(factura.fecha_servicio || factura.fecha || '');
      setIvaIncluido(factura.iva_aplicado || false);
      setResicoAplicado(factura.resico_aplicado || false);
      setUnidadesMantenimiento(factura.unidades_mantenimiento || []);
      setExistingFile(factura.archivo_escaneado || null);
    }
  }, [factura]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ticket' && value) {
      const ticket = ticketsPendientes.find(t => t.id === parseInt(value));
      if (ticket) {
        setFormData(prev => {
          const producto = productos.find(p => p.id === ticket.producto);
          if (producto) {
            setCategoriaSeleccionada(producto.categoria);
          }

          let ticketRfc = prev.rfc_emisor;
          let ticketRazon = prev.razon_social_emisor;

          if (ticket.taller) {
            const tallerTicket = talleres.find(t => t.id === ticket.taller);
            if (tallerTicket) {
              ticketRfc = tallerTicket.rfc || ticketRfc;
              ticketRazon = tallerTicket.razon_social || ticketRazon;
            }
          } else if (ticket.proveedor) {
            const provTicket = proveedores.find(p => p.id === ticket.proveedor);
            if (provTicket) {
              ticketRfc = provTicket.rfc || ticketRfc;
              ticketRazon = provTicket.razon_social || ticketRazon;
            }
          }

          const ticketUnidades = ticket.unidades || [];
          const ticketCajas = ticket.cajas || [];
          const ticketVariados = ticket.variados || [];

          let mappedDetails = [];
          if (ticket.detalles_unidades && ticket.detalles_unidades.length > 0) {
            mappedDetails = ticket.detalles_unidades.map(d => ({
              unidad: d.unidad,
              caja: d.caja,
              variado: d.variado,
              monto: d.monto
            }));
          } else {
            mappedDetails = [
              ...ticketUnidades.map(uId => ({ unidad: uId, monto: '' })),
              ...ticketCajas.map(cId => ({ caja: cId, monto: '' })),
              ...ticketVariados.map(vId => ({ variado: vId, monto: '' }))
            ];
          }

          return { 
            ...prev, 
            ticket: value,
            monto: ticket.monto,
            unidad: ticket.unidad || '',
            caja: ticket.caja || '',
            variado: ticket.variado || '',
            unidades: ticketUnidades,
            cajas: ticketCajas,
            variados: ticketVariados,
            detalles_unidades: mappedDetails,
            producto: ticket.producto || '',
            taller: ticket.taller || '',
            proveedor: ticket.proveedor || '',
            descripcion: ticket.descripcion || '',
            fecha: ticket.fecha,
            rfc_emisor: ticketRfc,
            razon_social_emisor: ticketRazon,
            categoria: ticket.categoria || 'Otro'
          };
        });
        return;
      }
    }

    if (name === 'entidad' && value) {
      const [tipo, id] = value.split('_');
      const entidadObj = entidades.find(e => e.tipo === tipo && e.id === parseInt(id));
      if (entidadObj) {
        setFormData(prev => ({
          ...prev,
          taller: tipo === 'taller' ? id : '',
          proveedor: tipo === 'proveedor' ? id : '',
          rfc_emisor: entidadObj.rfc || prev.rfc_emisor || '',
          razon_social_emisor: entidadObj.razon_social || prev.razon_social_emisor || ''
        }));
        return;
      }
    } else if (name === 'entidad' && !value) {
      setFormData(prev => ({ ...prev, taller: '', proveedor: '' }));
      return;
    }

    if (name === 'categoria') {
      setFormData(prev => ({ ...prev, categoria: value }));
      return;
    }

    if (name === 'folio') {
      const folioValue = value.trim();
      let error = '';
      let warning = '';
      
      if (folioValue) {
        const exactDuplicate = existingFacturas.find(f => f.folio === folioValue && f.id !== factura?.id);
        if (exactDuplicate) {
          error = 'Este folio ya existe exactamente igual.';
        } else {
          const suffix = folioValue.slice(-6);
          if (suffix.length >= 4) {
            const suffixMatch = existingFacturas.find(f => f.folio.endsWith(suffix) && f.id !== factura?.id);
            if (suffixMatch) {
              warning = `Aviso: Existe la factura ${suffixMatch.folio} que termina igual (${suffix}).`;
            }
          }
        }
      }
      setFolioStatus({ error, warning });
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const seleccionarUnidad = (value, tipo) => {
    if (value === 'sin_unidad') {
      setFormData(prev => ({
        ...prev,
        unidad: 'sin_unidad',
        caja: '',
        variado: '',
        unidades: [],
        cajas: [],
        variados: [],
        detalles_unidades: []
      }));
      setBusquedaUnidad('');
      setMostrarDropdownUnidad(false);
      return;
    }
    
    if (tipo === 'caja') {
      const cId = parseInt(value);
      setFormData(prev => {
        const prevCajas = prev.cajas.filter(id => id !== 'sin_unidad');
        const prevDetalles = prev.detalles_unidades.filter(d => d.caja !== 'sin_unidad');
        if (!prevCajas.includes(cId)) {
          const newCajas = [...prevCajas, cId];
          const newDetalles = [...prevDetalles, { caja: cId, monto: '' }];
          const totalAssets = prev.unidades.length + newCajas.length + prev.variados.length;
          return { 
            ...prev, 
            caja: totalAssets === 1 ? cId.toString() : '',
            unidad: '',
            variado: '',
            cajas: newCajas,
            detalles_unidades: newDetalles
          };
        }
        return prev;
      });
    } else if (tipo === 'variado') {
      const vId = parseInt(value);
      setFormData(prev => {
        const prevVariados = prev.variados.filter(id => id !== 'sin_unidad');
        const prevDetalles = prev.detalles_unidades.filter(d => d.variado !== 'sin_unidad');
        if (!prevVariados.includes(vId)) {
          const newVariados = [...prevVariados, vId];
          const newDetalles = [...prevDetalles, { variado: vId, monto: '' }];
          const totalAssets = prev.unidades.length + prev.cajas.length + newVariados.length;
          return { 
            ...prev, 
            variado: totalAssets === 1 ? vId.toString() : '',
            unidad: '',
            caja: '',
            variados: newVariados,
            detalles_unidades: newDetalles
          };
        }
        return prev;
      });
    } else {
      const uId = parseInt(value);
      setFormData(prev => {
        const prevUnidades = prev.unidades.filter(id => id !== 'sin_unidad');
        const prevDetalles = prev.detalles_unidades.filter(d => d.unidad !== 'sin_unidad');
        if (!prevUnidades.includes(uId)) {
          const newUnidades = [...prevUnidades, uId];
          const newDetalles = [...prevDetalles, { unidad: uId, monto: '' }];
          const totalAssets = newUnidades.length + prev.cajas.length + prev.variados.length;
          return { 
            ...prev, 
            unidad: totalAssets === 1 ? uId.toString() : '',
            caja: '',
            variado: '',
            unidades: newUnidades,
            detalles_unidades: newDetalles
          };
        }
        return prev;
      });
    }
    setBusquedaUnidad('');
    setMostrarDropdownUnidad(false);
  };

  const handleEntidadSearchChange = (e) => {
    const value = e.target.value;
    setBusquedaEntidad(value);
    setMostrarDropdownEntidad(true);
    if (!value) {
      setFormData(prev => ({
        ...prev,
        taller: '',
        proveedor: '',
        rfc_emisor: '',
        razon_social_emisor: ''
      }));
    }
  };

  const seleccionarEntidad = (entidad) => {
    setFormData(prev => ({
      ...prev,
      taller: entidad.tipo === 'taller' ? entidad.id : '',
      proveedor: entidad.tipo === 'proveedor' ? entidad.id : '',
      rfc_emisor: entidad.rfc || prev.rfc_emisor || '',
      razon_social_emisor: entidad.razon_social || prev.razon_social_emisor || '',
      categoria: entidad.tipo === 'taller' ? 'Mantenimiento' : (entidad.categoria || prev.categoria || 'Otro')
    }));
    setBusquedaEntidad(entidad.razon_social || entidad.nombre);
    setMostrarDropdownEntidad(false);
  };

  const handleEntidadBlur = () => {
    setMostrarDropdownEntidad(false);
    if (formData.taller) {
      const tallerObj = entidades.find(e => e.tipo === 'taller' && e.id === parseInt(formData.taller));
      if (tallerObj) setBusquedaEntidad(tallerObj.razon_social || tallerObj.nombre);
    } else if (formData.proveedor) {
      const provObj = entidades.find(e => e.tipo === 'proveedor' && e.id === parseInt(formData.proveedor));
      if (provObj) setBusquedaEntidad(provObj.razon_social || provObj.nombre);
    } else {
      setBusquedaEntidad('');
    }
  };

  const handleKeyDownEntidad = (e) => {
    if (e.key === 'Enter' && mostrarDropdownEntidad) {
      if (entidadesFiltradas.length === 1) {
        e.preventDefault();
        seleccionarEntidad(entidadesFiltradas[0]);
      }
    }
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
      return new File([mergedPdfBytes], `factura_${formData.folio || 'escaneada'}.pdf`, { type: "application/pdf" });
    } catch (err) {
      console.error("Error al unir documentos:", err);
      throw new Error("No se pudieron unir los documentos. Asegúrate de que sean PDFs o imágenes válidas.");
    }
  };

  const handleDetalleChange = (targetDetalle, monto) => {
    setFormData(prev => ({
      ...prev,
      detalles_unidades: prev.detalles_unidades.map(d => {
        if (targetDetalle.unidad && d.unidad === targetDetalle.unidad) {
          return { ...d, monto };
        }
        if (targetDetalle.caja && d.caja === targetDetalle.caja) {
          return { ...d, monto };
        }
        if (targetDetalle.variado && d.variado === targetDetalle.variado) {
          return { ...d, monto };
        }
        return d;
      })
    }));
  };

  const getMultiplier = (iva, resico) => {
    let mult = 1.0;
    if (iva) mult += 0.16;
    if (resico) mult -= 0.0125;
    return mult;
  };

  const handleAgregarIVA = () => {
    const nuevoIva = !ivaIncluido;
    const oldMult = getMultiplier(ivaIncluido, resicoAplicado);
    const newMult = getMultiplier(nuevoIva, resicoAplicado);
    
    setIvaIncluido(nuevoIva);
    setFormData(prev => ({
      ...prev,
      detalles_unidades: prev.detalles_unidades.map(d => ({
        ...d,
        monto: d.monto ? (parseFloat(d.monto) / oldMult * newMult).toFixed(2) : ''
      }))
    }));
  };

  const handleAgregarResico = () => {
    const nuevoResico = !resicoAplicado;
    const oldMult = getMultiplier(ivaIncluido, resicoAplicado);
    const newMult = getMultiplier(ivaIncluido, nuevoResico);
    
    setResicoAplicado(nuevoResico);
    setFormData(prev => ({
      ...prev,
      detalles_unidades: prev.detalles_unidades.map(d => ({
        ...d,
        monto: d.monto ? (parseFloat(d.monto) / oldMult * newMult).toFixed(2) : ''
      }))
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if(!window.confirm(factura ? '¿Estás seguro de actualizar esta factura?' : '¿Estás seguro de registrar esta factura?')) return;

    if (factura && isCapturista && !motivoCambio) {
        setShowMotivoModal(true);
        return;
    }
    
    setLoading(true);

    const data = new FormData();
    
    const isSinUnidad = formData.unidad === 'sin_unidad';
    const totalAssets = formData.unidades.length + formData.cajas.length + formData.variados.length;
    const hasAssets = totalAssets > 0 || (formData.unidad && formData.unidad !== 'sin_unidad') || formData.caja || formData.variado || isSinUnidad;
    
    if (!formData.folio || !formData.monto || !formData.fecha || (!formData.taller && !formData.proveedor) || !hasAssets) {
      notify.error("Faltan campos obligatorios. Revisa el Folio, Monto, Fecha, Proveedor y Unidad/Caja/Variado.");
      setLoading(false);
      return;
    }

    if (scannedFiles.length === 0 && !formData.archivo_escaneado && (!existingFile || replaceExistingScan)) {
      notify.error("Debes adjuntar o escanear el documento de la factura obligatoriamente.");
      setLoading(false);
      return;
    }

    if (totalAssets > 1) {
      const suma = formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0);
      if (Math.abs(suma - parseFloat(formData.monto)) > 0.01) {
        notify.error(`La suma del desglose ($${suma.toFixed(2)}) no coincide con el total ($${parseFloat(formData.monto).toFixed(2)})`);
        setLoading(false);
        return;
      }
    }

    data.append('fecha', formData.fecha);
    data.append('monto', formData.monto);
    data.append('folio', formData.folio);
    data.append('descripcion', formData.descripcion || '');
    if (formData.taller) data.append('taller', formData.taller);
    if (formData.proveedor) data.append('proveedor', formData.proveedor);
    
    if (totalAssets === 1) {
      if (formData.unidades.length === 1) {
        data.append('unidad', formData.unidades[0]);
      } else if (formData.cajas.length === 1) {
        data.append('caja', formData.cajas[0]);
      } else if (formData.variados.length === 1) {
        data.append('variado', formData.variados[0]);
      }
    }

    formData.unidades.forEach(uId => {
      if (uId !== 'sin_unidad') data.append('unidades', uId);
    });
    formData.cajas.forEach(cId => {
      data.append('cajas', cId);
    });
    formData.variados.forEach(vId => {
      data.append('variados', vId);
    });

    if (formData.categoria) data.append('categoria', formData.categoria);
    if (formData.ticket) data.append('ticket', formData.ticket);
    if (formData.rfc_emisor) data.append('rfc_emisor', formData.rfc_emisor);
    if (formData.razon_social_emisor) data.append('razon_social_emisor', formData.razon_social_emisor);
    
    if (esPreventivo) {
      data.append('es_preventivo', true);
      data.append('fecha_servicio', usaFechaDiferente ? fechaServicio : formData.fecha);
      if (unidadesMantenimiento.length > 0) {
        data.append('unidades_mantenimiento', JSON.stringify(unidadesMantenimiento));
      }
    }
    
    if (scannedFiles.length > 0) {
      if (existingFile && !replaceExistingScan) {
        try {
          const existingPdfRes = await fetch(formatMediaUrl(existingFile));
          const existingPdfBytes = await existingPdfRes.arrayBuffer();
          const existingDoc = await PDFDocument.load(existingPdfBytes);
          
          const mergedNewFile = await mergePDFs(scannedFiles);
          const newDoc = await PDFDocument.load(await mergedNewFile.arrayBuffer());
          
          const copiedPages = await existingDoc.copyPages(newDoc, newDoc.getPageIndices());
          copiedPages.forEach(page => existingDoc.addPage(page));
          
          const finalPdfBytes = await existingDoc.save();
          const finalFile = new File([finalPdfBytes], `factura_anexada_${Date.now()}.pdf`, { type: 'application/pdf' });
          data.append('archivo_escaneado', finalFile);
        } catch (err) {
          console.error("Error al anexar PDF:", err);
          notify.error("Error al anexar las hojas al documento existente. Asegúrate de que ambos sean PDFs válidos.");
          setLoading(false);
          return;
        }
      } else {
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
    } else if (formData.archivo_escaneado) {
       data.append('archivo_escaneado', formData.archivo_escaneado);
    }
    
    data.append('iva_aplicado', ivaIncluido);
    data.append('resico_aplicado', resicoAplicado);
    
    if (totalAssets > 1) {
      data.append('detalles_unidades', JSON.stringify(formData.detalles_unidades));
    }

    if (factura && factura.cancelado !== undefined) {
      data.append('cancelado', factura.cancelado);
    }
    if (motivoCambio) {
      data.append('motivo_cambio', motivoCambio);
    }

    try {
      if (factura) {
        await api.put(`facturas/${factura.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('facturas/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      notify.success(factura ? 'Factura actualizada' : 'Factura registrada con éxito');
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
      setFormData({ fecha: '', monto: '', folio: '', unidad: '', caja: '', variado: '', producto: '', ticket: '', taller: '', proveedor: '', descripcion: '', archivo_escaneado: null, rfc_emisor: '', razon_social_emisor: '', categoria: 'Otro', unidades: [], cajas: [], variados: [], detalles_unidades: [] });
      setEsPreventivo(false);
      setUsaFechaDiferente(false);
      setFechaServicio('');
      setUnidadesMantenimiento([]);
      setScannedFiles([]);
      setBusquedaTicket('');
      setBusquedaUnidad('');
      setBusquedaEntidad('');
    } catch (err) {
      if (err.response?.data?.folio) {
        notify.error(`El folio ya existe o es inválido: ${err.response.data.folio.join(' ')}`);
      } else {
        notify.error(err.response?.data ? 'Error en los datos enviados' : "Error al guardar la factura");
      }
    } finally {
      setLoading(false);
    }
  };

  const ticketsFiltrados = ticketsPendientes.filter(t => {
    const folio = (t.folio_interno || '').toLowerCase();
    const desc = (t.descripcion || '').toLowerCase();
    const search = busquedaTicket.toLowerCase();
    return folio.includes(search) || desc.includes(search);
  });

  const entidadesFiltradas = entidades.filter(e => {
    const searchLower = busquedaEntidad.toLowerCase();
    return (
      e.nombre.toLowerCase().includes(searchLower) ||
      (e.razon_social && e.razon_social.toLowerCase().includes(searchLower)) ||
      (e.rfc && e.rfc.toLowerCase().includes(searchLower))
    );
  });

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

  const totalSelectedAssets = formData.unidades.length + formData.cajas.length + formData.variados.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 p-3 rounded-2xl">
            <FilePlus className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {factura ? 'Editar Factura' : 'Registro de Factura'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {factura ? `Editando factura con folio ${factura.folio}` : 'Completa los datos para registrar el nuevo documento.'}
            </p>
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl">
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-xl p-4 mb-4 shadow-sm">
              <label className="block text-xs font-bold text-amber-600 dark:text-amber-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <TicketIcon size={14} /> ¿Relacionar con un Ticket? (Opcional)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-amber-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar folio o descripción..."
                    value={busquedaTicket}
                    onChange={(e) => setBusquedaTicket(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950/50 border border-amber-500/20 rounded-lg pl-8 pr-4 py-3 text-[10px] text-slate-900 dark:text-white placeholder:text-amber-500/40 focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>

                <select
                  name="ticket"
                  value={formData.ticket}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-950 border border-amber-500/20 dark:border-amber-500/30 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer text-sm"
                >
                  <option value="" className="bg-white dark:bg-slate-900">
                    {busquedaTicket 
                      ? `Resultados (${ticketsFiltrados.length})` 
                      : ticketsPendientes.length > 0 
                        ? `Seleccionar Ticket (${ticketsPendientes.length} pendientes)` 
                        : 'No hay tickets pendientes'}
                  </option>
                  {ticketsFiltrados.map(t => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">{t.folio_interno} - {t.descripcion || 'Sin descripción'} (${t.monto})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Hash size={14} /> Folio de Factura
                </label>
                <input
                  required
                  type="text"
                  name="folio"
                  value={formData.folio}
                  onChange={handleChange}
                  placeholder="Ej. F-99283"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all shadow-sm"
                />
                {folioStatus.error && <p className="text-rose-500 text-[10px] mt-1 font-bold animate-pulse">{folioStatus.error}</p>}
                {folioStatus.warning && !folioStatus.error && <p className="text-amber-500 text-[10px] mt-1 font-bold italic">{folioStatus.warning}</p>}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Taller / Proveedor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    required={!formData.taller && !formData.proveedor}
                    placeholder="Buscar taller o proveedor..."
                    value={busquedaEntidad}
                    onChange={handleEntidadSearchChange}
                    onFocus={() => setMostrarDropdownEntidad(true)}
                    onBlur={handleEntidadBlur}
                    onKeyDown={handleKeyDownEntidad}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  
                  {mostrarDropdownEntidad && (
                    <div 
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {entidadesFiltradas.length === 0 ? (
                        <div className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 italic">
                          No se encontraron resultados
                        </div>
                      ) : (
                        entidadesFiltradas.map(e => (
                          <button
                            key={`${e.tipo}-${e.id}`}
                            type="button"
                            onClick={() => seleccionarEntidad(e)}
                            className="w-full flex items-center justify-between px-6 py-3 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                          >
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {e.razon_social || e.nombre}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {e.razon_social && e.nombre && e.razon_social.trim().toLowerCase() !== e.nombre.trim().toLowerCase() && (
                                  <span className="font-medium text-slate-600 dark:text-slate-400 block mb-0.5">{e.nombre}</span>
                                )}
                                <span className="uppercase text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded mr-1.5">
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

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Hash size={14} /> RFC Emisor
                </label>
                <input
                  type="text"
                  name="rfc_emisor"
                  value={formData.rfc_emisor}
                  onChange={handleChange}
                  placeholder="Ej. ABC123456T1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Razón Social Emisor
                </label>
                <input
                  type="text"
                  name="razon_social_emisor"
                  value={formData.razon_social_emisor}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
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
                  placeholder="Ej. Compra de llantas"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Fecha de Emisión
                </label>
                <input
                  required
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Monto Total
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Truck size={14} /> Unidad(es)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar eco o placas..."
                    value={busquedaUnidad}
                    onChange={(e) => {
                      setBusquedaUnidad(e.target.value);
                      setMostrarDropdownUnidad(true);
                    }}
                    onFocus={() => setMostrarDropdownUnidad(true)}
                    onBlur={() => setMostrarDropdownUnidad(false)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                  
                  {mostrarDropdownUnidad && (
                    <div 
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                    >
                      {(!busquedaUnidad || 'sin unidad asignada'.includes(busquedaUnidad.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => seleccionarUnidad('sin_unidad')}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <span className="text-slate-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 italic">
                            Sin unidad asignada
                          </span>
                        </button>
                      )}
                      
                      {vehiculosFiltrados.length > 0 && (
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          Unidades
                        </div>
                      )}
                      {vehiculosFiltrados.map(v => (
                        <button
                          key={`vehiculo-${v.id}`}
                          type="button"
                          onClick={() => seleccionarUnidad(v.id, 'vehiculo')}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {v.numero_economico}
                            </div>
                            <div className="text-xs text-slate-500">
                              {v.placas ? `${v.placas} - ` : ''}{v.marca}
                            </div>
                          </div>
                        </button>
                      ))}

                      {cajasFiltradas.length > 0 && (
                        <div className="px-4 py-2 text-[10px] font-bold text-indigo-400 uppercase border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          Remolques / Cajas
                        </div>
                      )}
                      {cajasFiltradas.map(c => (
                        <button
                          key={`caja-${c.id}`}
                          type="button"
                          onClick={() => seleccionarUnidad(c.id, 'caja')}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-indigo-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {c.numero_economico} (Caja)
                            </div>
                            <div className="text-xs text-slate-500">
                              {c.placas ? `${c.placas} - ` : ''}{c.tipo || 'Remolque'}
                            </div>
                          </div>
                        </button>
                      ))}

                      {variadosFiltrados.length > 0 && (
                        <div className="px-4 py-2 text-[10px] font-bold text-emerald-400 uppercase border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          Vehículos Variados / Maquinaria
                        </div>
                      )}
                      {variadosFiltrados.map(v => (
                        <button
                          key={`variado-${v.id}`}
                          type="button"
                          onClick={() => seleccionarUnidad(v.id, 'variado')}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-emerald-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {v.numero_economico} ({v.tipo || 'Variado'})
                            </div>
                            <div className="text-xs text-slate-500">
                              {v.placas ? `${v.placas} - ` : ''}{v.modelo || 'Maquinaria'}
                            </div>
                          </div>
                        </button>
                      ))}

                      {vehiculosFiltrados.length === 0 && cajasFiltradas.length === 0 && variadosFiltrados.length === 0 && (
                        (!busquedaUnidad || !'sin unidad asignada'.includes(busquedaUnidad.toLowerCase())) && (
                          <div className="p-4 text-slate-500 text-center text-xs">No se encontraron unidades, cajas o maquinaria</div>
                        )
                      )}
                    </div>
                  )}
                </div>
                
                {(formData.unidades.length > 0 || formData.cajas.length > 0 || formData.variados.length > 0 || formData.unidad === 'sin_unidad') && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {formData.unidad === 'sin_unidad' && (
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full text-[10px] font-black">
                        <span>Sin unidad asignada</span>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, unidad: '', unidades: [], detalles_unidades: [] }))}
                          className="hover:text-rose-500 transition-colors ml-1 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {formData.unidades.map(uId => {
                      const v = vehiculos.find(veh => veh.id === uId);
                      return v ? (
                        <div key={`vehiculo-${uId}`} className="flex items-center gap-1.5 bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black">
                          <span>Unidad: {v.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => {
                              const newUnidades = prev.unidades.filter(id => id !== uId);
                              const newDetalles = prev.detalles_unidades.filter(d => d.unidad !== uId);
                              const totalAssets = newUnidades.length + prev.cajas.length + prev.variados.length;
                              return { 
                                ...prev, 
                                unidades: newUnidades, 
                                detalles_unidades: newDetalles,
                                unidad: totalAssets === 1 && newUnidades.length === 1 ? newUnidades[0].toString() : '',
                                caja: totalAssets === 1 && prev.cajas.length === 1 ? prev.cajas[0].toString() : '',
                                variado: totalAssets === 1 && prev.variados.length === 1 ? prev.variados[0].toString() : ''
                              };
                            })}
                            className="hover:text-rose-500 transition-colors ml-1 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                    {formData.cajas.map(cId => {
                      const c = cajas.find(caj => caj.id === cId);
                      return c ? (
                        <div key={`caja-${cId}`} className="flex items-center gap-1.5 bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-black">
                          <span>Remolque: {c.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => {
                              const newCajas = prev.cajas.filter(id => id !== cId);
                              const newDetalles = prev.detalles_unidades.filter(d => d.caja !== cId);
                              const totalAssets = prev.unidades.length + newCajas.length + prev.variados.length;
                              return { 
                                ...prev, 
                                cajas: newCajas, 
                                detalles_unidades: newDetalles,
                                unidad: totalAssets === 1 && prev.unidades.length === 1 ? prev.unidades[0].toString() : '',
                                caja: totalAssets === 1 && newCajas.length === 1 ? newCajas[0].toString() : '',
                                variado: totalAssets === 1 && prev.variados.length === 1 ? prev.variados[0].toString() : ''
                              };
                            })}
                            className="hover:text-rose-500 transition-colors ml-1 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                    {formData.variados.map(vId => {
                      const v = variados.find(vObj => vObj.id === vId);
                      return v ? (
                        <div key={`variado-${vId}`} className="flex items-center gap-1.5 bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black">
                          <span>Variado: {v.numero_economico}</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => {
                              const newVariados = prev.variados.filter(id => id !== vId);
                              const newDetalles = prev.detalles_unidades.filter(d => d.variado !== vId);
                              const totalAssets = prev.unidades.length + prev.cajas.length + newVariados.length;
                              return { 
                                ...prev, 
                                variados: newVariados, 
                                detalles_unidades: newDetalles,
                                unidad: totalAssets === 1 && prev.unidades.length === 1 ? prev.unidades[0].toString() : '',
                                caja: totalAssets === 1 && prev.cajas.length === 1 ? prev.cajas[0].toString() : '',
                                variado: totalAssets === 1 && newVariados.length === 1 ? newVariados[0].toString() : ''
                              };
                            })}
                            className="hover:text-rose-500 transition-colors ml-1 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Tag size={14} /> Categoría
                </label>
                <select
                  required
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Otro" className="bg-white dark:bg-slate-900">Seleccionar...</option>
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

            <div className="mt-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={esPreventivo}
                  onChange={(e) => {
                    setEsPreventivo(e.target.checked);
                    if (!e.target.checked) {
                      setUsaFechaDiferente(false);
                      setFechaServicio('');
                      setUnidadesMantenimiento([]);
                    } else {
                      if (!fechaServicio && formData.fecha) {
                        setFechaServicio(formData.fecha);
                      }
                      // Por defecto seleccionar todas las unidades actuales
                      setUnidadesMantenimiento(formData.unidades);
                    }
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ¿Es Mantenimiento Preventivo? (Reinicia los contadores de las unidades)
                </span>
              </label>

              {esPreventivo && (
                <div className="mt-4 pl-8 space-y-4 border-l-2 border-blue-500/20">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usaFechaDiferente}
                      onChange={(e) => {
                        setUsaFechaDiferente(e.target.checked);
                        if (e.target.checked && !fechaServicio) {
                          setFechaServicio(formData.fecha);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Usar fecha de servicio diferente a la factura
                    </span>
                  </label>

                  {usaFechaDiferente && (
                    <div className="max-w-xs animate-in slide-in-from-left-2 duration-300">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Fecha del Servicio Realizado
                      </label>
                      <input
                        required={usaFechaDiferente}
                        type="date"
                        value={fechaServicio}
                        onChange={(e) => setFechaServicio(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                  )}

                  {formData.unidades.length > 1 && (
                    <div className="mt-4 animate-in slide-in-from-left-2 duration-300">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        ¿A qué unidades se les aplicará este mantenimiento?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formData.unidades.map(uId => {
                          const v = vehiculos.find(veh => veh.id === uId);
                          const isSelected = unidadesMantenimiento.includes(uId);
                          return v ? (
                            <label
                              key={`mantenimiento-unidad-${uId}`}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setUnidadesMantenimiento(prev => [...prev, uId]);
                                  } else {
                                    setUnidadesMantenimiento(prev => prev.filter(id => id !== uId));
                                  }
                                }}
                                className="hidden"
                              />
                              {isSelected && <CheckCircle size={14} className="text-white" />}
                              {!isSelected && <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                              {v.numero_economico}
                            </label>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {totalSelectedAssets > 1 && (
              <div className="mt-2 space-y-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-amber-500/10 dark:border-amber-500/20 animate-in slide-in-from-top-2 duration-300 w-full shadow-inner">
                <div className="flex flex-wrap items-center justify-between border-b border-amber-500/10 pb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-[12px] text-amber-600 dark:text-amber-500 font-black italic flex items-center gap-2 uppercase tracking-widest">
                      <Info size={16} /> Desglose de Gastos por Unidad
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAgregarIVA}
                        className={`${ivaIncluido ? 'bg-emerald-500 text-white dark:text-slate-950' : 'bg-amber-500 text-white dark:text-slate-950'} text-[10px] font-black px-3 py-1 rounded-lg transition-all active:scale-95 shadow-lg shadow-amber-900/10 flex items-center gap-2`}
                      >
                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center ${ivaIncluido ? 'bg-white dark:bg-slate-950' : 'bg-transparent'}`}>
                          {ivaIncluido && <div className="w-1 h-1 bg-emerald-500 rounded-full" />}
                        </div>
                        {ivaIncluido ? 'IVA APLICADO (16%)' : 'AGREGAR IVA (16%)'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleAgregarResico}
                        className={`${resicoAplicado ? 'bg-blue-500 text-white dark:text-slate-950' : 'bg-slate-400 text-white dark:text-slate-950'} text-[10px] font-black px-3 py-1 rounded-lg transition-all active:scale-95 shadow-lg flex items-center gap-2`}
                      >
                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center ${resicoAplicado ? 'bg-white dark:bg-slate-950' : 'bg-transparent'}`}>
                          {resicoAplicado && <div className="w-1 h-1 bg-blue-500 rounded-full" />}
                        </div>
                        {resicoAplicado ? 'RESICO APLICADO (-1.25%)' : 'RETENCIÓN RESICO (-1.25%)'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Suma Total:</span>
                    <span className={`text-sm font-black px-4 py-1.5 rounded-full ${
                      Math.abs(formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0) - parseFloat(formData.monto || 0)) < 0.01
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-400/10'
                    }`}>
                      ${formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {formData.detalles_unidades.map((detalle) => {
                    let key, name;
                    if (detalle.unidad) {
                      const v = vehiculos.find(veh => veh.id === detalle.unidad);
                      key = `unidad-${detalle.unidad}`;
                      name = v ? `Unidad: ${v.numero_economico}` : `Unidad #${detalle.unidad}`;
                    } else if (detalle.caja) {
                      const c = cajas.find(caj => caj.id === detalle.caja);
                      key = `caja-${detalle.caja}`;
                      name = c ? `Remolque: ${c.numero_economico}` : `Remolque #${detalle.caja}`;
                    } else if (detalle.variado) {
                      const varObj = variados.find(vObj => vObj.id === detalle.variado);
                      key = `variado-${detalle.variado}`;
                      name = varObj ? `Variado: ${varObj.numero_economico}` : `Variado #${detalle.variado}`;
                    }
                    if (!key) return null;

                    return (
                      <div key={key} className="flex items-center gap-4 bg-white dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30 transition-all shadow-sm">
                        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 min-w-[120px] text-center">
                          <span className="text-xs font-black text-slate-700 dark:text-white">{name}</span>
                        </div>
                        <div className="relative flex-grow">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={detalle.monto}
                            onChange={(e) => handleDetalleChange(detalle, e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-blue-500 transition-colors relative min-h-[250px] shadow-sm">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
              accept="image/*,.pdf"
              disabled={scannedFiles.length >= 20}
            />
            
            <div className="bg-blue-600/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-600 dark:text-blue-500" size={24} />
            </div>
            
            {scannedFiles.length > 0 ? (
              <div className="w-full space-y-3 relative z-20">
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle size={12} /> {scannedFiles.length}/20 {scannedFiles.length === 1 ? 'Documento' : 'Documentos'} Listos
                </p>
                
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {scannedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2 rounded-xl group/item hover:border-blue-500/50 transition-all">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-blue-600/10 p-1.5 rounded-lg">
                          <FilePlus size={12} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                          {file.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          type="button"
                          onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name, isPdf: file.type === 'application/pdf' })}
                          className="text-slate-600 hover:text-blue-500 p-1 transition-colors mr-1"
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleScan('brother')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en alimentador"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>ALIMENTADOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScan('brother1')}
                      disabled={scanning || scannedFiles.length >= 20}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
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
            ) : existingFile ? (
              <div className="w-full space-y-3 relative z-20 px-2">
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle size={12} /> Documento Actual
                </p>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2 rounded-xl group/item hover:border-blue-500/50 transition-all">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-emerald-600/10 p-1.5 rounded-lg">
                      <FilePlus size={12} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                      Documento Original Guardado
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button 
                      type="button"
                      onClick={() => setPreviewFile({ url: formatMediaUrl(existingFile), name: 'Documento Original', isPdf: existingFile.toLowerCase().endsWith('.pdf') })}
                      className="text-slate-600 hover:text-blue-500 p-1 transition-colors mr-1"
                      title="Previsualizar"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setExistingFile(null)}
                      className="text-slate-600 hover:text-rose-500 p-1 transition-colors"
                      title="Quitar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2 bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg border border-rose-100 dark:border-rose-900/20">
                    <input 
                      type="checkbox" 
                      id="replaceExistingScan"
                      checked={replaceExistingScan}
                      onChange={(e) => setReplaceExistingScan(e.target.checked)}
                      className="rounded border-rose-300 text-rose-500 focus:ring-rose-500"
                    />
                    <label htmlFor="replaceExistingScan" className="text-[10px] text-rose-700 dark:text-rose-400 font-semibold cursor-pointer select-none">
                      Eliminar escaneo anterior y reemplazar completamente
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mb-1">
                    {replaceExistingScan 
                      ? "Se reemplazará el documento actual con las nuevas hojas." 
                      : "Las hojas nuevas se agregarán al final del documento actual."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleScan('brother')}
                      disabled={scanning}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en alimentador"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>ALIMENTADOR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScan('brother1')}
                      disabled={scanning}
                      className="flex-1 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      title="Escanear en cristal"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={14} />}
                      <span>CRISTAL</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 relative z-20 w-full px-4">
                <p className="text-slate-900 dark:text-white font-semibold text-base">Adjuntar PDF o Imagen</p>
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
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    title="Escanear en alimentador"
                  >
                    {scanning ? <Spinner /> : <FilePlus size={14} />}
                    <span>ALIMENTADOR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScan('brother1')}
                    disabled={scanning || scannedFiles.length >= 20}
                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-[10px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700"
                    title="Escanear en cristal"
                  >
                    {scanning ? <Spinner /> : <FilePlus size={14} />}
                    <span>CRISTAL</span>
                  </button>
                </div>
                <a
                  href="/agente_escaner.zip"
                  download
                  className="text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 underline text-[10px] font-bold block mt-2 text-center"
                >
                  ¿No tienes el asistente local? Descárgalo aquí
                </a>
              </div>
            )}
          </div>


          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Spinner /> : <FilePlus size={20} />}
            <span>{loading ? 'REGISTRANDO...' : (factura ? 'GUARDAR CAMBIOS' : 'REGISTRAR FACTURA')}</span>
          </button>
        </div>
      </form>
      
      {showMotivoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="text-amber-500" />
                Motivo del Cambio
              </h2>
              <p className="text-slate-500 text-sm mt-2">
                Como capturista, debes solicitar autorización para modificar esta factura. ¿Cuál es el motivo?
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={motivoCambio}
                onChange={(e) => setMotivoCambio(e.target.value)}
                placeholder="Ej. Se corrigió el monto porque el ticket original tenía un error..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all resize-none min-h-[120px]"
                required
              />
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowMotivoModal(false);
                  setMotivoCambio('');
                }}
                className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!motivoCambio.trim()) {
                    notify.error("Debes ingresar un motivo.");
                    return;
                  }
                  setShowMotivoModal(false);
                  handleSubmit();
                }}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl transition-colors shadow-lg shadow-amber-600/30 flex items-center gap-2 font-medium text-sm disabled:opacity-50"
              >
                {loading ? <Spinner /> : 'Enviar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="text-blue-500" />
                Previsualización: {previewFile.name}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-rose-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 flex items-center justify-center overflow-auto relative">
              {previewFile.isPdf ? (
                <iframe src={previewFile.url} className="w-full h-full rounded-xl shadow-inner border border-slate-200 dark:border-slate-800" title="PDF Preview" />
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

export default AltaFactura;
