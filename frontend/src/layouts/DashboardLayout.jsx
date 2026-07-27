import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo_neon.png';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Users,
  MapPin,
  Settings,
  LogOut,
  FilePlus,
  Tag,
  Briefcase,
  Menu,
  X,
  Navigation,
  Droplets,
  Ticket,
  LayoutGrid,
  Sun,
  Moon,
  Shield,
  ChevronDown,
  ChevronRight,
  History,
  FileEdit,
  BarChart3,
  Receipt
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCapturistaOpen, setIsCapturistaOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.rol === 'admin_general' || user?.rol === 'admin';

  const toggleMenu = (label) => {
    setOpenMenus(prev => {
      const item = mainItems.find(i => i.label === label);
      const isActive = item?.subItems?.some(sub => location.pathname === sub.path);
      const currentIsOpen = prev[label] !== undefined ? prev[label] : isActive;
      return { ...prev, [label]: !currentIsOpen };
    });
  };

  const mainItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/', roles: ['admin_general', 'admin', 'capturista', 'jefe_logistica', 'lector_gastos'] },
    { icon: <Shield size={20} />, label: 'Usuarios', path: '/usuarios', roles: ['admin_general'] },
    { icon: <History size={20} />, label: 'Historial', path: '/historial', roles: ['admin_general'] },
    { icon: <FileEdit size={20} />, label: 'Solicitudes', path: '/solicitudes-cambios', roles: ['admin_general', 'admin', 'jefe_logistica'] },
    { 
      icon: <BarChart3 size={20} />, 
      label: 'Reportes de Gastos', 
      roles: ['admin_general', 'admin', 'capturista', 'jefe_logistica', 'lector_gastos'],
      subItems: [
        { label: 'General', path: '/reporte-gastos', roles: ['admin_general', 'admin', 'capturista', 'jefe_logistica', 'lector_gastos'] },
        { label: 'Prov/Talleres', path: '/reporte-proveedores', roles: ['admin_general', 'admin', 'capturista', 'lector_gastos'] },
        { label: 'Pago Efectivo', path: '/reporte-efectivo', roles: ['admin_general', 'admin', 'capturista', 'lector_gastos'] }
      ]
    },
  ];

  const capturistaItems = [
    { icon: <Users size={20} />, label: 'Operadores', path: '/operadores', roles: ['admin_general', 'admin', 'jefe_logistica'] },
    { icon: <MapPin size={20} />, label: 'Logística', path: '/logistica', roles: ['admin_general', 'admin', 'jefe_logistica'] },
    { icon: <FilePlus size={20} />, label: 'Facturación', path: '/facturacion', roles: ['admin_general', 'admin', 'capturista', 'lector_gastos', 'jefe_logistica'] },
    { icon: <Receipt size={20} />, label: 'Contra Recibos', path: '/contra-recibos', roles: ['admin_general', 'admin', 'capturista'] },
    { icon: <Ticket size={20} />, label: 'Tickets', path: '/tickets', roles: ['admin_general', 'admin', 'capturista', 'lector_gastos'] },
    { icon: <LayoutGrid size={20} />, label: 'Catálogos', path: '/catalogos', roles: ['admin_general', 'admin', 'capturista'] },
    { icon: <Truck size={20} />, label: 'Vehículos', path: '/vehiculos', roles: ['admin_general', 'admin', 'capturista', 'jefe_logistica'] },
    { icon: <Wrench size={20} />, label: 'Mantenimiento', path: '/mantenimiento', roles: ['admin_general', 'admin', 'capturista'] },
    { icon: <Droplets size={20} />, label: 'Combustible', path: '/combustible', roles: ['admin_general', 'admin', 'capturista', 'jefe_logistica'] },
  ];

  const filteredMainItems = mainItems.filter(item => !item.roles || item.roles.includes(user?.rol || 'admin'));
  const filteredCapturistaItems = capturistaItems.filter(item => !item.roles || item.roles.includes(user?.rol || 'admin'));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderMenuItem = (item) => {
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(sub => !sub.roles || sub.roles.includes(user?.rol || 'admin'));
      if (filteredSubItems.length === 0) return null;
      
      const isActive = item.subItems.some(sub => location.pathname === sub.path);
      const isOpen = openMenus[item.label] !== undefined ? openMenus[item.label] : isActive;
      
      return (
        <div key={item.label} className="mt-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive 
              ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
            <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-6 mt-1">
              {filteredSubItems.map(sub => (
                <Link
                  key={sub.path}
                  to={sub.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                    location.pathname === sub.path
                    ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{sub.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === item.path
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200'
          }`}
      >
        {item.icon}
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-10 h-10 object-contain" 
                style={{ mixBlendMode: 'screen' }} 
              />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900 dark:text-white uppercase">SIGA</h1>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredMainItems.map(renderMenuItem)}
          
          {filteredCapturistaItems.length > 0 && (
            isAdmin ? (
              <div className="mt-2">
                <button
                  onClick={() => setIsCapturistaOpen(!isCapturistaOpen)}
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <Briefcase size={20} />
                    <span className="font-medium">Opciones Capturista</span>
                  </div>
                  {isCapturistaOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCapturistaOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                  <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-6 mt-1">
                    {filteredCapturistaItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${location.pathname === item.path
                          ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Visual separator for non-admins if they have both main items and capturista items */}
                {filteredMainItems.length > 0 && (
                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-4 mx-2"></div>
                )}
                {filteredCapturistaItems.map(renderMenuItem)}
              </>
            )
          )}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg lg:text-xl font-semibold text-slate-900 dark:text-white truncate">Gestión de Autotransporte</h2>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-6">
            <button
              onClick={toggleTheme}
              className="relative z-50 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm active:scale-90"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex items-center gap-3 lg:gap-4 border-l border-slate-200 dark:border-slate-800 pl-4 lg:pl-6">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize leading-tight">{user?.rol || 'Usuario'}</p>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{user?.username || 'user'}</p>
            </div>
            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-white dark:border-slate-700 shrink-0 uppercase shadow-lg">
              {user?.username ? user.username.substring(0, 2) : 'US'}
            </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

