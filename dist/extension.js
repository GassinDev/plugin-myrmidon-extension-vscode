"use strict";var B=Object.create;var P=Object.defineProperty;var N=Object.getOwnPropertyDescriptor;var V=Object.getOwnPropertyNames;var U=Object.getPrototypeOf,D=Object.prototype.hasOwnProperty;var O=(h,e)=>{for(var t in e)P(h,t,{get:e[t],enumerable:!0})},C=(h,e,t,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of V(e))!D.call(h,o)&&o!==t&&P(h,o,{get:()=>e[o],enumerable:!(r=N(e,o))||r.enumerable});return h};var j=(h,e,t)=>(t=h!=null?B(U(h)):{},C(e||!h||!h.__esModule?P(t,"default",{value:h,enumerable:!0}):t,h)),H=h=>C(P({},"__esModule",{value:!0}),h);var Q={};O(Q,{activate:()=>q,deactivate:()=>K});module.exports=H(Q);var $=j(require("vscode"));var f=j(require("fs")),b=j(require("path")),I=j(require("vscode"));var A=2,R=[".",".git",".vscode",".idea","node_modules","vendor","dist","build",".next","coverage"],z={type:"laravel",icon:"laravel-svgrepo-com.svg",color:"#FF2D20",description:"Framework PHP para desarrollo backend. Incluye ORM Eloquent, migraciones, y autenticaci\xF3n integrada.",versionKeys:["version","laravel","php","phpunit","pest","APP_URL","DB_DATABASE","DB_USERNAME","DB_PASSWORD","min-stability","license"],commands:[{id:"laravel-serve",label:"Serve",command:"php artisan serve --host=<IP_LOCAL> --port=8000",description:"Inicia el servidor de desarrollo con la IP local del dispositivo"},{id:"laravel-migrate",label:"Migrate",command:"php artisan migrate",description:"Ejecuta las migraciones"},{id:"laravel-tinker",label:"Tinker",command:"php artisan tinker",description:"Abre la consola interactiva"},{id:"laravel-optimize-clear",label:"Optimize Clear",command:"php artisan optimize:clear",description:"Limpia caches optimizadas de Laravel"},{id:"laravel-config-clear",label:"Config Clear",command:"php artisan config:clear",description:"Limpia cach\xE9 de configuraci\xF3n"},{id:"laravel-cache-clear",label:"Cache Clear",command:"php artisan cache:clear",description:"Limpia cach\xE9 de aplicaci\xF3n"}]},_={type:"ionic",icon:"ionic light logo black.svg",color:"#3880FF",description:"Framework mobile h\xEDbrido basado en Angular/React/Vue. Compila para iOS, Android y web.",versionKeys:["app","apiUrl (dev)","apiUrl (prod)","version","ionic","@ionic/angular","@capacitor/core","@capacitor/android","@angular/core","typescript","node","package-manager"],commands:[{id:"ionic-install-deps",label:"Instalaci\xF3n dependencias",command:"npm i",description:"Instala dependencias del proyecto"},{id:"ionic-build",label:"Build",command:"ionic cap build android",description:"Compila para Android"},{id:"ionic-sync",label:"Sync",command:"ionic cap sync",description:"Sincroniza archivos y plugins"},{id:"ionic-run-device",label:"Run Device",command:"ionic cap run android -l --external",description:"Ejecuta en dispositivo"},{id:"ionic-serve",label:"Run Web",command:"ionic serve",description:"Ejecuta en navegador"},{id:"ionic-prepare-release",label:"Prepare To Release",command:"build + sync + signed aab",description:"Prepara un Android App Bundle firmado para Play Store"}]},W={type:"other",icon:"\u{1F4E6}",color:"#808080",description:"Proyecto no identificado.",versionKeys:[],commands:[]},S={laravel:z,ionic:_,other:W};var L=class{logger=console;detectProjects(){let e=[];try{if(!I.workspace.workspaceFolders)return this.logger.log("No workspace folders found"),e;for(let t of I.workspace.workspaceFolders){let r=t.uri.fsPath,o=b.basename(r),n=this.detectProjectType(r);n?e.push({name:o,type:n,path:r,versions:this.extractVersions(r,n)}):e.push(...this.exploreDirectory(r))}}catch(t){this.logger.error("Error detecting projects:",t)}return e}detectProjectType(e){try{if(this.hasLaravelMarkers(e))return"laravel";if(this.hasIonicMarkers(e))return"ionic"}catch(t){this.logger.error(`Error detecting project type in ${e}:`,t)}return null}hasLaravelMarkers(e){try{let t=b.join(e,"composer.json");if(!f.existsSync(t))return!1;let r=f.readFileSync(t,"utf8"),o=JSON.parse(r);return!!(o?.require?.["laravel/framework"]||o?.requireDev?.["laravel/framework"])}catch(t){this.logger.debug(`Error checking Laravel markers in ${e}:`,t)}return!1}hasIonicMarkers(e){try{let t=b.join(e,"package.json");if(!f.existsSync(t))return!1;let r=f.readFileSync(t,"utf8"),o=JSON.parse(r),n={...o.dependencies||{},...o.devDependencies||{}};return!!(n["@ionic/angular"]||n["@ionic/core"]||n["@capacitor/core"]||n.ionic)}catch(t){this.logger.debug(`Error checking Ionic markers in ${e}:`,t)}return!1}exploreDirectory(e,t=A,r=0){let o=[];if(r>t)return o;try{let n=f.readdirSync(e,{withFileTypes:!0});for(let i of n)if(!(R.includes(i.name)||i.name.startsWith("."))&&i.isDirectory()){let s=b.join(e,i.name),c=this.detectProjectType(s);c?o.push({name:i.name,type:c,path:s,versions:this.extractVersions(s,c)}):r<t&&o.push(...this.exploreDirectory(s,t,r+1))}}catch(n){this.logger.debug(`Error exploring directory ${e}:`,n)}return o}extractVersions(e,t){let r={};try{if(t==="laravel"){let o=b.join(e,"composer.json");if(f.existsSync(o)){let i=f.readFileSync(o,"utf8"),s=JSON.parse(i);s.version&&(r.version=s.version),s["minimum-stability"]&&(r["min-stability"]=s["minimum-stability"]),s.license&&(r.license=Array.isArray(s.license)?s.license.join(", "):String(s.license)),s.require&&(s.require["laravel/framework"]&&(r.laravel=s.require["laravel/framework"]),s.require.php&&(r.php=s.require.php)),s.requireDev&&(s.requireDev["phpunit/phpunit"]&&(r.phpunit=s.requireDev["phpunit/phpunit"]),s.requireDev["pestphp/pest"]&&(r.pest=s.requireDev["pestphp/pest"]))}let n=b.join(e,".env");if(f.existsSync(n)){let s=f.readFileSync(n,"utf8").split(/\r?\n/);["APP_URL","DB_DATABASE","DB_USERNAME","DB_PASSWORD"].forEach(l=>{let p=s.find(m=>m.trim().startsWith(`${l}=`));if(!p)return;let v=p.split("=").slice(1).join("=").trim().replace(/^['"]|['"]$/g,"");if(l==="APP_URL"){v&&(r[l]=v);return}r[l]=v})}}else if(t==="ionic"){let o=b.join(e,"package.json");if(f.existsSync(o)){let s=f.readFileSync(o,"utf8"),c=JSON.parse(s),l={...c.dependencies,...c.devDependencies},p=b.join(e,"capacitor.config.json");if(f.existsSync(p))try{let g=f.readFileSync(p,"utf8"),v=JSON.parse(g);v?.appName&&(r.app=String(v.appName))}catch(g){this.logger.debug(`Error parsing capacitor config at ${p}:`,g)}c.version&&(r.version=c.version),c.engines?.node&&(r.node=c.engines.node),c.packageManager&&(r["package-manager"]=c.packageManager),l.ionic&&(r.ionic=l.ionic),l["@ionic/angular"]&&(r["@ionic/angular"]=l["@ionic/angular"]),l["@capacitor/core"]&&(r["@capacitor/core"]=l["@capacitor/core"]),l["@capacitor/android"]&&(r["@capacitor/android"]=l["@capacitor/android"]),l["@angular/core"]&&(r["@angular/core"]=l["@angular/core"]),l.typescript&&(r.typescript=l.typescript)}let n=this.readIonicApiUrl(e,[b.join("src","environments","environment.ts"),b.join("src","enviroments.ts"),"enviroments.ts","environments.ts"]);n&&(r["apiUrl (dev)"]=n);let i=this.readIonicApiUrl(e,[b.join("src","environments","environment.prod.ts"),b.join("src","enviroments.prod.ts"),"enviroments.prod.ts","environments.prod.ts"]);i&&(r["apiUrl (prod)"]=i)}}catch(o){this.logger.debug(`Error extracting versions from ${e}:`,o)}return r}readIonicApiUrl(e,t){for(let r of t){let o=b.join(e,r);if(f.existsSync(o))try{let n=f.readFileSync(o,"utf8"),i=this.parseApiUrlFromTypescript(n);if(i)return i}catch(n){this.logger.debug(`Error reading Ionic apiUrl from ${o}:`,n)}}return null}parseApiUrlFromTypescript(e){let t=e.split(/\r?\n/),r=!1;for(let o of t){let n=o.trim();if(!r&&n.startsWith("/*")){n.includes("*/")||(r=!0);continue}if(r){n.includes("*/")&&(r=!1);continue}if(n.startsWith("//"))continue;let i=o.match(/\bapiUrl\s*:\s*['"`]([^'"`]+)['"`]/);if(i?.[1])return i[1].trim();let s=o.match(/\bapiUrl\s*=\s*['"`]([^'"`]+)['"`]/);if(s?.[1])return s[1].trim()}return null}};var a=j(require("vscode")),d=j(require("fs")),F=j(require("os")),u=j(require("path")),M=require("child_process");var E=class{static generate(e,t=[],r,o){let n=this.generateProjectOptions(e),i=this.generateTerminalOptions(t),s=this.generateProjectTypeLegend(r,o),c=this.generateProjectInfoSections(r,o),l=this.getVersionKeyMap(),p=this.getStyles(),g=this.getScripts(l);return`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${p}
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
                ${i}
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
                                ${s}
                            </div>
                <select class="project-select" id="projectSelect" onchange="selectProject()">
                                <option value="">Selecciona un proyecto...</option>
                    ${n}
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
                ${c}
            </div>
        </div>
    </div>

    <script>
        ${g}
    </script>
</body>
</html>
		`}static generateTerminalOptions(e){if(!e||e.length===0)return`
                <optgroup label="VS Code">
                    <option value="vscode:new">+ Crear nueva terminal</option>
                </optgroup>
                <optgroup label="Externa">
                    <option value="external:native">\u{1F5A5}\uFE0F Terminal Externa</option>
                </optgroup>
            `;let t=e.filter(o=>o.type==="vscode").map(o=>`<option value="${o.id}">${o.name}</option>`).join(""),r=e.filter(o=>o.type==="external").map(o=>`<option value="${o.id}">${o.name}</option>`).join("");return`
            <optgroup label="VS Code">
                ${t}
                <option value="vscode:new">+ Crear nueva terminal</option>
            </optgroup>
            <optgroup label="Externa">
                ${r}
                <option value="external:native">\u{1F5A5}\uFE0F Terminal Externa</option>
            </optgroup>
        `}static generateProjectOptions(e){return e.map(t=>`<option value="${t.name}" data-type="${t.type}">${t.name}</option>`).join("")}static generateProjectTypeLegend(e,t){let r=this.getMediaUri(S.ionic.icon,e,t),o=this.getMediaUri(S.laravel.icon,e,t);return`
            <div class="project-type-icons" aria-hidden="true">
                <span class="type-icon-chip" title="Ionic">
                    <img src="${r}" alt="Ionic" class="type-icon" />
                </span>
                <span class="type-icon-chip" title="Laravel">
                    <img src="${o}" alt="Laravel" class="type-icon" />
                </span>
            </div>
        `}static getMediaUri(e,t,r){if(t&&r){let o=t.with({path:`${t.path}/media/${e}`});return String(r.asWebviewUri(o))}return`../media/${e}`}static getVersionKeyMap(){let e={};return Object.entries(S).forEach(([t,r])=>{e[t]=r.versionKeys||[]}),e}static generateProjectInfoSections(e,t){return["laravel","ionic","other"].map(r=>{let o=S[r],n=this.generateVersionsHtml(o),i=this.generateCommandsHtml(o),s=this.generateProjectHealthHtml(r),c=this.generateLiveLogsHtml(r),l=r==="ionic"?this.generateIonicLogoHtml():"",p=o.icon.includes(".svg")?this.getMediaUri(o.icon,e,t):null,g=!o.icon.includes(".svg");return`
                    <div class="project-info" id="${r}Info">
                        <div class="project-header">
                            <div class="project-icon-container">
                                ${g?`<span class="project-icon">${o.icon}</span>`:`<img src="${p}" alt="${r}" class="project-icon-large" />`}
                            </div>
                            <div class="project-header-info">
                                <h3 class="project-name" id="projectName${this.capitalize(r)}"></h3>
                                <p class="project-type">${r.toUpperCase()}</p>
                            </div>
                        </div>
                        
                        <div class="project-description">${o.description}</div>
                        
                        ${i?`<div class="project-functions">${i}</div>`:""}

                        ${s}
                        
                        ${n?`<div class="project-specifications">${l}${n}</div>`:""}

                        ${c}
                        
                        <div class="project-path-info">
                            <span class="path-label">Ubicaci\xF3n:</span>
                            <code class="project-path" id="projectPath${this.capitalize(r)}"></code>
                        </div>
                    </div>
                `}).join("")}static generateProjectHealthHtml(e){let t=this.capitalize(e);return`
            <div class="project-health-section">
                <h4 class="section-heading">SALUD DEL PROYECTO</h4>
                <div class="health-summary health-ok" id="healthSummary${t}">
                    Esperando validaci\xF3n...
                </div>
                <div class="health-checks-grid" id="healthChecks${t}"></div>
            </div>
        `}static generateLiveLogsHtml(e){let t=this.capitalize(e);return`
            <div class="project-live-logs-section">
                <h4 class="section-heading">LOGS EN VIVO</h4>
                <div class="live-logs-toolbar">
                    <div class="live-logs-filters">
                        <button type="button" class="live-log-filter-btn active" data-log-type="${e}" data-log-filter="all" onclick="setLogsFilter('${e}', 'all')">All</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${e}" data-log-filter="info" onclick="setLogsFilter('${e}', 'info')">Info</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${e}" data-log-filter="warning" onclick="setLogsFilter('${e}', 'warning')">Warn</button>
                        <button type="button" class="live-log-filter-btn" data-log-type="${e}" data-log-filter="error" onclick="setLogsFilter('${e}', 'error')">Error</button>
                    </div>
                    <button type="button" class="live-log-clear-btn" onclick="clearLiveLogs('${e}')">Limpiar</button>
                </div>
                <div class="live-logs-list" id="liveLogsList${t}">
                    <div class="live-log-empty">Sin logs por ahora</div>
                </div>
            </div>
        `}static generateCommandsHtml(e){return!e.commands||e.commands.length===0?"":`
            <div class="commands-section">
                <h4 class="section-heading">FUNCIONES</h4>
                <div class="commands-grid">
                    ${e.commands.map(t=>{let r=t.command.replace(/\\/g,"\\\\").replace(/'/g,"\\'"),o=t.id!=="ionic-prepare-release";return`
                            <div class="command-card" title="${t.description}">
                                <div class="command-top-row">
                                    <button type="button" class="command-run-btn" onclick="executeCommand('${t.id}', '${r}')">
                                        <span class="command-label">${t.label}</span>
                                    </button>
                                    ${o?`<button type="button" class="command-copy-btn" title="Copiar comando" aria-label="Copiar comando" onclick="copyCommand(event, '${t.id}', '${r}')">\u{1F4CB}</button>`:""}
                                </div>
                                <code class="command-code">${t.command}</code>
                            </div>
                        `}).join("")}
                </div>
            </div>
        `}static generateVersionsHtml(e){return!e.versionKeys||e.versionKeys.length===0?"":`
            <div class="specifications-section">
                <h4 class="section-heading">ESPECIFICACIONES</h4>
                <div class="versions-grid" id="versions${this.capitalize(e.type)}">
                    <!-- Se rellena din\xE1micamente con JavaScript -->
                </div>
            </div>
        `}static generateIonicLogoHtml(){return`
            <div class="app-logo-section" id="appLogoSectionIonic">
                <div class="app-logo-header">LOGO ACTUAL DE LA APP</div>
                <div class="app-logo-preview">
                    <img id="appLogoIonic" class="app-logo-image" alt="Logo de la app" />
                    <span id="appLogoIonicEmpty" class="app-logo-empty">No se detect\xF3 logo del proyecto</span>
                </div>
            </div>
        `}static getStyles(){return`
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
        `}static getScripts(e){return`
        const vscode = acquireVsCodeApi();
        const VERSION_KEY_MAP = ${JSON.stringify(e)};
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
        `}static capitalize(e){return e.charAt(0).toUpperCase()+e.slice(1)}};var T=class{constructor(e,t=[]){this._extensionUri=e;this.projects=t;this.logger.log(`[SidebarProvider] Initialized with ${this.projects.length} projects`,this.projects)}_extensionUri;projects;selectedProject=null;selectedTerminalId=null;logger=console;webviewView=null;runtimeSessions=new Map;runtimeHiddenTerminals=new Set;terminalLifecycleListenersRegistered=!1;liveLogEntries=[];maxLiveLogEntries=300;activeProjectLogType=null;watchedLaravelLogPath=null;watchedIonicLogPath=null;resolveWebviewView(e){this.logger.log("[SidebarProvider] Resolving webview view"),this.webviewView=e,this.registerTerminalLifecycleListeners();let t=a.workspace.workspaceFolders?.map(o=>o.uri)||[];e.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri,...t]};let r=this.getAvailableTerminals();e.webview.html=E.generate(this.projects,r,this._extensionUri,e.webview),this.setupMessageHandlers(e),this.pushTerminalAndRuntimeState(e),this.pushSelectedProjectInfo(e),this.refreshProjectInsights(e)}getAvailableTerminals(){let e=[];return a.window.terminals.forEach((t,r)=>{this.runtimeHiddenTerminals.has(t)||e.push({id:`vscode:${t.name}:${r}`,name:`\u{1F4DF} ${t.name||`Terminal ${r+1}`}`,type:"vscode"})}),e}setupMessageHandlers(e){e.webview.onDidReceiveMessage(t=>{switch(this.logger.log("[SidebarProvider] Message received:",t),t.command){case"terminalSelected":this.handleTerminalSelection(t.terminalId);break;case"executeCommand":this.handleCommandExecution(t.commandId,t.commandText,t.terminalId,e);break;case"projectSelected":this.handleProjectSelection(t.projectName,e);break;case"projectQuickAction":this.handleProjectQuickAction(t.action,t.projectName,e);break;case"editLaravelAppUrl":this.handleLaravelAppUrlEdit(t.currentValue,e);break;case"editLaravelEnvValue":this.handleLaravelEnvValueEdit(t.envKey,t.currentValue,e);break;case"editIonicApiUrl":this.handleIonicApiUrlEdit(t.apiKey,t.currentValue,e);break;case"copyCommand":this.handleCopyCommand(t.commandId,t.commandText);break;case"stopRuntimeSession":this.stopRuntimeSession(t.sessionId,e);break;case"clearLiveLogs":this.clearLiveLogs(e);break;default:this.logger.warn(`[SidebarProvider] Unknown command: ${t.command}`)}})}handleTerminalSelection(e){this.selectedTerminalId=e,this.logger.log(`[SidebarProvider] Terminal selected: ${e}`)}async handleCommandExecution(e,t,r,o){if(this.logger.log(`[SidebarProvider] Executing command: ${e}`),this.logger.log(`[SidebarProvider] Command text: ${t}`),this.logger.log(`[SidebarProvider] Terminal ID: ${r}`),!this.selectedProject){a.window.showErrorMessage("Por favor, selecciona un proyecto primero");return}if(!this.isRuntimeCommand(e)&&!r){a.window.showErrorMessage("Por favor, selecciona una terminal antes de ejecutar comandos");return}if(e==="ionic-prepare-release"){await this.handlePrepareToRelease(r,o);return}if(this.isRuntimeCommand(e)){await this.handleRuntimeCommand(e,t,o);return}e==="laravel-serve"&&(t=this.buildLaravelServeCommand());let i=`cd "${this.selectedProject.path}" && ${t}`;this.dispatchCommandToTerminal(r,i,o)}async handlePrepareToRelease(e,t){if(!this.selectedProject||this.selectedProject.type!=="ionic"){a.window.showErrorMessage("Prepare To Release solo est\xE1 disponible para proyectos Ionic");return}if(e.startsWith("external:")){a.window.showErrorMessage("Por seguridad, usa una terminal de VS Code para firmar el AAB");return}let r=this.selectedProject.path,o=u.join(r,"package.json");if(!d.existsSync(o)){a.window.showErrorMessage("No se encontr\xF3 package.json en el proyecto seleccionado");return}let n=this.getCurrentAppVersion(o)||"1.0.0",i=await a.window.showQuickPick([{label:"Mantener versi\xF3n actual",description:n,value:"keep"},{label:"Cambiar versi\xF3n",description:"Actualizar package.json antes del release",value:"change"}],{title:"Prepare To Release",placeHolder:`Versi\xF3n actual detectada: ${n}`,ignoreFocusOut:!0});if(!i)return;let s=n;if(i.value==="change"){let y=await a.window.showInputBox({title:"Nueva versi\xF3n",prompt:"Ingresa la versi\xF3n que se subir\xE1 (ej: 1.4.2)",value:n,ignoreFocusOut:!0,validateInput:x=>{let k=/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/;return x.trim()?k.test(x.trim())?null:"Formato sugerido: 1.0.0":"La versi\xF3n es obligatoria"}});if(!y)return;s=y.trim();try{this.updateAppVersion(o,s)}catch{return}this.syncSelectedProjectVersion(s),t.webview.postMessage({command:"updateProjectInfo",project:this.selectedProject})}let c=await this.pickKeystoreFile(r);if(!c)return;let l=await a.window.showInputBox({title:"Contrase\xF1a del keystore",prompt:"Ingresa la contrase\xF1a del keystore",password:!0,ignoreFocusOut:!0,validateInput:y=>y.trim()?null:"La contrase\xF1a es obligatoria"});if(!l)return;let p=await a.window.showInputBox({title:"Alias de firma",prompt:"Ingresa el alias del key (ej: upload)",ignoreFocusOut:!0,validateInput:y=>y.trim()?null:"El alias es obligatorio"});if(!p)return;let g=await a.window.showInputBox({title:"Contrase\xF1a del alias",prompt:"Ingresa la contrase\xF1a del alias (vac\xEDo = usar contrase\xF1a del keystore)",password:!0,ignoreFocusOut:!0});if(g===void 0)return;let v=g||l,m=await a.window.showQuickPick([{label:"Continuar y preparar release",description:`Versi\xF3n ${s} | ${u.basename(c)} | alias ${p}`,value:"continue"},{label:"Cancelar",value:"cancel"}],{title:"Confirmaci\xF3n final",placeHolder:"Se ejecutar\xE1 build, sync y bundleRelease firmado",ignoreFocusOut:!0});if(!m||m.value!=="continue")return;let w=this.buildPrepareReleaseCommand({projectPath:r,keystorePath:c,storePassword:l,keyAlias:p,keyPassword:v});this.dispatchCommandToTerminal(e,w,t),a.window.showInformationMessage(`\u2713 Flujo de release enviado (versi\xF3n ${s})`)}dispatchCommandToTerminal(e,t,r){e==="vscode:new"?this.executeInNewVSCodeTerminal(t,r):e.startsWith("vscode:")?this.executeInSelectedVSCodeTerminal(e,t,r):e.startsWith("external:")&&this.executeInExternalTerminal(t,e)}isRuntimeCommand(e){return["laravel-serve","ionic-serve","ionic-run-device"].includes(e)}resolveRuntimeLabel(e){return e==="laravel-serve"?"Run Laravel":"Run Ionic"}wrapRuntimeCommandForLogging(e,t,r){if(!["ionic-serve","ionic-run-device"].includes(t))return e;let o=u.join(r,".myrmidon","logs"),n=u.join(o,"ionic-runtime.log");return d.mkdirSync(o,{recursive:!0}),d.existsSync(n)||d.writeFileSync(n,"","utf8"),process.platform==="win32"?`(${e}) >> "${n}" 2>&1`:`(${e}) 2>&1 | tee -a "${n}"`}async handleRuntimeCommand(e,t,r){if(!this.selectedProject)return;let o=this.resolveRuntimeLabel(e),n=e==="laravel-serve"?this.buildLaravelServeCommand():t,i=this.wrapRuntimeCommandForLogging(n,e,this.selectedProject.path),s=`cd "${this.selectedProject.path}" && ${i}`,c=a.window.createTerminal({name:`Myrmidon ${o} ${this.runtimeSessions.size+1}`,hideFromUser:!1}),l=`runtime:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;this.runtimeSessions.set(l,{id:l,label:o,commandId:e,projectName:this.selectedProject.name,projectType:this.selectedProject.type,terminal:c}),this.runtimeHiddenTerminals.add(c),c.show(),c.sendText(s),this.logger.log(`[SidebarProvider] Runtime session started: ${o} (${l})`),this.appendLiveLogEntry({level:"info",source:o,message:`Ejecuci\xF3n iniciada (${e})`},r),this.pushTerminalAndRuntimeState(r),a.window.showInformationMessage(`\u2713 ${o} en ejecuci\xF3n`)}stopRuntimeSession(e,t){if(!e){a.window.showErrorMessage("No se pudo detener la ejecuci\xF3n: sesi\xF3n inv\xE1lida");return}let r=this.runtimeSessions.get(e);if(!r){this.pushTerminalAndRuntimeState(t);return}this.runtimeSessions.delete(e),this.runtimeHiddenTerminals.delete(r.terminal);try{r.terminal.sendText("",!1)}catch(o){this.logger.debug("[SidebarProvider] Ctrl+C not sent to runtime terminal:",o)}r.terminal.dispose(),this.logger.log(`[SidebarProvider] Runtime session stopped: ${r.label} (${e})`),this.appendLiveLogEntry({level:"info",source:r.label,message:"Ejecuci\xF3n detenida por el usuario"},t),this.pushTerminalAndRuntimeState(t),a.window.showInformationMessage(`\u2713 ${r.label} detenido`)}registerTerminalLifecycleListeners(){this.terminalLifecycleListenersRegistered||(this.terminalLifecycleListenersRegistered=!0,a.window.onDidCloseTerminal(e=>{let t=!1,r="",o="";this.runtimeHiddenTerminals.has(e)&&this.runtimeHiddenTerminals.delete(e);for(let[n,i]of this.runtimeSessions.entries())if(i.terminal===e){this.runtimeSessions.delete(n),r=i.label,o=n,t=!0;break}t&&(this.logger.log(`[SidebarProvider] Runtime session removed after terminal close (${o})`),this.appendLiveLogEntry({level:"warning",source:r||"Runtime",message:"La terminal fue cerrada y la ejecuci\xF3n termin\xF3"})),this.pushTerminalAndRuntimeState()}))}detectLogLevel(e){let t=e.toLowerCase();return/(^|\W)(error|fatal|exception|failed|traceback)(\W|$)/.test(t)?"error":/(^|\W)(warn|warning|deprecated)(\W|$)/.test(t)?"warning":"info"}appendLiveLogEntry(e,t,r){let o=r||this.activeProjectLogType||this.selectedProject?.type||"other";this.activeProjectLogType===o&&(this.liveLogEntries.push({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,level:e.level,source:e.source,message:e.message,timestamp:new Date().toISOString()}),this.liveLogEntries.length>this.maxLiveLogEntries&&(this.liveLogEntries=this.liveLogEntries.slice(-this.maxLiveLogEntries)),this.pushLiveLogs(t))}clearLiveLogs(e){this.liveLogEntries=[],this.pushLiveLogs(e)}pushLiveLogs(e){let t=e||this.webviewView;!t||!this.activeProjectLogType||t.webview.postMessage({command:"updateLiveLogs",projectType:this.activeProjectLogType,entries:this.liveLogEntries})}refreshProjectInsights(e){let t=e||this.webviewView;if(!t||!this.selectedProject)return;this.stopLaravelLogWatcher(),this.stopIonicLogWatcher(),this.activeProjectLogType=this.selectedProject.type,this.liveLogEntries=[];let r=this.buildProjectHealth(this.selectedProject);t.webview.postMessage({command:"updateProjectHealth",projectType:this.selectedProject.type,health:r}),this.pushLiveLogs(t),this.selectedProject.type==="laravel"&&this.startLaravelLogWatcher(this.selectedProject.path),this.selectedProject.type==="ionic"&&this.startIonicLogWatcher(this.selectedProject.path)}startLaravelLogWatcher(e){let t=u.join(e,"storage","logs","laravel.log");if(this.watchedLaravelLogPath=t,!d.existsSync(t)){this.appendLiveLogEntry({level:"info",source:"Laravel Log",message:"A\xFAn no existe storage/logs/laravel.log"});return}d.readFileSync(t,"utf8").split(/\r?\n/).filter(n=>n.trim().length>0).slice(-60).forEach(n=>{this.appendLiveLogEntry({level:this.detectLogLevel(n),source:"Laravel Log",message:n})}),d.watchFile(t,{interval:1e3},(n,i)=>{if(!this.watchedLaravelLogPath||this.watchedLaravelLogPath!==t||n.size===i.size)return;let s=n.size<i.size?0:i.size,c=n.size-s;if(c<=0)return;let l=d.openSync(t,"r");try{let p=Buffer.alloc(c);d.readSync(l,p,0,c,s),p.toString("utf8").split(/\r?\n/).map(v=>v.trim()).filter(v=>v.length>0).forEach(v=>{this.appendLiveLogEntry({level:this.detectLogLevel(v),source:"Laravel Log",message:v})})}catch(p){this.logger.debug("[SidebarProvider] Error reading Laravel log chunk:",p)}finally{d.closeSync(l)}})}stopLaravelLogWatcher(){this.watchedLaravelLogPath&&(d.unwatchFile(this.watchedLaravelLogPath),this.watchedLaravelLogPath=null)}startIonicLogWatcher(e){let t=u.join(e,".myrmidon","logs"),r=u.join(t,"ionic-runtime.log");d.mkdirSync(t,{recursive:!0}),d.existsSync(r)||d.writeFileSync(r,"","utf8"),this.watchedIonicLogPath=r,d.readFileSync(r,"utf8").split(/\r?\n/).filter(i=>i.trim().length>0).slice(-80).forEach(i=>{this.appendLiveLogEntry({level:this.detectLogLevel(i),source:"Ionic Runtime",message:i})}),d.watchFile(r,{interval:900},(i,s)=>{if(!this.watchedIonicLogPath||this.watchedIonicLogPath!==r||i.size===s.size)return;let c=i.size<s.size?0:s.size,l=i.size-c;if(l<=0)return;let p=d.openSync(r,"r");try{let g=Buffer.alloc(l);d.readSync(p,g,0,l,c),g.toString("utf8").split(/\r?\n/).map(m=>m.trim()).filter(m=>m.length>0).forEach(m=>{this.appendLiveLogEntry({level:this.detectLogLevel(m),source:"Ionic Runtime",message:m})})}catch(g){this.logger.debug("[SidebarProvider] Error reading Ionic runtime log chunk:",g)}finally{d.closeSync(p)}})}stopIonicLogWatcher(){this.watchedIonicLogPath&&(d.unwatchFile(this.watchedIonicLogPath),this.watchedIonicLogPath=null)}buildProjectHealth(e){let t=[];if(e.type==="laravel"){let i=d.existsSync(u.join(e.path,"vendor"));t.push({id:"laravel-deps",label:"Dependencias Composer",status:i?"ok":"error",detail:i?"vendor/ detectado":"Falta vendor/. Ejecuta composer install"});let s=["artisan","composer.json",".env"].every(y=>d.existsSync(u.join(e.path,y)));t.push({id:"laravel-files",label:"Archivos clave",status:s?"ok":"error",detail:s?"artisan/composer/.env listos":"Faltan archivos clave de Laravel"});let c=this.readInstalledVersion("php -v",/(PHP\s+)(\d+\.\d+(?:\.\d+)?)/i),l=e.versions?.php||"",p=this.isVersionCompatible(c,l);t.push({id:"laravel-php",label:"Compatibilidad PHP",status:c&&p?"ok":"warn",detail:c?`Instalada ${c}${l?` | Requerida ${l}`:""}`:"No se pudo detectar versi\xF3n local de PHP"});let g=e.versions?.APP_URL||"",v=e.versions?.DB_DATABASE||"",m=e.versions?.DB_USERNAME||"",w=!!(g&&v&&m);t.push({id:"laravel-config",label:"Configuraci\xF3n base",status:w?"ok":"warn",detail:w?"APP_URL y conexi\xF3n BBDD principal configuradas":"Revisa APP_URL / DB_DATABASE / DB_USERNAME"})}else if(e.type==="ionic"){let i=d.existsSync(u.join(e.path,"node_modules"));t.push({id:"ionic-deps",label:"Dependencias npm",status:i?"ok":"error",detail:i?"node_modules detectado":"Falta node_modules. Ejecuta npm i"});let s=["package.json","ionic.config.json"].every(w=>d.existsSync(u.join(e.path,w)));t.push({id:"ionic-files",label:"Archivos clave",status:s?"ok":"error",detail:s?"package.json e ionic.config.json presentes":"Faltan archivos clave de Ionic"});let c=this.readInstalledVersion("node -v",/(v)(\d+\.\d+(?:\.\d+)?)/i),l=e.versions?.node||"",p=this.isVersionCompatible(c,l);t.push({id:"ionic-node",label:"Compatibilidad Node",status:c&&p?"ok":"warn",detail:c?`Instalada ${c}${l?` | Requerida ${l}`:""}`:"No se pudo detectar versi\xF3n local de Node.js"});let g=d.existsSync(u.join(e.path,"capacitor.config.json")),v=d.existsSync(u.join(e.path,"android")),m=g&&v;t.push({id:"ionic-config",label:"Configuraci\xF3n base",status:m?"ok":"warn",detail:m?"Capacitor y plataforma Android detectados":"Revisa capacitor.config.json y carpeta android/"})}else{let i=d.existsSync(e.path);t.push({id:"generic-root",label:"Ruta del proyecto",status:i?"ok":"error",detail:i?"Carpeta accesible":"Ruta de proyecto no accesible"})}let r=t.some(i=>i.status==="error"),o=t.some(i=>i.status==="warn");return{overallStatus:r?"error":o?"warn":"ok",summary:`${t.length} checks | ${t.filter(i=>i.status==="ok").length} OK`,checks:t,generatedAt:new Date().toISOString()}}readInstalledVersion(e,t){try{return(0,M.execSync)(e,{encoding:"utf8"}).match(t)?.[2]||null}catch(r){return this.logger.debug(`[SidebarProvider] Could not resolve version with command: ${e}`,r),null}}isVersionCompatible(e,t){if(!e||!t)return!0;let r=this.extractMajorMinor(e),o=this.extractMajorMinor(t);return!r||!o?!0:r.major!==o.major?r.major>o.major:r.minor>=o.minor}extractMajorMinor(e){let r=e.trim().replace(/^v/i,"").match(/(\d+)\.(\d+)/);return r?{major:Number(r[1]),minor:Number(r[2])}:null}getRuntimeRunsPayload(){return Array.from(this.runtimeSessions.values()).map(e=>({id:e.id,label:e.label,commandId:e.commandId}))}pushTerminalAndRuntimeState(e){let t=e||this.webviewView;if(!t)return;let r=this.getAvailableTerminals();this.selectedTerminalId&&r.some(n=>n.id===this.selectedTerminalId)||(this.selectedTerminalId=""),t.webview.postMessage({command:"updateTerminals",terminals:r,selectedTerminalId:this.selectedTerminalId||""}),t.webview.postMessage({command:"updateRuntimeRuns",runs:this.getRuntimeRunsPayload()})}getCurrentAppVersion(e){try{let t=d.readFileSync(e,"utf8");return JSON.parse(t).version||null}catch(t){return this.logger.error("[SidebarProvider] Error reading package.json version:",t),null}}updateAppVersion(e,t){try{let r=d.readFileSync(e,"utf8"),o=JSON.parse(r);o.version=t,d.writeFileSync(e,`${JSON.stringify(o,null,2)}
`,"utf8")}catch(r){throw a.window.showErrorMessage(`No se pudo actualizar la versi\xF3n: ${r.message}`),r}}syncSelectedProjectVersion(e){this.selectedProject&&(this.selectedProject.versions||(this.selectedProject.versions={}),this.selectedProject.versions.app=e)}async pickKeystoreFile(e){let r=(await this.findKeystoreFiles(e)).map(n=>({label:u.basename(n),description:u.relative(e,n),value:n}));r.push({label:"$(folder-opened) Buscar archivo manualmente...",description:"Seleccionar un .jks o .keystore",value:"",browse:!0});let o=await a.window.showQuickPick(r,{title:"Seleccionar keystore",placeHolder:"Elige el keystore para firmar el AAB",ignoreFocusOut:!0});return o?o.browse?(await a.window.showOpenDialog({canSelectMany:!1,canSelectFolders:!1,defaultUri:a.Uri.file(e),openLabel:"Seleccionar keystore",filters:{Keystore:["jks","keystore"]}}))?.[0]?.fsPath||null:o.value:null}async findKeystoreFiles(e){let t="**/{node_modules,dist,build,vendor,.git}/**",[r,o]=await Promise.all([a.workspace.findFiles(new a.RelativePattern(e,"**/*.jks"),t,100),a.workspace.findFiles(new a.RelativePattern(e,"**/*.keystore"),t,100)]),n=[...r,...o].map(s=>s.fsPath);return Array.from(new Set(n)).sort((s,c)=>{let l=this.getKeystorePriority(s),p=this.getKeystorePriority(c);return l!==p?l-p:s.localeCompare(c)})}getKeystorePriority(e){let t=e.toLowerCase();return t.includes(`${u.sep}keystore${u.sep}`)?0:t.includes(`${u.sep}android${u.sep}`)?1:2}buildPrepareReleaseCommand(e){let t=process.platform==="win32"?"gradlew.bat":"./gradlew",r=this.escapeForShellDoubleQuotes(e.projectPath),o=this.escapeForShellDoubleQuotes(e.keystorePath),n=this.escapeForShellDoubleQuotes(e.storePassword),i=this.escapeForShellDoubleQuotes(e.keyAlias),s=this.escapeForShellDoubleQuotes(e.keyPassword);return`cd "${r}" && ionic cap build android && ionic cap sync android && cd android && ${t} bundleRelease -Pandroid.injected.signing.store.file="${o}" -Pandroid.injected.signing.store.password="${n}" -Pandroid.injected.signing.key.alias="${i}" -Pandroid.injected.signing.key.password="${s}"`}escapeForShellDoubleQuotes(e){return e.replace(/[\\"`$]/g,"\\$&")}executeInSelectedVSCodeTerminal(e,t,r){let o=this.resolveVSCodeTerminalFromId(e);o?(o.show(),o.sendText(t),this.logger.log(`[SidebarProvider] Command sent to existing terminal: ${o.name}`),a.window.showInformationMessage(`\u2713 Ejecutando en terminal: ${o.name}`)):r&&this.executeInNewVSCodeTerminal(t,r)}resolveVSCodeTerminalFromId(e){if(!e.startsWith("vscode:"))return;let t=e.lastIndexOf(":");if(t<=7)return;let r=e.slice(7,t),o=e.slice(t+1),n=Number(o);if(!Number.isNaN(n)){let i=a.window.terminals[n];if(i&&i.name===r)return i}return a.window.terminals.find(i=>i.name===r)}executeInNewVSCodeTerminal(e,t){let r=a.window.createTerminal({name:"Myrmidon",hideFromUser:!1});r.show(),r.sendText(e),this.selectedTerminalId=`vscode:${r.name}:${a.window.terminals.length-1}`,this.logger.log(`[SidebarProvider] Created new terminal: ${r.name}`),a.window.showInformationMessage("\u2713 Ejecutando en nueva terminal VS Code"),this.pushTerminalAndRuntimeState(t)}async executeInExternalTerminal(e,t){this.logger.log(`[SidebarProvider] Opening external terminal with command: ${e}`),await a.env.clipboard.writeText(e);try{await a.commands.executeCommand("workbench.action.terminal.openNativeConsole"),this.logger.log("[SidebarProvider] External terminal opened"),a.window.showInformationMessage(`\u2713 Terminal externa abierta

Comando copiado al portapapeles:
${e}

Pega (Ctrl+V) y presiona Enter`)}catch(r){this.logger.error("[SidebarProvider] Error opening external terminal:",r),a.window.showErrorMessage(`No se pudo abrir terminal externa. Intenta manualmente:

${e}`)}}async openNativeTerminal(e){try{let t=require("fs"),r=require("path"),n=require("os").tmpdir(),i=r.join(n,`myrmidon_${Date.now()}.sh`);t.writeFileSync(i,`#!/bin/bash
${e}
`,{mode:493});let{execFile:s}=require("child_process");s("sh",[i],c=>{t.unlink(i,l=>{l&&this.logger.warn("Could not delete temp script:",l)}),c?(this.logger.error("[SidebarProvider] Error in native terminal:",c),a.window.showErrorMessage(`Error al ejecutar en terminal nativa: ${c.message}`)):a.window.showInformationMessage("\u2713 Ejecutando en terminal nativa")})}catch(t){this.logger.error("[SidebarProvider] Error opening native terminal:",t),a.window.showErrorMessage(`No se pudo abrir terminal nativa: ${t.message}`)}}handleProjectSelection(e,t){let r=this.projects.find(o=>o.name===e);if(!r){this.logger.warn(`[SidebarProvider] Project not found: ${e}`);return}this.selectedProject=r,this.logger.log(`[SidebarProvider] Project selected: ${r.name} (${r.type})`),this.pushSelectedProjectInfo(t),this.refreshProjectInsights(t)}async handleProjectQuickAction(e,t,r){let o=this.resolveTargetProject(t);if(!o){a.window.showErrorMessage("No hay un proyecto seleccionado para ejecutar esta acci\xF3n");return}switch(e){case"open-folder":{await a.commands.executeCommand("revealFileInOS",a.Uri.file(o.path));break}case"copy-path":{await a.env.clipboard.writeText(o.path),a.window.showInformationMessage("\u2713 Ruta del proyecto copiada al portapapeles");break}case"open-key-file":{let n=this.resolveKeyFileForProject(o);if(!n){a.window.showWarningMessage("No se encontr\xF3 un archivo clave para este proyecto");break}let i=await a.workspace.openTextDocument(a.Uri.file(n));await a.window.showTextDocument(i,{preview:!1});break}case"open-project-terminal":{let n=a.window.createTerminal({name:`Myrmidon ${o.name}`,cwd:o.path,hideFromUser:!1});n.show(),this.selectedTerminalId=`vscode:${n.name}:${a.window.terminals.length-1}`,this.pushTerminalAndRuntimeState(r);break}default:this.logger.warn(`[SidebarProvider] Unknown project quick action: ${e}`)}}resolveTargetProject(e){if(e){let t=this.projects.find(r=>r.name===e);if(t)return t}return this.selectedProject}resolveKeyFileForProject(e){let t={laravel:[".env","composer.json","routes/web.php"],ionic:["package.json","ionic.config.json","capacitor.config.json"],other:["README.md","package.json"]},r=t[e.type]||t.other;for(let o of r){let n=u.join(e.path,o);if(d.existsSync(n))return n}return null}pushSelectedProjectInfo(e){if(!this.selectedProject)return;let t={...this.selectedProject};if(this.selectedProject.type==="ionic"){let r=this.resolveIonicAppLogoUri(this.selectedProject.path,e.webview);r&&(t.appLogoUri=r)}e.webview.postMessage({command:"updateProjectInfo",project:t})}async handleLaravelAppUrlEdit(e,t){await this.handleLaravelEnvValueEdit("APP_URL",e,t)}async handleLaravelEnvValueEdit(e,t,r){if(!this.selectedProject||this.selectedProject.type!=="laravel"){a.window.showErrorMessage("La edici\xF3n de variables .env solo est\xE1 disponible para proyectos Laravel");return}if(!e||!["APP_URL","DB_DATABASE","DB_USERNAME","DB_PASSWORD"].includes(e)){a.window.showErrorMessage("Variable .env no soportada para edici\xF3n");return}let n=u.join(this.selectedProject.path,".env");if(!d.existsSync(n)){a.window.showErrorMessage("No se encontr\xF3 el archivo .env en el proyecto Laravel");return}let i={APP_URL:"URL base de la aplicaci\xF3n",DB_DATABASE:"nombre de la base de datos",DB_USERNAME:"usuario de la base de datos",DB_PASSWORD:"contrase\xF1a de la base de datos"},s=e==="DB_PASSWORD",c=await a.window.showInputBox({title:`Editar ${e}`,prompt:`Ingresa ${i[e]||"el nuevo valor"}`,value:t??this.selectedProject.versions?.[e]??"",password:e==="DB_PASSWORD",ignoreFocusOut:!0,validateInput:p=>!s&&!p.trim()?`${e} no puede estar vac\xEDa`:null});if(c===void 0)return;let l=s?c:c.trim();try{let p=d.readFileSync(n,"utf8"),g=p.includes(`\r
`)?`\r
`:`
`,v=this.escapeEnvValue(l),m=`${e}=${v}`,w=new RegExp(`^(\\s*${this.escapeRegexForPattern(e)}\\s*=).*$`,"m"),y=w.test(p)?p.replace(w,m):`${p}${p.endsWith(g)||p.length===0?"":g}${m}${g}`;d.writeFileSync(n,y,"utf8"),this.selectedProject.versions||(this.selectedProject.versions={}),this.selectedProject.versions[e]=l,r.webview.postMessage({command:"updateProjectInfo",project:this.selectedProject}),this.refreshProjectInsights(r),a.window.showInformationMessage(`\u2713 ${e} actualizada correctamente en .env`)}catch(p){this.logger.error(`[SidebarProvider] Error updating ${e}:`,p),a.window.showErrorMessage(`No se pudo actualizar ${e}: ${p.message}`)}}async handleIonicApiUrlEdit(e,t,r){if(!this.selectedProject||this.selectedProject.type!=="ionic"){a.window.showErrorMessage("La edici\xF3n de apiUrl solo est\xE1 disponible para proyectos Ionic");return}if(!e||!["apiUrl (dev)","apiUrl (prod)"].includes(e)){a.window.showErrorMessage("Clave de apiUrl no soportada para edici\xF3n");return}let n=await a.window.showInputBox({title:`Editar ${e}`,prompt:"Ingresa la nueva URL de apiUrl",value:t??this.selectedProject.versions?.[e]??"",ignoreFocusOut:!0,validateInput:c=>c.trim()?null:"apiUrl no puede estar vac\xEDa"});if(n===void 0)return;let i=n.trim(),s=this.resolveIonicApiFilePath(this.selectedProject.path,e);if(!s){a.window.showErrorMessage(`No se encontr\xF3 archivo de entorno para ${e}`);return}try{let c=d.readFileSync(s,"utf8"),l=this.replaceActiveTypescriptPropertyValue(c,"apiUrl",i);if(!l.changed){a.window.showErrorMessage(`No se encontr\xF3 una propiedad apiUrl activa (sin comentar) en ${u.basename(s)}`);return}d.writeFileSync(s,l.nextContent,"utf8"),this.selectedProject.versions||(this.selectedProject.versions={}),this.selectedProject.versions[e]=i,this.pushSelectedProjectInfo(r),this.refreshProjectInsights(r),a.window.showInformationMessage(`\u2713 ${e} actualizada correctamente`)}catch(c){this.logger.error(`[SidebarProvider] Error updating ${e}:`,c),a.window.showErrorMessage(`No se pudo actualizar ${e}: ${c.message}`)}}resolveIonicApiFilePath(e,t){let o={"apiUrl (dev)":[u.join("src","environments","environment.ts"),u.join("src","enviroments.ts"),"enviroments.ts","environments.ts"],"apiUrl (prod)":[u.join("src","environments","environment.prod.ts"),u.join("src","enviroments.prod.ts"),"enviroments.prod.ts","environments.prod.ts"]}[t]||[];for(let n of o){let i=u.join(e,n);if(d.existsSync(i))return i}return null}replaceActiveTypescriptPropertyValue(e,t,r){let o=e.includes(`\r
`)?`\r
`:`
`,n=e.split(/\r?\n/),i=this.escapeRegexForPattern(t),s=new RegExp("(\\b"+i+"\\s*:\\s*)([\\'\"`])([^\\'\"`]*)\\2"),c=new RegExp("(\\b"+i+"\\s*=\\s*)([\\'\"`])([^\\'\"`]*)\\2"),l=!1,p=!1;return{nextContent:n.map(v=>{if(p)return v;let m=v.trim();if(!l&&m.startsWith("/*"))return m.includes("*/")||(l=!0),v;if(l)return m.includes("*/")&&(l=!1),v;if(m.startsWith("//"))return v;let w=v.match(s);if(w){p=!0;let x=w[2],k=this.escapeForTypescriptQuotedValue(r,x);return v.replace(s,`$1${x}${k}${x}`)}let y=v.match(c);if(y){p=!0;let x=y[2],k=this.escapeForTypescriptQuotedValue(r,x);return v.replace(c,`$1${x}${k}${x}`)}return v}).join(o),changed:p}}escapeForTypescriptQuotedValue(e,t){let r=e.replace(/\\/g,"\\\\");return t==="'"?r=r.replace(/'/g,"\\'"):t==='"'?r=r.replace(/"/g,'\\"'):r=r.replace(/`/g,"\\`"),r}escapeEnvValue(e){return/[\s#"'`]/.test(e)?`"${e.replace(/"/g,'\\"')}"`:e}escapeRegexForPattern(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}async handleCopyCommand(e,t){if(!t){a.window.showErrorMessage("No hay comando para copiar");return}let r=t;e==="laravel-serve"&&(r=this.buildLaravelServeCommand());try{await a.env.clipboard.writeText(r),a.window.showInformationMessage("\u2713 Comando copiado al portapapeles")}catch(o){this.logger.error("[SidebarProvider] Error copying command:",o),a.window.showErrorMessage(`No se pudo copiar el comando: ${o.message}`)}}buildLaravelServeCommand(){return`php artisan serve --host=${this.resolveLocalIpAddress()||"0.0.0.0"} --port=8000`}resolveLocalIpAddress(){let e=F.networkInterfaces();for(let t of Object.values(e))if(Array.isArray(t)){for(let r of t)if(r.family==="IPv4"&&!r.internal)return r.address}return null}resolveIonicAppLogoUri(e,t){let r=["resources/icon.png","resources/icon.jpg","resources/icon.jpeg","resources/icon.webp","resources/icon.svg","src/assets/icon/icon.png","src/assets/icon/icon.jpg","src/assets/icon/icon.jpeg","src/assets/icon/icon.svg","src/assets/logo.png","src/assets/logo.svg","src/assets/img/logo.png","src/assets/img/logo.svg","public/assets/icon/icon.png","public/assets/logo.png","public/logo.png","www/assets/icon/icon.png"];for(let n of r){let i=u.join(e,n);if(d.existsSync(i))return String(t.asWebviewUri(a.Uri.file(i)))}let o=[u.join(e,"src","assets"),u.join(e,"public","assets"),u.join(e,"resources")];for(let n of o){let i=this.findLogoInDirectory(n);if(i)return String(t.asWebviewUri(a.Uri.file(i)))}return null}findLogoInDirectory(e){if(!d.existsSync(e))return null;try{let t=d.readdirSync(e,{withFileTypes:!0}),o=t.filter(i=>i.isFile()&&/\.(png|jpe?g|svg|webp)$/i.test(i.name)).map(i=>i.name).find(i=>/(logo|icon|app)/i.test(i));if(o)return u.join(e,o);let n=t.filter(i=>i.isDirectory()).map(i=>i.name).filter(i=>["icon","icons","img","images","branding","logo"].includes(i.toLowerCase()));for(let i of n){let s=u.join(e,i),l=d.readdirSync(s,{withFileTypes:!0}).find(p=>p.isFile()&&/\.(png|jpe?g|svg|webp)$/i.test(p.name)&&/(logo|icon|app)/i.test(p.name));if(l)return u.join(s,l.name)}}catch(t){this.logger.debug(`[SidebarProvider] Error searching logo in ${e}:`,t)}return null}};function q(h){console.log("[Myrmidon] Extension activated");try{let t=new L().detectProjects();console.log(`[Myrmidon] Found ${t.length} projects:`,t);let r=new T(h.extensionUri,t);h.subscriptions.push($.window.registerWebviewViewProvider("myrmidon-vista-panel",r,{webviewOptions:{retainContextWhenHidden:!0}})),console.log("[Myrmidon] Sidebar provider registered successfully")}catch(e){console.error("[Myrmidon] Error during activation:",e),$.window.showErrorMessage("Error initializing Myrmidon extension")}}function K(){console.log("[Myrmidon] Extension deactivated")}0&&(module.exports={activate,deactivate});
