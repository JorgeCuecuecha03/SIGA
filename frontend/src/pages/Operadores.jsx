import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  IdCard, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  Calendar,
  Truck,
  MapPin,
  ClipboardList,
  ChevronRight,
  Hash,
  Send,
  Zap,
  Save,
  Trash,
  ArrowLeft,
  CalendarDays,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  UserCheck
} from 'lucide-react';

const Operadores = () => {
  const [operadores, setOperadores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const isJefeLogistica = user?.rol === 'jefe_logistica';
  
  const [activeView, setActiveView] = useState(isJefeLogistica ? 'horarios' : 'operadores'); 
  const [isCreating, setIsCreating] = useState(false);
  const [expandedDate, setExpandedDate] = useState(null);
  const [historyFilterDate, setHistoryFilterDate] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOperador, setEditingOperador] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    tipo_licencia: '',
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [stagedAsignaciones, setStagedAsignaciones] = useState([]);
  const [horarioFormData, setHorarioFormData] = useState({
    operador: '',
    unidad: '',
    tienda: '',
    horario: '07:00 AM - 16:30 PM',
    fecha: tomorrowStr,
    es_personal: false
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resOps, resVehs, resAsign] = await Promise.all([
        api.get('operadores/'),
        api.get('vehiculos/'),
        api.get('asignaciones-horarios/')
      ]);
      setOperadores(resOps.data);
      setVehiculos(resVehs.data);
      setAsignaciones(resAsign.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOperadorSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOperador) {
        await api.put(`operadores/${editingOperador.id}/`, formData);
      } else {
        await api.post('operadores/', formData);
      }
      fetchData();
      closeModal();
    } catch (err) {
      console.error("Error saving operador", err);
      alert("Error al guardar el operador");
    }
  };

  const handleAddToStaging = (e) => {
    e.preventDefault();
    if (!horarioFormData.operador || !horarioFormData.horario) {
      alert("Operador y Horario son obligatorios.");
      return;
    }

    if (stagedAsignaciones.some(s => s.operador === horarioFormData.operador)) {
      alert("Este operador ya está en la lista de pendientes.");
      return;
    }

    const op = operadores.find(o => o.id === parseInt(horarioFormData.operador));
    const veh = vehiculos.find(v => v.id === parseInt(horarioFormData.unidad));

    const newStaged = {
      ...horarioFormData,
      id: Date.now(),
      operador_nombre: `${op.nombre} ${op.apellido}`,
      unidad_nombre: veh ? veh.numero_economico : (horarioFormData.unidad === 'na' ? 'N/A' : 'Sin unidad')
    };

    setStagedAsignaciones([...stagedAsignaciones, newStaged]);
    setHorarioFormData({
      operador: '',
      unidad: '',
      tienda: '',
      horario: '07:00 AM - 16:30 PM',
      fecha: tomorrowStr,
      es_personal: false
    });
  };

  const handleSaveAll = async () => {
    if (stagedAsignaciones.length === 0) return;
    setFormLoading(true);
    try {
      const promises = stagedAsignaciones.map(item => {
        const payload = {
          operador: item.operador,
          horario: item.horario,
          fecha: item.fecha,
          unidad: item.unidad === 'na' || !item.unidad ? null : item.unidad,
          tienda: item.tienda || null,
          es_personal: item.es_personal
        };
        return api.post('asignaciones-horarios/', payload);
      });
      await Promise.all(promises);
      fetchData();
      setStagedAsignaciones([]);
      setIsCreating(false);
      alert("Todas las asignaciones han sido guardadas exitosamente.");
    } catch (err) {
      console.error("Error saving all assignments", err);
      alert("Error al guardar algunas asignaciones.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAssignRemainingAt9 = () => {
    const tomorrowAssignments = asignaciones.filter(a => a.fecha === tomorrowStr);
    const assignedIdsInDB = tomorrowAssignments.map(asig => asig.operador);
    const assignedIdsInStaging = stagedAsignaciones.map(s => parseInt(s.operador));
    const assignedIds = [...assignedIdsInDB, ...assignedIdsInStaging];
    const unassignedOps = operadores.filter(op => !assignedIds.includes(op.id));
    if (unassignedOps.length === 0) {
      alert("Todos ya tienen horario.");
      return;
    }
    const newStagedItems = unassignedOps.map(op => ({
      operador: op.id.toString(),
      operador_nombre: `${op.nombre} ${op.apellido}`,
      unidad: 'na',
      unidad_nombre: 'N/A',
      tienda: 'N/A',
      horario: '09:00 AM - 18:30 PM',
      fecha: tomorrowStr,
      es_personal: false,
      id: Date.now() + Math.random()
    }));
    setStagedAsignaciones([...stagedAsignaciones, ...newStagedItems]);
  };

  const handleDeleteAsignacion = async (id) => {
    if (window.confirm('¿Deseas eliminar esta asignación?')) {
      try {
        await api.delete(`asignaciones-horarios/${id}/`);
        fetchData();
      } catch (err) {
        console.error("Error deleting asignacion", err);
      }
    }
  };

  const openModal = (operador = null) => {
    if (operador) {
      setEditingOperador(operador);
      setFormData({ nombre: operador.nombre, apellido: operador.apellido, telefono: operador.telefono || '', tipo_licencia: operador.tipo_licencia });
    } else {
      setEditingOperador(null);
      setFormData({ nombre: '', apellido: '', telefono: '', tipo_licencia: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingOperador(null); };

  const isTrailer = (unidadId) => {
    const veh = vehiculos.find(v => v.id === parseInt(unidadId));
    return veh && parseFloat(veh.capacidad) >= 30.0;
  };

  const groupedAsignaciones = asignaciones.reduce((groups, assignment) => {
    const date = assignment.fecha;
    if (!groups[date]) { groups[date] = []; }
    groups[date].push(assignment);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedAsignaciones)
    .sort((a, b) => new Date(b) - new Date(a))
    .filter(date => !historyFilterDate || date === historyFilterDate);

  const tomorrowAssignments = asignaciones.filter(a => a.fecha === tomorrowStr);

  const downloadPDF = (date, data) => {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    doc.setFillColor(192, 80, 77); doc.rect(14, 10, pageWidth - 28, 15, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('AUTOTRANSPORTES COLUMBIA S.A DE C.V', pageWidth / 2, 17, { align: 'center' }); doc.setFontSize(10); doc.text(`HORARIOS ${formattedDate}`, pageWidth / 2, 23, { align: 'center' });
    const tableData = data.map(asig => { 
      const times = asig.horario.split(' - '); 
      const unitLabel = asig.es_personal ? `PERSONAL / ${asig.unidad_nombre || 'S/U'}` : (asig.unidad_nombre || 'N/A');
      return [ `${asig.operador_nombre} ${asig.operador_apellido}`.toUpperCase(), times[0] || '---', times[1] || '---', unitLabel.toUpperCase(), asig.tienda || 'N/A' ]; 
    });
    autoTable(doc, { 
      startY: 25, 
      head: [['NOMBRE', 'HORA ENTRADA', 'HORA SALIDA', 'UNIDAD ASIGNADA', 'SUCURSAL']], 
      body: tableData, 
      theme: 'grid', 
      headStyles: { fillColor: [192, 80, 77], textColor: 255, halign: 'center', fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.2 }, 
      styles: { fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle', lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
      columnStyles: { 0: { halign: 'left' }, 3: { fontStyle: 'bold' }, 4: { fontStyle: 'bold' } },
      didParseCell: function (data) { if (data.section === 'body') { const unit = data.row.cells[3].text[0]; const store = data.row.cells[4].text[0]; if (unit === 'N/A' || store === 'N/A') { data.cell.styles.fillColor = [146, 208, 80]; } else { data.cell.styles.fillColor = [255, 255, 0]; } } } 
    });
    doc.save(`Horarios_${date}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 lg:gap-2">
            <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3"><Users className="text-blue-600 dark:text-blue-500 shrink-0" size={32} />Personal y Logística</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-lg">Gestión de operadores y planificación operativa.</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {!isJefeLogistica && (
              <button onClick={() => setActiveView('operadores')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'operadores' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Users size={16} /> Operadores</button>
            )}
            <button onClick={() => setActiveView('horarios')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeView === 'horarios' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}><Clock size={16} /> Horarios</button>
          </div>
        </div>
      </div>

      {activeView === 'operadores' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 flex-1 shadow-sm">
              <Search className="text-slate-400 dark:text-slate-500" size={20} />
              <input type="text" placeholder="Buscar por nombre..." className="bg-transparent border-none text-slate-900 dark:text-white w-full focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 whitespace-nowrap"><UserPlus size={20} /> Nuevo Operador</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operadores.filter(op => `${op.nombre} ${op.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())).map(op => (
              <div key={op.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all group relative overflow-hidden shadow-sm dark:shadow-none">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-500 font-bold text-xl uppercase shadow-inner">{op.nombre[0]}{op.apellido[0]}</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${op.estatus === 'viaje' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'}`}>{op.estatus === 'viaje' ? 'En Viaje' : 'En Patio'}</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{op.nombre} {op.apellido}</h3>
                <div className="space-y-2 mt-4 text-slate-500 dark:text-slate-400 text-sm">
                  <div className="flex items-center gap-2"><IdCard size={16} className="text-blue-500" /><span>Licencia: <strong className="text-slate-900 dark:text-slate-200">{op.tipo_licencia}</strong></span></div>
                  <div className="flex items-center gap-2"><Phone size={16} className="text-blue-500" /><span>Tel: <strong className="text-slate-900 dark:text-slate-200">{op.telefono || 'N/A'}</strong></span></div>
                </div>
                <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(op)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"><Edit2 size={16} />Editar</button>
                  <button onClick={async () => { if(window.confirm('¿Eliminar?')) { await api.delete(`operadores/${op.id}/`); fetchData(); } }} className="bg-rose-500/10 text-rose-600 dark:text-rose-500 p-2 rounded-lg hover:bg-rose-500/20 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-6">
            {!isCreating ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3"><CalendarDays className="text-blue-600 dark:text-blue-500" />Historial de Horarios</h2>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 group hover:border-blue-500/50 transition-all shadow-sm">
                       <Calendar size={18} className="text-blue-600 dark:text-blue-500" />
                       <input 
                        type="date"
                        className="bg-transparent border-none text-slate-900 dark:text-white text-sm focus:ring-0 cursor-pointer"
                        value={historyFilterDate}
                        onChange={(e) => {
                          setHistoryFilterDate(e.target.value);
                          if (e.target.value) setExpandedDate(e.target.value);
                        }}
                       />
                       {historyFilterDate && (
                         <button onClick={() => setHistoryFilterDate('')} className="text-slate-500 hover:text-white"><X size={16} /></button>
                       )}
                    </div>
                    <button onClick={() => setIsCreating(true)} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"><Plus size={18} />GENERAR NUEVO HORARIO</button>
                  </div>
                </div>

                <div className="space-y-4">
                  {sortedDates.length === 0 ? (
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-20 text-center shadow-inner">
                      <ClipboardList className="mx-auto text-slate-300 dark:text-slate-800 mb-4" size={64} />
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                        {historyFilterDate ? `No hay horarios registrados para el ${historyFilterDate}` : 'No hay registros de horarios.'}
                      </p>
                    </div>
                  ) : (
                    sortedDates.map(date => (
                      <div key={date} className="group overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-blue-500/30 shadow-sm">
                        <div 
                          onClick={() => setExpandedDate(expandedDate === date ? null : date)} 
                          className="flex items-center justify-between p-6 cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all ${
                              expandedDate === date 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                              <CalendarDays size={24} />
                            </div>
                            <div>
                              <h3 className="text-slate-900 dark:text-white font-black text-lg leading-tight uppercase tracking-tight">
                                {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </h3>
                              <p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                {groupedAsignaciones[date].length} ASIGNACIONES
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {expandedDate === date && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); downloadPDF(date, groupedAsignaciones[date]); }} 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
                              >
                                <Download size={16} /> PDF
                              </button>
                            )}
                            <div className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                              {expandedDate === date ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                            </div>
                          </div>
                        </div>

                        {expandedDate === date && (
                          <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="overflow-x-auto custom-scrollbar rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-inner">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-blue-600 dark:bg-[#C0504D] text-white">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-center border-r border-white/10">Nombre</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-center border-r border-white/10">Entrada</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-center border-r border-white/10">Salida</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-center border-r border-white/10">Unidad</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-center">Sucursal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/50">
                                  {groupedAsignaciones[date].map(asig => {
                                    const times = asig.horario.split(' - ');
                                    const isNA = !asig.unidad || asig.tienda === 'N/A';
                                    const unitLabel = asig.es_personal ? `PERSONAL / ${asig.unidad_nombre || 'S/U'}` : (asig.unidad_nombre || 'N/A');
                                    return (
                                      <tr key={asig.id} className={`${isNA ? 'bg-[#92D050]/10 dark:bg-[#92D050]/20 hover:bg-[#92D050]/20' : 'bg-yellow-500/5 dark:bg-[#FFFF00]/10 hover:bg-yellow-500/10'} transition-colors group/row`}>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800/50 uppercase flex items-center justify-between">
                                          {asig.operador_nombre} {asig.operador_apellido}
                                          <button 
                                            onClick={() => handleDeleteAsignacion(asig.id)} 
                                            className="opacity-0 group-hover/row:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-all bg-white dark:bg-slate-900 rounded-lg shadow-sm"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-white text-center border-r border-slate-200 dark:border-slate-800/50">{times[0]}</td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-white text-center border-r border-slate-200 dark:border-slate-800/50">{times[1]}</td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-white text-center border-r border-slate-200 dark:border-slate-800/50">{unitLabel}</td>
                                        <td className="px-6 py-4 text-xs font-black text-slate-700 dark:text-white text-center uppercase">{asig.tienda || 'N/A'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { if (stagedAsignaciones.length > 0 && !window.confirm("Regresar?")) return; setStagedAsignaciones([]); setIsCreating(false); }} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white p-3 rounded-2xl transition-all"><ArrowLeft size={20} /></button>
                        <div><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ClipboardList className="text-blue-600 dark:text-blue-500" size={24} />Planificación para Mañana</h2><p className="text-slate-500 dark:text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest flex items-center gap-1"><Calendar size={14} /> {new Date(tomorrow).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={handleAssignRemainingAt9} disabled={formLoading} className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/20 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all active:scale-95"><Zap size={16} />Restantes 9 AM</button>
                      {stagedAsignaciones.length > 0 && (
                        <button onClick={handleSaveAll} disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 shadow-lg active:scale-95 animate-bounce"><Save size={16} />GUARDAR {stagedAsignaciones.length} CAMBIOS</button>
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleAddToStaging} className="flex flex-col lg:flex-row items-end gap-4 lg:gap-6 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-inner">
                    <div className="flex-1 w-full space-y-2"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Operador</label><select required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold cursor-pointer" value={horarioFormData.operador} onChange={(e) => setHorarioFormData({...horarioFormData, operador: e.target.value})}><option value="" className="bg-white dark:bg-slate-900">Selecciona...</option>{operadores.filter(op => !tomorrowAssignments.some(a => a.operador === op.id) && !stagedAsignaciones.some(s => parseInt(s.operador) === op.id)).map(op => (<option key={op.id} value={op.id} className="bg-white dark:bg-slate-900">{op.nombre} {op.apellido}</option>))}</select></div>
                    <div className="flex-1 w-full space-y-2"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Unidad</label><select required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold cursor-pointer" value={horarioFormData.unidad} onChange={(e) => { const val = e.target.value; setHorarioFormData({ ...horarioFormData, unidad: val, tienda: val === 'na' ? 'N/A' : (isTrailer(val) ? '' : horarioFormData.tienda) }); }}><option value="" className="bg-white dark:bg-slate-900">Selecciona...</option><option value="na" className="text-amber-600 font-bold bg-white dark:bg-slate-900">N/A</option>{vehiculos.map(v => (<option key={v.id} value={v.id} className="bg-white dark:bg-slate-900">{v.numero_economico} - {v.marca} ({parseFloat(v.capacidad)}T)</option>))}</select></div>
                    <div className="w-full lg:w-48 space-y-2"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Destino</label><input required type={isTrailer(horarioFormData.unidad) ? "text" : "number"} placeholder={isTrailer(horarioFormData.unidad) ? "Destino..." : "Tienda..."} disabled={horarioFormData.unidad === 'na'} className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold ${horarioFormData.unidad === 'na' ? 'opacity-50' : ''}`} value={horarioFormData.tienda} onChange={(e) => setHorarioFormData({...horarioFormData, tienda: e.target.value})} /></div>
                    <div className="w-full lg:w-56 space-y-2"><label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1">Horario</label><select required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all text-sm font-bold cursor-pointer" value={horarioFormData.horario} onChange={(e) => setHorarioFormData({...horarioFormData, horario: e.target.value})}><option value="06:30 AM - 03:30 PM" className="bg-white dark:bg-slate-900">06:30 AM - 03:30 PM</option><option value="07:00 AM - 16:30 PM" className="bg-white dark:bg-slate-900">07:00 AM - 16:30 PM</option><option value="08:00 AM - 17:30 PM" className="bg-white dark:bg-slate-900">08:00 AM - 17:30 PM</option><option value="09:00 AM - 18:30 PM" className="bg-white dark:bg-slate-900">09:00 AM - 18:30 PM</option></select></div>
                    
                    {!(tomorrowAssignments.some(a => a.es_personal) || stagedAsignaciones.some(s => s.es_personal)) && (
                      <div className="w-full lg:w-auto flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 h-[46px] group transition-all hover:border-blue-500/50 shadow-sm">
                         <input 
                          type="checkbox" 
                          id="esPersonal" 
                          className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 focus:ring-blue-500/20"
                          checked={horarioFormData.es_personal}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setHorarioFormData({
                              ...horarioFormData, 
                              es_personal: isChecked,
                              horario: isChecked ? '06:30 AM - 03:30 PM' : horarioFormData.horario
                            });
                          }}
                         />
                         <label htmlFor="esPersonal" className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase cursor-pointer flex items-center gap-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors"><UserCheck size={16} className={horarioFormData.es_personal ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-600'} /> PERSONAL</label>
                      </div>
                    )}

                    <button type="submit" className="w-full lg:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 h-[46px]"><Plus size={18} />AGREGAR</button>
                  </form>
                </div>
                <div className="space-y-8">
                  {stagedAsignaciones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-amber-500 font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><Zap size={18} />Pendientes por Guardar</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stagedAsignaciones.map(item => (
                          <div key={item.id} className="bg-white dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-[1.5rem] p-5 flex flex-col justify-between group shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3"><div className={`p-3 rounded-2xl ${item.es_personal ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500'}`}><Clock size={24} /></div><div><h4 className="text-slate-900 dark:text-white font-black text-lg leading-none flex items-center gap-2">{item.operador_nombre} {item.es_personal && <UserCheck size={14} className="text-indigo-500 dark:text-indigo-400" />}</h4><p className="text-amber-600 dark:text-amber-500/60 text-[10px] font-black uppercase mt-1 tracking-widest">{item.horario}</p></div></div>
                                <button onClick={() => setStagedAsignaciones(stagedAsignaciones.filter(s => s.id !== item.id))} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 bg-slate-50 dark:bg-slate-950 rounded-xl transition-colors border border-slate-100 dark:border-slate-800"><Trash size={16} /></button>
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-amber-100 dark:border-amber-500/10">
                                <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 truncate text-slate-900 dark:text-white font-bold text-xs"><Truck size={14} className="text-blue-600 dark:text-blue-500" />{item.es_personal ? `PERSONAL / ${item.unidad_nombre}` : item.unidad_nombre}</div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 truncate text-slate-900 dark:text-white font-bold text-xs"><MapPin size={14} className="text-emerald-600 dark:text-emerald-500" />{item.tienda || '---'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                      <div className="flex items-center justify-between px-2"><h3 className="text-slate-400 font-bold flex items-center gap-2 uppercase text-xs tracking-widest"><CheckCircle2 className="text-emerald-500" size={18} />Confirmados para Mañana</h3><span className="bg-slate-900 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black">{tomorrowAssignments.length} TOTAL</span></div>
                      {tomorrowAssignments.length === 0 ? (
                          <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[2rem] p-16 text-center"><ClipboardList className="mx-auto text-slate-800 mb-4" size={60} /><p className="text-slate-600 font-bold uppercase text-xs tracking-widest">Sin asignaciones.</p></div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {tomorrowAssignments.map(asig => (
                                  <div key={asig.id} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 rounded-[1.5rem] p-5 flex flex-col justify-between group shadow-sm">
                                      <div className="flex items-start justify-between mb-4">
                                          <div className="flex items-center gap-3"><div className={`p-3 rounded-2xl ${asig.es_personal ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500' : (asig.horario.startsWith('07:00') ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500' : asig.horario.startsWith('08:00') ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500')}`}><Clock size={24} /></div><div><h4 className="text-slate-900 dark:text-white font-black text-lg leading-none flex items-center gap-2">{asig.operador_nombre} {asig.operador_apellido} {asig.es_personal && <UserCheck size={14} className="text-indigo-500 dark:text-indigo-400" />}</h4><p className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase mt-1 tracking-widest">{asig.horario}</p></div></div>
                                          <button onClick={() => handleDeleteAsignacion(asig.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 bg-slate-50 dark:bg-slate-950 rounded-xl transition-all border border-slate-100 dark:border-slate-800"><Trash2 size={16} /></button>
                                      </div>
                                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/20">
                                          {asig.unidad || asig.es_personal ? (<><div className="flex-1 bg-slate-50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-2 truncate text-slate-700 dark:text-slate-300 font-bold text-xs"><Truck size={14} className="text-blue-600/50 dark:text-blue-500/50" />{asig.es_personal ? `PERSONAL / ${asig.unidad_nombre || 'S/U'}` : asig.unidad_nombre}</div><div className="flex-1 bg-slate-50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800/50 flex items-center gap-2 truncate text-slate-700 dark:text-slate-300 font-bold text-xs"><MapPin size={14} className="text-emerald-600/50 dark:text-emerald-500/50" />{asig.tienda}</div></>) : (<div className="w-full bg-slate-50 dark:bg-slate-950/20 px-3 py-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/30 text-slate-400 dark:text-slate-600 font-bold text-[10px] uppercase text-center">Sin unidad</div>)}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Operador CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50"><h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">{editingOperador ? <Edit2 size={20} className="text-blue-600 dark:text-blue-500" /> : <UserPlus size={20} className="text-blue-600 dark:text-blue-500" />}{editingOperador ? 'Editar Operador' : 'Nuevo Operador'}</h2><button onClick={closeModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><X size={24} /></button></div>
            <form onSubmit={handleOperadorSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase ml-1">Nombre</label><input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm" placeholder="Ej. Juan" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} /></div><div className="space-y-2"><label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase ml-1">Apellido</label><input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm" placeholder="Ej. Pérez" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} /></div></div>
              <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase ml-1">Tipo de Licencia</label><select required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm" value={formData.tipo_licencia} onChange={(e) => setFormData({...formData, tipo_licencia: e.target.value})}><option value="" className="bg-white dark:bg-slate-900">Selecciona tipo</option><option value="Tipo C" className="bg-white dark:bg-slate-900">Tipo C</option><option value="Tipo B" className="bg-white dark:bg-slate-900">Tipo B</option><option value="Tipo F" className="bg-white dark:bg-slate-900">Tipo F</option><option value="Tipo B Federal" className="bg-white dark:bg-slate-900">Tipo B Federal</option></select></div>
              <div className="space-y-2"><label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase ml-1">Teléfono</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} /><input type="tel" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm" placeholder="5512345678" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} /></div></div>
              <div className="pt-4 flex gap-3"><button type="button" onClick={closeModal} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 rounded-xl transition-all">Cancelar</button><button type="submit" className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20">{editingOperador ? 'Guardar Cambios' : 'Registrar'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operadores;
