# Estructura Profesional de Myrmidon

## 📁 Organización del Código

```
src/
├── extension.ts              # Punto de entrada principal
├── SidebarProvider.ts        # Proveedor del webview del sidebar
├── types/
│   └── index.ts             # Tipos e interfaces TypeScript
├── constants/
│   └── index.ts             # Configuración y constantes
├── services/
│   └── ProjectDetector.ts   # Servicio de detección de proyectos
├── ui/
│   └── WebviewContent.ts    # Generador de contenido HTML del webview
└── test/
    └── extension.test.ts    # Pruebas unitarias
```

## 🏗️ Arquitectura

### Principios Aplicados

1. **Separación de Responsabilidades**
   - `extension.ts`: Inicialización y coordinación
   - `SidebarProvider.ts`: Gestión del UI y comunicación
   - `ProjectDetector.ts`: Lógica de detección de proyectos
   - `WebviewContent.ts`: Generación de contenido HTML

2. **Configuración Centralizada**
   - Todas las constantes en `constants/index.ts`
   - Fácil mantenimiento y actualización

3. **Tipado Fuerte**
   - Interfaces claras en `types/index.ts`
   - Mejor autocompletar en IDE
   - Menos errores en tiempo de compilación

## 🔍 Componentes Principales

### Extension (extension.ts)

- Punto de entrada de la extensión
- Inicializa el detector de proyectos
- Registra el proveedor del webview
- Manejo centralizado de errores

### SidebarProvider (SidebarProvider.ts)

- Implementa `vscode.WebviewViewProvider`
- Gestiona la comunicación webview ↔ extensión
- Maneja eventos de UI
- Logging estructurado

### ProjectDetector (services/ProjectDetector.ts)

- Detecta automáticamente proyectos Laravel e Ionic
- Explora recursivamente hasta 2 niveles
- Ignora carpetas comunes (node_modules, vendor, etc.)
- Logging detallado de operaciones

### WebviewContent (ui/WebviewContent.ts)

- Genera HTML del webview dinámicamente
- Estilos CSS integrados y modernos
- JavaScript para interactividad
- Reutiliza configuración de constantes

## 📊 Flujo de Datos

```
Extensión activada
        ↓
ProjectDetector detecta proyectos
        ↓
SidebarProvider recibe lista de proyectos
        ↓
WebviewContent genera HTML
        ↓
Usuario interactúa con UI
        ↓
Mensaje llega a SidebarProvider
        ↓
Se ejecuta acción correspondiente
```

## 🎯 Tipos Disponibles

```typescript
// Proyecto detectado
interface Project {
  name: string;
  type: "laravel" | "ionic" | "other";
  path: string;
}

// Acción disponible
interface Action {
  id: string;
  label: string;
  icon: string;
  description: string;
}

// Configuración de tipo de proyecto
interface ProjectConfig {
  type: ProjectType;
  icon: string;
  color: string;
  description: string;
  actions: Action[];
}
```

## ⚙️ Constantes Clave

- `MAX_SEARCH_DEPTH`: Profundidad de búsqueda recursiva (2)
- `IGNORED_FOLDERS`: Carpetas a ignorar durante búsqueda
- `LARAVEL_CONFIG`: Configuración y acciones de Laravel
- `IONIC_CONFIG`: Configuración y acciones de Ionic
- `MAIN_COMMANDS`: Comandos principales de la extensión

## 🔌 Extensibilidad

### Agregar nuevo tipo de proyecto

1. Añade tipo en `types/index.ts`
2. Crea `XXX_CONFIG` en `constants/index.ts`
3. Agrega lógica de detección en `ProjectDetector.ts`
4. Actualiza `PROJECT_CONFIGS` en `constants/index.ts`

### Agregar nuevas acciones

1. Define acción en `LARAVEL_CONFIG`, `IONIC_CONFIG` o `OTHER_CONFIG`
2. Maneja en `SidebarProvider.handleActionExecution()`
3. La UI se actualiza automáticamente

## 📝 Logging

Toda la extensión usa `console.log` con prefijos para facilitar debugging:

- `[Myrmidon]`: Eventos generales
- `[SidebarProvider]`: Eventos del UI
- `[ProjectDetector]`: Detección de proyectos

## 🚀 Mejoras Futuras

- [ ] Soporte para más tipos de proyectos (Python, Node.js, etc.)
- [ ] Guardado de preferencias de usuario
- [ ] Ejecutar comandos del terminal desde acciones
- [ ] Panel de configuración avanzada
- [ ] Caché de proyectos detectados
- [ ] Notificaciones en tiempo real de eventos

---

**Actualizado**: 16 de abril de 2026
