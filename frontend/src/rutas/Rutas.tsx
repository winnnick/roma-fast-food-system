import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import RutaConPermiso from "./RutaConPermiso";
import RutaProtegida from "./RutaProtegida";
import RutaPublica from "./RutaPublica";

import LayoutPrincipal from "../layouts/LayoutPrincipal";

import CargandoPagina from "../shared/feedback/CargandoPagina";

/*
  Las páginas se cargan de forma diferida.

  Esto divide la aplicación en fragmentos más pequeños
  y evita cargar todos los módulos al iniciar el sistema.
*/
const Login = lazy(
  () => import("../paginas/Login/Login"),
);

const Dashboard = lazy(
  () =>
    import(
      "../paginas/Dashboard/Dashboard"
    ),
);

const Ventas = lazy(
  () => import("../paginas/Ventas/Ventas"),
);

const Productos = lazy(
  () =>
    import(
      "../paginas/Productos/Productos"
    ),
);

const Caja = lazy(
  () => import("../paginas/Caja/Caja"),
);

const Inventario = lazy(
  () =>
    import(
      "../paginas/Inventario/Inventario"
    ),
);

const Usuarios = lazy(
  () =>
    import(
      "../paginas/Usuarios/Usuarios"
    ),
);

const RolesPermisos = lazy(
  () =>
    import(
      "../paginas/RolesPermisos/RolesPermisos"
    ),
);

const Reportes = lazy(
  () =>
    import(
      "../paginas/Reportes/Reportes"
    ),
);

const SinPermiso = lazy(
  () =>
    import(
      "../paginas/SinPermiso/SinPermiso"
    ),
);

const NoEncontrado = lazy(
  () =>
    import(
      "../paginas/NoEncontrado/NoEncontrado"
    ),
);

function Rutas() {
  return (
    <BrowserRouter>
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          {/* Ruta pública */}
          <Route
            path="/login"
            element={
              <RutaPublica>
                <Login />
              </RutaPublica>
            }
          />

          {/* Rutas internas protegidas */}
          <Route
            path="/"
            element={
              <RutaProtegida>
                <LayoutPrincipal />
              </RutaProtegida>
            }
          >
            {/* Redirección inicial */}
            <Route
              index
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

            {/* Acceso restringido */}
            <Route
              path="sin-permiso"
              element={<SinPermiso />}
            />

            {/* Dashboard */}
            <Route
              path="dashboard"
              element={
                <RutaConPermiso permiso="DASHBOARD_VER">
                  <Dashboard />
                </RutaConPermiso>
              }
            />

            {/* Ventas */}
            <Route
              path="ventas"
              element={
                <RutaConPermiso permiso="VENTAS_VER">
                  <Ventas />
                </RutaConPermiso>
              }
            />

            {/* Productos */}
            <Route
              path="productos"
              element={
                <RutaConPermiso permiso="PRODUCTOS_VER">
                  <Productos />
                </RutaConPermiso>
              }
            />

            {/* Caja */}
            <Route
              path="caja"
              element={
                <RutaConPermiso permiso="CAJA_VER">
                  <Caja />
                </RutaConPermiso>
              }
            />

            {/* Inventario */}
            <Route
              path="inventario"
              element={
                <RutaConPermiso permiso="INVENTARIO_VER">
                  <Inventario />
                </RutaConPermiso>
              }
            />

            {/* Usuarios */}
            <Route
              path="usuarios"
              element={
                <RutaConPermiso permiso="USUARIOS_VER">
                  <Usuarios />
                </RutaConPermiso>
              }
            />

            <Route
              path="roles-permisos"
              element={
                <RutaConPermiso permiso="ROLES_GESTIONAR">
                  <RolesPermisos />
                </RutaConPermiso>
              }
            />

            {/* Reportes */}
            <Route
              path="reportes"
              element={
                <RutaConPermiso permiso="REPORTES_VER">
                  <Reportes />
                </RutaConPermiso>
              }
            />
          </Route>

          {/* Ruta inexistente */}
          <Route
            path="*"
            element={<NoEncontrado />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default Rutas;