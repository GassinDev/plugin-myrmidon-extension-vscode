"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));

// src/services/ProjectDetector.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var vscode = __toESM(require("vscode"));

// src/constants/index.ts
var MAX_SEARCH_DEPTH = 2;
var IGNORED_FOLDERS = [
  ".",
  ".git",
  ".vscode",
  ".idea",
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".next",
  "coverage"
];
var LARAVEL_CONFIG = {
  type: "laravel",
  icon: "laravel-svgrepo-com.svg",
  color: "#FF2D20",
  description: "Framework PHP para desarrollo backend. Incluye ORM Eloquent, migraciones, y autenticaci\xF3n integrada.",
  versionKeys: ["version", "laravel", "php", "phpunit", "pest", "APP_URL", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD", "min-stability", "license"],
  commands: [
    { id: "laravel-serve", label: "Serve", command: "php artisan serve --host=<IP_LOCAL> --port=8000", description: "Inicia el servidor de desarrollo con la IP local del dispositivo" },
    { id: "laravel-migrate", label: "Migrate", command: "php artisan migrate", description: "Ejecuta las migraciones" },
    { id: "laravel-tinker", label: "Tinker", command: "php artisan tinker", description: "Abre la consola interactiva" },
    { id: "laravel-optimize-clear", label: "Optimize Clear", command: "php artisan optimize:clear", description: "Limpia caches optimizadas de Laravel" },
    { id: "laravel-config-clear", label: "Config Clear", command: "php artisan config:clear", description: "Limpia cach\xE9 de configuraci\xF3n" },
    { id: "laravel-cache-clear", label: "Cache Clear", command: "php artisan cache:clear", description: "Limpia cach\xE9 de aplicaci\xF3n" }
  ]
};
var IONIC_CONFIG = {
  type: "ionic",
  icon: "ionic light logo black.svg",
  color: "#3880FF",
  description: "Framework mobile h\xEDbrido basado en Angular/React/Vue. Compila para iOS, Android y web.",
  versionKeys: ["app", "apiUrl (dev)", "apiUrl (prod)", "version", "ionic", "@ionic/angular", "@capacitor/core", "@capacitor/android", "@angular/core", "typescript", "node", "package-manager"],
  commands: [
    { id: "ionic-install-deps", label: "Instalaci\xF3n dependencias", command: "npm i", description: "Instala dependencias del proyecto" },
    { id: "ionic-build", label: "Build", command: "ionic cap build android", description: "Compila para Android" },
    { id: "ionic-sync", label: "Sync", command: "ionic cap sync", description: "Sincroniza archivos y plugins" },
    { id: "ionic-run-device", label: "Run Device", command: "ionic cap run android -l --external", description: "Ejecuta en dispositivo" },
    { id: "ionic-serve", label: "Run Web", command: "ionic serve", description: "Ejecuta en navegador" },
    {
      id: "ionic-prepare-release",
      label: "Prepare To Release",
      command: "build + sync + signed aab",
      description: "Prepara un Android App Bundle firmado para Play Store"
    }
  ]
};
var OTHER_CONFIG = {
  type: "other",
  icon: "\u{1F4E6}",
  color: "#808080",
  description: "Proyecto no identificado.",
  versionKeys: [],
  commands: []
};
var PROJECT_CONFIGS = {
  laravel: LARAVEL_CONFIG,
  ionic: IONIC_CONFIG,
  other: OTHER_CONFIG
};

// src/services/ProjectDetector.ts
var ProjectDetector = class {
  logger = console;
  /**
   * Detecta todos los proyectos en el workspace
   */
  detectProjects() {
    const projects = [];
    try {
      if (!vscode.workspace.workspaceFolders) {
        this.logger.log("No workspace folders found");
        return projects;
      }
      for (const folder of vscode.workspace.workspaceFolders) {
        const folderPath = folder.uri.fsPath;
        const folderName = path.basename(folderPath);
        const projectType = this.detectProjectType(folderPath);
        if (projectType) {
          projects.push({
            name: folderName,
            type: projectType,
            path: folderPath,
            versions: this.extractVersions(folderPath, projectType)
          });
        } else {
          projects.push(...this.exploreDirectory(folderPath));
        }
      }
    } catch (error) {
      this.logger.error("Error detecting projects:", error);
    }
    return projects;
  }
  /**
   * Detecta el tipo de un proyecto
   */
  detectProjectType(folderPath) {
    try {
      if (this.hasLaravelMarkers(folderPath)) {
        return "laravel";
      }
      if (this.hasIonicMarkers(folderPath)) {
        return "ionic";
      }
    } catch (error) {
      this.logger.error(`Error detecting project type in ${folderPath}:`, error);
    }
    return null;
  }
  /**
   * Verifica si una carpeta es un proyecto Laravel
   */
  hasLaravelMarkers(folderPath) {
    try {
      const composerPath = path.join(folderPath, "composer.json");
      if (!fs.existsSync(composerPath)) {
        return false;
      }
      const content = fs.readFileSync(composerPath, "utf8");
      const composerJson = JSON.parse(content);
      return !!(composerJson?.require?.["laravel/framework"] || composerJson?.requireDev?.["laravel/framework"]);
    } catch (error) {
      this.logger.debug(`Error checking Laravel markers in ${folderPath}:`, error);
    }
    return false;
  }
  /**
   * Verifica si una carpeta es un proyecto Ionic
   */
  hasIonicMarkers(folderPath) {
    try {
      const packagePath = path.join(folderPath, "package.json");
      if (!fs.existsSync(packagePath)) {
        return false;
      }
      const content = fs.readFileSync(packagePath, "utf8");
      const packageJson = JSON.parse(content);
      const dependencies = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };
      return !!(dependencies["@ionic/angular"] || dependencies["@ionic/core"] || dependencies["@capacitor/core"] || dependencies["ionic"]);
    } catch (error) {
      this.logger.debug(`Error checking Ionic markers in ${folderPath}:`, error);
    }
    return false;
  }
  /**
   * Explora recursivamente un directorio buscando proyectos
   */
  exploreDirectory(dirPath, maxDepth = MAX_SEARCH_DEPTH, currentDepth = 0) {
    const projects = [];
    if (currentDepth > maxDepth) {
      return projects;
    }
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (IGNORED_FOLDERS.includes(entry.name) || entry.name.startsWith(".")) {
          continue;
        }
        if (entry.isDirectory()) {
          const subPath = path.join(dirPath, entry.name);
          const projectType = this.detectProjectType(subPath);
          if (projectType) {
            projects.push({
              name: entry.name,
              type: projectType,
              path: subPath,
              versions: this.extractVersions(subPath, projectType)
            });
          } else if (currentDepth < maxDepth) {
            projects.push(...this.exploreDirectory(subPath, maxDepth, currentDepth + 1));
          }
        }
      }
    } catch (error) {
      this.logger.debug(`Error exploring directory ${dirPath}:`, error);
    }
    return projects;
  }
  /**
   * Extrae versiones de dependencias de un proyecto
   */
  extractVersions(folderPath, projectType) {
    const versions = {};
    try {
      if (projectType === "laravel") {
        const composerPath = path.join(folderPath, "composer.json");
        if (fs.existsSync(composerPath)) {
          const content = fs.readFileSync(composerPath, "utf8");
          const composerJson = JSON.parse(content);
          if (composerJson.version) {
            versions["version"] = composerJson.version;
          }
          if (composerJson["minimum-stability"]) {
            versions["min-stability"] = composerJson["minimum-stability"];
          }
          if (composerJson.license) {
            versions["license"] = Array.isArray(composerJson.license) ? composerJson.license.join(", ") : String(composerJson.license);
          }
          if (composerJson.require) {
            if (composerJson.require["laravel/framework"]) {
              versions["laravel"] = composerJson.require["laravel/framework"];
            }
            if (composerJson.require["php"]) {
              versions["php"] = composerJson.require["php"];
            }
          }
          if (composerJson.requireDev) {
            if (composerJson.requireDev["phpunit/phpunit"]) {
              versions["phpunit"] = composerJson.requireDev["phpunit/phpunit"];
            }
            if (composerJson.requireDev["pestphp/pest"]) {
              versions["pest"] = composerJson.requireDev["pestphp/pest"];
            }
          }
        }
        const envPath = path.join(folderPath, ".env");
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf8");
          const envLines = envContent.split(/\r?\n/);
          const envKeys = ["APP_URL", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"];
          envKeys.forEach((envKey) => {
            const envLine = envLines.find((line) => line.trim().startsWith(`${envKey}=`));
            if (!envLine) {
              return;
            }
            const rawValue = envLine.split("=").slice(1).join("=").trim();
            const cleanedValue = rawValue.replace(/^['"]|['"]$/g, "");
            if (envKey === "APP_URL") {
              if (cleanedValue) {
                versions[envKey] = cleanedValue;
              }
              return;
            }
            versions[envKey] = cleanedValue;
          });
        }
      } else if (projectType === "ionic") {
        const packagePath = path.join(folderPath, "package.json");
        if (fs.existsSync(packagePath)) {
          const content = fs.readFileSync(packagePath, "utf8");
          const packageJson = JSON.parse(content);
          const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
          const capacitorConfigPath = path.join(folderPath, "capacitor.config.json");
          if (fs.existsSync(capacitorConfigPath)) {
            try {
              const capacitorContent = fs.readFileSync(capacitorConfigPath, "utf8");
              const capacitorConfig = JSON.parse(capacitorContent);
              if (capacitorConfig?.appName) {
                versions["app"] = String(capacitorConfig.appName);
              }
            } catch (error) {
              this.logger.debug(`Error parsing capacitor config at ${capacitorConfigPath}:`, error);
            }
          }
          if (packageJson.version) {
            versions["version"] = packageJson.version;
          }
          if (packageJson.engines?.node) {
            versions["node"] = packageJson.engines.node;
          }
          if (packageJson.packageManager) {
            versions["package-manager"] = packageJson.packageManager;
          }
          if (dependencies["ionic"]) {
            versions["ionic"] = dependencies["ionic"];
          }
          if (dependencies["@ionic/angular"]) {
            versions["@ionic/angular"] = dependencies["@ionic/angular"];
          }
          if (dependencies["@capacitor/core"]) {
            versions["@capacitor/core"] = dependencies["@capacitor/core"];
          }
          if (dependencies["@capacitor/android"]) {
            versions["@capacitor/android"] = dependencies["@capacitor/android"];
          }
          if (dependencies["@angular/core"]) {
            versions["@angular/core"] = dependencies["@angular/core"];
          }
          if (dependencies["typescript"]) {
            versions["typescript"] = dependencies["typescript"];
          }
        }
        const apiUrlDev = this.readIonicApiUrl(folderPath, [
          path.join("src", "environments", "environment.ts"),
          path.join("src", "enviroments.ts"),
          "enviroments.ts",
          "environments.ts"
        ]);
        if (apiUrlDev) {
          versions["apiUrl (dev)"] = apiUrlDev;
        }
        const apiUrlProd = this.readIonicApiUrl(folderPath, [
          path.join("src", "environments", "environment.prod.ts"),
          path.join("src", "enviroments.prod.ts"),
          "enviroments.prod.ts",
          "environments.prod.ts"
        ]);
        if (apiUrlProd) {
          versions["apiUrl (prod)"] = apiUrlProd;
        }
      }
    } catch (error) {
      this.logger.debug(`Error extracting versions from ${folderPath}:`, error);
    }
    return versions;
  }
  /**
   * Lee apiUrl desde un archivo de entorno Ionic
   */
  readIonicApiUrl(projectPath, relativeCandidates) {
    for (const relativePath of relativeCandidates) {
      const absolutePath = path.join(projectPath, relativePath);
      if (!fs.existsSync(absolutePath)) {
        continue;
      }
      try {
        const content = fs.readFileSync(absolutePath, "utf8");
        const parsedValue = this.parseApiUrlFromTypescript(content);
        if (parsedValue) {
          return parsedValue;
        }
      } catch (error) {
        this.logger.debug(`Error reading Ionic apiUrl from ${absolutePath}:`, error);
      }
    }
    return null;
  }
  /**
   * Extrae apiUrl de contenido TypeScript con sintaxis objeto o asignacion
   */
  parseApiUrlFromTypescript(content) {
    const lines = content.split(/\r?\n/);
    let insideBlockComment = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!insideBlockComment && trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) {
          insideBlockComment = true;
        }
        continue;
      }
      if (insideBlockComment) {
        if (trimmed.includes("*/")) {
          insideBlockComment = false;
        }
        continue;
      }
      if (trimmed.startsWith("//")) {
        continue;
      }
      const objectStyleMatch = line.match(/\bapiUrl\s*:\s*['"`]([^'"`]+)['"`]/);
      if (objectStyleMatch?.[1]) {
        return objectStyleMatch[1].trim();
      }
      const assignmentStyleMatch = line.match(/\bapiUrl\s*=\s*['"`]([^'"`]+)['"`]/);
      if (assignmentStyleMatch?.[1]) {
        return assignmentStyleMatch[1].trim();
      }
    }
    return null;
  }
};

// src/SidebarProvider.ts
var vscode2 = __toESM(require("vscode"));
var fs2 = __toESM(require("fs"));
var os = __toESM(require("os"));
var path2 = __toESM(require("path"));
var import_child_process = require("child_process");

// src/ui/WebviewContent.ts
var WebviewContent = class {
  /**
   * Genera el HTML completo del webview
   */
  static generate(projects, terminals = [], extensionUri, webview) {
    const projectsHtml = this.generateProjectOptions(projects);
    const terminalsHtml = this.generateTerminalOptions(terminals);
    const projectTypeIcons = this.generateProjectTypeLegend(extensionUri, webview);
    const projectInfoSections = this.generateProjectInfoSections(extensionUri, webview);
    const versionKeyMap = this.getVersionKeyMap();
    const styles = this.getStyles();
    const scripts = this.getScripts(versionKeyMap);
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${styles}
    </style>
</head>
<body>
    <div class="container">
        <!-- T\xEDtulo -->
        <header class="extension-header">
            <h1 class="extension-title">MYRMIDON</h1>
        </header>

        <!-- Selector de terminal -->
        <div class="terminal-selector-wrapper">
            <label for="terminalSelect" class="terminal-label">\u{1F5A5}\uFE0F TERMINAL</label>
            <select class="terminal-select" id="terminalSelect" onchange="selectTerminal()">
                <option value="">Selecciona una terminal...</option>
                ${terminalsHtml}
            </select>
            <span class="terminal-status" id="terminalStatus"></span>
            <div class="terminal-hint">
                <small>\u{1F4A1} Terminal externa: Se abrir\xE1 el terminal configurado en VS Code. El comando se copiar\xE1 autom\xE1ticamente.</small>
            </div>
            <div class="runtime-status-wrapper" id="runtimeStatusWrapper" hidden>
                <span class="runtime-status-title">EJECUCIONES ACTIVAS</span>
                <div class="runtime-status-list" id="runtimeStatusList"></div>
            </div>
        </div>

        <!-- Selector de proyectos -->
        <div class="projects-container">
                        <div class="project-selector-wrapper">
                            <div class="project-selector-header">
                                <label for="projectSelect" class="terminal-label">PROYECTO</label>
                                ${projectTypeIcons}
                            </div>
                <select class="project-select" id="projectSelect" onchange="selectProject()">
                                <option value="">Selecciona un proyecto...</option>
                    ${projectsHtml}
                </select>

                <div class="project-quick-tools" id="projectQuickTools" data-active="false">
                    <div class="project-quick-header">
                        <span class="project-quick-title">UTILIDADES R\xC1PIDAS</span>
                        <span class="project-quick-current" id="quickProjectName">Sin proyecto</span>
                    </div>
                    <div class="project-quick-grid">
                        <button type="button" class="project-quick-btn" data-project-action="open-folder" onclick="projectQuickAction('open-folder')" disabled>\u{1F4C1} Abrir carpeta</button>
                        <button type="button" class="project-quick-btn" data-project-action="copy-path" onclick="projectQuickAction('copy-path')" disabled>\u{1F4CB} Copiar ruta</button>
                        <button type="button" class="project-quick-btn" data-project-action="open-key-file" onclick="projectQuickAction('open-key-file')" disabled>\u{1F9E9} Archivo clave</button>
                        <button type="button" class="project-quick-btn" data-project-action="open-project-terminal" onclick="projectQuickAction('open-project-terminal')" disabled>\u{1F5A5}\uFE0F Terminal proyecto</button>
                    </div>
                </div>
            </div>

            <!-- Secci\xF3n de funciones y especificaciones -->
            <div class="project-info-wrapper">
                ${projectInfoSections}
            </div>
        </div>
    </div>

    <script>
        ${scripts}
    </script>
</body>
</html>
		`;
  }
  /**
   * Genera las opciones del selector de terminales
   */
  static generateTerminalOptions(terminals) {
    if (!terminals || terminals.length === 0) {
      return `
                <optgroup label="VS Code">
                    <option value="vscode:new">+ Crear nueva terminal</option>
                </optgroup>
                <optgroup label="Externa">
                    <option value="external:native">\u{1F5A5}\uFE0F Terminal Externa</option>
                </optgroup>
            `;
    }
    const vsCodeTerminals = terminals.filter((t) => t.type === "vscode").map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    const externalTerminals = terminals.filter((t) => t.type === "external").map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    return `
            <optgroup label="VS Code">
                ${vsCodeTerminals}
                <option value="vscode:new">+ Crear nueva terminal</option>
            </optgroup>
            <optgroup label="Externa">
                ${externalTerminals}
                <option value="external:native">\u{1F5A5}\uFE0F Terminal Externa</option>
            </optgroup>
        `;
  }
  /**
   * Genera las opciones del selector de proyectos
   */
  static generateProjectOptions(projects) {
    return projects.map((project) => {
      return `<option value="${project.name}" data-type="${project.type}">${project.name}</option>`;
    }).join("");
  }
  /**
   * Genera la leyenda pequeña de stacks al lado del selector
   */
  static generateProjectTypeLegend(extensionUri, webview) {
    const ionicIcon = this.getMediaUri(PROJECT_CONFIGS.ionic.icon, extensionUri, webview);
    const laravelIcon = this.getMediaUri(PROJECT_CONFIGS.laravel.icon, extensionUri, webview);
    return `
            <div class="project-type-icons" aria-hidden="true">
                <span class="type-icon-chip" title="Ionic">
                    <img src="${ionicIcon}" alt="Ionic" class="type-icon" />
                </span>
                <span class="type-icon-chip" title="Laravel">
                    <img src="${laravelIcon}" alt="Laravel" class="type-icon" />
                </span>
            </div>
        `;
  }
  /**
   * Resuelve ruta de media para webview
   */
  static getMediaUri(fileName, extensionUri, webview) {
    if (extensionUri && webview) {
      const mediaUri = extensionUri.with({ path: `${extensionUri.path}/media/${fileName}` });
      return String(webview.asWebviewUri(mediaUri));
    }
    return `../media/${fileName}`;
  }
  /**
   * Mapa de orden recomendado para especificaciones por tipo de proyecto
   */
  static getVersionKeyMap() {
    const versionKeyMap = {};
    Object.entries(PROJECT_CONFIGS).forEach(([type, config]) => {
      versionKeyMap[type] = config.versionKeys || [];
    });
    return versionKeyMap;
  }
  /**
   * Genera las secciones de información de cada tipo de proyecto
   */
  static generateProjectInfoSections(extensionUri, webview) {
    return ["laravel", "ionic", "other"].map((type) => {
      const config = PROJECT_CONFIGS[type];
      const versionsHtml = this.generateVersionsHtml(config);
      const commandsHtml = this.generateCommandsHtml(config);
      const healthHtml = this.generateProjectHealthHtml(type);
      const liveLogsHtml = this.generateLiveLogsHtml(type);
      const appLogoHtml = type === "ionic" ? this.generateIonicLogoHtml() : "";
      const iconUrl = config.icon.includes(".svg") ? this.getMediaUri(config.icon, extensionUri, webview) : null;
      const isEmoji = !config.icon.includes(".svg");
      return `
                    <div class="project-info" id="${type}Info">
                        <div class="project-header">
                            <div class="project-icon-container">
                                ${isEmoji ? `<span class="project-icon">${config.icon}</span>` : `<img src="${iconUrl}" alt="${type}" class="project-icon-large" />`}
                            </div>
                            <div class="project-header-info">
                                <h3 class="project-name" id="projectName${this.capitalize(type)}"></h3>
                                <p class="project-type">${type.toUpperCase()}</p>
                            </div>
                        </div>
                        
                        <div class="project-description">${config.description}</div>
                        
                        ${commandsHtml ? `<div class="project-functions">${commandsHtml}</div>` : ""}

                        ${healthHtml}
                        
                        ${versionsHtml ? `<div class="project-specifications">${appLogoHtml}${versionsHtml}</div>` : ""}

                        ${liveLogsHtml}
                        
                        <div class="project-path-info">
                            <span class="path-label">Ubicaci\xF3n:</span>
                            <code class="project-path" id="projectPath${this.capitalize(type)}"></code>
                        </div>
                    </div>
                `;
    }).join("");
  }
  /**
   * Genera bloque de salud del proyecto
   */
  static generateProjectHealthHtml(type) {
    const capType = this.capitalize(type);
    return `
            <div class="project-health-section">
                <h4 class="section-heading">SALUD DEL PROYECTO</h4>
                <div class="health-summary health-ok" id="healthSummary${capType}">
                    Esperando validaci\xF3n...
                </div>
                <div class="health-checks-grid" id="healthChecks${capType}"></div>
            </div>
        `;
  }
  /**
   * Genera bloque de logs en vivo
   */
  static generateLiveLogsHtml(type) {
    const capType = this.capitalize(type);
    return `
            <div class="project-live-logs-section">
                <h4 class="section-heading">LOGS EN VIVO</h4>
                <div class="live-logs-toolbar">
                    <div class="live-logs-filters">
                        <button type="button" class="live-log-filter-btn active" data-log-type="${type}" data-log-filter="all" onclick="setLogsFilter('${type}', 'all')">All</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${type}" data-log-filter="info" onclick="setLogsFilter('${type}', 'info')">Info</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${type}" data-log-filter="warning" onclick="setLogsFilter('${type}', 'warning')">Warn</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${type}" data-log-filter="error" onclick="setLogsFilter('${type}', 'error')">Error</button>
                    </div>
                    <button type="button" class="live-log-clear-btn" onclick="clearLiveLogs('${type}')">Limpiar</button>
                </div>
                <div class="live-logs-list" id="liveLogsList${capType}">
                    <div class="live-log-empty">Sin logs por ahora</div>
                </div>
            </div>
        `;
  }
  /**
   * Genera el HTML para mostrar comandos/funciones
   */
  static generateCommandsHtml(config) {
    if (!config.commands || config.commands.length === 0) {
      return "";
    }
    return `
            <div class="commands-section">
                <h4 class="section-heading">FUNCIONES</h4>
                <div class="commands-grid">
                    ${config.commands.map((cmd) => {
      const escapedCommand = cmd.command.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const showCopyButton = cmd.id !== "ionic-prepare-release";
      return `
                            <div class="command-card" title="${cmd.description}">
                                <div class="command-top-row">
                                    <button type="button" class="command-run-btn" onclick="executeCommand('${cmd.id}', '${escapedCommand}')">
                                        <span class="command-label">${cmd.label}</span>
                                    </button>
                                    ${showCopyButton ? `<button type="button" class="command-copy-btn" title="Copiar comando" aria-label="Copiar comando" onclick="copyCommand(event, '${cmd.id}', '${escapedCommand}')">\u{1F4CB}</button>` : ""}
                                </div>
                                <code class="command-code">${cmd.command}</code>
                            </div>
                        `;
    }).join("")}
                </div>
            </div>
        `;
  }
  /**
   * Genera el HTML para mostrar versiones/especificaciones
   */
  static generateVersionsHtml(config) {
    if (!config.versionKeys || config.versionKeys.length === 0) {
      return "";
    }
    return `
            <div class="specifications-section">
                <h4 class="section-heading">ESPECIFICACIONES</h4>
                <div class="versions-grid" id="versions${this.capitalize(config.type)}">
                    <!-- Se rellena din\xE1micamente con JavaScript -->
                </div>
            </div>
        `;
  }
  /**
   * Genera el bloque visual para el logo de la app Ionic
   */
  static generateIonicLogoHtml() {
    return `
            <div class="app-logo-section" id="appLogoSectionIonic">
                <div class="app-logo-header">LOGO ACTUAL DE LA APP</div>
                <div class="app-logo-preview">
                    <img id="appLogoIonic" class="app-logo-image" alt="Logo de la app" />
                    <span id="appLogoIonicEmpty" class="app-logo-empty">No se detect\xF3 logo del proyecto</span>
                </div>
            </div>
        `;
  }
  /**
   * Obtiene los estilos CSS
   */
  static getStyles() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
            background: transparent;
            font-size: 12px;
            line-height: 1.5;
        }

        .container {
            padding: 14px;
            display: flex;
            flex-direction: column;
            height: 100%;
            gap: 12px;
        }

        /* Encabezado de extensi\xF3n */
        .extension-header {
            border: 1px solid var(--vscode-widget-border);
            background: linear-gradient(135deg, var(--vscode-editor-background), var(--vscode-sideBar-background));
            border-radius: 10px;
            padding: 10px 12px;
        }

        .extension-title {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: var(--vscode-foreground);
            margin: 0;
        }

        .projects-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex: 1;
            min-height: 0;
        }

        /* Selector de terminal */
        .terminal-selector-wrapper {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 10px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 10px;
            background: var(--vscode-editor-background);
        }

        .terminal-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }

        .project-selector-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        }

        .project-type-icons {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .type-icon-chip {
            width: 22px;
            height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 999px;
            background: var(--vscode-input-background);
        }

        .type-icon {
            width: 14px;
            height: 14px;
            object-fit: contain;
        }

        .terminal-select {
            width: 100%;
            padding: 8px 10px;
            border: 2px solid var(--vscode-inputBorder);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            font-family: var(--vscode-font-family);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .terminal-select:hover {
            border-color: var(--vscode-focusBorder);
        }

        .terminal-select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
            opacity: 0.5;
        }

        .terminal-status {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            opacity: 0.7;
        }

        .terminal-status.selected {
            color: var(--vscode-chart-green);
            opacity: 1;
            font-weight: 600;
        }

        .terminal-hint {
            padding: 8px 10px;
            background: var(--vscode-editor-background);
            border-left: 3px solid var(--vscode-chart-blue);
            border-radius: 3px;
            font-size: 10px;
            line-height: 1.4;
            color: var(--vscode-descriptionForeground);
        }

        .terminal-hint code {
            background: var(--vscode-input-background);
            padding: 2px 4px;
            border-radius: 2px;
            font-family: monospace;
            font-size: 9px;
        }

        .runtime-status-wrapper {
            margin-top: 2px;
            padding: 8px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .runtime-status-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }

        .runtime-status-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .runtime-run-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 8px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
        }

        .runtime-run-main {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .runtime-run-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #2ecc71;
            box-shadow: 0 0 8px rgba(46, 204, 113, 0.6);
            animation: runtimePulse 1.9s ease-in-out infinite;
            flex-shrink: 0;
        }

        .runtime-run-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-foreground);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .runtime-stop-btn {
            width: 24px;
            height: 24px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            line-height: 1;
            cursor: pointer;
            flex-shrink: 0;
        }

        .runtime-stop-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-focusBorder);
            color: var(--vscode-errorForeground);
        }

        @keyframes runtimePulse {
            0%,
            100% {
                opacity: 0.45;
                transform: scale(1);
            }
            50% {
                opacity: 1;
                transform: scale(1.08);
            }
        }

        /* Selector de proyectos */
        .project-selector-wrapper {
            flex-shrink: 0;
            padding: 10px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 10px;
            background: var(--vscode-editor-background);
        }

        .project-select {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid var(--vscode-inputBorder);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            font-family: var(--vscode-font-family);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .project-select:hover {
            border-color: var(--vscode-focusBorder);
        }

        .project-select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
            opacity: 0.5;
        }

        .project-quick-tools {
            margin-top: 10px;
            padding: 10px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            background: var(--vscode-input-background);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .project-quick-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .project-quick-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
        }

        .project-quick-current {
            font-size: 10px;
            font-weight: 600;
            color: var(--vscode-foreground);
            max-width: 60%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: right;
        }

        .project-quick-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
        }

        .project-quick-btn {
            border: 1px solid var(--vscode-widget-border);
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border-radius: 4px;
            padding: 7px 8px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s ease;
        }

        .project-quick-btn:hover:not(:disabled) {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-button-hoverBackground);
        }

        .project-quick-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .project-quick-tools[data-active="true"] {
            border-color: var(--vscode-focusBorder);
        }

        /* Informaci\xF3n del proyecto */
        .project-info-wrapper {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }

        .project-info {
            background: linear-gradient(145deg, var(--vscode-editor-background), var(--vscode-editorGroupHeader-tabsBackground));
            border: 1px solid var(--vscode-widget-border);
            border-radius: 10px;
            padding: 14px;
            display: none;
            animation: slideIn 0.22s ease;
        }

        .project-info.active {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Header del proyecto */
        .project-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }

        .project-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            background: var(--vscode-editor-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-widget-border);
        }

        .project-icon {
            font-size: 32px;
            line-height: 1;
        }

        .project-icon-large {
            width: 40px;
            height: 40px;
            object-fit: contain;
        }

        .project-header-info {
            flex: 1;
        }

        .project-name {
            font-size: 15px;
            font-weight: 600;
            margin-bottom: 2px;
            color: var(--vscode-foreground);
            line-height: 1.2;
        }

        .project-type {
            font-size: 11px;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }

        /* Descripci\xF3n */
        .project-description {
            font-size: 12px;
            opacity: 0.85;
            line-height: 1.5;
            color: var(--vscode-descriptionForeground);
        }

        /* Secciones generales */
        .section-heading {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 8px;
        }

        /* Funciones/Comandos */
        .project-functions {
            background: var(--vscode-input-background);
            border-radius: 6px;
            padding: 12px;
            border: 1px solid var(--vscode-widget-border);
        }

        .project-health-section {
            background: var(--vscode-input-background);
            border-radius: 6px;
            padding: 12px;
            border: 1px solid var(--vscode-widget-border);
        }

        .health-summary {
            border-radius: 5px;
            padding: 8px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
            border: 1px solid transparent;
        }

        .health-summary.health-ok {
            background: color-mix(in srgb, var(--vscode-terminal-ansiGreen), transparent 88%);
            border-color: color-mix(in srgb, var(--vscode-terminal-ansiGreen), transparent 60%);
        }

        .health-summary.health-warn {
            background: color-mix(in srgb, var(--vscode-terminal-ansiYellow), transparent 88%);
            border-color: color-mix(in srgb, var(--vscode-terminal-ansiYellow), transparent 60%);
        }

        .health-summary.health-error {
            background: color-mix(in srgb, var(--vscode-errorForeground), transparent 90%);
            border-color: color-mix(in srgb, var(--vscode-errorForeground), transparent 55%);
        }

        .health-checks-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
        }

        .health-check-item {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 5px;
            background: var(--vscode-editor-background);
            padding: 8px;
        }

        .health-check-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }

        .health-check-detail {
            font-size: 11px;
            color: var(--vscode-foreground);
            line-height: 1.4;
        }

        .health-check-item[data-health-status="ok"] {
            border-left: 3px solid var(--vscode-terminal-ansiGreen);
        }

        .health-check-item[data-health-status="warn"] {
            border-left: 3px solid var(--vscode-terminal-ansiYellow);
        }

        .health-check-item[data-health-status="error"] {
            border-left: 3px solid var(--vscode-errorForeground);
        }

        .commands-section {
            margin-bottom: 12px;
        }

        .commands-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
        }

        .command-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 10px;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .command-card:hover {
            background: var(--vscode-button-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }

        .command-top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .command-run-btn {
            appearance: none;
            border: none;
            background: transparent;
            color: inherit;
            padding: 0;
            text-align: left;
            cursor: pointer;
            flex: 1;
            min-width: 0;
        }

        .command-copy-btn {
            width: 24px;
            height: 24px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            line-height: 1;
            flex-shrink: 0;
        }

        .command-copy-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-focusBorder);
        }

        .command-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .command-code {
            font-size: 10px;
            font-family: monospace;
            background: var(--vscode-input-background);
            padding: 4px 6px;
            border-radius: 3px;
            color: var(--vscode-descriptionForeground);
            word-break: break-all;
        }

        /* Especificaciones/Versiones */
        .project-specifications {
            background: var(--vscode-input-background);
            border-radius: 6px;
            padding: 12px;
            border: 1px solid var(--vscode-widget-border);
        }

        .project-live-logs-section {
            background: var(--vscode-input-background);
            border-radius: 6px;
            padding: 12px;
            border: 1px solid var(--vscode-widget-border);
        }

        .live-logs-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
        }

        .live-logs-filters {
            display: inline-flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .live-log-filter-btn,
        .live-log-clear-btn {
            border: 1px solid var(--vscode-widget-border);
            background: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
        }

        .live-log-filter-btn.active {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-button-secondaryBackground);
        }

        .live-log-filter-btn:hover,
        .live-log-clear-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-focusBorder);
        }

        .live-logs-list {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 5px;
            background: var(--vscode-editor-background);
            max-height: 190px;
            overflow-y: auto;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .live-log-row {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 6px;
            background: var(--vscode-input-background);
            font-size: 10px;
            line-height: 1.35;
        }

        .live-log-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 4px;
            color: var(--vscode-descriptionForeground);
        }

        .live-log-source {
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-size: 9px;
        }

        .live-log-message {
            color: var(--vscode-foreground);
            font-family: monospace;
            word-break: break-word;
            white-space: pre-wrap;
        }

        .live-log-row[data-log-level="info"] {
            border-left: 3px solid var(--vscode-terminal-ansiBlue);
        }

        .live-log-row[data-log-level="warning"] {
            border-left: 3px solid var(--vscode-terminal-ansiYellow);
        }

        .live-log-row[data-log-level="error"] {
            border-left: 3px solid var(--vscode-errorForeground);
        }

        .live-log-empty {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
            padding: 8px;
        }

        .specifications-section {
            margin-bottom: 12px;
        }

        .app-logo-section {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 12px;
            background: var(--vscode-editor-background);
        }

        .app-logo-header {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.7px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 8px;
        }

        .app-logo-preview {
            width: 100%;
            min-height: 96px;
            border: 1px dashed var(--vscode-widget-border);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--vscode-input-background);
        }

        .app-logo-image {
            width: 84px;
            height: 84px;
            object-fit: contain;
            display: none;
        }

        .app-logo-empty {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            opacity: 0.8;
            text-align: center;
            padding: 0 8px;
        }

        .versions-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        @media (max-width: 560px) {
            .container {
                padding: 10px;
                gap: 10px;
            }

            .commands-grid,
            .versions-grid,
            .health-checks-grid,
            .project-quick-grid {
                grid-template-columns: 1fr;
            }

            .live-logs-toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .project-icon-container {
                width: 40px;
                height: 40px;
            }

            .project-icon-large {
                width: 30px;
                height: 30px;
            }
        }

        .version-item {
            background: var(--vscode-editor-background);
            border-radius: 4px;
            padding: 8px;
            border: 1px solid var(--vscode-widget-border);
        }

        .app-url-item {
            grid-column: 1 / -1;
        }

        .db-connection-item {
            grid-column: 1 / -1;
        }

        .db-connection-title {
            margin-bottom: 8px;
        }

        .db-connection-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 8px;
        }

        .db-connection-entry {
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 8px;
        }

        .app-url-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .app-url-value {
            flex: 1;
            min-width: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .app-url-edit-btn {
            width: 24px;
            height: 24px;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 12px;
            line-height: 1;
            flex-shrink: 0;
        }

        .app-url-edit-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-focusBorder);
        }

        @media (max-width: 720px) {
            .db-connection-grid {
                grid-template-columns: 1fr;
            }

            .ionic-api-row {
                align-items: flex-start;
            }

            .ionic-api-value {
                white-space: normal;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                line-height: 1.25;
                max-height: calc(1.25em * 2);
                word-break: break-all;
            }
        }

        .version-key {
            font-size: 10px;
            opacity: 0.6;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 3px;
            display: block;
            color: var(--vscode-descriptionForeground);
        }

        .version-value {
            font-size: 11px;
            font-weight: 600;
            font-family: monospace;
            color: var(--vscode-foreground);
            word-break: break-all;
        }

        /* Ubicaci\xF3n del proyecto */
        .project-path-info {
            margin-top: 8px;
            font-size: 11px;
        }

        .path-label {
            opacity: 0.6;
            display: block;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .project-path {
            display: block;
            background: var(--vscode-input-background);
            border-radius: 4px;
            padding: 6px 8px;
            border: 1px solid var(--vscode-widget-border);
            font-family: 'Courier New', monospace;
            font-size: 10px;
            opacity: 0.75;
            word-break: break-all;
            margin-top: 4px;
        }

        /* Scrollbar personalizada */
        .project-info-wrapper::-webkit-scrollbar {
            width: 8px;
        }

        .project-info-wrapper::-webkit-scrollbar-track {
            background: transparent;
        }

        .project-info-wrapper::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbar-shadow);
            border-radius: 4px;
        }

        .project-info-wrapper::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-widget-border);
        }
        `;
  }
  /**
   * Obtiene el código JavaScript
   */
  static getScripts(versionKeyMap) {
    return `
        const vscode = acquireVsCodeApi();
        const VERSION_KEY_MAP = ${JSON.stringify(versionKeyMap)};
        const persistedState = vscode.getState() || {};
        let selectedTerminal = typeof persistedState.selectedTerminal === 'string'
            ? persistedState.selectedTerminal
            : null;
        let selectedProjectName = typeof persistedState.selectedProjectName === 'string'
            ? persistedState.selectedProjectName
            : '';
        const liveLogsByType = {
            laravel: [],
            ionic: [],
            other: []
        };
        const liveLogsFilterByType = {
            laravel: 'all',
            ionic: 'all',
            other: 'all'
        };

        function capitalize(value) {
            return String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1);
        }

        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function persistUiState() {
            vscode.setState({
                selectedTerminal,
                selectedProjectName
            });
        }

        function updateProjectQuickToolsState() {
            const quickTools = document.getElementById('projectQuickTools');
            const quickProjectName = document.getElementById('quickProjectName');
            const quickButtons = document.querySelectorAll('.project-quick-btn');
            const hasProject = Boolean(selectedProjectName);

            if (quickTools) {
                quickTools.setAttribute('data-active', hasProject ? 'true' : 'false');
            }

            if (quickProjectName) {
                quickProjectName.textContent = hasProject ? selectedProjectName : 'Sin proyecto';
            }

            quickButtons.forEach((button) => {
                button.disabled = !hasProject;
            });
        }

        function projectQuickAction(action) {
            if (!selectedProjectName) {
                alert('Selecciona un proyecto primero');
                const projectSelect = document.getElementById('projectSelect');
                if (projectSelect) {
                    projectSelect.focus();
                }
                return;
            }

            vscode.postMessage({
                command: 'projectQuickAction',
                action,
                projectName: selectedProjectName
            });
        }

        function setLogsFilter(projectType, level) {
            liveLogsFilterByType[projectType] = level;

            document
                .querySelectorAll('.live-log-filter-btn[data-log-type="' + projectType + '"]')
                .forEach((button) => {
                    const matches = button.getAttribute('data-log-filter') === level;
                    button.classList.toggle('active', matches);
                });

            renderLiveLogs(projectType);
        }

        function clearLiveLogs(projectType) {
            if (selectedProjectName) {
                vscode.postMessage({
                    command: 'clearLiveLogs',
                    projectType
                });
            }

            liveLogsByType[projectType] = [];
            renderLiveLogs(projectType);
        }

        function renderProjectHealth(projectType, health) {
            if (!projectType || !health) {
                return;
            }

            const capType = capitalize(projectType);
            const summaryEl = document.getElementById('healthSummary' + capType);
            const checksEl = document.getElementById('healthChecks' + capType);

            if (!summaryEl || !checksEl) {
                return;
            }

            const status = health.overallStatus || 'ok';
            const summary = health.summary || 'Sin datos de salud';
            summaryEl.className = 'health-summary health-' + status;
            summaryEl.textContent = summary;

            const checks = Array.isArray(health.checks) ? health.checks : [];
            checksEl.innerHTML = checks
                .map((check) => {
                    const checkStatus = check.status || 'warn';
                    const label = escapeHtml(check.label || 'Check');
                    const detail = escapeHtml(check.detail || 'Sin detalle');

                    return '<div class="health-check-item" data-health-status="' + checkStatus + '">'
                        + '<div class="health-check-title">' + label + '</div>'
                        + '<div class="health-check-detail">' + detail + '</div>'
                        + '</div>';
                })
                .join('');

            if (!checks.length) {
                checksEl.innerHTML = '<div class="health-check-item" data-health-status="warn"><div class="health-check-detail">Sin checks disponibles</div></div>';
            }
        }

        function renderLiveLogs(projectType) {
            const capType = capitalize(projectType);
            const listEl = document.getElementById('liveLogsList' + capType);
            if (!listEl) {
                return;
            }

            const entries = Array.isArray(liveLogsByType[projectType]) ? liveLogsByType[projectType] : [];
            const activeFilter = liveLogsFilterByType[projectType] || 'all';

            const visibleEntries = activeFilter === 'all'
                ? entries
                : entries.filter(entry => entry.level === activeFilter);

            if (!visibleEntries.length) {
                listEl.innerHTML = '<div class="live-log-empty">Sin logs para este filtro</div>';
                return;
            }

            listEl.innerHTML = visibleEntries
                .map((entry) => {
                    const safeSource = escapeHtml(entry.source || 'Log');
                    const safeMessage = escapeHtml(entry.message || '');
                    const safeLevel = escapeHtml(entry.level || 'info');
                    const date = new Date(entry.timestamp || Date.now());
                    const timeText = Number.isNaN(date.getTime())
                        ? '--:--:--'
                        : date.toLocaleTimeString('es-ES', { hour12: false });

                    return '<div class="live-log-row" data-log-level="' + safeLevel + '">'
                        + '<div class="live-log-meta">'
                        + '<span class="live-log-source">' + safeSource + '</span>'
                        + '<span class="live-log-time">' + escapeHtml(timeText) + '</span>'
                        + '</div>'
                        + '<div class="live-log-message">' + safeMessage + '</div>'
                        + '</div>';
                })
                .join('');
        }

        function updateTerminalStatusFromSelect() {
            const select = document.getElementById('terminalSelect');
            const statusEl = document.getElementById('terminalStatus');

            if (!select || !statusEl) {
                return;
            }

            selectedTerminal = select.value || null;

            if (selectedTerminal) {
                const selectedText = select.options[select.selectedIndex]?.text || '';
                statusEl.textContent = '\u2713 ' + selectedText;
                statusEl.classList.add('selected');
            } else {
                statusEl.textContent = '';
                statusEl.classList.remove('selected');
            }

            persistUiState();
        }

        function initializePersistedSelections() {
            const terminalSelect = document.getElementById('terminalSelect');
            const projectSelect = document.getElementById('projectSelect');

            if (projectSelect && selectedProjectName) {
                projectSelect.value = selectedProjectName;
                if (projectSelect.value === selectedProjectName) {
                    vscode.postMessage({
                        command: 'projectSelected',
                        projectName: selectedProjectName
                    });
                } else {
                    selectedProjectName = '';
                }
            }

            if (terminalSelect && selectedTerminal) {
                terminalSelect.value = selectedTerminal;
                if (terminalSelect.value !== selectedTerminal) {
                    selectedTerminal = null;
                }
            }

            updateProjectQuickToolsState();
            updateTerminalStatusFromSelect();

            if (selectedTerminal) {
                vscode.postMessage({
                    command: 'terminalSelected',
                    terminalId: selectedTerminal
                });
            }

            persistUiState();
        }

        function stopRuntimeSession(sessionId) {
            vscode.postMessage({
                command: 'stopRuntimeSession',
                sessionId
            });
        }

        function renderRuntimeRuns(runs) {
            const wrapper = document.getElementById('runtimeStatusWrapper');
            const list = document.getElementById('runtimeStatusList');

            if (!wrapper || !list) {
                return;
            }

            const safeRuns = Array.isArray(runs) ? runs : [];
            if (safeRuns.length === 0) {
                wrapper.hidden = true;
                list.innerHTML = '';
                return;
            }

            wrapper.hidden = false;
            list.innerHTML = safeRuns
                .map((run) => {
                    const runId = encodeURIComponent(String(run.id || ''));
                    const runLabel = String(run.label || 'Run');
                    const safeRunLabel = runLabel
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');

                    return '<div class="runtime-run-item">'
                        + '<div class="runtime-run-main">'
                        + '<span class="runtime-run-dot" aria-hidden="true"></span>'
                        + '<span class="runtime-run-label">' + safeRunLabel + '</span>'
                        + '</div>'
                        + '<button type="button" class="runtime-stop-btn" data-runtime-id="' + runId + '" title="Detener ejecuci\xF3n" aria-label="Detener ejecuci\xF3n">\u23F9</button>'
                        + '</div>';
                })
                .join('');

            list.querySelectorAll('.runtime-stop-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    const encodedRuntimeId = button.getAttribute('data-runtime-id') || '';
                    const runtimeId = decodeURIComponent(encodedRuntimeId);
                    if (runtimeId) {
                        stopRuntimeSession(runtimeId);
                    }
                });
            });
        }
        
        /**
         * Selecciona una terminal
         */
        function selectTerminal() {
            updateTerminalStatusFromSelect();

            if (selectedTerminal) {
                vscode.postMessage({
                    command: 'terminalSelected',
                    terminalId: selectedTerminal
                });
            }
        }
        
        /**
         * Ejecuta un comando
         */
        function executeCommand(id, command) {
            if (!selectedTerminal) {
                alert('Por favor, selecciona una terminal primero');
                document.getElementById('terminalSelect').focus();
                return;
            }
            
            vscode.postMessage({ 
                command: 'executeCommand', 
                commandId: id,
                commandText: command,
                terminalId: selectedTerminal
            });
        }

        /**
         * Copia un comando al portapapeles
         */
        function copyCommand(event, id, command) {
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }

            vscode.postMessage({
                command: 'copyCommand',
                commandId: id,
                commandText: command
            });
        }
        
        /**
         * Selecciona un proyecto
         */
        function selectProject() {
            const select = document.getElementById('projectSelect');
            const projectName = select.value;
            selectedProjectName = projectName || '';
            persistUiState();
            updateProjectQuickToolsState();
            
            if (!projectName) {
                document.querySelectorAll('.project-info').forEach(el => el.classList.remove('active'));
                return;
            }

            vscode.postMessage({ 
                command: 'projectSelected', 
                projectName 
            });
        }

        /**
         * Escucha los mensajes del backend
         */
        window.addEventListener('message', event => {
            const message = event.data;
            const LARAVEL_DB_ENV_KEYS = ['DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];
            const IONIC_API_KEYS = ['apiUrl (dev)', 'apiUrl (prod)'];

            function renderTerminalOptions(terminals) {
                const safeTerminals = Array.isArray(terminals) ? terminals : [];
                const vsCodeTerminals = safeTerminals
                    .filter(t => t.type === 'vscode')
                    .map(t => '<option value="' + t.id + '">' + t.name + '</option>')
                    .join('');

                const externalTerminals = safeTerminals
                    .filter(t => t.type === 'external')
                    .map(t => '<option value="' + t.id + '">' + t.name + '</option>')
                    .join('');

                return '<optgroup label="VS Code">'
                    + vsCodeTerminals
                    + '<option value="vscode:new">+ Crear nueva terminal</option>'
                    + '</optgroup>'
                    + '<optgroup label="Externa">'
                    + externalTerminals
                    + '<option value="external:native">\u{1F5A5}\uFE0F Terminal Externa</option>'
                    + '</optgroup>';
            }
            
            if (message.command === 'updateProjectInfo') {
                const project = message.project;
                const typeCapitalized = project.type.charAt(0).toUpperCase() + project.type.slice(1);
                
                // Mostrar la secci\xF3n correspondiente
                document.querySelectorAll('.project-info').forEach(el => el.classList.remove('active'));
                const infoSection = document.getElementById(project.type + 'Info');
                if (infoSection) {
                    infoSection.classList.add('active');
                }

                // Actualizar informaci\xF3n
                const nameEl = document.getElementById('projectName' + typeCapitalized);
                const pathEl = document.getElementById('projectPath' + typeCapitalized);
                const projectSelect = document.getElementById('projectSelect');
                
                if (nameEl) nameEl.textContent = project.name;
                if (pathEl) pathEl.textContent = project.path;
                if (projectSelect) {
                    projectSelect.value = project.name;
                }
                selectedProjectName = project.name;
                persistUiState();
                updateProjectQuickToolsState();

                // Actualizar logo actual de la app (Ionic)
                const appLogoIonic = document.getElementById('appLogoIonic');
                const appLogoIonicEmpty = document.getElementById('appLogoIonicEmpty');

                if (appLogoIonic && appLogoIonicEmpty) {
                    if (project.type === 'ionic' && project.appLogoUri) {
                        appLogoIonic.setAttribute('src', project.appLogoUri);
                        appLogoIonic.style.display = 'block';
                        appLogoIonicEmpty.style.display = 'none';
                    } else {
                        appLogoIonic.removeAttribute('src');
                        appLogoIonic.style.display = 'none';
                        appLogoIonicEmpty.style.display = 'inline-block';
                    }
                }

                // Actualizar versiones
                if (project.versions) {
                    const versionsContainer = document.getElementById('versions' + typeCapitalized);
                    if (versionsContainer) {
                        const rawVersions = project.versions || {};
                        const preferredOrder = VERSION_KEY_MAP[project.type] || [];
                        const existingKeys = Object.keys(rawVersions);
                        const orderedKeys = [
                            ...preferredOrder.filter(key => Object.prototype.hasOwnProperty.call(rawVersions, key)),
                            ...existingKeys.filter(key => !preferredOrder.includes(key)).sort()
                        ];

                        const displayKeys = project.type === 'laravel'
                            ? orderedKeys.filter(key => !LARAVEL_DB_ENV_KEYS.includes(key))
                            : orderedKeys;

                        const baseRowsHtml = displayKeys
                            .map((key) => {
                                const rawValue = rawVersions[key] ?? '';
                                const safeKey = escapeHtml(key);
                                const safeValue = escapeHtml(rawValue);

                                if (project.type === 'laravel' && key === 'APP_URL') {
                                    const encodedValue = encodeURIComponent(String(rawValue));

                                    return \`
                                        <div class="version-item app-url-item">
                                            <span class="version-key">\${safeKey}</span>
                                            <div class="app-url-row">
                                                <span class="version-value app-url-value">\${safeValue}</span>
                                                <button type="button" class="app-url-edit-btn laravel-env-edit-btn" title="Editar APP_URL" data-env-key="APP_URL" data-current-value="\${encodedValue}">\u270F\uFE0F</button>
                                            </div>
                                        </div>
                                    \`;
                                }

                                if (project.type === 'ionic' && IONIC_API_KEYS.includes(key)) {
                                    const encodedValue = encodeURIComponent(String(rawValue));

                                    return \`
                                        <div class="version-item app-url-item">
                                            <span class="version-key">\${safeKey}</span>
                                            <div class="app-url-row ionic-api-row">
                                                <span class="version-value app-url-value ionic-api-value">\${safeValue}</span>
                                                <button type="button" class="app-url-edit-btn ionic-api-edit-btn" title="Editar \${safeKey}" data-api-key="\${safeKey}" data-current-value="\${encodedValue}">\u270F\uFE0F</button>
                                            </div>
                                        </div>
                                    \`;
                                }

                                return \`
                                    <div class="version-item">
                                        <span class="version-key">\${safeKey}</span>
                                        <span class="version-value">\${safeValue}</span>
                                    </div>
                                \`;
                            })
                            .join('');

                        let dbSectionHtml = '';
                        if (project.type === 'laravel') {
                            const dbEntriesHtml = LARAVEL_DB_ENV_KEYS
                                .map((envKey) => {
                                    const rawValue = rawVersions[envKey] ?? '';
                                    const safeKey = escapeHtml(envKey);
                                    const safeValue = escapeHtml(rawValue);
                                    const encodedValue = encodeURIComponent(String(rawValue));

                                    return \`
                                        <div class="db-connection-entry">
                                            <span class="version-key">\${safeKey}</span>
                                            <div class="app-url-row">
                                                <span class="version-value app-url-value">\${safeValue}</span>
                                                <button type="button" class="app-url-edit-btn laravel-env-edit-btn" title="Editar \${safeKey}" data-env-key="\${safeKey}" data-current-value="\${encodedValue}">\u270F\uFE0F</button>
                                            </div>
                                        </div>
                                    \`;
                                })
                                .join('');

                            dbSectionHtml = \`
                                <div class="version-item db-connection-item">
                                    <span class="version-key db-connection-title">CONEXI\xD3N BBDD</span>
                                    <div class="db-connection-grid">
                                        \${dbEntriesHtml}
                                    </div>
                                </div>
                            \`;
                        }

                        versionsContainer.innerHTML = baseRowsHtml + dbSectionHtml;

                        if (!versionsContainer.innerHTML.trim()) {
                            versionsContainer.innerHTML = '<div class="version-item"><span class="version-key">estado</span><span class="version-value">Sin datos disponibles</span></div>';
                        }

                        if (project.type === 'laravel') {
                            const envEditButtons = versionsContainer.querySelectorAll('.laravel-env-edit-btn');
                            envEditButtons.forEach((button) => {
                                button.addEventListener('click', () => {
                                    const envKey = button.getAttribute('data-env-key') || '';
                                    const encodedCurrentValue = button.getAttribute('data-current-value') || '';
                                    const currentValue = decodeURIComponent(encodedCurrentValue);

                                    vscode.postMessage({
                                        command: 'editLaravelEnvValue',
                                        envKey,
                                        currentValue
                                    });
                                });
                            });
                        }

                        if (project.type === 'ionic') {
                            const apiEditButtons = versionsContainer.querySelectorAll('.ionic-api-edit-btn');
                            apiEditButtons.forEach((button) => {
                                button.addEventListener('click', () => {
                                    const apiKey = button.getAttribute('data-api-key') || '';
                                    const encodedCurrentValue = button.getAttribute('data-current-value') || '';
                                    const currentValue = decodeURIComponent(encodedCurrentValue);

                                    vscode.postMessage({
                                        command: 'editIonicApiUrl',
                                        apiKey,
                                        currentValue
                                    });
                                });
                            });
                        }
                    }
                }
            }
            
            if (message.command === 'updateTerminals') {
                const terminalSelect = document.getElementById('terminalSelect');
                if (terminalSelect) {
                    if (message.terminals) {
                        const placeholder = '<option value="">Selecciona una terminal...</option>';
                        terminalSelect.innerHTML = placeholder + renderTerminalOptions(message.terminals);
                    }

                    if (typeof message.selectedTerminalId === 'string') {
                        terminalSelect.value = message.selectedTerminalId;
                    }

                    updateTerminalStatusFromSelect();
                }
            }

            if (message.command === 'updateRuntimeRuns') {
                renderRuntimeRuns(message.runs);
            }

            if (message.command === 'updateProjectHealth') {
                renderProjectHealth(message.projectType, message.health);
            }

            if (message.command === 'updateLiveLogs') {
                const projectType = message.projectType || 'other';
                liveLogsByType[projectType] = Array.isArray(message.entries) ? message.entries : [];
                renderLiveLogs(projectType);
            }
        });

        initializePersistedSelections();
        `;
  }
  /**
   * Capitaliza la primera letra de una cadena
   */
  static capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

// src/SidebarProvider.ts
var SidebarProvider = class {
  constructor(_extensionUri, projects = []) {
    this._extensionUri = _extensionUri;
    this.projects = projects;
    this.logger.log(
      `[SidebarProvider] Initialized with ${this.projects.length} projects`,
      this.projects
    );
  }
  _extensionUri;
  projects;
  selectedProject = null;
  selectedTerminalId = null;
  logger = console;
  webviewView = null;
  runtimeSessions = /* @__PURE__ */ new Map();
  runtimeHiddenTerminals = /* @__PURE__ */ new Set();
  terminalLifecycleListenersRegistered = false;
  liveLogEntries = [];
  maxLiveLogEntries = 300;
  activeProjectLogType = null;
  watchedLaravelLogPath = null;
  watchedIonicLogPath = null;
  /**
   * Resuelve la vista del webview
   */
  resolveWebviewView(webviewView) {
    this.logger.log("[SidebarProvider] Resolving webview view");
    this.webviewView = webviewView;
    this.registerTerminalLifecycleListeners();
    const workspaceRoots = vscode2.workspace.workspaceFolders?.map((folder) => folder.uri) || [];
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri, ...workspaceRoots]
    };
    const terminals = this.getAvailableTerminals();
    webviewView.webview.html = WebviewContent.generate(this.projects, terminals, this._extensionUri, webviewView.webview);
    this.setupMessageHandlers(webviewView);
    this.pushTerminalAndRuntimeState(webviewView);
    this.pushSelectedProjectInfo(webviewView);
    this.refreshProjectInsights(webviewView);
  }
  /**
   * Obtiene las terminales disponibles
   */
  getAvailableTerminals() {
    const terminals = [];
    vscode2.window.terminals.forEach((terminal, index) => {
      if (this.runtimeHiddenTerminals.has(terminal)) {
        return;
      }
      terminals.push({
        id: `vscode:${terminal.name}:${index}`,
        name: `\u{1F4DF} ${terminal.name || `Terminal ${index + 1}`}`,
        type: "vscode"
      });
    });
    return terminals;
  }
  /**
   * Configura los manejadores de mensajes del webview
   */
  setupMessageHandlers(webviewView) {
    webviewView.webview.onDidReceiveMessage((message) => {
      this.logger.log("[SidebarProvider] Message received:", message);
      switch (message.command) {
        case "terminalSelected":
          this.handleTerminalSelection(message.terminalId);
          break;
        case "executeCommand":
          this.handleCommandExecution(
            message.commandId,
            message.commandText,
            message.terminalId,
            webviewView
          );
          break;
        case "projectSelected":
          this.handleProjectSelection(message.projectName, webviewView);
          break;
        case "projectQuickAction":
          this.handleProjectQuickAction(message.action, message.projectName, webviewView);
          break;
        case "editLaravelAppUrl":
          this.handleLaravelAppUrlEdit(message.currentValue, webviewView);
          break;
        case "editLaravelEnvValue":
          this.handleLaravelEnvValueEdit(message.envKey, message.currentValue, webviewView);
          break;
        case "editIonicApiUrl":
          this.handleIonicApiUrlEdit(message.apiKey, message.currentValue, webviewView);
          break;
        case "copyCommand":
          this.handleCopyCommand(message.commandId, message.commandText);
          break;
        case "stopRuntimeSession":
          this.stopRuntimeSession(message.sessionId, webviewView);
          break;
        case "clearLiveLogs":
          this.clearLiveLogs(webviewView);
          break;
        default:
          this.logger.warn(
            `[SidebarProvider] Unknown command: ${message.command}`
          );
      }
    });
  }
  /**
   * Maneja la selección de terminal
   */
  handleTerminalSelection(terminalId) {
    this.selectedTerminalId = terminalId;
    this.logger.log(`[SidebarProvider] Terminal selected: ${terminalId}`);
  }
  /**
   * Maneja la ejecución de un comando
   */
  async handleCommandExecution(commandId, commandText, terminalId, webviewView) {
    this.logger.log(`[SidebarProvider] Executing command: ${commandId}`);
    this.logger.log(`[SidebarProvider] Command text: ${commandText}`);
    this.logger.log(`[SidebarProvider] Terminal ID: ${terminalId}`);
    if (!this.selectedProject) {
      vscode2.window.showErrorMessage("Por favor, selecciona un proyecto primero");
      return;
    }
    if (!this.isRuntimeCommand(commandId) && !terminalId) {
      vscode2.window.showErrorMessage("Por favor, selecciona una terminal antes de ejecutar comandos");
      return;
    }
    if (commandId === "ionic-prepare-release") {
      await this.handlePrepareToRelease(terminalId, webviewView);
      return;
    }
    if (this.isRuntimeCommand(commandId)) {
      await this.handleRuntimeCommand(commandId, commandText, webviewView);
      return;
    }
    if (commandId === "laravel-serve") {
      commandText = this.buildLaravelServeCommand();
    }
    const projectPath = this.selectedProject.path;
    const fullCommand = `cd "${projectPath}" && ${commandText}`;
    this.dispatchCommandToTerminal(terminalId, fullCommand, webviewView);
  }
  /**
   * Flujo guiado para preparar un release firmado de Android (AAB)
   */
  async handlePrepareToRelease(terminalId, webviewView) {
    if (!this.selectedProject || this.selectedProject.type !== "ionic") {
      vscode2.window.showErrorMessage("Prepare To Release solo est\xE1 disponible para proyectos Ionic");
      return;
    }
    if (terminalId.startsWith("external:")) {
      vscode2.window.showErrorMessage("Por seguridad, usa una terminal de VS Code para firmar el AAB");
      return;
    }
    const projectPath = this.selectedProject.path;
    const packageJsonPath = path2.join(projectPath, "package.json");
    if (!fs2.existsSync(packageJsonPath)) {
      vscode2.window.showErrorMessage("No se encontr\xF3 package.json en el proyecto seleccionado");
      return;
    }
    const currentVersion = this.getCurrentAppVersion(packageJsonPath) || "1.0.0";
    const versionOption = await vscode2.window.showQuickPick(
      [
        {
          label: "Mantener versi\xF3n actual",
          description: currentVersion,
          value: "keep"
        },
        {
          label: "Cambiar versi\xF3n",
          description: "Actualizar package.json antes del release",
          value: "change"
        }
      ],
      {
        title: "Prepare To Release",
        placeHolder: `Versi\xF3n actual detectada: ${currentVersion}`,
        ignoreFocusOut: true
      }
    );
    if (!versionOption) {
      return;
    }
    let releaseVersion = currentVersion;
    if (versionOption.value === "change") {
      const nextVersion = await vscode2.window.showInputBox({
        title: "Nueva versi\xF3n",
        prompt: "Ingresa la versi\xF3n que se subir\xE1 (ej: 1.4.2)",
        value: currentVersion,
        ignoreFocusOut: true,
        validateInput: (value) => {
          const semverLike = /^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/;
          if (!value.trim()) {
            return "La versi\xF3n es obligatoria";
          }
          if (!semverLike.test(value.trim())) {
            return "Formato sugerido: 1.0.0";
          }
          return null;
        }
      });
      if (!nextVersion) {
        return;
      }
      releaseVersion = nextVersion.trim();
      try {
        this.updateAppVersion(packageJsonPath, releaseVersion);
      } catch {
        return;
      }
      this.syncSelectedProjectVersion(releaseVersion);
      webviewView.webview.postMessage({
        command: "updateProjectInfo",
        project: this.selectedProject
      });
    }
    const keystorePath = await this.pickKeystoreFile(projectPath);
    if (!keystorePath) {
      return;
    }
    const storePassword = await vscode2.window.showInputBox({
      title: "Contrase\xF1a del keystore",
      prompt: "Ingresa la contrase\xF1a del keystore",
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => value.trim() ? null : "La contrase\xF1a es obligatoria"
    });
    if (!storePassword) {
      return;
    }
    const keyAlias = await vscode2.window.showInputBox({
      title: "Alias de firma",
      prompt: "Ingresa el alias del key (ej: upload)",
      ignoreFocusOut: true,
      validateInput: (value) => value.trim() ? null : "El alias es obligatorio"
    });
    if (!keyAlias) {
      return;
    }
    const keyPasswordInput = await vscode2.window.showInputBox({
      title: "Contrase\xF1a del alias",
      prompt: "Ingresa la contrase\xF1a del alias (vac\xEDo = usar contrase\xF1a del keystore)",
      password: true,
      ignoreFocusOut: true
    });
    if (keyPasswordInput === void 0) {
      return;
    }
    const keyPassword = keyPasswordInput || storePassword;
    const confirmation = await vscode2.window.showQuickPick(
      [
        {
          label: "Continuar y preparar release",
          description: `Versi\xF3n ${releaseVersion} | ${path2.basename(keystorePath)} | alias ${keyAlias}`,
          value: "continue"
        },
        { label: "Cancelar", value: "cancel" }
      ],
      {
        title: "Confirmaci\xF3n final",
        placeHolder: "Se ejecutar\xE1 build, sync y bundleRelease firmado",
        ignoreFocusOut: true
      }
    );
    if (!confirmation || confirmation.value !== "continue") {
      return;
    }
    const fullCommand = this.buildPrepareReleaseCommand({
      projectPath,
      keystorePath,
      storePassword,
      keyAlias,
      keyPassword
    });
    this.dispatchCommandToTerminal(terminalId, fullCommand, webviewView);
    vscode2.window.showInformationMessage(`\u2713 Flujo de release enviado (versi\xF3n ${releaseVersion})`);
  }
  /**
   * Envía un comando a la terminal elegida por el usuario
   */
  dispatchCommandToTerminal(terminalId, fullCommand, webviewView) {
    if (terminalId === "vscode:new") {
      this.executeInNewVSCodeTerminal(fullCommand, webviewView);
    } else if (terminalId.startsWith("vscode:")) {
      this.executeInSelectedVSCodeTerminal(terminalId, fullCommand, webviewView);
    } else if (terminalId.startsWith("external:")) {
      this.executeInExternalTerminal(fullCommand, terminalId);
    }
  }
  /**
   * Determina si el comando es una ejecución larga que se gestiona como run activo
   */
  isRuntimeCommand(commandId) {
    return ["laravel-serve", "ionic-serve", "ionic-run-device"].includes(commandId);
  }
  /**
   * Obtiene la etiqueta visible para una ejecución activa
   */
  resolveRuntimeLabel(commandId) {
    return commandId === "laravel-serve" ? "Run Laravel" : "Run Ionic";
  }
  /**
   * Envuelve comandos runtime para capturar salida cuando aplica
   */
  wrapRuntimeCommandForLogging(command, commandId, projectPath) {
    if (!["ionic-serve", "ionic-run-device"].includes(commandId)) {
      return command;
    }
    const logsDir = path2.join(projectPath, ".myrmidon", "logs");
    const ionicLogPath = path2.join(logsDir, "ionic-runtime.log");
    fs2.mkdirSync(logsDir, { recursive: true });
    if (!fs2.existsSync(ionicLogPath)) {
      fs2.writeFileSync(ionicLogPath, "", "utf8");
    }
    if (process.platform === "win32") {
      return `(${command}) >> "${ionicLogPath}" 2>&1`;
    }
    return `(${command}) 2>&1 | tee -a "${ionicLogPath}"`;
  }
  /**
   * Ejecuta un comando largo en una terminal dedicada y la oculta del selector
   */
  async handleRuntimeCommand(commandId, commandText, webviewView) {
    if (!this.selectedProject) {
      return;
    }
    const runtimeLabel = this.resolveRuntimeLabel(commandId);
    let baseCommandToRun = commandId === "laravel-serve" ? this.buildLaravelServeCommand() : commandText;
    if (commandId === "ionic-run-device") {
      const commandWithTarget = await this.prepareIonicRunDeviceCommand(baseCommandToRun);
      if (!commandWithTarget) {
        this.logger.log("[SidebarProvider] Ionic run device cancelado por el usuario o sin dispositivos disponibles");
        return;
      }
      baseCommandToRun = commandWithTarget;
    }
    const commandToRun = this.wrapRuntimeCommandForLogging(
      baseCommandToRun,
      commandId,
      this.selectedProject.path
    );
    const fullCommand = `cd "${this.selectedProject.path}" && ${commandToRun}`;
    const terminal = vscode2.window.createTerminal({
      name: `Myrmidon ${runtimeLabel} ${this.runtimeSessions.size + 1}`,
      hideFromUser: false
    });
    const sessionId = `runtime:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    this.runtimeSessions.set(sessionId, {
      id: sessionId,
      label: runtimeLabel,
      commandId,
      projectName: this.selectedProject.name,
      projectType: this.selectedProject.type,
      terminal
    });
    this.runtimeHiddenTerminals.add(terminal);
    terminal.show();
    terminal.sendText(fullCommand);
    this.logger.log(`[SidebarProvider] Runtime session started: ${runtimeLabel} (${sessionId})`);
    this.appendLiveLogEntry({
      level: "info",
      source: runtimeLabel,
      message: `Ejecuci\xF3n iniciada (${commandId})`
    }, webviewView);
    this.pushTerminalAndRuntimeState(webviewView);
    vscode2.window.showInformationMessage(`\u2713 ${runtimeLabel} en ejecuci\xF3n`);
  }
  /**
   * Prepara el comando de Ionic Run Device solicitando el target Android actual
   */
  async prepareIonicRunDeviceCommand(baseCommand) {
    const selectedDevice = await this.pickAndroidDeviceForIonicRun();
    if (!selectedDevice) {
      return null;
    }
    return this.applyIonicRunTarget(baseCommand, selectedDevice.id);
  }
  /**
   * Muestra selector de dispositivos Android conectados para Ionic
   */
  async pickAndroidDeviceForIonicRun() {
    const devices = this.listConnectedAndroidDevices();
    if (devices.length === 0) {
      vscode2.window.showWarningMessage("No hay dispositivos Android conectados. Conecta uno o inicia un emulador.");
      return null;
    }
    const selectedItem = await vscode2.window.showQuickPick(
      devices.map((device) => ({
        label: device.name,
        description: device.id,
        detail: device.detail,
        value: device
      })),
      {
        title: "Ionic Run Device",
        placeHolder: "Selecciona el dispositivo Android donde ejecutar la app",
        ignoreFocusOut: true
      }
    );
    return selectedItem?.value || null;
  }
  /**
   * Lista dispositivos Android conectados usando adb
   */
  listConnectedAndroidDevices() {
    try {
      const output = (0, import_child_process.execSync)("adb devices -l", { encoding: "utf8" });
      const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).filter((line) => !line.toLowerCase().startsWith("list of devices attached"));
      return lines.map((line) => this.parseAdbDeviceLine(line)).filter((device) => Boolean(device));
    } catch (error) {
      this.logger.error("[SidebarProvider] Error listando dispositivos Android con adb:", error);
      vscode2.window.showErrorMessage("No se pudo listar dispositivos Android. Verifica que adb est\xE9 disponible en PATH.");
      return [];
    }
  }
  /**
   * Parsea una línea de "adb devices -l" para obtener datos de display
   */
  parseAdbDeviceLine(line) {
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      return null;
    }
    const [id, status, ...metadataParts] = parts;
    if (status !== "device") {
      return null;
    }
    const metadata = metadataParts.join(" ");
    const model = metadata.match(/\bmodel:([^\s]+)/)?.[1]?.replace(/_/g, " ");
    const deviceName = metadata.match(/\bdevice:([^\s]+)/)?.[1]?.replace(/_/g, " ");
    const product = metadata.match(/\bproduct:([^\s]+)/)?.[1]?.replace(/_/g, " ");
    const transportId = metadata.match(/\btransport_id:([^\s]+)/)?.[1];
    const detailParts = [];
    if (deviceName) {
      detailParts.push(`device: ${deviceName}`);
    }
    if (product) {
      detailParts.push(`product: ${product}`);
    }
    if (transportId) {
      detailParts.push(`transport: ${transportId}`);
    }
    return {
      id,
      name: model || deviceName || id,
      detail: detailParts.length > 0 ? detailParts.join(" | ") : void 0
    };
  }
  /**
   * Inserta/actualiza el --target del comando de Ionic run
   */
  applyIonicRunTarget(command, targetId) {
    const commandWithoutTarget = command.replace(/\s+--target(?:=|\s+)[^\s]+/g, "").trim();
    return `${commandWithoutTarget} --target ${targetId}`;
  }
  /**
   * Detiene una ejecución activa
   */
  stopRuntimeSession(sessionId, webviewView) {
    if (!sessionId) {
      vscode2.window.showErrorMessage("No se pudo detener la ejecuci\xF3n: sesi\xF3n inv\xE1lida");
      return;
    }
    const runtimeSession = this.runtimeSessions.get(sessionId);
    if (!runtimeSession) {
      this.pushTerminalAndRuntimeState(webviewView);
      return;
    }
    this.runtimeSessions.delete(sessionId);
    this.runtimeHiddenTerminals.delete(runtimeSession.terminal);
    try {
      runtimeSession.terminal.sendText("", false);
    } catch (error) {
      this.logger.debug("[SidebarProvider] Ctrl+C not sent to runtime terminal:", error);
    }
    runtimeSession.terminal.dispose();
    this.logger.log(`[SidebarProvider] Runtime session stopped: ${runtimeSession.label} (${sessionId})`);
    this.appendLiveLogEntry({
      level: "info",
      source: runtimeSession.label,
      message: "Ejecuci\xF3n detenida por el usuario"
    }, webviewView);
    this.pushTerminalAndRuntimeState(webviewView);
    vscode2.window.showInformationMessage(`\u2713 ${runtimeSession.label} detenido`);
  }
  /**
   * Registra listeners globales de ciclo de vida de terminales
   */
  registerTerminalLifecycleListeners() {
    if (this.terminalLifecycleListenersRegistered) {
      return;
    }
    this.terminalLifecycleListenersRegistered = true;
    vscode2.window.onDidCloseTerminal((terminal) => {
      let removedRuntime = false;
      let closedRuntimeLabel = "";
      let removedSessionId = "";
      if (this.runtimeHiddenTerminals.has(terminal)) {
        this.runtimeHiddenTerminals.delete(terminal);
      }
      for (const [sessionId, runtimeSession] of this.runtimeSessions.entries()) {
        if (runtimeSession.terminal === terminal) {
          this.runtimeSessions.delete(sessionId);
          closedRuntimeLabel = runtimeSession.label;
          removedSessionId = sessionId;
          removedRuntime = true;
          break;
        }
      }
      if (removedRuntime) {
        this.logger.log(`[SidebarProvider] Runtime session removed after terminal close (${removedSessionId})`);
        this.appendLiveLogEntry({
          level: "warning",
          source: closedRuntimeLabel || "Runtime",
          message: "La terminal fue cerrada y la ejecuci\xF3n termin\xF3"
        });
      }
      this.pushTerminalAndRuntimeState();
    });
  }
  /**
   * Infere nivel de log desde una línea textual
   */
  detectLogLevel(message) {
    const lower = message.toLowerCase();
    if (/(^|\W)(error|fatal|exception|failed|traceback)(\W|$)/.test(lower)) {
      return "error";
    }
    if (/(^|\W)(warn|warning|deprecated)(\W|$)/.test(lower)) {
      return "warning";
    }
    return "info";
  }
  /**
   * Inserta una entrada de log y publica cambios
   */
  appendLiveLogEntry(input, targetWebviewView, projectTypeOverride) {
    const projectType = projectTypeOverride || this.activeProjectLogType || this.selectedProject?.type || "other";
    if (this.activeProjectLogType !== projectType) {
      return;
    }
    this.liveLogEntries.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level: input.level,
      source: input.source,
      message: input.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (this.liveLogEntries.length > this.maxLiveLogEntries) {
      this.liveLogEntries = this.liveLogEntries.slice(-this.maxLiveLogEntries);
    }
    this.pushLiveLogs(targetWebviewView);
  }
  /**
   * Limpia los logs en vivo del proyecto activo
   */
  clearLiveLogs(webviewView) {
    this.liveLogEntries = [];
    this.pushLiveLogs(webviewView);
  }
  /**
   * Publica logs en vivo al webview
   */
  pushLiveLogs(targetWebviewView) {
    const activeWebview = targetWebviewView || this.webviewView;
    if (!activeWebview || !this.activeProjectLogType) {
      return;
    }
    activeWebview.webview.postMessage({
      command: "updateLiveLogs",
      projectType: this.activeProjectLogType,
      entries: this.liveLogEntries
    });
  }
  /**
   * Recalcula salud y reinicia el origen de logs del proyecto seleccionado
   */
  refreshProjectInsights(targetWebviewView) {
    const activeWebview = targetWebviewView || this.webviewView;
    if (!activeWebview || !this.selectedProject) {
      return;
    }
    this.stopLaravelLogWatcher();
    this.stopIonicLogWatcher();
    this.activeProjectLogType = this.selectedProject.type;
    this.liveLogEntries = [];
    const healthPayload = this.buildProjectHealth(this.selectedProject);
    activeWebview.webview.postMessage({
      command: "updateProjectHealth",
      projectType: this.selectedProject.type,
      health: healthPayload
    });
    this.pushLiveLogs(activeWebview);
    if (this.selectedProject.type === "laravel") {
      this.startLaravelLogWatcher(this.selectedProject.path);
    }
    if (this.selectedProject.type === "ionic") {
      this.startIonicLogWatcher(this.selectedProject.path);
    }
  }
  /**
   * Empieza seguimiento de storage/logs/laravel.log
   */
  startLaravelLogWatcher(projectPath) {
    const laravelLogPath = path2.join(projectPath, "storage", "logs", "laravel.log");
    this.watchedLaravelLogPath = laravelLogPath;
    if (!fs2.existsSync(laravelLogPath)) {
      this.appendLiveLogEntry({
        level: "info",
        source: "Laravel Log",
        message: "A\xFAn no existe storage/logs/laravel.log"
      });
      return;
    }
    const existingContent = fs2.readFileSync(laravelLogPath, "utf8");
    const tailLines = existingContent.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(-60);
    tailLines.forEach((line) => {
      this.appendLiveLogEntry({
        level: this.detectLogLevel(line),
        source: "Laravel Log",
        message: line
      });
    });
    fs2.watchFile(laravelLogPath, { interval: 1e3 }, (current, previous) => {
      if (!this.watchedLaravelLogPath || this.watchedLaravelLogPath !== laravelLogPath) {
        return;
      }
      if (current.size === previous.size) {
        return;
      }
      const start = current.size < previous.size ? 0 : previous.size;
      const length = current.size - start;
      if (length <= 0) {
        return;
      }
      const fd = fs2.openSync(laravelLogPath, "r");
      try {
        const buffer = Buffer.alloc(length);
        fs2.readSync(fd, buffer, 0, length, start);
        const chunk = buffer.toString("utf8");
        chunk.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).forEach((line) => {
          this.appendLiveLogEntry({
            level: this.detectLogLevel(line),
            source: "Laravel Log",
            message: line
          });
        });
      } catch (error) {
        this.logger.debug("[SidebarProvider] Error reading Laravel log chunk:", error);
      } finally {
        fs2.closeSync(fd);
      }
    });
  }
  /**
   * Detiene seguimiento de logs Laravel si existe watcher activo
   */
  stopLaravelLogWatcher() {
    if (this.watchedLaravelLogPath) {
      fs2.unwatchFile(this.watchedLaravelLogPath);
      this.watchedLaravelLogPath = null;
    }
  }
  /**
   * Empieza seguimiento del output de runtime Ionic en .myrmidon/logs/ionic-runtime.log
   */
  startIonicLogWatcher(projectPath) {
    const logsDir = path2.join(projectPath, ".myrmidon", "logs");
    const ionicLogPath = path2.join(logsDir, "ionic-runtime.log");
    fs2.mkdirSync(logsDir, { recursive: true });
    if (!fs2.existsSync(ionicLogPath)) {
      fs2.writeFileSync(ionicLogPath, "", "utf8");
    }
    this.watchedIonicLogPath = ionicLogPath;
    const existingContent = fs2.readFileSync(ionicLogPath, "utf8");
    const tailLines = existingContent.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(-80);
    tailLines.forEach((line) => {
      this.appendLiveLogEntry({
        level: this.detectLogLevel(line),
        source: "Ionic Runtime",
        message: line
      });
    });
    fs2.watchFile(ionicLogPath, { interval: 900 }, (current, previous) => {
      if (!this.watchedIonicLogPath || this.watchedIonicLogPath !== ionicLogPath) {
        return;
      }
      if (current.size === previous.size) {
        return;
      }
      const start = current.size < previous.size ? 0 : previous.size;
      const length = current.size - start;
      if (length <= 0) {
        return;
      }
      const fd = fs2.openSync(ionicLogPath, "r");
      try {
        const buffer = Buffer.alloc(length);
        fs2.readSync(fd, buffer, 0, length, start);
        const chunk = buffer.toString("utf8");
        chunk.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).forEach((line) => {
          this.appendLiveLogEntry({
            level: this.detectLogLevel(line),
            source: "Ionic Runtime",
            message: line
          });
        });
      } catch (error) {
        this.logger.debug("[SidebarProvider] Error reading Ionic runtime log chunk:", error);
      } finally {
        fs2.closeSync(fd);
      }
    });
  }
  /**
   * Detiene seguimiento del log de runtime Ionic
   */
  stopIonicLogWatcher() {
    if (this.watchedIonicLogPath) {
      fs2.unwatchFile(this.watchedIonicLogPath);
      this.watchedIonicLogPath = null;
    }
  }
  /**
   * Construye estado de salud del proyecto con checks básicos
   */
  buildProjectHealth(project) {
    const checks = [];
    if (project.type === "laravel") {
      const vendorExists = fs2.existsSync(path2.join(project.path, "vendor"));
      checks.push({
        id: "laravel-deps",
        label: "Dependencias Composer",
        status: vendorExists ? "ok" : "error",
        detail: vendorExists ? "vendor/ detectado" : "Falta vendor/. Ejecuta composer install"
      });
      const hasKeyFiles = ["artisan", "composer.json", ".env"].every((relativePath) => fs2.existsSync(path2.join(project.path, relativePath)));
      checks.push({
        id: "laravel-files",
        label: "Archivos clave",
        status: hasKeyFiles ? "ok" : "error",
        detail: hasKeyFiles ? "artisan/composer/.env listos" : "Faltan archivos clave de Laravel"
      });
      const installedPhp = this.readInstalledVersion("php -v", /(PHP\s+)(\d+\.\d+(?:\.\d+)?)/i);
      const requiredPhp = project.versions?.php || "";
      const phpCompatible = this.isVersionCompatible(installedPhp, requiredPhp);
      checks.push({
        id: "laravel-php",
        label: "Compatibilidad PHP",
        status: installedPhp ? phpCompatible ? "ok" : "warn" : "warn",
        detail: installedPhp ? `Instalada ${installedPhp}${requiredPhp ? ` | Requerida ${requiredPhp}` : ""}` : "No se pudo detectar versi\xF3n local de PHP"
      });
      const appUrl = project.versions?.APP_URL || "";
      const dbDatabase = project.versions?.DB_DATABASE || "";
      const dbUsername = project.versions?.DB_USERNAME || "";
      const configOk = Boolean(appUrl && dbDatabase && dbUsername);
      checks.push({
        id: "laravel-config",
        label: "Configuraci\xF3n base",
        status: configOk ? "ok" : "warn",
        detail: configOk ? "APP_URL y conexi\xF3n BBDD principal configuradas" : "Revisa APP_URL / DB_DATABASE / DB_USERNAME"
      });
    } else if (project.type === "ionic") {
      const nodeModulesExists = fs2.existsSync(path2.join(project.path, "node_modules"));
      checks.push({
        id: "ionic-deps",
        label: "Dependencias npm",
        status: nodeModulesExists ? "ok" : "error",
        detail: nodeModulesExists ? "node_modules detectado" : "Falta node_modules. Ejecuta npm i"
      });
      const hasKeyFiles = ["package.json", "ionic.config.json"].every((relativePath) => fs2.existsSync(path2.join(project.path, relativePath)));
      checks.push({
        id: "ionic-files",
        label: "Archivos clave",
        status: hasKeyFiles ? "ok" : "error",
        detail: hasKeyFiles ? "package.json e ionic.config.json presentes" : "Faltan archivos clave de Ionic"
      });
      const installedNode = this.readInstalledVersion("node -v", /(v)(\d+\.\d+(?:\.\d+)?)/i);
      const requiredNode = project.versions?.node || "";
      const nodeCompatible = this.isVersionCompatible(installedNode, requiredNode);
      checks.push({
        id: "ionic-node",
        label: "Compatibilidad Node",
        status: installedNode ? nodeCompatible ? "ok" : "warn" : "warn",
        detail: installedNode ? `Instalada ${installedNode}${requiredNode ? ` | Requerida ${requiredNode}` : ""}` : "No se pudo detectar versi\xF3n local de Node.js"
      });
      const capacitorConfigExists = fs2.existsSync(path2.join(project.path, "capacitor.config.json"));
      const androidPlatformExists = fs2.existsSync(path2.join(project.path, "android"));
      const configOk = capacitorConfigExists && androidPlatformExists;
      checks.push({
        id: "ionic-config",
        label: "Configuraci\xF3n base",
        status: configOk ? "ok" : "warn",
        detail: configOk ? "Capacitor y plataforma Android detectados" : "Revisa capacitor.config.json y carpeta android/"
      });
    } else {
      const rootExists = fs2.existsSync(project.path);
      checks.push({
        id: "generic-root",
        label: "Ruta del proyecto",
        status: rootExists ? "ok" : "error",
        detail: rootExists ? "Carpeta accesible" : "Ruta de proyecto no accesible"
      });
    }
    const hasError = checks.some((check) => check.status === "error");
    const hasWarn = checks.some((check) => check.status === "warn");
    const overallStatus = hasError ? "error" : hasWarn ? "warn" : "ok";
    return {
      overallStatus,
      summary: `${checks.length} checks | ${checks.filter((check) => check.status === "ok").length} OK`,
      checks,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Obtiene versión instalada de una herramienta del sistema
   */
  readInstalledVersion(command, matcher) {
    try {
      const output = (0, import_child_process.execSync)(command, { encoding: "utf8" });
      const match = output.match(matcher);
      return match?.[2] || null;
    } catch (error) {
      this.logger.debug(`[SidebarProvider] Could not resolve version with command: ${command}`, error);
      return null;
    }
  }
  /**
   * Comprobación simple de compatibilidad entre versión instalada y restricción
   */
  isVersionCompatible(installedVersion, versionRequirement) {
    if (!installedVersion || !versionRequirement) {
      return true;
    }
    const installed = this.extractMajorMinor(installedVersion);
    const required = this.extractMajorMinor(versionRequirement);
    if (!installed || !required) {
      return true;
    }
    if (installed.major !== required.major) {
      return installed.major > required.major;
    }
    return installed.minor >= required.minor;
  }
  /**
   * Extrae major/minor de un texto de versión
   */
  extractMajorMinor(value) {
    const normalized = value.trim().replace(/^v/i, "");
    const match = normalized.match(/(\d+)\.(\d+)/);
    if (!match) {
      return null;
    }
    return {
      major: Number(match[1]),
      minor: Number(match[2])
    };
  }
  /**
   * Obtiene payload serializable de ejecuciones activas
   */
  getRuntimeRunsPayload() {
    return Array.from(this.runtimeSessions.values()).map((session) => ({
      id: session.id,
      label: session.label,
      commandId: session.commandId
    }));
  }
  /**
   * Sincroniza terminales visibles y ejecuciones activas en el webview
   */
  pushTerminalAndRuntimeState(targetWebviewView) {
    const activeWebview = targetWebviewView || this.webviewView;
    if (!activeWebview) {
      return;
    }
    const availableTerminals = this.getAvailableTerminals();
    const hasCurrentSelection = this.selectedTerminalId ? availableTerminals.some((terminal) => terminal.id === this.selectedTerminalId) : false;
    if (!hasCurrentSelection) {
      this.selectedTerminalId = "";
    }
    activeWebview.webview.postMessage({
      command: "updateTerminals",
      terminals: availableTerminals,
      selectedTerminalId: this.selectedTerminalId || ""
    });
    activeWebview.webview.postMessage({
      command: "updateRuntimeRuns",
      runs: this.getRuntimeRunsPayload()
    });
  }
  /**
   * Lee la versión actual de package.json
   */
  getCurrentAppVersion(packageJsonPath) {
    try {
      const packageContent = fs2.readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || null;
    } catch (error) {
      this.logger.error("[SidebarProvider] Error reading package.json version:", error);
      return null;
    }
  }
  /**
   * Actualiza la versión en package.json
   */
  updateAppVersion(packageJsonPath, newVersion) {
    try {
      const packageContent = fs2.readFileSync(packageJsonPath, "utf8");
      const packageJson = JSON.parse(packageContent);
      packageJson.version = newVersion;
      fs2.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}
`, "utf8");
    } catch (error) {
      vscode2.window.showErrorMessage(`No se pudo actualizar la versi\xF3n: ${error.message}`);
      throw error;
    }
  }
  /**
   * Refleja la versión actualizada en la caché del proyecto seleccionado
   */
  syncSelectedProjectVersion(newVersion) {
    if (!this.selectedProject) {
      return;
    }
    if (!this.selectedProject.versions) {
      this.selectedProject.versions = {};
    }
    this.selectedProject.versions.app = newVersion;
  }
  /**
   * Permite seleccionar un keystore detectado o elegir uno manualmente
   */
  async pickKeystoreFile(projectPath) {
    const foundKeystores = await this.findKeystoreFiles(projectPath);
    const options = foundKeystores.map((filePath) => ({
      label: path2.basename(filePath),
      description: path2.relative(projectPath, filePath),
      value: filePath
    }));
    options.push({
      label: "$(folder-opened) Buscar archivo manualmente...",
      description: "Seleccionar un .jks o .keystore",
      value: "",
      browse: true
    });
    const selected = await vscode2.window.showQuickPick(options, {
      title: "Seleccionar keystore",
      placeHolder: "Elige el keystore para firmar el AAB",
      ignoreFocusOut: true
    });
    if (!selected) {
      return null;
    }
    if (selected.browse) {
      const picked = await vscode2.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        defaultUri: vscode2.Uri.file(projectPath),
        openLabel: "Seleccionar keystore",
        filters: {
          Keystore: ["jks", "keystore"]
        }
      });
      return picked?.[0]?.fsPath || null;
    }
    return selected.value;
  }
  /**
   * Busca archivos .jks y .keystore en el proyecto Ionic
   */
  async findKeystoreFiles(projectPath) {
    const excludePattern = "**/{node_modules,dist,build,vendor,.git}/**";
    const [jksFiles, keystoreFiles] = await Promise.all([
      vscode2.workspace.findFiles(
        new vscode2.RelativePattern(projectPath, "**/*.jks"),
        excludePattern,
        100
      ),
      vscode2.workspace.findFiles(
        new vscode2.RelativePattern(projectPath, "**/*.keystore"),
        excludePattern,
        100
      )
    ]);
    const allPaths = [...jksFiles, ...keystoreFiles].map((file) => file.fsPath);
    const unique = Array.from(new Set(allPaths));
    return unique.sort((a, b) => {
      const priorityA = this.getKeystorePriority(a);
      const priorityB = this.getKeystorePriority(b);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.localeCompare(b);
    });
  }
  /**
   * Prioriza rutas comunes donde normalmente vive el keystore
   */
  getKeystorePriority(filePath) {
    const normalized = filePath.toLowerCase();
    if (normalized.includes(`${path2.sep}keystore${path2.sep}`)) {
      return 0;
    }
    if (normalized.includes(`${path2.sep}android${path2.sep}`)) {
      return 1;
    }
    return 2;
  }
  /**
   * Construye el comando final para generar el AAB firmado
   */
  buildPrepareReleaseCommand(input) {
    const gradleCmd = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
    const projectPath = this.escapeForShellDoubleQuotes(input.projectPath);
    const keystorePath = this.escapeForShellDoubleQuotes(input.keystorePath);
    const storePassword = this.escapeForShellDoubleQuotes(input.storePassword);
    const keyAlias = this.escapeForShellDoubleQuotes(input.keyAlias);
    const keyPassword = this.escapeForShellDoubleQuotes(input.keyPassword);
    return `cd "${projectPath}" && ionic cap build android && ionic cap sync android && cd android && ${gradleCmd} bundleRelease -Pandroid.injected.signing.store.file="${keystorePath}" -Pandroid.injected.signing.store.password="${storePassword}" -Pandroid.injected.signing.key.alias="${keyAlias}" -Pandroid.injected.signing.key.password="${keyPassword}"`;
  }
  /**
   * Escapa caracteres peligrosos para argumentos entre comillas dobles
   */
  escapeForShellDoubleQuotes(value) {
    return value.replace(/[\\"`$]/g, "\\$&");
  }
  /**
   * Ejecuta un comando en una terminal existente de VS Code
   */
  executeInSelectedVSCodeTerminal(terminalId, fullCommand, webviewView) {
    const terminal = this.resolveVSCodeTerminalFromId(terminalId);
    if (terminal) {
      terminal.show();
      terminal.sendText(fullCommand);
      this.logger.log(`[SidebarProvider] Command sent to existing terminal: ${terminal.name}`);
      vscode2.window.showInformationMessage(
        `\u2713 Ejecutando en terminal: ${terminal.name}`
      );
    } else if (webviewView) {
      this.executeInNewVSCodeTerminal(fullCommand, webviewView);
    }
  }
  /**
   * Resuelve una terminal de VS Code a partir de su id serializado
   */
  resolveVSCodeTerminalFromId(terminalId) {
    if (!terminalId.startsWith("vscode:")) {
      return void 0;
    }
    const lastSeparator = terminalId.lastIndexOf(":");
    if (lastSeparator <= "vscode:".length) {
      return void 0;
    }
    const namePart = terminalId.slice("vscode:".length, lastSeparator);
    const indexPart = terminalId.slice(lastSeparator + 1);
    const parsedIndex = Number(indexPart);
    if (!Number.isNaN(parsedIndex)) {
      const byIndex = vscode2.window.terminals[parsedIndex];
      if (byIndex && byIndex.name === namePart) {
        return byIndex;
      }
    }
    return vscode2.window.terminals.find((terminal) => terminal.name === namePart);
  }
  /**
   * Ejecuta un comando en una nueva terminal de VS Code
   */
  executeInNewVSCodeTerminal(fullCommand, webviewView) {
    const terminal = vscode2.window.createTerminal({
      name: "Myrmidon",
      hideFromUser: false
    });
    terminal.show();
    terminal.sendText(fullCommand);
    this.selectedTerminalId = `vscode:${terminal.name}:${vscode2.window.terminals.length - 1}`;
    this.logger.log(`[SidebarProvider] Created new terminal: ${terminal.name}`);
    vscode2.window.showInformationMessage(`\u2713 Ejecutando en nueva terminal VS Code`);
    this.pushTerminalAndRuntimeState(webviewView);
  }
  /**
   * Ejecuta un comando en la terminal externa predefinida de VS Code
   */
  async executeInExternalTerminal(fullCommand, terminalId) {
    this.logger.log(`[SidebarProvider] Opening external terminal with command: ${fullCommand}`);
    await vscode2.env.clipboard.writeText(fullCommand);
    try {
      await vscode2.commands.executeCommand("workbench.action.terminal.openNativeConsole");
      this.logger.log(`[SidebarProvider] External terminal opened`);
      vscode2.window.showInformationMessage(
        `\u2713 Terminal externa abierta

Comando copiado al portapapeles:
${fullCommand}

Pega (Ctrl+V) y presiona Enter`
      );
    } catch (error) {
      this.logger.error("[SidebarProvider] Error opening external terminal:", error);
      vscode2.window.showErrorMessage(
        `No se pudo abrir terminal externa. Intenta manualmente:

${fullCommand}`
      );
    }
  }
  /**
   * Abre la terminal nativa configurada en VS Code
   */
  async openNativeTerminal(fullCommand) {
    try {
      const fs3 = require("fs");
      const path3 = require("path");
      const os2 = require("os");
      const tempDir = os2.tmpdir();
      const tempScript = path3.join(tempDir, `myrmidon_${Date.now()}.sh`);
      fs3.writeFileSync(tempScript, `#!/bin/bash
${fullCommand}
`, { mode: 493 });
      const { execFile } = require("child_process");
      execFile("sh", [tempScript], (error) => {
        fs3.unlink(tempScript, (err) => {
          if (err) {
            this.logger.warn("Could not delete temp script:", err);
          }
        });
        if (error) {
          this.logger.error("[SidebarProvider] Error in native terminal:", error);
          vscode2.window.showErrorMessage(`Error al ejecutar en terminal nativa: ${error.message}`);
        } else {
          vscode2.window.showInformationMessage(`\u2713 Ejecutando en terminal nativa`);
        }
      });
    } catch (error) {
      this.logger.error("[SidebarProvider] Error opening native terminal:", error);
      vscode2.window.showErrorMessage(
        `No se pudo abrir terminal nativa: ${error.message}`
      );
    }
  }
  /**
   * Maneja la selección de un proyecto
   */
  handleProjectSelection(projectName, webviewView) {
    const selected = this.projects.find((p) => p.name === projectName);
    if (!selected) {
      this.logger.warn(`[SidebarProvider] Project not found: ${projectName}`);
      return;
    }
    this.selectedProject = selected;
    this.logger.log(
      `[SidebarProvider] Project selected: ${selected.name} (${selected.type})`
    );
    this.pushSelectedProjectInfo(webviewView);
    this.refreshProjectInsights(webviewView);
  }
  /**
   * Ejecuta utilidades rápidas sobre el proyecto activo
   */
  async handleProjectQuickAction(action, projectName, webviewView) {
    const targetProject = this.resolveTargetProject(projectName);
    if (!targetProject) {
      vscode2.window.showErrorMessage("No hay un proyecto seleccionado para ejecutar esta acci\xF3n");
      return;
    }
    switch (action) {
      case "open-folder": {
        await vscode2.commands.executeCommand("revealFileInOS", vscode2.Uri.file(targetProject.path));
        break;
      }
      case "copy-path": {
        await vscode2.env.clipboard.writeText(targetProject.path);
        vscode2.window.showInformationMessage("\u2713 Ruta del proyecto copiada al portapapeles");
        break;
      }
      case "open-key-file": {
        const keyFilePath = this.resolveKeyFileForProject(targetProject);
        if (!keyFilePath) {
          vscode2.window.showWarningMessage("No se encontr\xF3 un archivo clave para este proyecto");
          break;
        }
        const document = await vscode2.workspace.openTextDocument(vscode2.Uri.file(keyFilePath));
        await vscode2.window.showTextDocument(document, { preview: false });
        break;
      }
      case "open-project-terminal": {
        const terminal = vscode2.window.createTerminal({
          name: `Myrmidon ${targetProject.name}`,
          cwd: targetProject.path,
          hideFromUser: false
        });
        terminal.show();
        this.selectedTerminalId = `vscode:${terminal.name}:${vscode2.window.terminals.length - 1}`;
        this.pushTerminalAndRuntimeState(webviewView);
        break;
      }
      default:
        this.logger.warn(`[SidebarProvider] Unknown project quick action: ${action}`);
    }
  }
  /**
   * Resuelve el proyecto objetivo desde el nombre enviado por UI o el proyecto seleccionado
   */
  resolveTargetProject(projectName) {
    if (projectName) {
      const byName = this.projects.find((project) => project.name === projectName);
      if (byName) {
        return byName;
      }
    }
    return this.selectedProject;
  }
  /**
   * Devuelve un archivo clave del proyecto para abrirlo rápidamente
   */
  resolveKeyFileForProject(project) {
    const candidateByType = {
      laravel: [".env", "composer.json", "routes/web.php"],
      ionic: ["package.json", "ionic.config.json", "capacitor.config.json"],
      other: ["README.md", "package.json"]
    };
    const candidates = candidateByType[project.type] || candidateByType.other;
    for (const relativePath of candidates) {
      const absolutePath = path2.join(project.path, relativePath);
      if (fs2.existsSync(absolutePath)) {
        return absolutePath;
      }
    }
    return null;
  }
  /**
   * Publica en el webview la información del proyecto actualmente seleccionado
   */
  pushSelectedProjectInfo(webviewView) {
    if (!this.selectedProject) {
      return;
    }
    const projectPayload = { ...this.selectedProject };
    if (this.selectedProject.type === "ionic") {
      const appLogoUri = this.resolveIonicAppLogoUri(this.selectedProject.path, webviewView.webview);
      if (appLogoUri) {
        projectPayload.appLogoUri = appLogoUri;
      }
    }
    webviewView.webview.postMessage({
      command: "updateProjectInfo",
      project: projectPayload
    });
  }
  /**
   * Permite editar APP_URL y persistirlo en el archivo .env del proyecto Laravel
   */
  async handleLaravelAppUrlEdit(currentValue, webviewView) {
    await this.handleLaravelEnvValueEdit("APP_URL", currentValue, webviewView);
  }
  /**
   * Permite editar una variable del .env en proyectos Laravel
   */
  async handleLaravelEnvValueEdit(envKey, currentValue, webviewView) {
    if (!this.selectedProject || this.selectedProject.type !== "laravel") {
      vscode2.window.showErrorMessage("La edici\xF3n de variables .env solo est\xE1 disponible para proyectos Laravel");
      return;
    }
    const allowedKeys = ["APP_URL", "DB_DATABASE", "DB_USERNAME", "DB_PASSWORD"];
    if (!envKey || !allowedKeys.includes(envKey)) {
      vscode2.window.showErrorMessage("Variable .env no soportada para edici\xF3n");
      return;
    }
    const envPath = path2.join(this.selectedProject.path, ".env");
    if (!fs2.existsSync(envPath)) {
      vscode2.window.showErrorMessage("No se encontr\xF3 el archivo .env en el proyecto Laravel");
      return;
    }
    const fieldLabels = {
      APP_URL: "URL base de la aplicaci\xF3n",
      DB_DATABASE: "nombre de la base de datos",
      DB_USERNAME: "usuario de la base de datos",
      DB_PASSWORD: "contrase\xF1a de la base de datos"
    };
    const canBeEmpty = envKey === "DB_PASSWORD";
    const newEnvValue = await vscode2.window.showInputBox({
      title: `Editar ${envKey}`,
      prompt: `Ingresa ${fieldLabels[envKey] || "el nuevo valor"}`,
      value: currentValue ?? this.selectedProject.versions?.[envKey] ?? "",
      password: envKey === "DB_PASSWORD",
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!canBeEmpty && !value.trim()) {
          return `${envKey} no puede estar vac\xEDa`;
        }
        return null;
      }
    });
    if (newEnvValue === void 0) {
      return;
    }
    const cleanedEnvValue = canBeEmpty ? newEnvValue : newEnvValue.trim();
    try {
      const envContent = fs2.readFileSync(envPath, "utf8");
      const lineBreak = envContent.includes("\r\n") ? "\r\n" : "\n";
      const escapedValue = this.escapeEnvValue(cleanedEnvValue);
      const envLine = `${envKey}=${escapedValue}`;
      const envRegex = new RegExp(`^(\\s*${this.escapeRegexForPattern(envKey)}\\s*=).*$`, "m");
      const nextContent = envRegex.test(envContent) ? envContent.replace(envRegex, envLine) : `${envContent}${envContent.endsWith(lineBreak) || envContent.length === 0 ? "" : lineBreak}${envLine}${lineBreak}`;
      fs2.writeFileSync(envPath, nextContent, "utf8");
      if (!this.selectedProject.versions) {
        this.selectedProject.versions = {};
      }
      this.selectedProject.versions[envKey] = cleanedEnvValue;
      webviewView.webview.postMessage({
        command: "updateProjectInfo",
        project: this.selectedProject
      });
      this.refreshProjectInsights(webviewView);
      vscode2.window.showInformationMessage(`\u2713 ${envKey} actualizada correctamente en .env`);
    } catch (error) {
      this.logger.error(`[SidebarProvider] Error updating ${envKey}:`, error);
      vscode2.window.showErrorMessage(`No se pudo actualizar ${envKey}: ${error.message}`);
    }
  }
  /**
   * Permite editar apiUrl en archivos de entorno de Ionic
   */
  async handleIonicApiUrlEdit(apiKey, currentValue, webviewView) {
    if (!this.selectedProject || this.selectedProject.type !== "ionic") {
      vscode2.window.showErrorMessage("La edici\xF3n de apiUrl solo est\xE1 disponible para proyectos Ionic");
      return;
    }
    const allowedApiKeys = ["apiUrl (dev)", "apiUrl (prod)"];
    if (!apiKey || !allowedApiKeys.includes(apiKey)) {
      vscode2.window.showErrorMessage("Clave de apiUrl no soportada para edici\xF3n");
      return;
    }
    const newApiUrl = await vscode2.window.showInputBox({
      title: `Editar ${apiKey}`,
      prompt: "Ingresa la nueva URL de apiUrl",
      value: currentValue ?? this.selectedProject.versions?.[apiKey] ?? "",
      ignoreFocusOut: true,
      validateInput: (value) => value.trim() ? null : "apiUrl no puede estar vac\xEDa"
    });
    if (newApiUrl === void 0) {
      return;
    }
    const cleanedApiUrl = newApiUrl.trim();
    const targetFilePath = this.resolveIonicApiFilePath(this.selectedProject.path, apiKey);
    if (!targetFilePath) {
      vscode2.window.showErrorMessage(`No se encontr\xF3 archivo de entorno para ${apiKey}`);
      return;
    }
    try {
      const fileContent = fs2.readFileSync(targetFilePath, "utf8");
      const replacementResult = this.replaceActiveTypescriptPropertyValue(fileContent, "apiUrl", cleanedApiUrl);
      if (!replacementResult.changed) {
        vscode2.window.showErrorMessage(`No se encontr\xF3 una propiedad apiUrl activa (sin comentar) en ${path2.basename(targetFilePath)}`);
        return;
      }
      fs2.writeFileSync(targetFilePath, replacementResult.nextContent, "utf8");
      if (!this.selectedProject.versions) {
        this.selectedProject.versions = {};
      }
      this.selectedProject.versions[apiKey] = cleanedApiUrl;
      this.pushSelectedProjectInfo(webviewView);
      this.refreshProjectInsights(webviewView);
      vscode2.window.showInformationMessage(`\u2713 ${apiKey} actualizada correctamente`);
    } catch (error) {
      this.logger.error(`[SidebarProvider] Error updating ${apiKey}:`, error);
      vscode2.window.showErrorMessage(`No se pudo actualizar ${apiKey}: ${error.message}`);
    }
  }
  /**
   * Resuelve el archivo de entorno Ionic a modificar según clave apiUrl
   */
  resolveIonicApiFilePath(projectPath, apiKey) {
    const candidatesByKey = {
      "apiUrl (dev)": [
        path2.join("src", "environments", "environment.ts"),
        path2.join("src", "enviroments.ts"),
        "enviroments.ts",
        "environments.ts"
      ],
      "apiUrl (prod)": [
        path2.join("src", "environments", "environment.prod.ts"),
        path2.join("src", "enviroments.prod.ts"),
        "enviroments.prod.ts",
        "environments.prod.ts"
      ]
    };
    const candidates = candidatesByKey[apiKey] || [];
    for (const relativePath of candidates) {
      const absolutePath = path2.join(projectPath, relativePath);
      if (fs2.existsSync(absolutePath)) {
        return absolutePath;
      }
    }
    return null;
  }
  /**
   * Reemplaza una propiedad TypeScript activa (sin comentar) conservando comillas
   */
  replaceActiveTypescriptPropertyValue(content, propertyName, newValue) {
    const lineBreak = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(/\r?\n/);
    const escapedProperty = this.escapeRegexForPattern(propertyName);
    const objectRegex = new RegExp("(\\b" + escapedProperty + "\\s*:\\s*)([\\'\"`])([^\\'\"`]*)\\2");
    const assignmentRegex = new RegExp("(\\b" + escapedProperty + "\\s*=\\s*)([\\'\"`])([^\\'\"`]*)\\2");
    let insideBlockComment = false;
    let changed = false;
    const updatedLines = lines.map((line) => {
      if (changed) {
        return line;
      }
      const trimmed = line.trim();
      if (!insideBlockComment && trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) {
          insideBlockComment = true;
        }
        return line;
      }
      if (insideBlockComment) {
        if (trimmed.includes("*/")) {
          insideBlockComment = false;
        }
        return line;
      }
      if (trimmed.startsWith("//")) {
        return line;
      }
      const objectMatch = line.match(objectRegex);
      if (objectMatch) {
        changed = true;
        const quote = objectMatch[2];
        const escapedNewValue = this.escapeForTypescriptQuotedValue(newValue, quote);
        return line.replace(objectRegex, `$1${quote}${escapedNewValue}${quote}`);
      }
      const assignmentMatch = line.match(assignmentRegex);
      if (assignmentMatch) {
        changed = true;
        const quote = assignmentMatch[2];
        const escapedNewValue = this.escapeForTypescriptQuotedValue(newValue, quote);
        return line.replace(assignmentRegex, `$1${quote}${escapedNewValue}${quote}`);
      }
      return line;
    });
    return {
      nextContent: updatedLines.join(lineBreak),
      changed
    };
  }
  /**
   * Escapa una cadena para usarla dentro de comillas TypeScript
   */
  escapeForTypescriptQuotedValue(value, quote) {
    let escaped = value.replace(/\\/g, "\\\\");
    if (quote === "'") {
      escaped = escaped.replace(/'/g, "\\'");
    } else if (quote === '"') {
      escaped = escaped.replace(/"/g, '\\"');
    } else {
      escaped = escaped.replace(/`/g, "\\`");
    }
    return escaped;
  }
  /**
   * Escapa valores para el formato de .env
   */
  escapeEnvValue(value) {
    if (!/[\s#"'`]/.test(value)) {
      return value;
    }
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  /**
   * Escapa caracteres especiales para construir expresiones regulares seguras
   */
  escapeRegexForPattern(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  /**
   * Copia un comando al portapapeles
   */
  async handleCopyCommand(commandId, commandText) {
    if (!commandText) {
      vscode2.window.showErrorMessage("No hay comando para copiar");
      return;
    }
    let commandToCopy = commandText;
    if (commandId === "laravel-serve") {
      commandToCopy = this.buildLaravelServeCommand();
    }
    try {
      await vscode2.env.clipboard.writeText(commandToCopy);
      vscode2.window.showInformationMessage("\u2713 Comando copiado al portapapeles");
    } catch (error) {
      this.logger.error("[SidebarProvider] Error copying command:", error);
      vscode2.window.showErrorMessage(`No se pudo copiar el comando: ${error.message}`);
    }
  }
  /**
   * Construye el comando serve de Laravel usando la IP local del dispositivo
   */
  buildLaravelServeCommand() {
    const localIp = this.resolveLocalIpAddress();
    const host = localIp || "0.0.0.0";
    return `php artisan serve --host=${host} --port=8000`;
  }
  /**
   * Obtiene una IP local IPv4 válida para exponer servicios en red local
   */
  resolveLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const networkInterface of Object.values(interfaces)) {
      if (!Array.isArray(networkInterface)) {
        continue;
      }
      for (const address of networkInterface) {
        if (address.family === "IPv4" && !address.internal) {
          return address.address;
        }
      }
    }
    return null;
  }
  /**
   * Detecta y resuelve el logo actual de una app Ionic
   */
  resolveIonicAppLogoUri(projectPath, webview) {
    const candidateRelativePaths = [
      "resources/icon.png",
      "resources/icon.jpg",
      "resources/icon.jpeg",
      "resources/icon.webp",
      "resources/icon.svg",
      "src/assets/icon/icon.png",
      "src/assets/icon/icon.jpg",
      "src/assets/icon/icon.jpeg",
      "src/assets/icon/icon.svg",
      "src/assets/logo.png",
      "src/assets/logo.svg",
      "src/assets/img/logo.png",
      "src/assets/img/logo.svg",
      "public/assets/icon/icon.png",
      "public/assets/logo.png",
      "public/logo.png",
      "www/assets/icon/icon.png"
    ];
    for (const relativePath of candidateRelativePaths) {
      const absolutePath = path2.join(projectPath, relativePath);
      if (fs2.existsSync(absolutePath)) {
        return String(webview.asWebviewUri(vscode2.Uri.file(absolutePath)));
      }
    }
    const fallbackDirectories = [
      path2.join(projectPath, "src", "assets"),
      path2.join(projectPath, "public", "assets"),
      path2.join(projectPath, "resources")
    ];
    for (const directoryPath of fallbackDirectories) {
      const foundLogo = this.findLogoInDirectory(directoryPath);
      if (foundLogo) {
        return String(webview.asWebviewUri(vscode2.Uri.file(foundLogo)));
      }
    }
    return null;
  }
  /**
   * Busca un archivo de logo/icono en un directorio y un nivel de subdirectorios
   */
  findLogoInDirectory(directoryPath) {
    if (!fs2.existsSync(directoryPath)) {
      return null;
    }
    try {
      const entries = fs2.readdirSync(directoryPath, { withFileTypes: true });
      const imageFiles = entries.filter((entry) => entry.isFile() && /\.(png|jpe?g|svg|webp)$/i.test(entry.name)).map((entry) => entry.name);
      const preferredFile = imageFiles.find((fileName) => /(logo|icon|app)/i.test(fileName));
      if (preferredFile) {
        return path2.join(directoryPath, preferredFile);
      }
      const candidateSubDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((name) => ["icon", "icons", "img", "images", "branding", "logo"].includes(name.toLowerCase()));
      for (const subDirName of candidateSubDirs) {
        const subDirPath = path2.join(directoryPath, subDirName);
        const subEntries = fs2.readdirSync(subDirPath, { withFileTypes: true });
        const subPreferred = subEntries.find(
          (entry) => entry.isFile() && /\.(png|jpe?g|svg|webp)$/i.test(entry.name) && /(logo|icon|app)/i.test(entry.name)
        );
        if (subPreferred) {
          return path2.join(subDirPath, subPreferred.name);
        }
      }
    } catch (error) {
      this.logger.debug(`[SidebarProvider] Error searching logo in ${directoryPath}:`, error);
    }
    return null;
  }
};

// src/extension.ts
function activate(context) {
  console.log("[Myrmidon] Extension activated");
  try {
    const detector = new ProjectDetector();
    const projects = detector.detectProjects();
    console.log(`[Myrmidon] Found ${projects.length} projects:`, projects);
    const sidebarProvider = new SidebarProvider(context.extensionUri, projects);
    context.subscriptions.push(
      vscode3.window.registerWebviewViewProvider(
        "myrmidon-vista-panel",
        sidebarProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true
          }
        }
      )
    );
    console.log("[Myrmidon] Sidebar provider registered successfully");
  } catch (error) {
    console.error("[Myrmidon] Error during activation:", error);
    vscode3.window.showErrorMessage("Error initializing Myrmidon extension");
  }
}
function deactivate() {
  console.log("[Myrmidon] Extension deactivated");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
