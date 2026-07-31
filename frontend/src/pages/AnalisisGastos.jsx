import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Filter, Truck, Search } from 'lucide-react';

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
    color: "#f97316",
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
  },
  "Gastos sin unidad asignada": {
    label: "Gastos sin unidad asignada",
    color: "#ef4444",
  }
};

const trendChartConfig = {
  total: {
    label: "Monto Total",
    color: "#10b981",
  }
};

const AnalisisGastos = ({ facturas, vehiculos, cajas = [], variados = [], cargasCombustible = [] }) => {
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');

  const vehiculosFiltrados = useMemo(() => {
    if (!vehiculos) return [];
    return vehiculos.filter(v => 
      v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
    );
  }, [vehiculos, busquedaUnidad]);

  const cajasFiltradas = useMemo(() => {
    if (!cajas) return [];
    return cajas.filter(c => 
      c.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      c.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
    );
  }, [cajas, busquedaUnidad]);

  const variadosFiltradas = useMemo(() => {
    if (!variados) return [];
    return variados.filter(v => 
      v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
    );
  }, [variados, busquedaUnidad]);

  const facturasFiltradas = useMemo(() => {
    // Excluir "Combustible" de las facturas para evitar duplicados y cargas antiguas
    const facturasSinCombustible = facturas.filter(f => {
      const cat = String(f.categoria || f.producto_categoria || 'Otro').trim().toLowerCase();
      return cat !== 'combustible';
    });

    // Mapear cargas de combustible al formato de facturas
    const cargasMapeadas = cargasCombustible.map(c => ({
      id: `carga_${c.id}`,
      categoria: 'Combustible',
      monto: c.monto_total,
      fecha: c.fecha,
      unidad: c.unidad,
      variado: c.unidad_variada,
      caja: null
    }));

    const datosCombinados = [...facturasSinCombustible, ...cargasMapeadas];

    if (unidadSeleccionada === 'todas') return datosCombinados;
    if (unidadSeleccionada === 'sin_asignar') {
      return datosCombinados.filter(f => !f.unidad && (!f.unidades || f.unidades.length === 0) && !f.caja && !f.variado);
    }
    
    if (typeof unidadSeleccionada === 'string' && unidadSeleccionada.startsWith('caja_')) {
      const cajaId = parseInt(unidadSeleccionada.replace('caja_', ''), 10);
      return datosCombinados.reduce((acc, f) => {
        const detalle = f.detalles_unidades?.find(d => d.caja === cajaId);
        if (detalle) {
          acc.push({ ...f, monto: detalle.monto });
          return acc;
        }
        if (f.caja === cajaId) {
          acc.push(f);
        }
        return acc;
      }, []);
    }

    if (typeof unidadSeleccionada === 'string' && unidadSeleccionada.startsWith('variado_')) {
      const variadoId = parseInt(unidadSeleccionada.replace('variado_', ''), 10);
      return datosCombinados.reduce((acc, f) => {
        const detalle = f.detalles_unidades?.find(d => d.variado === variadoId);
        if (detalle) {
          acc.push({ ...f, monto: detalle.monto });
          return acc;
        }
        if (f.variado === variadoId) {
          acc.push(f);
        }
        return acc;
      }, []);
    }

    const uId = parseInt(unidadSeleccionada, 10);
    
    return datosCombinados.reduce((acc, f) => {
      const detalle = f.detalles_unidades?.find(d => d.unidad === uId);
      if (detalle) {
        acc.push({ ...f, monto: detalle.monto });
        return acc;
      }

      if (f.unidad === uId) {
        if (f.unidades_info && f.unidades_info.length > 1 && (!f.detalles_unidades || f.detalles_unidades.length === 0)) {
            return acc;
        }
        acc.push(f);
      }
      return acc;
    }, []);
  }, [facturas, cargasCombustible, unidadSeleccionada]);

  const dataPorCategoria = useMemo(() => {
    const categorias = {};
    facturasFiltradas.forEach(f => {
      let cat = f.categoria;
      if (unidadSeleccionada === 'todas' && !f.unidad && (!f.unidades || f.unidades.length === 0) && !f.caja && !f.variado) {
        cat = 'Gastos sin unidad asignada';
      } else {
        if (!cat || cat === 'Otro') {
          cat = f.producto_categoria || 'Otro';
        }
      }
      const monto = parseFloat(f.monto);
      if (!categorias[cat]) categorias[cat] = 0;
      categorias[cat] += monto;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [facturasFiltradas, unidadSeleccionada]);

  const dataPorCategoriaConFills = useMemo(() => {
    return dataPorCategoria.map((item, index) => ({
      ...item,
      fill: categoryChartConfig[item.name]?.color || COLORS[index % COLORS.length]
    }));
  }, [dataPorCategoria]);

  const dataPorMes = useMemo(() => {
    const meses = {};
    const categoriasPresentes = new Set();
    
    facturasFiltradas.forEach(f => {
      const date = new Date(f.fecha + 'T00:00:00');
      const mesAnio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!meses[mesAnio]) meses[mesAnio] = { name: mesAnio, total: 0 };
      
      let cat = f.categoria;
      if (unidadSeleccionada === 'todas' && !f.unidad && (!f.unidades || f.unidades.length === 0) && !f.caja && !f.variado) {
        cat = 'Gastos sin unidad asignada';
      } else {
        if (!cat || cat === 'Otro') {
          cat = f.producto_categoria || 'Otro';
        }
      }

      categoriasPresentes.add(cat);
      if (!meses[mesAnio][cat]) meses[mesAnio][cat] = 0;
      
      meses[mesAnio][cat] += parseFloat(f.monto);
      meses[mesAnio].total += parseFloat(f.monto);
    });

    // Rellenar con 0 las categorías faltantes en cada mes para que el AreaChart las apile correctamente
    const result = Object.values(meses).sort((a, b) => a.name.localeCompare(b.name));
    result.forEach(mes => {
      categoriasPresentes.forEach(cat => {
        if (mes[cat] === undefined) mes[cat] = 0;
      });
    });

    return result;
  }, [facturasFiltradas, unidadSeleccionada]);

  // ApexCharts Configs
  const pieOptions = useMemo(() => ({
    chart: { type: 'donut', background: 'transparent', fontFamily: 'inherit' },
    labels: dataPorCategoria.map(d => categoryChartConfig[d.name]?.label || d.name),
    colors: dataPorCategoria.map(d => categoryChartConfig[d.name]?.color || '#cbd5e1'),
    theme: { mode: 'dark' },
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `$${val.toLocaleString('es-MX', {minimumFractionDigits: 2})}` }
    }
  }), [dataPorCategoria]);
  const pieSeries = useMemo(() => dataPorCategoria.map(d => d.value), [dataPorCategoria]);

  const lineOptions = useMemo(() => ({
    chart: { type: 'line', background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
    stroke: { curve: 'smooth', width: 4 },
    colors: ['#10b981'],
    theme: { mode: 'dark' },
    xaxis: { categories: dataPorMes.map(d => d.name), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (val) => `$${(val/1000).toFixed(0)}k` } },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `$${val.toLocaleString('es-MX', {minimumFractionDigits: 2})}` }
    },
    grid: { borderColor: '#1e293b', strokeDashArray: 3 }
  }), [dataPorMes]);
  const lineSeries = useMemo(() => [{ name: 'Monto Total', data: dataPorMes.map(d => d.total) }], [dataPorMes]);

  const areaOptions = useMemo(() => ({
    chart: { type: 'area', stacked: false, background: 'transparent', toolbar: { show: false }, fontFamily: 'inherit' },
    colors: dataPorCategoriaConFills.map(c => c.fill),
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    theme: { mode: 'dark' },
    xaxis: { categories: dataPorMes.map(d => d.name), labels: { style: { colors: '#94a3b8' } } },
    yaxis: { labels: { style: { colors: '#94a3b8' }, formatter: (val) => `$${(val/1000).toFixed(0)}k` } },
    dataLabels: { enabled: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val) => `$${val.toLocaleString('es-MX', {minimumFractionDigits: 2})}` }
    },
    grid: { borderColor: '#1e293b', strokeDashArray: 3 },
    legend: { position: 'bottom', labels: { colors: '#94a3b8' } }
  }), [dataPorMes, dataPorCategoriaConFills]);
  const areaSeries = useMemo(() => dataPorCategoriaConFills.map(cat => ({
    name: categoryChartConfig[cat.name]?.label || cat.name,
    data: dataPorMes.map(d => d[cat.name] || 0)
  })), [dataPorMes, dataPorCategoriaConFills]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Filtro por Unidad */}
      <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row items-center gap-6 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3 bg-blue-600/10 p-3 rounded-2xl">
          <Filter className="text-blue-500" size={24} />
        </div>
        
        <div className="flex-grow w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider block">
              Analizar gastos por unidad
            </label>
            
            <div className="relative group w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-4 lg:left-5 flex items-center pointer-events-none">
                <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="Buscar por eco o placas..."
                value={busquedaUnidad}
                onChange={(e) => setBusquedaUnidad(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-base lg:text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
              />
            </div>
          </div>
 
          <div className="relative">
            <div className="absolute inset-y-0 left-4 lg:left-5 flex items-center pointer-events-none">
              <Truck className="text-slate-500" size={20} />
            </div>
            <select
              value={unidadSeleccionada}
              onChange={(e) => setUnidadSeleccionada(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl lg:rounded-2xl pl-12 lg:pl-14 pr-4 lg:pr-6 py-3 lg:py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all appearance-none text-base lg:text-lg font-medium cursor-pointer shadow-xl"
            >
              <option value="todas">
                {busquedaUnidad 
                  ? `Resultados (${vehiculosFiltrados.length + cajasFiltradas.length + variadosFiltradas.length})` 
                  : 'Todas las Unidades (Global)'}
              </option>
              <option value="sin_asignar">
                Gastos sin unidad asignada
              </option>
              
              {vehiculosFiltrados.length > 0 && (
                <optgroup label="Unidades" className="bg-slate-100 dark:bg-slate-955 text-blue-600 dark:text-blue-400 font-bold">
                  {vehiculosFiltrados.map(v => (
                    <option key={`tractor_${v.id}`} value={v.id} className="text-slate-900 dark:text-white font-normal bg-white dark:bg-slate-950">
                      {v.numero_economico} {v.placas ? `- ${v.placas}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {cajasFiltradas.length > 0 && (
                <optgroup label="Remolques / Cajas" className="bg-slate-100 dark:bg-slate-955 text-blue-600 dark:text-blue-400 font-bold">
                  {cajasFiltradas.map(c => (
                    <option key={`caja_${c.id}`} value={`caja_${c.id}`} className="text-slate-900 dark:text-white font-normal bg-white dark:bg-slate-950">
                      {c.numero_economico} {c.placas ? `- ${c.placas}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              {variadosFiltradas.length > 0 && (
                <optgroup label="Vehículos Variados / Maquinaria" className="bg-slate-100 dark:bg-slate-955 text-blue-600 dark:text-blue-400 font-bold">
                  {variadosFiltradas.map(varItem => (
                    <option key={`variado_${varItem.id}`} value={`variado_${varItem.id}`} className="text-slate-900 dark:text-white font-normal bg-white dark:bg-slate-950">
                      {varItem.numero_economico} {varItem.placas ? `- ${varItem.placas}` : ''} {varItem.tipo ? `(${varItem.tipo})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución por Categoría */}
        <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-3 rounded-2xl">
              <PieChartIcon className="text-blue-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Distribución de Gastos</h3>
          </div>
          
          {dataPorCategoriaConFills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 w-full">
                <ReactApexChart options={pieOptions} series={pieSeries} type="donut" height="100%" />
              </div>
              <div className="space-y-3">
                {(() => {
                  const total = dataPorCategoriaConFills.reduce((acc, curr) => acc + curr.value, 0);
                  return dataPorCategoriaConFills.map((item) => {
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.name} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900/60 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{categoryChartConfig[item.name]?.label || item.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{percentage}% del total</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-4 font-mono">
                          ${parseFloat(item.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 font-medium italic bg-slate-200/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              No hay datos para esta selección
            </div>
          )}
        </div>

        {/* Tendencia Mensual */}
        <div className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-600/20 p-3 rounded-2xl">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tendencia Mensual Total</h3>
          </div>
          
          {dataPorMes.length > 0 ? (
            <div className="h-80 w-full">
              <ReactApexChart options={lineOptions} series={lineSeries} type="line" height="100%" />
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 font-medium italic bg-slate-200/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              Sin historial de gastos disponible
            </div>
          )}
        </div>

        {/* Comparativa de Gastos por Mes y Categoría */}
        <div className="col-span-1 lg:col-span-2 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm dark:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-600/20 p-3 rounded-2xl">
              <BarChart3 className="text-purple-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Comparativa de Gastos por Categoría</h3>
          </div>
          
          {dataPorMes.length > 0 ? (
            <div className="h-96 w-full">
              <ReactApexChart options={areaOptions} series={areaSeries} type="area" height="100%" />
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 font-medium italic bg-slate-200/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
              No hay facturas registradas para generar la comparativa
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AnalisisGastos;
