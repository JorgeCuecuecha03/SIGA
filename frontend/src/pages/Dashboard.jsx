import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Plus,
  DollarSign,
  Droplets,
  Ticket,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  FilePlus,
  LayoutGrid
} from 'lucide-react';

const StatCard = ({ icon, label, value, subValue, trend, color }) => (
  <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden shadow-xl dark:shadow-2xl">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-4 rounded-2xl bg-opacity-10 shadow-inner ${color}`}>
        {React.cloneElement(icon, { size: 24, className: color.split(' ')[0].replace('bg-', 'text-') })}
      </div>
      {trend && (
        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/10">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
      {subValue && (
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          {subValue}
        </p>
      )}
    </div>
  </div>
);

const ActionCard = ({ icon, label, description, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-slate-200 dark:border-slate-800/50 rounded-[2rem] p-6 transition-all duration-500 flex flex-col items-start gap-4 text-left hover:scale-[1.02] active:scale-[0.98] shadow-lg dark:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-900/10 overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 rounded-bl-[100px]`} />
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
      {React.cloneElement(icon, { size: 28, className: color.split(' ')[0].replace('bg-', 'text-') })}
    </div>
    <div>
      <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{label}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed line-clamp-2">{description}</p>
    </div>
    <div className="mt-2 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
      <Plus size={20} />
    </div>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const firstDay = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const lastDay = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

      const [resVehiculos, resFacturasStats, resFacturasRecent, resFuelRecent, resProyecciones] = await Promise.all([
        api.get('vehiculos/', { params: { nopaged: true } }),
        api.get('facturas/stats/', { params: { fecha_inicio: firstDay, fecha_fin: lastDay, exclude_categoria: 'Combustible', cancelado: false } }),
        api.get('facturas/', { params: { page_size: 5 } }),
        api.get('cargas-combustible/', { params: { page_size: 5 } }),
        api.get('vehiculos/proyeccion_mantenimiento/')
      ]);

      const vehs = resVehiculos.data || [];
      const statsMonto = resFacturasStats.data?.total || 0;
      const statsCount = resFacturasStats.data?.count || 0;
      
      const facts = resFacturasRecent.data?.results || resFacturasRecent.data || [];
      const fuel = resFuelRecent.data?.results || resFuelRecent.data || [];

      setStats({
        unidades: {
          total: vehs.length,
          operativas: vehs.filter(v => !v.estado || v.estado === 'operativa').length,
          taller: vehs.filter(v => v.estado && v.estado !== 'operativa').length
        },
        mantenimientos: {
          total: vehs.filter(v => v.estado && v.estado !== 'operativa').length,
          proximos: 3 // Mockup for now
        },
        facturacion: {
          total: statsMonto,
          count: statsCount
        }
      });

      // Filter maintenance alerts (remaining days <= 20 OR remaining km <= 1000)
      const alerts = (resProyecciones.data || []).filter(p => {
        if (p.estado_alerta === 'sin_iniciar') return false;
        const porKm = p.km_restantes !== null && p.km_restantes <= 1000;
        const porDias = p.dias_restantes !== null && p.dias_restantes <= 20;
        return porKm || porDias;
      });
      setMaintenanceAlerts(alerts);

      // Combine and sort recent activity
      const combined = [
        ...facts.map(f => ({ ...f, type: 'factura', sortDate: new Date(f.fecha + 'T00:00:00') })),
        ...fuel.map(f => ({ ...f, type: 'combustible', sortDate: new Date(f.fecha + 'T00:00:00') }))
      ].sort((a, b) => b.sortDate - a.sortDate).slice(0, 5);

      setRecentActivity(combined);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetMantenimiento = async (id, econ) => {
    if (!window.confirm(`¿Confirmas que se le hizo el mantenimiento a la unidad ${econ} HOY? Esto reiniciará sus contadores.`)) return;
    try {
      await api.post(`vehiculos/${id}/reset_mantenimiento/`);
      fetchDashboardData();
    } catch (err) {
      console.error("Error resetting maintenance:", err);
      alert("Hubo un error al reiniciar los contadores.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="text-blue-500 animate-spin" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 lg:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard 
          icon={<Truck />} 
          label="Unidades" 
          value={stats?.unidades?.total || 0} 
          color="bg-blue-600"
        />
        <StatCard 
          icon={<DollarSign />} 
          label="Facturado (Mes)" 
          value={`$${((stats?.facturacion?.total || 0) / 1000).toFixed(1)}k`} 
          color="bg-emerald-500"
        />
      </div>

      {/* Alertas de Mantenimiento */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-amber-500 rounded-full" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Alertas de Mantenimiento
            </h3>
          </div>
          {maintenanceAlerts.length > 0 && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-3 py-1.5 rounded-full font-black border border-amber-500/20 dark:border-amber-500/10">
              {maintenanceAlerts.length} {maintenanceAlerts.length === 1 ? 'unidad requiere' : 'unidades requieren'} atención
            </span>
          )}
        </div>

        {maintenanceAlerts.length === 0 ? (
          <div className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 dark:border-emerald-500/10 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center gap-3 shadow-lg">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">Flota al día</h4>
              <p className="text-xs text-slate-500 mt-1">Ninguna unidad se encuentra a menos de 20 días o 1,000 km de su mantenimiento.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {maintenanceAlerts.map((p) => {
              const esVencido = p.estado_alerta === 'vencido' || p.km_restantes <= 0 || p.dias_restantes <= 0;
              return (
                <div 
                  key={p.id}
                  className={`relative overflow-hidden bg-white dark:bg-slate-900/60 border rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between shadow-xl ${
                    esVencido 
                      ? 'border-red-500/30 dark:border-red-500/20 hover:border-red-500/50' 
                      : 'border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50'
                  }`}
                >
                  {/* Urgency indicator corner */}
                  <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest text-white ${
                    esVencido ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    {esVencido ? 'Vencido' : 'Próximo'}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${
                        esVencido ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {esVencido ? <AlertTriangle size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white leading-none">{p.numero_economico}</h4>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{p.placas || 'Sin Placas'}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {/* Kilometraje indicator */}
                      {p.km_restantes !== null && (
                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mb-1">Por Kilometraje</p>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                              {p.km_actual.toLocaleString()} / {(p.km_ultimo_mantenimiento + p.intervalo_km).toLocaleString()} km
                            </span>
                            <span className={`text-xs font-black ${p.km_restantes <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                              {p.km_restantes <= 0 
                                ? `Vencido (${Math.abs(p.km_restantes).toLocaleString()} km)` 
                                : `Faltan ${p.km_restantes.toLocaleString()} km`}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Tiempo indicator */}
                      {p.dias_restantes !== null && (
                        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider mb-1">Por Tiempo</p>
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                              Límite: {p.fecha_limite ? new Date(p.fecha_limite + 'T00:00:00').toLocaleDateString() : ''}
                            </span>
                            <span className={`text-xs font-black ${p.dias_restantes <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                              {p.dias_restantes <= 0 
                                ? `Vencido (${Math.abs(p.dias_restantes)} días)` 
                                : `Faltan ${p.dias_restantes} días`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {user?.rol === 'admin_general' && (
                    <button 
                      onClick={() => handleResetMantenimiento(p.id, p.numero_economico)}
                      className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white transition-all font-black text-xs uppercase tracking-wider"
                    >
                      <CheckCircle2 size={16} />
                      Registrar Mantenimiento
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-blue-600 rounded-full" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Acciones Rápidas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            icon={<FilePlus />} 
            label="Capturar Factura" 
            description="Registra gastos generales, refacciones o servicios externos."
            color="bg-blue-600"
            onClick={() => navigate('/facturacion')}
          />
          <ActionCard 
            icon={<Droplets />} 
            label="Carga Diésel" 
            description="Registra consumo de combustible y kilometraje actual."
            color="bg-amber-500"
            onClick={() => navigate('/combustible')}
          />
          <ActionCard 
            icon={<Ticket />} 
            label="Generar Ticket" 
            description="Crea órdenes de servicio internas para mantenimiento."
            color="bg-indigo-600"
            onClick={() => navigate('/tickets')}
          />
          <ActionCard 
            icon={<Truck />} 
            label="Alta de Unidad" 
            description="Registra un nuevo vehículo en la flota activa."
            color="bg-emerald-600"
            onClick={() => navigate('/vehiculos')}
          />
        </div>
      </div>


    </div>
  );
};

export default Dashboard;

