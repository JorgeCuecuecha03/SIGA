import React, { useState, useContext } from 'react';
import { Tag, Wrench, Users, LayoutGrid } from 'lucide-react';
import Productos from './Productos';
import Talleres from './Talleres';
import Proveedores from './Proveedores';
import { AuthContext } from '../context/AuthContext';

const Catalogos = () => {
  const { user } = useContext(AuthContext);
  const isCapturista = user?.rol === 'capturista';

  const [activeTab, setActiveTab] = useState(isCapturista ? 'talleres' : 'productos');

  let tabs = [
    { id: 'productos', label: 'Productos', icon: <Tag size={20} />, component: <Productos /> },
    { id: 'talleres', label: 'Talleres', icon: <Wrench size={20} />, component: <Talleres /> },
    { id: 'proveedores', label: 'Proveedores', icon: <Users size={20} />, component: <Proveedores /> },
  ];

  if (isCapturista) {
    tabs = tabs.filter(tab => tab.id !== 'productos');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <LayoutGrid className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Administración de Catálogos</h1>
            <p className="text-slate-500 text-xs font-medium">Gestiona productos, talleres y proveedores en un solo lugar</p>
          </div>
        </div>

        <div className="flex bg-slate-200/50 dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-300/50 dark:border-slate-800/80 self-center backdrop-blur-xl shadow-inner w-full md:w-auto overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out whitespace-nowrap overflow-hidden ${
                activeTab === tab.id
                  ? 'text-white shadow-lg shadow-indigo-900/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
              }`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-full" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="transition-all duration-300">
        {tabs.find(t => t.id === activeTab)?.component}
      </div>
    </div>
  );
};

export default Catalogos;
