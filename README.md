# Inversiones Urbaneja - Sistema de POS e Inventario

Sistema integral de Punto de Venta (POS) y control de inventario construido con arquitectura Desktop para maximizar la velocidad, permitir uso offline, y gestionar operaciones locales sin dependencias estrictas de la nube. 

Diseñado específicamente para negocios de alta rotación (minimarkets, bodegas y supermercados), incluyendo soporte para compras por unidad, productos por peso (Kilogramos/Gramos), facturación multimoneda (Dólares / Bolívares), cuentas por cobrar y cierres de caja detallados.

## 🚀 Características Principales

1. **Gestión de Inventario (Kardex)**
   - Soporte para tipo de producto (Unidad o Peso).
   - Tipos de control fraccionario (ej. deducciones precisas de `0.250kg`).
   - Alertas visuales de stock mínimo y próximos vencimientos.
   - Marcador dinámico de productos y categorías Favoritas.

2. **Módulo POS de Alta Velocidad (Multi-Moneda)**
   - Manejo de carrito de compras 100% transaccional usando sentencias SQL en crudo.
   - Buscador universal (por código de barras o nombre del producto).
   - **Pago Fraccionado y Multi-Moneda**: Permite pagar la misma cuenta de forma simultánea con Dólares en efectivo, Bolívares en efectivo, Pagos Móviles (Digitales) o combinados.
   - Cálculo instantáneo del Vuelto (Cambio) con base a la Tasa BCV (o tasa configurada localmente).
   - Generación de tickets tipo comprobante de pago.
   - Módulo de crédito / cuentas por cobrar directamente desde el POS.

3. **Cierre de Caja Ciego interactivo**
   - Comparativas del saldo teórico del sistema contra el conteo físico real (Efectivo en Bs, Efectivo en USD y Ventas en Sistema Digital).

4. **Dashboard y Reportes**
   - Reportes detallados por fecha (Kpis de facturación, volumen de productos, histórico general).
   - Dashboard analítico con Top 5 productos más vendidos.

## 🛠️ Stack Tecnológico
La aplicación emplea un entorno monorepo simplificado: un empaquetado **Electron** actuando como un contenedor nativo / backend, combinado con un frontend renderizado de inmediato usando React 19.

**Frontend:**
* [React 19](https://react.dev/) – UI reactiva.
* [Vite](https://vitejs.dev/) – Entorno de construcción ultrarrápido y Server de Development.
* [Tailwind CSS 3](https://tailwindcss.com/) – Sistema de utilidades y estilos, diseño modular basado en Custom Palette "brand", "surface".
* [Recharts](https://recharts.org/) – Para diagramas e historial en el Dashboard.
* [React Icons (Lucide)](https://react-icons.github.io/react-icons/icons/lu/) – Todos los iconos de interfaz.
* [Date-Fns](https://date-fns.org) – Formateo estricto de fechas y cálculos de vencimientos.

**Backend & Entorno Local:**
* [Electron v30](https://www.electronjs.org/) – Contenedor de escritorio, ContextBridge y acceso a IPC.
* [Node.js](https://nodejs.org/) – Backend base que invoca Electron.
* [SQLite3](https://github.com/TryGhost/node-sqlite3) – Base de datos SQL Local incrustada `(urbaneja_pos.db)` para transacciones ultra veloces tipo ACID.

---

## 💻 Instalación y Ejecución Local

### 1. Prerrequisitos
Asegúrate de contar con Node.js instalado (Versión v18+ es preferida).

### 2. Clonar el Repositorio
```bash
git clone <url-del-repositorio>
cd Inversiones_Urbaneja
```

### 3. Instalar Dependencias
Instala los módulos del administrador de paquetes.
```bash
npm install
```
*(Durante la instalación, `sqlite3` generará binarios precompilados mediante `node-gyp` enfocados en la plataforma del host).*

### 4. Lanzar Entorno de Desarrollo (Dev Server)
Se cuenta con un script que lanza paralelamente Vite (puerto 5173 para HMR) y el proceso principal de Electron observando estos cambios:
```bash
npm run dev
```
Este comando activa internamente:
* `npm run vite`: Servidor de react.
* `npm run electron:dev`: Cross-env para ejecutar electron como proceso de escritorio invocando `launcher.js`.

---

## 🗄️ Estructura del Proyecto

* **`/desktop-main`**: Código de Electron / Backend Local.
   * `main.js`: Gestor del ciclo de vida de la ventana (`BrowserWindow`) y handlers generales.
   * `preload.js`: Context Bridge exponiendo la API `window.api.invoke` hacia React de forma segura.
   * `/database/db.js`: Generador principal de esquemas SQLite.
   * `/database/handlers/`: Controladores CRUD que se inyectan dinámicamente (`productos.js`, `ventas.js`, `cuentas.js`, etc.) a través de `ipcMain`.

* **`/src`**: Código React / Frontend.
   * `index.css`: Archivo Tailwind Root donde se encuentra la implementación de clases enlazadas de sistema de diseño (inputs, themes, modals).
   * `App.jsx`: Componente maestro / Shell. Root Router + Sidebars y Navegación Responsive Múltiple.
   * `/context/AppContext.jsx`: Estado Global que inyecta los helpers monetarios (BS/US) y variables maestras como tasaciones y configuración.
   * `/pages`: Archivos principales JSX separados por Vistas (POS, Dashboard, Inventario, Reportes, CierreDeCaja, CuentasPorCobrar).
   * `/components`: Sub-módulos reutilizables.

* **Archivos Raíz Principales:**
   * `launcher.js`: Módulo especial usado en desarrollo que neutraliza variables agresoras como `ELECTRON_RUN_AS_NODE` que causan bugs de carga bajo sistemas Windows específicos antes de cargar el main.
   * `vite.config.js`: Reglas de bundler Vite.
   * `tailwind.config.js`: Tematización UI.

---

## ⚙️ Compilación a Ejecutable (Deploy Build)

*(Si se usará electron-builder u otra herramienta para exportar un `.exe` , detallarlo a futuro. Por defecto:*
1. Compilar Vite.
```bash
npm run build
```
2. Ejecutar de forma estática con Electron.
```bash
npm run electron:start
```
