# MYRMIDON VS Code Extension

Panel operativo para proyectos Laravel, Ionic, Ionic+Cordova, React Native y Cordova dentro de Visual Studio Code.

> Realizado por **GassinDev** para el **uso exclusivo de la organización MYRMIDON**.

## Tabla de contenidos

- [1. Resumen](#1-resumen)
- [2. Funcionalidades](#2-funcionalidades)
- [3. Requisitos](#3-requisitos)
- [4. Instalación y ejecución](#4-instalación-y-ejecución)
- [5. Guía de uso](#5-guía-de-uso)
- [6. Referencia de comandos](#6-referencia-de-comandos)
- [7. Arquitectura técnica](#7-arquitectura-técnica)
- [8. Guía de desarrollo](#8-guía-de-desarrollo)
- [9. Validación y calidad](#9-validación-y-calidad)
- [10. Troubleshooting](#10-troubleshooting)
- [11. Actualización para desarrolladores (Symlink)](#11-actualización-para-desarrolladores-symlink)
- [12. Autoría y uso](#12-autoría-y-uso)

## 1. Resumen

Myrmidon centraliza tareas habituales de desarrollo en un panel lateral de VS Code:

- Detección automática de proyectos Laravel, Ionic, Ionic+Cordova, React Native y Cordova en el workspace.
- Ejecución de comandos de trabajo frecuentes.
- Visualización y edición de especificaciones críticas.
- Flujos guiados (por ejemplo, release de Ionic).
- Estado de salud del proyecto y logs en vivo.

## 2. Funcionalidades

### 2.1 Vista general

| Bloque             | Descripción                                                                  | Beneficio                       |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------- |
| Terminal           | Terminal dedicada por proyecto, creada y reutilizada automáticamente         | Sin configuración manual        |
| Proyecto           | Selector de proyecto detectado automáticamente                               | Cambio rápido de contexto       |
| Utilidades rápidas | Abrir carpeta, copiar ruta, abrir archivo clave, abrir terminal del proyecto | Operación más ágil              |
| Funciones          | Acciones por stack (Laravel/Ionic)                                           | Productividad diaria            |
| Salud del proyecto | Checks técnicos con estado OK/WARN/ERROR                                     | Detección temprana de problemas |
| Especificaciones   | Valores clave por stack                                                      | Visibilidad de configuración    |
| Logs en vivo       | Visualización y filtrado de logs                                             | Diagnóstico rápido              |

### 2.2 Funciones por stack

| Stack         | Funciones destacadas                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| Laravel       | Serve (con IP local), Migrate, Tinker, Optimize Clear, Config Clear, Cache Clear  |
| Ionic         | Instalación dependencias, Build, Sync, Run Device, Run Web, Prepare To Release    |
| Ionic+Cordova | Instalación dependencias, Build, Prepare To Release, Prepare, Run Device, Run Web |
| React Native  | Install Deps, Start Metro (npx expo start)                                        |
| Cordova       | Install Deps, Add Android, Add iOS, Run Android, Run iOS, Build Release           |

### 2.3 Edición desde especificaciones

| Stack         | Claves editables desde el panel                |
| ------------- | ---------------------------------------------- |
| Laravel       | APP_URL, DB_DATABASE, DB_USERNAME, DB_PASSWORD |
| Ionic         | apiUrl (dev), apiUrl (prod)                    |
| Ionic+Cordova | apiUrl (dev), apiUrl (prod)                    |

Notas para Ionic / Ionic+Cordova:

- La apiUrl se detecta solo en líneas activas (sin comentar).
- Se ignoran líneas comentadas con `//` y bloques `/* ... */`.

## 3. Requisitos

| Componente                    | Requisito                        |
| ----------------------------- | -------------------------------- |
| Node.js                       | 18+                              |
| VS Code                       | 1.116.0+                         |
| Entorno Laravel               | PHP/Composer según proyecto      |
| Entorno Ionic                 | Node + toolchain Ionic/Capacitor |
| Entorno Ionic+Cordova         | Node + Ionic CLI + Cordova CLI   |
| Entorno React Native          | Node + Expo CLI (`npx expo`)     |
| Entorno Cordova               | Node + Cordova CLI               |
| Firma Android (release Ionic) | Keystore válido + credenciales   |

## 4. Instalación y ejecución

### 4.1 Preparación

```bash
npm install
```

### 4.2 Compilación

```bash
npm run compile
```

### 4.3 Instalación para quien clona el repositorio

Si descargaste este repositorio y quieres usar la extensión en tu VS Code:

1. Instala dependencias:

```bash
npm install
```

2. Empaqueta la extensión en un archivo VSIX:

```bash
npx --yes @vscode/vsce package
```

3. Instala el VSIX generado:

```bash
code --install-extension ./myrmidon-0.0.1.vsix --force
```

4. Reinicia VS Code y abre el panel Myrmidon en la barra lateral.

Alternativa por interfaz:

1. Ir a Extensions en VS Code.
2. Menú de tres puntos.
3. Elegir Install from VSIX...
4. Seleccionar el archivo `myrmidon-0.0.1.vsix`.

### 4.4 Desarrollo en VS Code

1. Abrir la carpeta del proyecto de la extensión.
2. Ejecutar la configuración de depuración de extensión (Run Extension / F5).
3. En la ventana de desarrollo, abrir un workspace con proyectos Laravel, Ionic, Ionic+Cordova, React Native o Cordova.

## 5. Guía de uso

### 5.1 Flujo base

1. Abrir panel MYRMIDON en la barra lateral.
2. Seleccionar proyecto.
3. Usar funciones, utilidades y edición de especificaciones.

### 5.2 Ejecutar funciones

- Botón principal: ejecuta comando.
- Botón de copia: copia comando (excepto flujos guiados especiales).

### 5.3 Ejecutar runs activos

Para comandos de ejecución larga (por ejemplo, serve/run):

- Se gestionan como sesiones activas.
- Aparecen en el bloque de ejecuciones activas.
- Cada sesión tiene botón de stop.

### 5.4 Editar especificaciones

1. Localiza la clave en ESPECIFICACIONES.
2. Pulsa el icono de lápiz.
3. Guarda el nuevo valor.

Ionic apiUrl:

- `apiUrl (dev)` se actualiza en archivo de entorno dev.
- `apiUrl (prod)` se actualiza en archivo de entorno prod.

### 5.5 Logs en vivo

- Filtros disponibles: All, Info, Warn, Error.
- Botón Limpiar para limpiar la vista actual.

## 6. Referencia de comandos

### 6.1 Laravel

| Label          | Comando                                           |
| -------------- | ------------------------------------------------- |
| Serve          | `php artisan serve --host=<IP_LOCAL> --port=8000` |
| Migrate        | `php artisan migrate`                             |
| Tinker         | `php artisan tinker`                              |
| Optimize Clear | `php artisan optimize:clear`                      |
| Config Clear   | `php artisan config:clear`                        |
| Cache Clear    | `php artisan cache:clear`                         |

### 6.2 Ionic

| Label                    | Comando                                    |
| ------------------------ | ------------------------------------------ |
| Instalación dependencias | `npm i`                                    |
| Build                    | `ionic cap build android`                  |
| Sync                     | `ionic cap sync`                           |
| Run Device               | `ionic cap run android -l --external`      |
| Run Web                  | `ionic serve`                              |
| Prepare To Release       | Flujo guiado de build + sync + firmado AAB |

### 6.3 Ionic + Cordova

| Label                    | Comando                                   |
| ------------------------ | ----------------------------------------- |
| Instalación dependencias | `npm i`                                   |
| Build                    | `ionic cordova build android`             |
| Prepare To Release       | `ionic cordova build android --release`   |
| Prepare                  | `ionic cordova prepare android`           |
| Run Device               | `ionic cordova run android -l --external` |
| Run Web                  | `ionic serve`                             |

### 6.4 React Native

| Label        | Comando          |
| ------------ | ---------------- |
| Install Deps | `npx install`    |
| Start Metro  | `npx expo start` |

### 6.5 Cordova

| Label         | Comando                           |
| ------------- | --------------------------------- |
| Install Deps  | `npm install`                     |
| Add Android   | `cordova platform add android`    |
| Add iOS       | `cordova platform add ios`        |
| Run Android   | `cordova run android`             |
| Run iOS       | `cordova run ios`                 |
| Build Release | `cordova build android --release` |

## 7. Arquitectura técnica

| Archivo                           | Responsabilidad                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `src/extension.ts`                | Activación y registro del WebviewViewProvider                                      |
| `src/SidebarProvider.ts`          | Orquestación backend: mensajes, terminal por proyecto, runs, edición, salud y logs |
| `src/services/ProjectDetector.ts` | Detección recursiva de proyectos y extracción de especificaciones                  |
| `src/ui/WebviewContent.ts`        | Render HTML/CSS/JS del panel                                                       |
| `src/constants/index.ts`          | Configuración por stack, comandos y orden de especificaciones                      |
| `src/types/index.ts`              | Tipos compartidos                                                                  |

## 8. Guía de desarrollo

### 8.1 Scripts útiles

| Script                | Uso                                    |
| --------------------- | -------------------------------------- |
| `npm run check-types` | Validación TypeScript                  |
| `npm run lint`        | Reglas ESLint                          |
| `npm run compile`     | Check-types + lint + build con esbuild |
| `npm run watch`       | Watch de build/tsc                     |
| `npm run package`     | Build de producción                    |

### 8.2 Añadir un nuevo comando de stack

1. Añadir comando en `src/constants/index.ts` dentro del stack correspondiente.
2. Si necesita lógica especial, manejar `commandId` en `src/SidebarProvider.ts`.
3. Validar ejecución en terminal VS Code.
4. Ejecutar `npm run compile`.

### 8.3 Añadir una nueva especificación detectada

1. Extraer valor en `src/services/ProjectDetector.ts`.
2. Añadir key al `versionKeys` del stack en `src/constants/index.ts`.
3. Si requiere formato especial de render, ajustarlo en `src/ui/WebviewContent.ts`.
4. Ejecutar `npm run compile`.

### 8.4 Añadir especificación editable con lápiz

1. Renderizar botón de edición en `src/ui/WebviewContent.ts`.
2. Enviar mensaje al backend (`webview.postMessage`).
3. Gestionar mensaje y persistencia en `src/SidebarProvider.ts`.
4. Refrescar `updateProjectInfo` tras guardar.
5. Ejecutar `npm run compile`.

### 8.5 Convenciones recomendadas

- Mantener comentarios cortos y solo donde aporten contexto.
- Mantener nombres explícitos para `commandId` y claves de especificaciones.
- Evitar cambios de formato no relacionados con la funcionalidad.

## 9. Validación y calidad

Checklist recomendado antes de cerrar cambios:

1. `npm run compile` sin errores.
2. Prueba manual en Laravel e Ionic reales.
3. Confirmar que la edición de especificaciones escribe en archivo correcto.
4. Confirmar visual responsive del panel.

## 10. Troubleshooting

| Problema                          | Posible causa                                  | Acción recomendada                                    |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| No aparecen proyectos             | Estructura no detectada o fuera de profundidad | Verificar `MAX_SEARCH_DEPTH` y marcadores de proyecto |
| No se ejecutan comandos           | Ningún proyecto seleccionado                   | Seleccionar un proyecto en el panel                   |
| No aparece apiUrl en Ionic/I+C    | Línea comentada o archivo distinto al esperado | Revisar archivos de entorno y ruta                    |
| Prepare To Release falla (Ionic)  | Keystore o credenciales inválidas              | Validar alias/password y keystore correcto            |
| No detecta proyecto React Native  | Falta `react-native` o `expo` en package.json  | Verificar dependencias en package.json                |
| No detecta proyecto Ionic+Cordova | Falta `cordova` junto a `@ionic/angular`       | Verificar que `cordova` figure en las dependencias    |
| No detecta proyecto Cordova       | Falta `config.xml` o `cordova` en deps         | Verificar `config.xml` y dependencias en package.json |

## 11. Actualización para desarrolladores (Symlink)

La forma más ágil de mantener la extensión actualizada es mediante un vínculo simbólico. VS Code leerá la extensión directamente desde la carpeta del repo clonado, de modo que un simple `git pull` + recarga de ventana aplica cualquier cambio sin reinstalar nada.

### 11.1 Configuración inicial (se hace una sola vez)

**1. Eliminar la instalación actual de la extensión** (si ya está instalada):

Mac/Linux:

```bash
rm -rf ~/.vscode/extensions/undefined_publisher.myrmidon-0.0.1
```

Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force "$HOME\.vscode\extensions\undefined_publisher.myrmidon-0.0.1"
```

**2. Crear el vínculo simbólico apuntando al repo clonado:**

Mac/Linux:

```bash
ln -s /ruta/al/repo ~/.vscode/extensions/undefined_publisher.myrmidon-0.0.1
```

Windows (PowerShell como administrador):

```powershell
New-Item -ItemType Junction -Path "$HOME\.vscode\extensions\undefined_publisher.myrmidon-0.0.1" -Value "C:\ruta\al\repo"
```

**3. Recargar VS Code:**

`Ctrl+Shift+P` → `Developer: Reload Window`

### 11.2 Flujo diario de actualización

```bash
git pull
```

Después: `Ctrl+Shift+P` → `Developer: Reload Window`

**No se necesita compilar, ni instalar ningún paquete.**

### 11.3 Cuándo sí es necesario un paso extra

| Situación                                          | Acción            |
| -------------------------------------------------- | ----------------- |
| Se añaden o cambian paquetes `npm`                 | `npm install`     |
| Se edita código TypeScript sin compilar el `dist/` | `npm run compile` |

Mientras el desarrollador commitee siempre `dist/extension.js` junto a cada cambio (situación normal), los compañeros nunca necesitan compilar.

## 12. Autoría y uso

Este desarrollo fue realizado por **GassinDev** para el **uso exclusivo de la organización MYRMIDON**.

- Uso previsto: interno, operativo y evolutivo dentro de la organización.
- Cualquier distribución, reutilización o cesión externa requiere autorización explícita de MYRMIDON.
