import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Facturacion from './pages/Facturacion';
import ContraRecibos from './pages/ContraRecibos';
import ListaVehiculos from './pages/ListaVehiculos';
import Mantenimiento from './pages/Mantenimiento';
import Logistica from './pages/Logistica';
import Operadores from './pages/Operadores';

import Combustibles from './pages/Combustibles';
import Catalogos from './pages/Catalogos';
import Tickets from './pages/Tickets';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Historial from './pages/Historial';
import SolicitudesCambios from './pages/SolicitudesCambios';
import ReporteGastosUnidad from './pages/ReporteGastosUnidad';
import ReporteGastosProveedor from './pages/ReporteGastosProveedor';
import ReporteEfectivo from './pages/ReporteEfectivo';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import SileoToaster from './components/SileoToaster';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute allowedRoles={['admin_general', 'capturista', 'admin', 'jefe_logistica', 'monitoreo', 'lector_gastos']} />}>
              <Route path="/" element={<DashboardLayout />}>
                
                {/* Dashboard: All valid roles */}
                <Route index element={<Dashboard />} />

                {/* Rutas de Operaciones / Logística */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'jefe_logistica']} />}>
                  <Route path="logistica" element={<Logistica />} />
                  <Route path="operadores" element={<Operadores />} />
                  <Route path="solicitudes-cambios" element={<SolicitudesCambios />} />
                </Route>

                {/* Rutas de Capturista (con Lector de Gastos y Logística para visualizar facturas) */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'capturista', 'lector_gastos', 'jefe_logistica']} />}>
                  <Route path="facturacion" element={<Facturacion />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'capturista', 'lector_gastos']} />}>
                  <Route path="tickets" element={<Tickets />} />
                </Route>

                {/* Rutas de Capturista (sin Lector de Gastos) */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'capturista']} />}>
                  <Route path="mantenimiento" element={<Mantenimiento />} />
                  <Route path="catalogos" element={<Catalogos />} />
                  <Route path="contra-recibos" element={<ContraRecibos />} />
                </Route>

                {/* Rutas de Reportes */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'capturista', 'jefe_logistica', 'lector_gastos']} />}>
                  <Route path="reporte-gastos" element={<ReporteGastosUnidad />} />
                  <Route path="reporte-proveedores" element={<ReporteGastosProveedor />} />
                  <Route path="reporte-efectivo" element={<ReporteEfectivo />} />
                </Route>

                {/* Rutas Compartidas (Capturista y Logística) */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general', 'admin', 'capturista', 'jefe_logistica', 'lector_gastos']} />}>
                  <Route path="vehiculos" element={<ListaVehiculos />} />
                  <Route path="combustible" element={<Combustibles />} />
                </Route>
                
                {/* Rutas de Administración General */}
                <Route element={<ProtectedRoute allowedRoles={['admin_general']} />}>
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="historial" element={<Historial />} />
                </Route>

              </Route>
            </Route>
          </Routes>
          <SileoToaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
