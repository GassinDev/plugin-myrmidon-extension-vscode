/**
 * Generador de contenido HTML del webview
 */

import { Project, ProjectConfig } from '../types';
import { PROJECT_CONFIGS } from '../constants';

export class WebviewContent {
    /**
     * Genera el HTML completo del webview
     */
    static generate(projects: Project[], terminals: any[] = [], extensionUri?: any, webview?: any): string {
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
        <!-- Título -->
        <header class="extension-header">
            <h1 class="extension-title">MYRMIDON</h1>
        </header>

        <!-- Selector de terminal -->
        <div class="terminal-selector-wrapper">
            <label for="terminalSelect" class="terminal-label">🖥️ TERMINAL</label>
            <select class="terminal-select" id="terminalSelect" onchange="selectTerminal()">
                <option value="">Selecciona una terminal...</option>
                ${terminalsHtml}
            </select>
            <span class="terminal-status" id="terminalStatus"></span>
            <div class="terminal-hint">
                <small>💡 Terminal externa: Se abrirá el terminal configurado en VS Code. El comando se copiará automáticamente.</small>
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
                        <span class="project-quick-title">UTILIDADES RÁPIDAS</span>
                        <span class="project-quick-current" id="quickProjectName">Sin proyecto</span>
                    </div>
                    <div class="project-quick-grid">
                        <button type="button" class="project-quick-btn" data-project-action="open-folder" onclick="projectQuickAction('open-folder')" disabled>📁 Abrir carpeta</button>
                        <button type="button" class="project-quick-btn" data-project-action="copy-path" onclick="projectQuickAction('copy-path')" disabled>📋 Copiar ruta</button>
                        <button type="button" class="project-quick-btn" data-project-action="open-key-file" onclick="projectQuickAction('open-key-file')" disabled>🧩 Archivo clave</button>
                        <button type="button" class="project-quick-btn" data-project-action="open-project-terminal" onclick="projectQuickAction('open-project-terminal')" disabled>🖥️ Terminal proyecto</button>
                    </div>
                </div>
            </div>

            <!-- Sección de funciones y especificaciones -->
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
    private static generateTerminalOptions(terminals: any[]): string {
        if (!terminals || terminals.length === 0) {
            return `
                <optgroup label="VS Code">
                    <option value="vscode:new">+ Crear nueva terminal</option>
                </optgroup>
                <optgroup label="Externa">
                    <option value="external:native">🖥️ Terminal Externa</option>
                </optgroup>
            `;
        }

        const vsCodeTerminals = terminals
            .filter((t: any) => t.type === 'vscode')
            .map((t: any) => `<option value="${t.id}">${t.name}</option>`)
            .join('');

        const externalTerminals = terminals
            .filter((t: any) => t.type === 'external')
            .map((t: any) => `<option value="${t.id}">${t.name}</option>`)
            .join('');

        return `
            <optgroup label="VS Code">
                ${vsCodeTerminals}
                <option value="vscode:new">+ Crear nueva terminal</option>
            </optgroup>
            <optgroup label="Externa">
                ${externalTerminals}
                <option value="external:native">🖥️ Terminal Externa</option>
            </optgroup>
        `;
    }

    /**
     * Genera las opciones del selector de proyectos
     */
    private static generateProjectOptions(projects: Project[]): string {
        return projects
            .map(project => {
                return `<option value="${project.name}" data-type="${project.type}">${project.name}</option>`;
            })
            .join('');
    }

    /**
     * Genera la leyenda pequeña de stacks al lado del selector
     */
    private static generateProjectTypeLegend(extensionUri?: any, webview?: any): string {
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
    private static getMediaUri(fileName: string, extensionUri?: any, webview?: any): string {
        if (extensionUri && webview) {
            const mediaUri = extensionUri.with({ path: `${extensionUri.path}/media/${fileName}` });
            return String(webview.asWebviewUri(mediaUri));
        }

        return `../media/${fileName}`;
    }

    /**
     * Mapa de orden recomendado para especificaciones por tipo de proyecto
     */
    private static getVersionKeyMap(): Record<string, string[]> {
        const versionKeyMap: Record<string, string[]> = {};

        Object.entries(PROJECT_CONFIGS).forEach(([type, config]) => {
            versionKeyMap[type] = config.versionKeys || [];
        });

        return versionKeyMap;
    }

    /**
     * Genera las secciones de información de cada tipo de proyecto
     */
    private static generateProjectInfoSections(extensionUri?: any, webview?: any): string {
        return ['laravel', 'ionic', 'other']
            .map(type => {
                const config = PROJECT_CONFIGS[type];
                const versionsHtml = this.generateVersionsHtml(config);
                const commandsHtml = this.generateCommandsHtml(config);
                const healthHtml = this.generateProjectHealthHtml(type);
                const liveLogsHtml = this.generateLiveLogsHtml(type);
                const appLogoHtml = type === 'ionic' ? this.generateIonicLogoHtml() : '';
                const iconUrl = config.icon.includes('.svg') ? this.getMediaUri(config.icon, extensionUri, webview) : null;
                const isEmoji = !config.icon.includes('.svg');

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
                        
                        ${commandsHtml ? `<div class="project-functions">${commandsHtml}</div>` : ''}

                        ${healthHtml}
                        
                        ${versionsHtml ? `<div class="project-specifications">${appLogoHtml}${versionsHtml}</div>` : ''}

                        ${liveLogsHtml}
                        
                        <div class="project-path-info">
                            <span class="path-label">Ubicación:</span>
                            <code class="project-path" id="projectPath${this.capitalize(type)}"></code>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Genera bloque de salud del proyecto
     */
    private static generateProjectHealthHtml(type: string): string {
        const capType = this.capitalize(type);
        return `
            <div class="project-health-section">
                <h4 class="section-heading">SALUD DEL PROYECTO</h4>
                <div class="health-summary health-ok" id="healthSummary${capType}">
                    Esperando validación...
                </div>
                <div class="health-checks-grid" id="healthChecks${capType}"></div>
            </div>
        `;
    }

    /**
     * Genera bloque de logs en vivo
     */
    private static generateLiveLogsHtml(type: string): string {
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
    private static generateCommandsHtml(config: ProjectConfig): string {
        if (!config.commands || config.commands.length === 0) {
            return '';
        }

        return `
            <div class="commands-section">
                <h4 class="section-heading">FUNCIONES</h4>
                <div class="commands-grid">
                    ${config.commands.map(cmd => {
            const escapedCommand = cmd.command.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const showCopyButton = cmd.id !== 'ionic-prepare-release';

            return `
                            <div class="command-card" title="${cmd.description}">
                                <div class="command-top-row">
                                    <button type="button" class="command-run-btn" onclick="executeCommand('${cmd.id}', '${escapedCommand}')">
                                        <span class="command-label">${cmd.label}</span>
                                    </button>
                                    ${showCopyButton
                    ? `<button type="button" class="command-copy-btn" title="Copiar comando" aria-label="Copiar comando" onclick="copyCommand(event, '${cmd.id}', '${escapedCommand}')">📋</button>`
                    : ''}
                                </div>
                                <code class="command-code">${cmd.command}</code>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Genera el HTML para mostrar versiones/especificaciones
     */
    private static generateVersionsHtml(config: ProjectConfig): string {
        if (!config.versionKeys || config.versionKeys.length === 0) {
            return '';
        }

        return `
            <div class="specifications-section">
                <h4 class="section-heading">ESPECIFICACIONES</h4>
                <div class="versions-grid" id="versions${this.capitalize(config.type)}">
                    <!-- Se rellena dinámicamente con JavaScript -->
                </div>
            </div>
        `;
    }

    /**
     * Genera el bloque visual para el logo de la app Ionic
     */
    private static generateIonicLogoHtml(): string {
        return `
            <div class="app-logo-section" id="appLogoSectionIonic">
                <div class="app-logo-header">LOGO ACTUAL DE LA APP</div>
                <div class="app-logo-preview">
                    <img id="appLogoIonic" class="app-logo-image" alt="Logo de la app" />
                    <span id="appLogoIonicEmpty" class="app-logo-empty">No se detectó logo del proyecto</span>
                </div>
            </div>
        `;
    }

    /**
     * Obtiene los estilos CSS
     */
    private static getStyles(): string {
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

        /* Encabezado de extensión */
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

        /* Información del proyecto */
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

        /* Descripción */
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

        /* Ubicación del proyecto */
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
    private static getScripts(versionKeyMap: Record<string, string[]>): string {
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
                        + '<button type="button" class="runtime-stop-btn" data-runtime-id="' + runId + '" title="Detener ejecución" aria-label="Detener ejecución">⏹</button>'
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
                    + '<option value="external:native">🖥️ Terminal Externa</option>'
                    + '</optgroup>';
            }
            
            if (message.command === 'updateProjectInfo') {
                const project = message.project;
                const typeCapitalized = project.type.charAt(0).toUpperCase() + project.type.slice(1);
                
                // Mostrar la sección correspondiente
                document.querySelectorAll('.project-info').forEach(el => el.classList.remove('active'));
                const infoSection = document.getElementById(project.type + 'Info');
                if (infoSection) {
                    infoSection.classList.add('active');
                }

                // Actualizar información
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
                                                <button type="button" class="app-url-edit-btn laravel-env-edit-btn" title="Editar APP_URL" data-env-key="APP_URL" data-current-value="\${encodedValue}">✏️</button>
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
                                                <button type="button" class="app-url-edit-btn ionic-api-edit-btn" title="Editar \${safeKey}" data-api-key="\${safeKey}" data-current-value="\${encodedValue}">✏️</button>
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
                                                <button type="button" class="app-url-edit-btn laravel-env-edit-btn" title="Editar \${safeKey}" data-env-key="\${safeKey}" data-current-value="\${encodedValue}">✏️</button>
                                            </div>
                                        </div>
                                    \`;
                                })
                                .join('');

                            dbSectionHtml = \`
                                <div class="version-item db-connection-item">
                                    <span class="version-key db-connection-title">CONEXIÓN BBDD</span>
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
    private static capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
