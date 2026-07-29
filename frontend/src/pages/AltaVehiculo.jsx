import React, { useState } from 'react';
import api from '../services/api';
import { 
  Truck, 
  Upload, 
  Hash, 
  Tag, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Binary,
  Droplets
} from 'lucide-react';

const AltaVehiculo = ({ onSuccess, onClose, vehiculo = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    numero_economico: vehiculo?.numero_economico || '',
    placas: vehiculo?.placas || '',
    marca_modelo: vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}`.trim() : '',
    anio: vehiculo?.anio || '',
    numero_vin: vehiculo?.numero_vin || '',
    capacidad: vehiculo?.capacidad !== undefined && vehiculo?.capacidad !== null ? String(parseFloat(vehiculo.capacidad).toFixed(1)) : '10.0',
    tipo_combustible: vehiculo?.tipo_combustible || 'diesel',
    imagen: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, imagen: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    const splitIndex = formData.marca_modelo.trim().indexOf(' ');
    let marca = '';
    let modelo = '';
    
    if (splitIndex !== -1) {
      marca = formData.marca_modelo.trim().substring(0, splitIndex).trim();
      modelo = formData.marca_modelo.trim().substring(splitIndex + 1).trim();
    } else {
      marca = formData.marca_modelo.trim();
    }

    data.append('numero_economico', formData.numero_economico);
    data.append('placas', formData.placas);
    data.append('marca', marca);
    data.append('modelo', modelo);
    data.append('anio', formData.anio);
    data.append('numero_vin', formData.numero_vin);
    data.append('capacidad', formData.capacidad);
    data.append('tipo_combustible', formData.tipo_combustible);
    if (formData.imagen) {
      data.append('imagen', formData.imagen);
    }

    try {
      if (vehiculo) {
        await api.patch(`vehiculos/${vehiculo.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('vehiculos/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
      setFormData({
        numero_economico: '',
        placas: '',
        marca_modelo: '',
        anio: '',
        numero_vin: '',
        capacidad: '10.0',
        tipo_combustible: 'diesel',
        imagen: null
      });
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Error al registrar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600/10 p-3 rounded-2xl">
            <Truck className="text-indigo-600 dark:text-indigo-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {vehiculo ? 'Editar Unidad' : 'Alta de Unidad'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {vehiculo ? 'Modifica los datos del camión.' : 'Completa los datos del nuevo camión.'}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shadow-sm"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Tag className="text-indigo-600 dark:text-indigo-500" size={18} />
              Detalles de la Unidad
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Hash size={14} className="text-indigo-500" /> Número Económico
                </label>
                <input
                  required
                  type="text"
                  name="numero_economico"
                  value={formData.numero_economico}
                  onChange={handleChange}
                  placeholder="Ej. T-105"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <CreditCard size={14} className="text-indigo-500" /> Placas
                </label>
                <input
                  required
                  type="text"
                  name="placas"
                  value={formData.placas}
                  onChange={handleChange}
                  placeholder="Ej. 12-AB-34"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Tag size={14} className="text-indigo-500" /> Marca y Modelo
                </label>
                <input
                  required
                  type="text"
                  name="marca_modelo"
                  value={formData.marca_modelo}
                  onChange={handleChange}
                  placeholder="Ej. Kenworth T680"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Binary size={14} className="text-indigo-500" /> Número de Serie (VIN)
                </label>
                <input
                  type="text"
                  name="numero_vin"
                  value={formData.numero_vin}
                  onChange={handleChange}
                  placeholder="17 caracteres"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 uppercase shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Calendar size={14} className="text-indigo-500" /> Año
                </label>
                <input
                  required
                  type="number"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  placeholder="Ej. 2024"
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Truck size={14} className="text-indigo-500" /> Capacidad (Toneladas)
                </label>
                 <select
                  required
                  name="capacidad"
                  value={formData.capacidad}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="0.0" className="bg-white dark:bg-slate-900">Vehículo Ligero (Auto/Camioneta)</option>
                  <option value="1.5" className="bg-white dark:bg-slate-900">1.5 Toneladas</option>
                  <option value="3.5" className="bg-white dark:bg-slate-900">3.5 Toneladas</option>
                  <option value="5.0" className="bg-white dark:bg-slate-900">5 Toneladas</option>
                  <option value="8.0" className="bg-white dark:bg-slate-900">8 Toneladas</option>
                  <option value="10.0" className="bg-white dark:bg-slate-900">10 Toneladas</option>
                  <option value="30.0" className="bg-white dark:bg-slate-900">Trailer / Full</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Droplets size={14} className="text-indigo-500" /> Tipo de Combustible
                </label>
                <select
                  required
                  name="tipo_combustible"
                  value={formData.tipo_combustible}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="diesel" className="bg-white dark:bg-slate-900">Diesel</option>
                  <option value="magna" className="bg-white dark:bg-slate-900">Gasolina Magna</option>
                  <option value="premium" className="bg-white dark:bg-slate-900">Gasolina Premium</option>
                  <option value="gas_lp" className="bg-white dark:bg-slate-900">Gas LP</option>
                  <option value="electrico" className="bg-white dark:bg-slate-900">Eléctrico</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Imagen y Feedback */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/80 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-indigo-500 transition-all relative min-h-[300px] overflow-hidden shadow-sm">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept="image/*"
            />
            
            {formData.imagen ? (
              <div className="space-y-4 w-full">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700">
                  <img 
                    src={URL.createObjectURL(formData.imagen)} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium">Cambiar imagen</p>
                  </div>
                </div>
                <p className="text-indigo-400 text-xs font-medium truncate px-2">{formData.imagen.name}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-indigo-600/10 p-4 rounded-full inline-block group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-indigo-600 dark:text-indigo-500" size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-slate-900 dark:text-white font-bold text-lg">Foto de la Unidad</p>
                  <p className="text-slate-500 dark:text-slate-500 text-xs max-w-[150px] mx-auto">
                    Imagen del tractocamión.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 text-emerald-400 animate-in zoom-in-95 duration-300">
                <CheckCircle size={18} />
                <span className="font-semibold text-xs">
                  {vehiculo ? '¡Unidad actualizada con éxito!' : '¡Unidad registrada con éxito!'}
                </span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-400 animate-in zoom-in-95 duration-300">
                <AlertCircle size={18} />
                <span className="font-semibold text-xs break-words line-clamp-2">{error}</span>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Truck size={20} />
              )}
              {loading ? (vehiculo ? 'ACTUALIZANDO...' : 'REGISTRANDO...') : (vehiculo ? 'ACTUALIZAR UNIDAD' : 'REGISTRAR UNIDAD')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AltaVehiculo;
