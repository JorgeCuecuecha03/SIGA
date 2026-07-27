import React, { useState, useEffect, useContext } from 'react';
import { X, User, Lock, Save, Loader2, Truck, Car, Settings, HelpCircle, Shield, KeyRound, Star, Zap, Activity } from 'lucide-react';
import api from '../services/api';
import notify from '../utils/notifications';
import { AuthContext } from '../context/AuthContext';

export const AVATAR_OPTIONS = [
  { id: 'User', icon: <User size={24} /> },
  { id: 'Truck', icon: <Truck size={24} /> },
  { id: 'Car', icon: <Car size={24} /> },
  { id: 'Shield', icon: <Shield size={24} /> },
  { id: 'Star', icon: <Star size={24} /> },
  { id: 'Zap', icon: <Zap size={24} /> },
  { id: 'Activity', icon: <Activity size={24} /> },
  { id: 'HelpCircle', icon: <HelpCircle size={24} /> },
  { id: 'Settings', icon: <Settings size={24} /> },
];

const PerfilUsuarioModal = ({ onClose }) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    password: '',
    avatar: 'User'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
        avatar: user.avatar || 'User'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData(prev => ({ ...prev, avatar: avatarId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.password) {
        delete payload.password;
      }
      
      const response = await api.put('auth/me/', payload);
      setUser(response.data);
      
      notify.success("Perfil actualizado correctamente");
      onClose();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      notify.error("Ocurrió un error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mi Perfil</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza tu información y avatar</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <form id="perfil-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Selecciona tu Avatar
              </label>
              <div className="grid grid-cols-5 gap-3">
                {AVATAR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleAvatarSelect(opt.id)}
                    className={`flex items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 ${
                      formData.avatar === opt.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-md' 
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {opt.icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nombre(s)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Apellido(s)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Cambiar Contraseña <span className="text-slate-400 font-normal text-xs">(Opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                  placeholder="Dejar en blanco para mantener actual"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="perfil-form"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuarioModal;
