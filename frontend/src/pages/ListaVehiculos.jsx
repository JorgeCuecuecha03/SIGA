import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Truck, 
  Search, 
  Plus, 
  Hash, 
  CreditCard, 
  Calendar, 
  Binary, 
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  FilePlus,
  Wrench,
  LogIn,
  CheckCircle2,
  BarChart3,
  List,
  ChevronLeft,
  ChevronRight,
  Droplets,
  History,
  X,
  Pencil,
  Trash2,
  Clock,
  AlertTriangle,
  Tag,
  Info,
  Archive,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AltaVehiculo from './AltaVehiculo';
import AltaCaja from './AltaCaja';
import AltaVariado from './AltaVariado';
import AnalisisGastos from './AnalisisGastos';
import notify from '../utils/notifications';
import { formatMediaUrl } from '../utils/media';

const ListaVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Maintenance & Modal States
  const [talleres, setTalleres] = useState([]);
  const [showOrdenModal, setShowOrdenModal] = useState(false);
  const [showCompletarModal, setShowCompletarModal] = useState(false);
  const [ordenForm, setOrdenForm] = useState({ tipo: 'correctivo', taller: '', descripcion: '' });
  const [formLoading, setFormLoading] = useState(false);
  
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [showFacturasModal, setShowFacturasModal] = useState(false);
  const [facturas, setFacturas] = useState([]);
  const [allFacturas, setAllFacturas] = useState([]);
  const [cargasCombustible, setCargasCombustible] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const { user } = React.useContext(AuthContext);
  const isLector = user?.rol === 'lector_gastos';
  const [ordenesTrabajo, setOrdenesTrabajo] = useState([]);
  const [showInfoMantenimientoModal, setShowInfoMantenimientoModal] = useState(false);
  const [showMantenimientoModal, setShowMantenimientoModal] = useState(false);
  const [selectedUnitForFuel, setSelectedUnitForFuel] = useState(null);
  const [fuelHistory, setFuelHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('lista'); // 'lista' o 'analisis'
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Cajas States
  const [cajas, setCajas] = useState([]);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [showAltaCajaModal, setShowAltaCajaModal] = useState(false);
  const [editingCaja, setEditingCaja] = useState(null);
  const [currentPageCajas, setCurrentPageCajas] = useState(1);
  const [selectedCaja, setSelectedCaja] = useState(null);
  const [showCajaFacturasModal, setShowCajaFacturasModal] = useState(false);
  const [cajaFacturas, setCajaFacturas] = useState([]);
  const [loadingCajaFacturas, setLoadingCajaFacturas] = useState(false);

  // Variados States
  const [variados, setVariados] = useState([]);
  const [loadingVariados, setLoadingVariados] = useState(false);
  const [showAltaVariadoModal, setShowAltaVariadoModal] = useState(false);
  const [editingVariado, setEditingVariado] = useState(null);
  const [currentPageVariados, setCurrentPageVariados] = useState(1);
  const [selectedVariado, setSelectedVariado] = useState(null);
  const [showVariadoFacturasModal, setShowVariadoFacturasModal] = useState(false);
  const [variadoFacturas, setVariadoFacturas] = useState([]);
  const [loadingVariadoFacturas, setLoadingVariadoFacturas] = useState(false);

  const fetchFuelHistory = async (unit, tipoEntidad = 'vehiculo') => {
    try {
      setLoadingHistory(true);
      setSelectedUnitForFuel(unit);
      const queryParam = tipoEntidad === 'variado' ? `unidad_variada_id=${unit.id}` : `unidad_id=${unit.id}`;
      const res = await api.get(`cargas-combustible/historial_unidad/?${queryParam}`);
      setFuelHistory(res.data);
    } catch (err) {
      console.error("Error fetching fuel history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchCajas = async () => {
    try {
      setLoadingCajas(true);
      const res = await api.get('cajas/', { params: { nopaged: true } });
      setCajas(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando cajas", err);
      notify.error("No se pudieron cargar las cajas.");
    } finally {
      setLoadingCajas(false);
    }
  };

  const fetchVariados = async () => {
    try {
      setLoadingVariados(true);
      const res = await api.get('variados/', { params: { nopaged: true } });
      setVariados(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando vehículos variados", err);
      notify.error("No se pudieron cargar los vehículos variados.");
    } finally {
      setLoadingVariados(false);
    }
  };

  const openCajaFacturasModal = async (cajaObj) => {
    setModalSearchTerm('');
    setSelectedCaja(cajaObj);
    setLoadingCajaFacturas(true);
    setShowCajaFacturasModal(true);
    try {
      const res = await api.get('facturas/', { params: { caja: cajaObj.id, nopaged: true } });
      const data = res.data.results || res.data;
      const filtered = data.reduce((acc, f) => {
        const detalle = f.detalles_unidades?.find(d => d.caja === cajaObj.id);
        if (detalle) {
          acc.push({ ...f, monto_especifico: detalle.monto, es_compartida: true });
        } else if (f.caja === cajaObj.id) {
          acc.push({ ...f, monto_especifico: f.monto, es_compartida: (f.unidades_info?.length > 1) });
        }
        return acc;
      }, []);
      setCajaFacturas(filtered);
    } catch (err) {
      console.error("Error cargando facturas de la caja", err);
    } finally {
      setLoadingCajaFacturas(false);
    }
  };

  const openVariadoFacturasModal = async (variadoObj) => {
    setModalSearchTerm('');
    setSelectedVariado(variadoObj);
    setLoadingVariadoFacturas(true);
    setShowVariadoFacturasModal(true);
    try {
      const res = await api.get('facturas/', { params: { variado: variadoObj.id, nopaged: true } });
      const data = res.data.results || res.data;
      const filtered = data.reduce((acc, f) => {
        const detalle = f.detalles_unidades?.find(d => d.variado === variadoObj.id);
        if (detalle) {
          acc.push({ ...f, monto_especifico: detalle.monto, es_compartida: true });
        } else if (f.variado === variadoObj.id) {
          acc.push({ ...f, monto_especifico: f.monto, es_compartida: (f.unidades_info?.length > 1) });
        }
        return acc;
      }, []);
      setVariadoFacturas(filtered);
    } catch (err) {
      console.error("Error cargando facturas del vehículo variado", err);
    } finally {
      setLoadingVariadoFacturas(false);
    }
  };

  useEffect(() => {
    fetchVehiculos();
    fetchTalleres();
    fetchAllFacturas();
    fetchCargasCombustible();
    fetchOrdenes();
    fetchCajas();
    fetchVariados();
  }, []);

  const fetchCargasCombustible = async () => {
    try {
      const res = await api.get('cargas-combustible/', { params: { nopaged: true } });
      setCargasCombustible(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando cargas de combustible", err);
    }
  };

  const fetchOrdenes = async () => {
    try {
      const res = await api.get('ordenes-trabajo/', { params: { nopaged: true } });
      setOrdenesTrabajo(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando órdenes", err);
    }
  };

  const fetchAllFacturas = async () => {
    try {
      const res = await api.get('facturas/', { params: { nopaged: true } });
      setAllFacturas(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando todas las facturas", err);
    }
  };

  const fetchTalleres = async () => {
    try {
      const res = await api.get('talleres/', { params: { nopaged: true } });
      setTalleres(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando talleres", err);
    }
  };

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const res = await api.get('vehiculos/', { params: { nopaged: true } });
      setVehiculos(res.data.results || res.data);
    } catch (err) {
      console.error("Error cargando vehículos", err);
      notify.error("No se pudieron cargar las unidades.");
    } finally {
      setLoading(false);
    }
  };

  const handleAltaSuccess = () => {
    setShowAltaModal(false);
    setEditingVehiculo(null);
    fetchVehiculos();
  };

  const handleEditClick = (e, v) => {
    e.stopPropagation();
    setEditingVehiculo(v);
    setShowAltaModal(true);
  };

  const handleDeleteClick = async (e, v) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar la unidad ${v.numero_economico}? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`vehiculos/${v.id}/`);
        notify.success("Unidad eliminada correctamente");
        fetchVehiculos();
      } catch (err) {
        console.error("Error eliminando vehículo", err);
        notify.error("No se pudo eliminar el vehículo.");
      }
    }
  };

  const handleAltaCajaSuccess = () => {
    setShowAltaCajaModal(false);
    setEditingCaja(null);
    fetchCajas();
  };

  const handleEditCajaClick = (e, c) => {
    e.stopPropagation();
    setEditingCaja(c);
    setShowAltaCajaModal(true);
  };

  const handleDeleteCajaClick = async (e, c) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar la caja ${c.numero_economico}? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`cajas/${c.id}/`);
        notify.success("Caja eliminada correctamente");
        fetchCajas();
      } catch (err) {
        console.error("Error eliminando caja", err);
        notify.error("No se pudo eliminar la caja.");
      }
    }
  };

  const handleAltaVariadoSuccess = () => {
    setShowAltaVariadoModal(false);
    setEditingVariado(null);
    fetchVariados();
  };

  const handleEditVariadoClick = (e, v) => {
    e.stopPropagation();
    setEditingVariado(v);
    setShowAltaVariadoModal(true);
  };

  const handleDeleteVariadoClick = async (e, v) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que deseas eliminar el vehículo variado ${v.numero_economico}? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`variados/${v.id}/`);
        notify.success("Vehículo variado eliminado correctamente");
        fetchVariados();
      } catch (err) {
        console.error("Error eliminando vehículo variado", err);
        notify.error("No se pudo eliminar el vehículo variado.");
      }
    }
  };

  const filteredVehiculos = vehiculos.filter(v => 
    v.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCajas = cajas.filter(c => 
    c.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.tipo && c.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredVariados = variados.filter(v => 
    v.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.placas && v.placas.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.tipo && v.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (v.modelo && v.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Reset to first page on search
  useEffect(() => {
    setCurrentPage(1);
    setCurrentPageCajas(1);
    setCurrentPageVariados(1);
  }, [searchTerm, activeTab]);

  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);
  const currentVehiculos = filteredVehiculos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPagesCajas = Math.ceil(filteredCajas.length / itemsPerPage);
  const currentCajas = filteredCajas.slice(
    (currentPageCajas - 1) * itemsPerPage,
    currentPageCajas * itemsPerPage
  );

  const totalPagesVariados = Math.ceil(filteredVariados.length / itemsPerPage);
  const currentVariados = filteredVariados.slice(
    (currentPageVariados - 1) * itemsPerPage,
    currentPageVariados * itemsPerPage
  );

  const fetchVehiculoFacturas = async (vehiculoId) => {
    setLoadingFacturas(true);
    try {
      const res = await api.get('facturas/', { params: { unidad: vehiculoId, nopaged: true } });
      const data = res.data.results || res.data;
      const filtered = data.reduce((acc, f) => {
        // Buscar si esta unidad tiene un monto asignado específicamente
        const detalle = f.detalles_unidades?.find(d => d.unidad === vehiculoId);
        if (detalle) {
          acc.push({ ...f, monto_especifico: detalle.monto, es_compartida: true });
        } else if (f.unidad === vehiculoId) {
          // Si es la unidad principal y no hay desglose, mostramos el total
          acc.push({ ...f, monto_especifico: f.monto, es_compartida: (f.unidades_info?.length > 1) });
        }
        return acc;
      }, []);
      setVehiculoFacturas(filtered);
      setFacturas(filtered); // Sincronizar con el estado que usa el modal
      return filtered;
    } catch (err) {
      console.error("Error cargando facturas", err);
      return [];
    } finally {
      setLoadingFacturas(false);
    }
  };

  const handleStatusClick = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    
    // Si está fuera de servicio, siempre mostramos la info primero
    if (vehiculo.estado && vehiculo.estado !== 'operativa') {
        setShowInfoMantenimientoModal(true);
        return;
    }

    // Si está operativa y NO es jefe logistica, permitimos dar salida
    if (user?.rol !== 'jefe_logistica' && !isLector) {
        setOrdenForm({ tipo: 'correctivo', taller: '', descripcion: '' });
        setShowOrdenModal(true);
    }
  };

  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState([]);
  const [vehiculoFacturas, setVehiculoFacturas] = useState([]);

  const handleCreateOrden = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('ordenes-trabajo/', {
        unidad: selectedVehiculo.id,
        ...ordenForm
      });
      notify.success("Orden de salida generada");
      setShowOrdenModal(false);
      fetchVehiculos(); 
      fetchOrdenes();
    } catch (err) {
      console.error("Error al crear orden", err);
      notify.error("No se pudo crear la orden de trabajo.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCompletarOrden = async () => {
    if (facturasSeleccionadas.length === 0) {
      notify.info("Debes seleccionar al menos una factura.");
      return;
    }
    setFormLoading(true);
    try {
      await api.post(`ordenes-trabajo/${selectedVehiculo.orden_activa}/completar/`, {
        facturas: facturasSeleccionadas
      });
      notify.success("Unidad reintegrada a operación");
      setShowCompletarModal(false);
      setShowInfoMantenimientoModal(false);
      fetchVehiculos(); 
      fetchOrdenes();
    } catch (err) {
      console.error("Error al completar orden", err);
      notify.error("Error al procesar el alta.");
    } finally {
      setFormLoading(false);
    }
  };

  const openFacturasModal = async (vehiculo) => {
    setModalSearchTerm('');
    setSelectedVehiculo(vehiculo);
    const data = await fetchVehiculoFacturas(vehiculo.id);
    setFacturas(data);
    setShowFacturasModal(true);
  };

  const filterFacturasList = (list) => {
    if (!modalSearchTerm.trim()) return list;
    const term = modalSearchTerm.toLowerCase();
    return list.filter(f => {
      const folio = (f.folio || '').toLowerCase();
      const taller = (f.taller_nombre || '').toLowerCase();
      const proveedor = (f.proveedor_nombre || '').toLowerCase();
      const rfc = (f.rfc_emisor || '').toLowerCase();
      const razonSocial = (f.razon_social_emisor || '').toLowerCase();
      const descripcion = (f.descripcion || '').toLowerCase();

      return folio.includes(term) ||
             taller.includes(term) ||
             proveedor.includes(term) ||
             rfc.includes(term) ||
             razonSocial.includes(term) ||
             descripcion.includes(term);
    });
  };

  const formatMotivoEspera = (motivo) => {
    const motivos = {
        'falta_refaccion': 'Falta de pieza/refacción',
        'taller_lleno': 'Sin espacio en taller',
        'falta_presupuesto': 'Aprobación de presupuesto',
        'otro': 'Otro motivo'
    };
    return motivos[motivo] || motivo;
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {activeTab === 'cajas' ? (
              <>
                <Archive className="text-blue-500 shrink-0" size={32} />
                Catálogo de Cajas / Remolques
              </>
            ) : activeTab === 'variados' ? (
              <>
                <Settings className="text-blue-500 shrink-0" size={32} />
                Catálogo de Vehículos Variados
              </>
            ) : (
              <>
                <Truck className="text-blue-500 shrink-0" size={32} />
                Catálogo de Unidades
              </>
            )}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 lg:mt-2 text-sm lg:text-lg">
            {activeTab === 'cajas' 
              ? 'Administra y visualiza toda la flota de remolques y cajas.' 
              : activeTab === 'variados'
                ? 'Administra y visualiza la flota de vehículos variados y maquinaria.'
                : 'Administra y visualiza toda la flota de tractocamiones.'}
          </p>
        </div>
        
        {user?.rol !== 'jefe_logistica' && !isLector && activeTab !== 'analisis' && (
          <button 
            onClick={() => {
              if (activeTab === 'cajas') setShowAltaCajaModal(true);
              else if (activeTab === 'variados') setShowAltaVariadoModal(true);
              else setShowAltaModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 lg:px-6 py-3 rounded-xl lg:rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 w-full md:w-auto"
          >
            <Plus size={20} />
            {activeTab === 'cajas' ? 'Nueva Caja' : activeTab === 'variados' ? 'Nuevo Vehículo Variado' : 'Nueva Unidad'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 w-full sm:w-max overflow-x-auto custom-scrollbar whitespace-nowrap backdrop-blur-xl shadow-inner">
        <button
          onClick={() => setActiveTab('lista')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 rounded-full text-sm lg:text-base font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'lista' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'lista' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <List size={18} /> Lista
          </span>
        </button>
        <button
          onClick={() => setActiveTab('cajas')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 rounded-full text-sm lg:text-base font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'cajas' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'cajas' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Archive size={18} /> Cajas / Remolques
          </span>
        </button>
        <button
          onClick={() => setActiveTab('variados')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 rounded-full text-sm lg:text-base font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'variados' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'variados' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Settings size={18} /> Vehículos Variados
          </span>
        </button>
        <button
          onClick={() => setActiveTab('analisis')}
          className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 lg:px-8 py-2.5 rounded-full text-sm lg:text-base font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'analisis' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'analisis' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <BarChart3 size={18} /> Análisis
          </span>
        </button>
      </div>

      {activeTab === 'lista' && (
        <>
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 lg:left-5 flex items-center pointer-events-none">
              <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar unidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-base lg:text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 lg:py-20 space-y-4">
              <Loader2 className="text-blue-500 animate-spin" size={40} />
              <p className="text-slate-400 font-medium">Cargando flota...</p>
            </div>
          ) : filteredVehiculos.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] p-12 lg:p-20 text-center space-y-6 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Truck className="text-slate-400 dark:text-slate-600" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">No se encontraron unidades</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base max-w-md mx-auto">
                  {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otros términos.` : "Aún no has registrado ningún camión en el sistema."}
                </p>
              </div>
              {!searchTerm && (
                <button 
                  onClick={() => setShowAltaModal(true)}
                  className="inline-flex items-center gap-2 text-blue-500 font-bold hover:text-blue-400 transition-colors"
                >
                  Registrar mi primera unidad <Plus size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                {currentVehiculos.map((v) => (
                  <div 
                    key={v.id} 
                    className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 shadow-lg dark:shadow-none"
                  >
                    {/* Image Container */}
                    <div className="relative h-48 lg:h-56 overflow-hidden bg-slate-50 dark:bg-slate-950">
                      {v.imagen ? (
                        <img 
                          src={v.imagen} 
                          alt={`${v.marca} ${v.modelo}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800">
                          <Truck size={60} lg:size={80} strokeWidth={1} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] lg:text-xs font-black tracking-widest uppercase shadow-lg">
                          {v.numero_economico}
                        </div>
                        <div className="bg-slate-900/90 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700 shadow-lg">
                          {v.capacidad} Tons
                        </div>
                      </div>
                    </div>

                    {/* Data Content */}
                    <div className="p-5 lg:p-8 space-y-4 lg:space-y-6">
                      <div className="min-w-0">
                        <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                          {v.marca} {v.modelo}
                        </h3>
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider">{v.anio || 'Año no especificado'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Placas</p>
                          <p className="text-slate-900 dark:text-white font-mono font-bold text-xs lg:text-base flex items-center gap-2">
                            <CreditCard size={14} className="text-blue-500 shrink-0" />
                            <span className="truncate">{v.placas}</span>
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                          <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Serie (VIN)</p>
                          <p className="text-slate-900 dark:text-white font-mono font-bold text-xs lg:text-base flex items-center gap-2">
                            <Binary size={14} className="text-blue-500 shrink-0" />
                            <span className="truncate">{v.numero_vin || 'N/A'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Fuel & Efficiency Section */}
                      <button 
                        type="button"
                        onClick={() => fetchFuelHistory(v, 'vehiculo')}
                        className="w-full text-left bg-blue-600/5 dark:bg-blue-600/5 border border-blue-500/10 dark:border-blue-500/10 rounded-2xl p-4 space-y-3 hover:bg-blue-600/10 transition-all group/fuel active:scale-[0.98] shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest">
                            <Droplets size={14} className="group-hover/fuel:animate-pulse" />
                            Última Carga
                          </div>
                          <span className="text-white text-xs font-bold bg-blue-600 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                            {v.fecha_ultima_carga ? new Date(v.fecha_ultima_carga + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '---'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-tight">Kilometraje</p>
                            <p className="text-slate-900 dark:text-white font-black text-lg">{v.ultimo_kilometraje != null ? `${String(v.ultimo_kilometraje)} km` : '---'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-tight">Rendimiento</p>
                            <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg flex items-center justify-end gap-1">
                              <Droplets size={14} />
                              {v.ultimo_rendimiento > 0 ? `${v.ultimo_rendimiento} km/l` : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-blue-500/10 flex items-center justify-center gap-2 text-blue-500/50 dark:text-blue-400/50 group-hover/fuel:text-blue-600 dark:group-hover/fuel:text-blue-400 transition-colors">
                           <History size={12} />
                           <span className="text-[10px] font-bold uppercase tracking-wider">Ver Historial Completo</span>
                        </div>
                      </button>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {/* Botón de estado (Operativo / Fuera de Servicio) oculto por ahora
                          <button 
                            type="button"
                            onClick={() => handleStatusClick(v)}
                            className={`flex items-center justify-center gap-2 text-[10px] lg:text-xs font-bold px-3 py-2 rounded-full transition-all active:scale-95 hover:shadow-lg ${
                              (!v.estado || v.estado === 'operativa')
                                ? 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20' 
                                : 'text-rose-500 bg-rose-500/10 hover:bg-rose-500/20'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${
                              (!v.estado || v.estado === 'operativa') ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}></span>
                            {(!v.estado || v.estado === 'operativa') ? 'Operativo' : 'Fuera de Servicio'}
                          </button>
                          */}
                          <button 
                            type="button"
                            onClick={() => openFacturasModal(v)}
                            className="flex items-center justify-center gap-2 text-xs lg:text-sm text-blue-400 hover:text-blue-300 font-bold transition-colors bg-blue-900/20 px-3 py-2 rounded-xl hover:bg-blue-900/40"
                          >
                            Facturas <ExternalLink size={16} />
                          </button>
                        </div>

                        {!isLector && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => handleEditClick(e, v)}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-all"
                            title="Editar Unidad"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteClick(e, v)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar Unidad"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'cajas' && (
        <>
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 lg:left-5 flex items-center pointer-events-none">
              <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar caja por eco, placas o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-base lg:text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
            />
          </div>

          {loadingCajas ? (
            <div className="flex flex-col items-center justify-center py-16 lg:py-20 space-y-4">
              <Loader2 className="text-blue-500 animate-spin" size={40} />
              <p className="text-slate-400 font-medium">Cargando remolques...</p>
            </div>
          ) : filteredCajas.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] p-12 lg:p-20 text-center space-y-6 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Archive className="text-slate-400 dark:text-slate-600" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">No se encontraron cajas</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base max-w-md mx-auto">
                  {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otros términos.` : "Aún no has registrado ningún remolque en el sistema."}
                </p>
              </div>
              {!searchTerm && user?.rol !== 'jefe_logistica' && !isLector && (
                <button 
                  onClick={() => setShowAltaCajaModal(true)}
                  className="inline-flex items-center gap-2 text-blue-500 font-bold hover:text-blue-400 transition-colors"
                >
                  Registrar mi primer remolque <Plus size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                {currentCajas.map((c) => (
                  <div 
                    key={c.id} 
                    className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 shadow-lg dark:shadow-none p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] lg:text-xs font-black tracking-widest uppercase shadow-lg">
                        {c.numero_economico}
                      </div>
                      {c.modelo && (
                        <div className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800">
                          Modelo {c.modelo}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                        {c.tipo || 'Caja / Remolque'}
                      </h3>
                      <p className="text-slate-400 text-xs font-mono truncate">Serie: {c.numero_serie || 'N/A'}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                      <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Placas</p>
                      <p className="text-slate-900 dark:text-white font-mono font-bold text-base flex items-center gap-2">
                        <CreditCard size={14} className="text-blue-500 shrink-0" />
                        <span>{c.placas}</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={() => openCajaFacturasModal(c)}
                        className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors bg-blue-500/10 px-3 py-2 rounded-xl"
                      >
                        Gastos / Facturas <ExternalLink size={14} />
                      </button>

                      {user?.rol !== 'jefe_logistica' && !isLector && (
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={(e) => handleEditCajaClick(e, c)}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-all"
                            title="Editar Caja"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteCajaClick(e, c)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar Caja"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPagesCajas > 1 && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <button
                    onClick={() => setCurrentPageCajas(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageCajas === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPagesCajas)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPageCajas(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          currentPageCajas === i + 1
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPageCajas(prev => Math.min(prev + 1, totalPagesCajas))}
                    disabled={currentPageCajas === totalPagesCajas}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'variados' && (
        <>
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 lg:left-5 flex items-center pointer-events-none">
              <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            </div>
            <input
              type="text"
              placeholder="Buscar vehículo variado por eco, placas, tipo o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-base lg:text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
            />
          </div>

          {loadingVariados ? (
            <div className="flex flex-col items-center justify-center py-16 lg:py-20 space-y-4">
              <Loader2 className="text-blue-500 animate-spin" size={40} />
              <p className="text-slate-400 font-medium">Cargando vehículos variados...</p>
            </div>
          ) : filteredVariados.length === 0 ? (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] p-12 lg:p-20 text-center space-y-6 shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Settings className="text-slate-400 dark:text-slate-600" size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">No se encontraron vehículos variados</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base max-w-md mx-auto">
                  {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otros términos.` : "Aún no has registrado ningún vehículo variado en el sistema."}
                </p>
              </div>
              {!searchTerm && user?.rol !== 'jefe_logistica' && !isLector && (
                <button 
                  onClick={() => setShowAltaVariadoModal(true)}
                  className="inline-flex items-center gap-2 text-blue-500 font-bold hover:text-blue-400 transition-colors"
                >
                  Registrar mi primer vehículo variado <Plus size={18} />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                {currentVariados.map((v) => (
                  <div 
                    key={v.id} 
                    className="bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 shadow-lg dark:shadow-none p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] lg:text-xs font-black tracking-widest uppercase shadow-lg">
                        {v.numero_economico}
                      </div>
                      {v.modelo && (
                        <div className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-800">
                          Modelo {v.modelo}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors truncate">
                        {v.tipo || 'Vehículo Variado'}
                      </h3>
                      <p className="text-slate-400 text-xs font-mono truncate">Serie: {v.numero_serie || 'N/A'}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-inner">
                      <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mb-1">Placas</p>
                      <p className="text-slate-900 dark:text-white font-mono font-bold text-base flex items-center gap-2">
                        <CreditCard size={14} className="text-blue-500 shrink-0" />
                        <span>{v.placas || 'N/A'}</span>
                      </p>
                    </div>

                    {/* Fuel & Efficiency Section */}
                    <button 
                      type="button"
                      onClick={() => fetchFuelHistory(v, 'variado')}
                      className="w-full text-left bg-blue-600/5 dark:bg-blue-600/5 border border-blue-500/10 dark:border-blue-500/10 rounded-2xl p-4 space-y-3 hover:bg-blue-600/10 transition-all group/fuel active:scale-[0.98] shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest">
                          <Droplets size={14} className="group-hover/fuel:animate-pulse" />
                          Última Carga
                        </div>
                        <span className="text-white text-xs font-bold bg-blue-600 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                          {v.fecha_ultima_carga ? new Date(v.fecha_ultima_carga + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '---'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-tight">Km / Hrs</p>
                          <p className="text-slate-900 dark:text-white font-black text-lg">{v.ultimo_kilometraje != null ? `${String(v.ultimo_kilometraje)}` : '---'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-tight">Rendimiento</p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg flex items-center justify-end gap-1">
                            <Droplets size={14} />
                            {v.ultimo_rendimiento > 0 ? `${v.ultimo_rendimiento} km/l` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-blue-500/10 flex items-center justify-center gap-2 text-blue-500/50 dark:text-blue-400/50 group-hover/fuel:text-blue-600 dark:group-hover/fuel:text-blue-400 transition-colors">
                         <History size={12} />
                         <span className="text-[10px] font-bold uppercase tracking-wider">Ver Historial Completo</span>
                      </div>
                    </button>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <button 
                        type="button"
                        onClick={() => openVariadoFacturasModal(v)}
                        className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-400 font-bold transition-colors bg-blue-500/10 px-3 py-2 rounded-xl"
                      >
                        Gastos / Facturas <ExternalLink size={14} />
                      </button>

                      {user?.rol !== 'jefe_logistica' && !isLector && (
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={(e) => handleEditVariadoClick(e, v)}
                            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-lg transition-all"
                            title="Editar Vehículo"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDeleteVariadoClick(e, v)}
                            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar Vehículo"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPagesVariados > 1 && (
                <div className="flex items-center justify-center gap-4 pt-8">
                  <button
                    onClick={() => setCurrentPageVariados(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageVariados === 1}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPagesVariados)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPageVariados(i + 1)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          currentPageVariados === i + 1
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPageVariados(prev => Math.min(prev + 1, totalPagesVariados))}
                    disabled={currentPageVariados === totalPagesVariados}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-blue-500 disabled:opacity-30 disabled:hover:border-slate-800 transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'analisis' && (
        <AnalisisGastos 
          facturas={allFacturas} 
          vehiculos={vehiculos} 
          cajas={cajas}
          variados={variados}
          cargasCombustible={cargasCombustible}
        />
      )}

      {/* Modal de Nueva Unidad */}
      {showAltaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-4xl p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <AltaVehiculo 
              onSuccess={handleAltaSuccess} 
              onClose={() => {
                setShowAltaModal(false);
                setEditingVehiculo(null);
              }} 
              vehiculo={editingVehiculo}
            />
          </div>
        </div>
      )}

      {/* Modal de Facturas */}
      {showFacturasModal && selectedVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header del Modal */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="min-w-0">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <FilePlus className="text-blue-500 shrink-0" size={24} />
                  <span className="truncate">Facturas Unidad {selectedVehiculo.numero_economico}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm mt-1 truncate">{selectedVehiculo.marca} {selectedVehiculo.modelo} - {selectedVehiculo.placas}</p>
              </div>
              <button 
                onClick={() => {
                  setShowFacturasModal(false);
                  setSelectedVehiculo(null);
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shrink-0 shadow-sm"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900/50 custom-scrollbar">
              {loadingFacturas ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
              ) : facturas.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Hash size={48} className="text-slate-200 dark:text-slate-700 mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg">Esta unidad aún no tiene facturas registradas.</p>
                  <Link 
                    to="/facturacion" 
                    className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold underline"
                  >
                    Registrar una ahora
                  </Link>
                </div>
              ) : (
                <>
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por folio (ej: 0F40), taller/proveedor o descripción..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                    {modalSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {filterFacturasList(facturas).length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Search size={40} className="text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base font-medium">
                        No se encontraron facturas que coincidan con "<span className="font-bold text-slate-700 dark:text-slate-200">{modalSearchTerm}</span>".
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="text-xs text-blue-500 font-bold hover:underline"
                      >
                        Limpiar filtro de búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      {filterFacturasList(facturas).map(f => (
                        <div key={f.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:border-blue-500/50 transition-colors shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                              <p className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">Folio</p>
                              <p className="text-slate-900 dark:text-white font-mono text-base lg:text-lg font-bold truncate">{f.folio}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Monto {f.es_compartida ? '(Asignado)' : ''}</p>
                              <p className={`font-bold text-lg lg:text-xl ${f.cancelado ? 'text-rose-500 line-through' : 'text-emerald-400'}`}>
                                ${parseFloat(f.monto_especifico || f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                              {f.es_compartida && (
                                <p className="text-[8px] text-purple-400 font-bold uppercase mt-1">Factura Compartida</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4 space-y-3">
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Taller / Proveedor</p>
                              <p className="text-slate-700 dark:text-slate-300 font-bold text-xs truncate flex items-center gap-2">
                                <Wrench size={12} className="text-blue-500 shrink-0" />
                                {f.taller_nombre || 'No asignado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Descripción</p>
                              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">
                                {f.cancelado && <span className="text-rose-500 font-bold mr-1">CANCELADA -</span>}
                                {f.descripcion || 'Sin descripción'}
                              </p>
                              {f.cancelado && f.motivo_cancelacion && (
                                <p className="text-rose-400 text-[10px] mt-1 font-bold italic line-clamp-2" title={f.motivo_cancelacion}>
                                  Motivo: {f.motivo_cancelacion}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 lg:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 gap-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                              <Calendar size={14} /> {f.fecha}
                            </p>
                            
                            {f.archivo_escaneado ? (
                              <a 
                                href={formatMediaUrl(f.archivo_escaneado)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                              >
                                Ver Documento
                              </a>
                            ) : (
                              <span className="text-rose-400 text-[10px] lg:text-xs font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg">Sin Imagen</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Generar Orden (Dar Salida) */}
      {showOrdenModal && selectedVehiculo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-xl p-6 lg:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Wrench className="text-blue-500" size={24} />
                Mantenimiento
              </h2>
              <button onClick={() => setShowOrdenModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleCreateOrden} className="space-y-5 lg:space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl lg:rounded-2xl">
                <p className="text-blue-400 text-xs lg:text-sm font-medium">Unidad seleccionada:</p>
                <p className="text-white font-bold text-base lg:text-lg">{selectedVehiculo.numero_economico} - {selectedVehiculo.marca} {selectedVehiculo.modelo}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Tipo</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg lg:rounded-xl px-4 py-2.5 lg:py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm cursor-pointer"
                    value={ordenForm.tipo}
                    onChange={(e) => setOrdenForm({...ordenForm, tipo: e.target.value})}
                  >
                    <option value="correctivo" className="bg-white dark:bg-slate-900">Correctivo</option>
                    <option value="preventivo" className="bg-white dark:bg-slate-900">Preventivo</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Taller</label>
                  <select 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg lg:rounded-xl px-4 py-2.5 lg:py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm cursor-pointer"
                    value={ordenForm.taller}
                    onChange={(e) => setOrdenForm({...ordenForm, taller: e.target.value})}
                  >
                    <option value="" className="bg-white dark:bg-slate-900">Seleccionar taller...</option>
                    {talleres.map(t => <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">{t.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Descripción / Falla</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg lg:rounded-xl px-4 py-2.5 lg:py-3 text-slate-900 dark:text-white focus:border-blue-500 outline-none text-sm placeholder:text-slate-400 dark:placeholder:text-slate-700"
                  placeholder="Detalla el motivo del ingreso..."
                  value={ordenForm.descripcion}
                  onChange={(e) => setOrdenForm({...ordenForm, descripcion: e.target.value})}
                />
              </div>

              <button 
                disabled={formLoading}
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <Truck size={20} />}
                GENERAR ORDEN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Info Mantenimiento (Para ver detalles de unidad fuera de servicio) */}
      {showInfoMantenimientoModal && selectedVehiculo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-xl p-6 lg:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                <Wrench className="text-amber-500" size={24} />
                Estado de Mantenimiento
              </h2>
              <button 
                onClick={() => {
                  setShowInfoMantenimientoModal(false);
                  setSelectedVehiculo(null);
                  setShowCompletarModal(false);
                }} 
                className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Unidad fuera de servicio</p>
                    <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-amber-500/20 animate-pulse">Inactiva</span>
                </div>
                <h3 className="text-2xl font-black text-white leading-none">{selectedVehiculo.numero_economico}</h3>
                <p className="text-slate-400 text-sm mt-1 font-medium">{selectedVehiculo.marca} {selectedVehiculo.modelo} • {selectedVehiculo.placas}</p>
              </div>

              {(() => {
                const orden = ordenesTrabajo.find(o => o.id === selectedVehiculo.orden_activa);
                const taller = talleres.find(t => t.id === orden?.taller);
                
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-2">
                                <Clock size={12} className="text-amber-500" /> Estatus de Reparación
                            </p>
                            <p className={`font-black text-sm uppercase ${
                                orden?.estatus === 'en espera' ? 'text-rose-400' : 'text-amber-400'
                            }`}>
                                {orden?.estatus || 'Desconocido'}
                            </p>
                        </div>
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                            <p className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-2">
                                <Tag size={12} className="text-blue-500" /> Tipo
                            </p>
                            <p className="text-white font-black text-sm uppercase">
                                {orden?.tipo || 'N/A'}
                            </p>
                        </div>
                    </div>

                    {orden?.estatus === 'en espera' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <p className="text-rose-500 text-[10px] font-black uppercase tracking-wider">Motivo de Detención</p>
                                <p className="text-white text-sm font-bold mt-0.5">{formatMotivoEspera(orden.motivo_espera)}</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 relative group">
                      <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500" /> Ubicación de la Unidad
                      </p>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-white font-black text-lg group-hover:text-blue-400 transition-colors">
                                {taller ? taller.nombre : 'Taller no especificado'}
                            </p>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed italic">
                                {taller ? taller.direccion : 'Dirección no disponible'}
                            </p>
                        </div>
                        {taller?.url_mapa && (
                            <a 
                                href={taller.url_mapa} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                            >
                                <ExternalLink size={20} />
                            </a>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                      <p className="text-slate-500 text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
                        <Info size={14} className="text-amber-500" /> Reporte de Falla / Trabajo
                      </p>
                      <p className="text-slate-200 text-sm leading-relaxed font-medium">
                        {orden ? orden.descripcion : 'No hay reporte detallado disponible.'}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-500">
                         <span>FECHA DE INGRESO:</span>
                         <span className="text-white font-mono">{orden?.fecha_creacion ? new Date(orden.fecha_creacion).toLocaleDateString('es-MX', {day: '2-digit', month: 'long', year: 'numeric'}) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={() => {
                        setShowInfoMantenimientoModal(false);
                        setSelectedVehiculo(null);
                    }}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl lg:rounded-2xl transition-all"
                >
                    CERRAR
                </button>
                
                {user?.rol !== 'jefe_logistica' && !isLector && (
                    <button 
                        onClick={() => {
                            setFacturasSeleccionadas([]);
                            fetchVehiculoFacturas(selectedVehiculo.id);
                            setShowCompletarModal(true);
                            setShowInfoMantenimientoModal(false);
                        }}
                        className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl lg:rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <LogIn size={20} />
                        DAR ALTA Y REINTEGRAR
                    </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reintegrar (Dar Ingreso) */}
      {showCompletarModal && selectedVehiculo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-xl p-6 lg:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                <LogIn className="text-emerald-500" size={24} />
                Reintegrar Unidad
              </h2>
              <button onClick={() => setShowCompletarModal(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-5 lg:space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl lg:rounded-2xl">
                <p className="text-emerald-400 text-xs lg:text-sm font-medium">Unidad lista para operar:</p>
                <p className="text-white font-bold text-base lg:text-lg">{selectedVehiculo.numero_economico} - {selectedVehiculo.marca} {selectedVehiculo.modelo}</p>
              </div>

              <p className="text-slate-400 text-xs lg:text-sm">Selecciona las facturas de la reparación para finalizar el proceso:</p>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {vehiculoFacturas.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
                    <p className="text-slate-500 italic text-sm">No hay facturas registradas para esta unidad.</p>
                    <Link 
                        to="/facturacion" 
                        target="_blank"
                        className="text-blue-400 text-xs font-bold underline flex items-center justify-center gap-2"
                    >
                        Registrar Factura <ExternalLink size={12}/>
                    </Link>
                  </div>
                ) : (
                  vehiculoFacturas.map(f => (
                    <label key={f.id} className="flex items-center gap-3 p-3 lg:p-4 bg-slate-950 border border-slate-800 rounded-xl lg:rounded-2xl cursor-pointer hover:border-emerald-500/50 transition-all">
                      <input 
                        type="checkbox"
                        checked={facturasSeleccionadas.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) setFacturasSeleccionadas([...facturasSeleccionadas, f.id]);
                          else setFacturasSeleccionadas(facturasSeleccionadas.filter(id => id !== f.id));
                        }}
                        className="w-5 h-5 accent-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-xs lg:text-sm truncate">Folio: {f.folio}</p>
                        <p className="text-emerald-400 font-bold text-[10px] lg:text-xs">${f.monto}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <button 
                onClick={handleCompletarOrden}
                disabled={formLoading || (vehiculoFacturas.length > 0 && facturasSeleccionadas.length === 0)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                REINTEGRAR A LA FLOTA
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Historial de Combustible */}
      {selectedUnitForFuel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/20 p-3 rounded-2xl text-blue-500">
                  <Droplets size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Historial de Cargas</h3>
                  <p className="text-slate-400 text-sm">Unidad {selectedUnitForFuel.numero_economico} • {selectedUnitForFuel.marca} {selectedUnitForFuel.modelo}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUnitForFuel(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="animate-spin text-blue-500" size={40} />
                  <p className="text-slate-500 font-medium animate-pulse">Consultando base de datos...</p>
                </div>
              ) : fuelHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
                   <Droplets size={60} className="text-slate-700" />
                   <p className="text-slate-500 italic max-w-xs">No se han registrado cargas de combustible para esta unidad.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fuelHistory.map((carga, index) => (
                    <div key={index} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                       <div className="flex items-center justify-between mb-4">
                         <div className="bg-blue-600/10 p-2 rounded-lg text-blue-400">
                           <Calendar size={16} />
                         </div>
                          <span className="text-white font-mono text-xs font-bold">{new Date(carga.fecha + 'T00:00:00').toLocaleDateString()}</span>
                       </div>
                       
                       <div className="space-y-3">
                         <div className="flex justify-between items-end">
                            <div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Litros</p>
                              <p className="text-white text-lg font-black">{carga.litros} L</p>
                            </div>
                            <div className="text-right">
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Costo</p>
                              <p className="text-emerald-400 text-lg font-black">${parseFloat(carga.monto_total || 0).toLocaleString()}</p>
                            </div>
                         </div>
                         
                         <div className="pt-3 border-t border-slate-800/50">
                            {fuelHistory[index + 1]?.kilometraje != null && (
                              <div className="flex justify-between items-center text-[11px] mb-1.5">
                                <span className="text-slate-500 font-bold">KM ANTERIOR</span>
                                <span className="text-slate-400 font-mono">{String(fuelHistory[index + 1].kilometraje)} km</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-bold">KM ACTUAL</span>
                              <span className="text-slate-300 font-mono">{carga.kilometraje != null ? String(carga.kilometraje) : '---'} km</span>
                            </div>
                            {carga.rendimiento > 0 && (
                              <div className="flex justify-between items-center text-[11px] mt-1.5">
                                <span className="text-slate-500 font-bold">RENDIMIENTO</span>
                                <span className="text-emerald-400 font-black">{carga.rendimiento} km/l</span>
                              </div>
                            )}
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alta/Edición de Caja */}
      {showAltaCajaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-xl p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <AltaCaja 
              onSuccess={handleAltaCajaSuccess} 
              onClose={() => {
                setShowAltaCajaModal(false);
                setEditingCaja(null);
              }} 
              caja={editingCaja}
            />
          </div>
        </div>
      )}

      {/* Modal de Facturas de Caja */}
      {showCajaFacturasModal && selectedCaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header del Modal */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="min-w-0">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <FilePlus className="text-blue-500 shrink-0" size={24} />
                  <span className="truncate">Facturas Caja {selectedCaja.numero_economico}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm mt-1 truncate">{selectedCaja.tipo || 'Remolque'} - {selectedCaja.placas}</p>
              </div>
              <button 
                onClick={() => {
                  setShowCajaFacturasModal(false);
                  setSelectedCaja(null);
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shrink-0 shadow-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900/50 custom-scrollbar">
              {loadingCajaFacturas ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
              ) : cajaFacturas.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Hash size={48} className="text-slate-200 dark:text-slate-700 mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg">Esta caja aún no tiene facturas registradas.</p>
                  <Link 
                    to="/facturacion" 
                    className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold underline"
                  >
                    Registrar una ahora
                  </Link>
                </div>
              ) : (
                <>
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por folio (ej: 0F40), taller/proveedor o descripción..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                    {modalSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {filterFacturasList(cajaFacturas).length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Search size={40} className="text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base font-medium">
                        No se encontraron facturas que coincidan con "<span className="font-bold text-slate-700 dark:text-slate-200">{modalSearchTerm}</span>".
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="text-xs text-blue-500 font-bold hover:underline"
                      >
                        Limpiar filtro de búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      {filterFacturasList(cajaFacturas).map(f => (
                        <div key={f.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:border-blue-500/50 transition-colors shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                              <p className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">Folio</p>
                              <p className="text-slate-900 dark:text-white font-mono text-base lg:text-lg font-bold truncate">{f.folio}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Monto {f.es_compartida ? '(Asignado)' : ''}</p>
                              <p className={`font-bold text-lg lg:text-xl ${f.cancelado ? 'text-rose-500 line-through' : 'text-emerald-400'}`}>
                                ${parseFloat(f.monto_especifico || f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                              {f.es_compartida && (
                                <p className="text-[8px] text-purple-400 font-bold uppercase mt-1">Factura Compartida</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4 space-y-3">
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Taller / Proveedor</p>
                              <p className="text-slate-700 dark:text-slate-300 font-bold text-xs truncate flex items-center gap-2">
                                <Wrench size={12} className="text-blue-500 shrink-0" />
                                {f.taller_nombre || 'No asignado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Descripción</p>
                              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">
                                {f.cancelado && <span className="text-rose-500 font-bold mr-1">CANCELADA -</span>}
                                {f.descripcion || 'Sin descripción'}
                              </p>
                              {f.cancelado && f.motivo_cancelacion && (
                                <p className="text-rose-400 text-[10px] mt-1 font-bold italic line-clamp-2" title={f.motivo_cancelacion}>
                                  Motivo: {f.motivo_cancelacion}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 lg:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 gap-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                              <Calendar size={14} /> {f.fecha}
                            </p>
                            
                            {f.archivo_escaneado ? (
                              <a 
                                href={formatMediaUrl(f.archivo_escaneado)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                              >
                                Ver Documento
                              </a>
                            ) : (
                              <span className="text-rose-400 text-[10px] lg:text-xs font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg">Sin Imagen</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alta/Edición de Vehículo Variado */}
      {showAltaVariadoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-[2.5rem] w-full max-w-xl p-5 sm:p-8 lg:p-10 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <AltaVariado 
              onSuccess={handleAltaVariadoSuccess} 
              onClose={() => {
                setShowAltaVariadoModal(false);
                setEditingVariado(null);
              }} 
              variado={editingVariado}
            />
          </div>
        </div>
      )}

      {/* Modal de Facturas de Vehículo Variado */}
      {showVariadoFacturasModal && selectedVariado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header del Modal */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="min-w-0">
                <h2 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <FilePlus className="text-blue-500 shrink-0" size={24} />
                  <span className="truncate">Facturas Vehículo {selectedVariado.numero_economico}</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs lg:text-sm mt-1 truncate">{selectedVariado.tipo || 'Vehículo Variado'} - {selectedVariado.placas}</p>
              </div>
              <button 
                onClick={() => {
                  setShowVariadoFacturasModal(false);
                  setSelectedVariado(null);
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shrink-0 shadow-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white dark:bg-slate-900/50 custom-scrollbar">
              {loadingVariadoFacturas ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
              ) : variadoFacturas.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Hash size={48} className="text-slate-200 dark:text-slate-700 mx-auto" />
                  <p className="text-slate-500 dark:text-slate-400 text-base lg:text-lg">Este vehículo aún no tiene facturas registradas.</p>
                  <Link 
                    to="/facturacion" 
                    className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold underline"
                  >
                    Registrar una ahora
                  </Link>
                </div>
              ) : (
                <>
                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar por folio (ej: 0F40), taller/proveedor o descripción..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                    />
                    {modalSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {filterFacturasList(variadoFacturas).length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Search size={40} className="text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base font-medium">
                        No se encontraron facturas que coincidan con "<span className="font-bold text-slate-700 dark:text-slate-200">{modalSearchTerm}</span>".
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalSearchTerm('')}
                        className="text-xs text-blue-500 font-bold hover:underline"
                      >
                        Limpiar filtro de búsqueda
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      {filterFacturasList(variadoFacturas).map(f => (
                        <div key={f.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:border-blue-500/50 transition-colors shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="min-w-0">
                              <p className="text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase mb-1">Folio</p>
                              <p className="text-slate-900 dark:text-white font-mono text-base lg:text-lg font-bold truncate">{f.folio}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Monto {f.es_compartida ? '(Asignado)' : ''}</p>
                              <p className={`font-bold text-lg lg:text-xl ${f.cancelado ? 'text-rose-500 line-through' : 'text-emerald-400'}`}>
                                ${parseFloat(f.monto_especifico || f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                              {f.es_compartida && (
                                <p className="text-[8px] text-purple-400 font-bold uppercase mt-1">Factura Compartida</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-4 space-y-3">
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Taller / Proveedor</p>
                              <p className="text-slate-700 dark:text-slate-300 font-bold text-xs truncate flex items-center gap-2">
                                <Wrench size={12} className="text-blue-500 shrink-0" />
                                {f.taller_nombre || 'No asignado'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase mb-1">Descripción</p>
                              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium line-clamp-2">
                                {f.cancelado && <span className="text-rose-500 font-bold mr-1">CANCELADA -</span>}
                                {f.descripcion || 'Sin descripción'}
                              </p>
                              {f.cancelado && f.motivo_cancelacion && (
                                <p className="text-rose-400 text-[10px] mt-1 font-bold italic line-clamp-2" title={f.motivo_cancelacion}>
                                  Motivo: {f.motivo_cancelacion}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 lg:mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50 gap-3">
                            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2">
                              <Calendar size={14} /> {f.fecha}
                            </p>
                            
                            {f.archivo_escaneado ? (
                              <a 
                                href={formatMediaUrl(f.archivo_escaneado)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                              >
                                Ver Documento
                              </a>
                            ) : (
                              <span className="text-rose-400 text-[10px] lg:text-xs font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg">Sin Imagen</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaVehiculos;
