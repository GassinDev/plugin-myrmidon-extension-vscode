import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { Project, Terminal, WebviewMessage } from './types';
import { WebviewContent } from './ui/WebviewContent';

interface ReleaseCommandInput {
  projectPath: string;
  keystorePath: string;
  storePassword: string;
  keyAlias: string;
  keyPassword: string;
  versionCode: string;
}

interface RuntimeRunSession {
  id: string;
  label: string;
  commandId: string;
  projectName: string;
  projectType: Project['type'];
  terminal: vscode.Terminal;
}

type HealthStatus = 'ok' | 'warn' | 'error';

interface ProjectHealthCheck {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
}

interface ProjectHealthPayload {
  overallStatus: HealthStatus;
  summary: string;
  checks: ProjectHealthCheck[];
  generatedAt: string;
}

interface LiveLogEntry {
  id: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  timestamp: string;
}

interface IonicAndroidDevice {
  id: string;
  name: string;
  detail?: string;
}

/**
 * Proveedor del panel lateral (sidebar)
 * Gestiona la UI del webview y la comunicación con la extensión
 */
export class SidebarProvider implements vscode.WebviewViewProvider {
  private selectedProject: Project | null = null;
  private selectedTerminalId: string | null = null;
  private logger = console;
  private webviewView: vscode.WebviewView | null = null;
  private runtimeSessions = new Map<string, RuntimeRunSession>();
  private runtimeHiddenTerminals = new Set<vscode.Terminal>();
  private terminalLifecycleListenersRegistered = false;
  private liveLogEntries: LiveLogEntry[] = [];
  private readonly maxLiveLogEntries = 300;
  private activeProjectLogType: Project['type'] | null = null;
  private watchedLaravelLogPath: string | null = null;
  private watchedIonicLogPath: string | null = null;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly projects: Project[] = []
  ) {
    this.logger.log(
      `[SidebarProvider] Initialized with ${this.projects.length} projects`,
      this.projects
    );
  }

  /**
   * Resuelve la vista del webview
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.logger.log('[SidebarProvider] Resolving webview view');
    this.webviewView = webviewView;
    this.registerTerminalLifecycleListeners();

    const workspaceRoots = vscode.workspace.workspaceFolders?.map(folder => folder.uri) || [];

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri, ...workspaceRoots],
    };

    // Obtener terminales disponibles
    const terminals = this.getAvailableTerminals();

    // Generar contenido HTML con proyectos y terminales
    webviewView.webview.html = WebviewContent.generate(this.projects, terminals, this._extensionUri, webviewView.webview);

    // Escuchar mensajes del webview
    this.setupMessageHandlers(webviewView);

    // Sincronizar estado inicial de terminales/runs activos
    this.pushTerminalAndRuntimeState(webviewView);

    // Restaurar proyecto seleccionado si existe
    this.pushSelectedProjectInfo(webviewView);
    this.refreshProjectInsights(webviewView);
  }

  /**
   * Obtiene las terminales disponibles
   */
  private getAvailableTerminals(): Terminal[] {
    const terminals: Terminal[] = [];

    // Agregar terminales existentes de VS Code
    vscode.window.terminals.forEach((terminal, index) => {
      if (this.runtimeHiddenTerminals.has(terminal)) {
        return;
      }

      terminals.push({
        id: `vscode:${terminal.name}:${index}`,
        name: `📟 ${terminal.name || `Terminal ${index + 1}`}`,
        type: 'vscode'
      });
    });

    return terminals;
  }

  /**
   * Configura los manejadores de mensajes del webview
   */
  private setupMessageHandlers(webviewView: vscode.WebviewView): void {
    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this.logger.log('[SidebarProvider] Message received:', message);

      switch (message.command) {
        case 'terminalSelected':
          this.handleTerminalSelection(message.terminalId);
          break;

        case 'executeCommand':
          this.handleCommandExecution(
            message.commandId,
            message.commandText,
            message.terminalId,
            webviewView
          );
          break;

        case 'projectSelected':
          this.handleProjectSelection(message.projectName, webviewView);
          break;

        case 'projectQuickAction':
          this.handleProjectQuickAction(message.action, message.projectName, webviewView);
          break;

        case 'editLaravelAppUrl':
          this.handleLaravelAppUrlEdit(message.currentValue, webviewView);
          break;

        case 'editLaravelEnvValue':
          this.handleLaravelEnvValueEdit(message.envKey, message.currentValue, webviewView);
          break;

        case 'editIonicApiUrl':
          this.handleIonicApiUrlEdit(message.apiKey, message.currentValue, webviewView);
          break;

        case 'copyCommand':
          this.handleCopyCommand(message.commandId, message.commandText);
          break;

        case 'stopRuntimeSession':
          this.stopRuntimeSession(message.sessionId, webviewView);
          break;

        case 'clearLiveLogs':
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
  private handleTerminalSelection(terminalId: string): void {
    this.selectedTerminalId = terminalId;
    this.logger.log(`[SidebarProvider] Terminal selected: ${terminalId}`);
  }

  /**
   * Maneja la ejecución de un comando
   */
  private async handleCommandExecution(
    commandId: string,
    commandText: string,
    terminalId: string,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    this.logger.log(`[SidebarProvider] Executing command: ${commandId}`);
    this.logger.log(`[SidebarProvider] Command text: ${commandText}`);
    this.logger.log(`[SidebarProvider] Terminal ID: ${terminalId}`);

    if (!this.selectedProject) {
      vscode.window.showErrorMessage('Por favor, selecciona un proyecto primero');
      return;
    }

    if (!this.isRuntimeCommand(commandId) && !terminalId) {
      vscode.window.showErrorMessage('Por favor, selecciona una terminal antes de ejecutar comandos');
      return;
    }

    if (commandId === 'ionic-prepare-release') {
      await this.handlePrepareToRelease(terminalId, webviewView);
      return;
    }

    if (this.isRuntimeCommand(commandId)) {
      await this.handleRuntimeCommand(commandId, commandText, webviewView);
      return;
    }

    if (commandId === 'laravel-serve') {
      commandText = this.buildLaravelServeCommand();
    }

    const projectPath = this.selectedProject.path;
    const fullCommand = `cd "${projectPath}" && ${commandText}`;

    this.dispatchCommandToTerminal(terminalId, fullCommand, webviewView);
  }

  /**
   * Flujo guiado para preparar un release firmado de Android (AAB)
   */
  private async handlePrepareToRelease(
    terminalId: string,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    if (!this.selectedProject || this.selectedProject.type !== 'ionic') {
      vscode.window.showErrorMessage('Prepare To Release solo está disponible para proyectos Ionic');
      return;
    }

    if (terminalId.startsWith('external:')) {
      vscode.window.showErrorMessage('Por seguridad, usa una terminal de VS Code para firmar el AAB');
      return;
    }

    const projectPath = this.selectedProject.path;
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      vscode.window.showErrorMessage('No se encontró package.json en el proyecto seleccionado');
      return;
    }

    const currentVersion =
      this.getCurrentAndroidVersionName(projectPath) ||
      this.getCurrentAppVersion(packageJsonPath) ||
      '1.0.0';

    type VersionOption = vscode.QuickPickItem & { value: 'keep' | 'change' };
    const versionOption = await vscode.window.showQuickPick<VersionOption>(
      [
        {
          label: 'Mantener versión actual',
          description: currentVersion,
          value: 'keep',
        },
        {
          label: 'Cambiar versión',
          description: 'Actualizar build.gradle y package.json antes del release',
          value: 'change',
        },
      ],
      {
        title: 'Prepare To Release',
        placeHolder: `Versión actual detectada: ${currentVersion}`,
        ignoreFocusOut: true,
      }
    );

    if (!versionOption) {
      return;
    }

    let releaseVersion = currentVersion;
    if (versionOption.value === 'change') {
      const nextVersion = await vscode.window.showInputBox({
        title: 'Nueva versión',
        prompt: 'Ingresa la versión que se subirá (ej: 1.4.2)',
        value: currentVersion,
        ignoreFocusOut: true,
        validateInput: value => {
          const semverLike = /^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/;
          if (!value.trim()) {
            return 'La versión es obligatoria';
          }
          if (!semverLike.test(value.trim())) {
            return 'Formato sugerido: 1.0.0';
          }
          return null;
        },
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
        command: 'updateProjectInfo',
        project: this.selectedProject,
      });
    }

    const currentVersionCode = this.getCurrentAndroidVersionCode(projectPath) || '1';
    const releaseVersionCodeInput = await vscode.window.showInputBox({
      title: 'Código de versión (build)',
      prompt: 'Ingresa el versionCode entero para Android (ej: 42)',
      value: currentVersionCode,
      ignoreFocusOut: true,
      validateInput: value => {
        const trimmed = value.trim();
        if (!trimmed) {
          return 'El código de versión es obligatorio';
        }

        if (!/^\d+$/.test(trimmed)) {
          return 'El código de versión debe ser un número entero';
        }

        if (Number(trimmed) <= 0) {
          return 'El código de versión debe ser mayor que 0';
        }

        return null;
      },
    });
    if (!releaseVersionCodeInput) {
      return;
    }

    const releaseVersionCode = releaseVersionCodeInput.trim();

    const keystorePath = await this.pickKeystoreFile(projectPath);
    if (!keystorePath) {
      return;
    }

    const storePassword = await vscode.window.showInputBox({
      title: 'Contraseña del keystore',
      prompt: 'Ingresa la contraseña del keystore',
      password: true,
      ignoreFocusOut: true,
      validateInput: value => (value.trim() ? null : 'La contraseña es obligatoria'),
    });
    if (!storePassword) {
      return;
    }

    const keyAlias = await vscode.window.showInputBox({
      title: 'Alias de firma',
      prompt: 'Ingresa el alias del key (ej: upload)',
      ignoreFocusOut: true,
      validateInput: value => (value.trim() ? null : 'El alias es obligatorio'),
    });
    if (!keyAlias) {
      return;
    }

    const keyPasswordInput = await vscode.window.showInputBox({
      title: 'Contraseña del alias',
      prompt: 'Ingresa la contraseña del alias (vacío = usar contraseña del keystore)',
      password: true,
      ignoreFocusOut: true,
    });
    if (keyPasswordInput === undefined) {
      return;
    }

    const keyPassword = keyPasswordInput || storePassword;

    type ConfirmOption = vscode.QuickPickItem & { value: 'continue' | 'cancel' };
    const confirmation = await vscode.window.showQuickPick<ConfirmOption>(
      [
        {
          label: 'Continuar y preparar release',
          description: `Versión ${releaseVersion} (build ${releaseVersionCode}) | ${path.basename(keystorePath)} | alias ${keyAlias}`,
          value: 'continue',
        },
        { label: 'Cancelar', value: 'cancel' },
      ],
      {
        title: 'Confirmación final',
        placeHolder: 'Se ejecutará build, sync y bundleRelease firmado',
        ignoreFocusOut: true,
      }
    );

    if (!confirmation || confirmation.value !== 'continue') {
      return;
    }

    // Actualizar build.gradle con los valores confirmados
    try {
      this.updateAndroidBuildGradle(projectPath, releaseVersionCode, releaseVersion);
    } catch (err: any) {
      vscode.window.showErrorMessage(`No se pudo actualizar build.gradle: ${err.message}`);
      return;
    }

    const fullCommand = this.buildPrepareReleaseCommand({
      projectPath,
      keystorePath,
      storePassword,
      keyAlias,
      keyPassword,
      versionCode: releaseVersionCode,
    });

    this.dispatchCommandToTerminal(terminalId, fullCommand, webviewView);
    vscode.window.showInformationMessage(
      `✓ Flujo de release enviado (versión ${releaseVersion}, build ${releaseVersionCode})`
    );
  }

  /**
   * Envía un comando a la terminal elegida por el usuario
   */
  private dispatchCommandToTerminal(
    terminalId: string,
    fullCommand: string,
    webviewView: vscode.WebviewView
  ): void {
    if (terminalId === 'vscode:new') {
      this.executeInNewVSCodeTerminal(fullCommand, webviewView);
    } else if (terminalId.startsWith('vscode:')) {
      this.executeInSelectedVSCodeTerminal(terminalId, fullCommand, webviewView);
    } else if (terminalId.startsWith('external:')) {
      this.executeInExternalTerminal(fullCommand, terminalId);
    }
  }

  /**
   * Determina si el comando es una ejecución larga que se gestiona como run activo
   */
  private isRuntimeCommand(commandId: string): boolean {
    return ['laravel-serve', 'ionic-serve', 'ionic-run-device'].includes(commandId);
  }

  /**
   * Obtiene la etiqueta visible para una ejecución activa
   */
  private resolveRuntimeLabel(commandId: string): string {
    return commandId === 'laravel-serve' ? 'Run Laravel' : 'Run Ionic';
  }

  /**
   * Envuelve comandos runtime para capturar salida cuando aplica
   */
  private wrapRuntimeCommandForLogging(command: string, commandId: string, projectPath: string): string {
    if (!['ionic-serve', 'ionic-run-device'].includes(commandId)) {
      return command;
    }

    const logsDir = path.join(projectPath, '.myrmidon', 'logs');
    const ionicLogPath = path.join(logsDir, 'ionic-runtime.log');
    fs.mkdirSync(logsDir, { recursive: true });

    if (!fs.existsSync(ionicLogPath)) {
      fs.writeFileSync(ionicLogPath, '', 'utf8');
    }

    if (process.platform === 'win32') {
      return `(${command}) >> "${ionicLogPath}" 2>&1`;
    }

    return `(${command}) 2>&1 | tee -a "${ionicLogPath}"`;
  }

  /**
   * Ejecuta un comando largo en una terminal dedicada y la oculta del selector
   */
  private async handleRuntimeCommand(
    commandId: string,
    commandText: string,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    if (!this.selectedProject) {
      return;
    }

    const runtimeLabel = this.resolveRuntimeLabel(commandId);
    let baseCommandToRun = commandId === 'laravel-serve'
      ? this.buildLaravelServeCommand()
      : commandText;

    if (commandId === 'ionic-run-device') {
      const commandWithTarget = await this.prepareIonicRunDeviceCommand(baseCommandToRun);
      if (!commandWithTarget) {
        this.logger.log('[SidebarProvider] Ionic run device cancelado por el usuario o sin dispositivos disponibles');
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

    const terminal = vscode.window.createTerminal({
      name: `Myrmidon ${runtimeLabel} ${this.runtimeSessions.size + 1}`,
      hideFromUser: false,
    });

    const sessionId = `runtime:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    this.runtimeSessions.set(sessionId, {
      id: sessionId,
      label: runtimeLabel,
      commandId,
      projectName: this.selectedProject.name,
      projectType: this.selectedProject.type,
      terminal,
    });
    this.runtimeHiddenTerminals.add(terminal);

    terminal.show();
    terminal.sendText(fullCommand);

    this.logger.log(`[SidebarProvider] Runtime session started: ${runtimeLabel} (${sessionId})`);
    this.appendLiveLogEntry({
      level: 'info',
      source: runtimeLabel,
      message: `Ejecución iniciada (${commandId})`,
    }, webviewView);
    this.pushTerminalAndRuntimeState(webviewView);
    vscode.window.showInformationMessage(`✓ ${runtimeLabel} en ejecución`);
  }

  /**
   * Prepara el comando de Ionic Run Device solicitando el target Android actual
   */
  private async prepareIonicRunDeviceCommand(baseCommand: string): Promise<string | null> {
    const selectedDevice = await this.pickAndroidDeviceForIonicRun();
    if (!selectedDevice) {
      return null;
    }

    return this.applyIonicRunTarget(baseCommand, selectedDevice.id);
  }

  /**
   * Muestra selector de dispositivos Android conectados para Ionic
   */
  private async pickAndroidDeviceForIonicRun(): Promise<IonicAndroidDevice | null> {
    const devices = this.listConnectedAndroidDevices();

    if (devices.length === 0) {
      vscode.window.showWarningMessage('No hay dispositivos Android conectados. Conecta uno o inicia un emulador.');
      return null;
    }

    type DeviceQuickPickItem = vscode.QuickPickItem & { value: IonicAndroidDevice };
    const selectedItem = await vscode.window.showQuickPick<DeviceQuickPickItem>(
      devices.map((device) => ({
        label: device.name,
        description: device.id,
        detail: device.detail,
        value: device,
      })),
      {
        title: 'Ionic Run Device',
        placeHolder: 'Selecciona el dispositivo Android donde ejecutar la app',
        ignoreFocusOut: true,
      }
    );

    return selectedItem?.value || null;
  }

  /**
   * Lista dispositivos Android conectados usando adb
   */
  private listConnectedAndroidDevices(): IonicAndroidDevice[] {
    try {
      const output = execSync('adb devices -l', { encoding: 'utf8' });
      const lines = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .filter(line => !line.toLowerCase().startsWith('list of devices attached'));

      return lines
        .map(line => this.parseAdbDeviceLine(line))
        .filter((device): device is IonicAndroidDevice => Boolean(device));
    } catch (error) {
      this.logger.error('[SidebarProvider] Error listando dispositivos Android con adb:', error);
      vscode.window.showErrorMessage('No se pudo listar dispositivos Android. Verifica que adb esté disponible en PATH.');
      return [];
    }
  }

  /**
   * Parsea una línea de "adb devices -l" para obtener datos de display
   */
  private parseAdbDeviceLine(line: string): IonicAndroidDevice | null {
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const [id, status, ...metadataParts] = parts;
    if (status !== 'device') {
      return null;
    }

    const metadata = metadataParts.join(' ');
    const model = metadata.match(/\bmodel:([^\s]+)/)?.[1]?.replace(/_/g, ' ');
    const deviceName = metadata.match(/\bdevice:([^\s]+)/)?.[1]?.replace(/_/g, ' ');
    const product = metadata.match(/\bproduct:([^\s]+)/)?.[1]?.replace(/_/g, ' ');
    const transportId = metadata.match(/\btransport_id:([^\s]+)/)?.[1];

    const detailParts: string[] = [];
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
      detail: detailParts.length > 0 ? detailParts.join(' | ') : undefined,
    };
  }

  /**
   * Inserta/actualiza el --target del comando de Ionic run
   */
  private applyIonicRunTarget(command: string, targetId: string): string {
    const commandWithoutTarget = command
      .replace(/\s+--target(?:=|\s+)[^\s]+/g, '')
      .trim();
    return `${commandWithoutTarget} --target ${targetId}`;
  }

  /**
   * Detiene una ejecución activa
   */
  private stopRuntimeSession(sessionId: string | undefined, webviewView: vscode.WebviewView): void {
    if (!sessionId) {
      vscode.window.showErrorMessage('No se pudo detener la ejecución: sesión inválida');
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
      runtimeSession.terminal.sendText('\u0003', false);
    } catch (error) {
      this.logger.debug('[SidebarProvider] Ctrl+C not sent to runtime terminal:', error);
    }

    runtimeSession.terminal.dispose();

    this.logger.log(`[SidebarProvider] Runtime session stopped: ${runtimeSession.label} (${sessionId})`);
    this.appendLiveLogEntry({
      level: 'info',
      source: runtimeSession.label,
      message: 'Ejecución detenida por el usuario',
    }, webviewView);
    this.pushTerminalAndRuntimeState(webviewView);
    vscode.window.showInformationMessage(`✓ ${runtimeSession.label} detenido`);
  }

  /**
   * Registra listeners globales de ciclo de vida de terminales
   */
  private registerTerminalLifecycleListeners(): void {
    if (this.terminalLifecycleListenersRegistered) {
      return;
    }

    this.terminalLifecycleListenersRegistered = true;

    vscode.window.onDidCloseTerminal((terminal) => {
      let removedRuntime = false;
      let closedRuntimeLabel = '';
      let removedSessionId = '';

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
          level: 'warning',
          source: closedRuntimeLabel || 'Runtime',
          message: 'La terminal fue cerrada y la ejecución terminó',
        });
      }

      this.pushTerminalAndRuntimeState();
    });
  }

  /**
   * Infere nivel de log desde una línea textual
   */
  private detectLogLevel(message: string): 'info' | 'warning' | 'error' {
    const lower = message.toLowerCase();
    if (/(^|\W)(error|fatal|exception|failed|traceback)(\W|$)/.test(lower)) {
      return 'error';
    }

    if (/(^|\W)(warn|warning|deprecated)(\W|$)/.test(lower)) {
      return 'warning';
    }

    return 'info';
  }

  /**
   * Inserta una entrada de log y publica cambios
   */
  private appendLiveLogEntry(
    input: { level: 'info' | 'warning' | 'error'; source: string; message: string },
    targetWebviewView?: vscode.WebviewView,
    projectTypeOverride?: Project['type']
  ): void {
    const projectType = projectTypeOverride || this.activeProjectLogType || this.selectedProject?.type || 'other';
    if (this.activeProjectLogType !== projectType) {
      return;
    }

    this.liveLogEntries.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      level: input.level,
      source: input.source,
      message: input.message,
      timestamp: new Date().toISOString(),
    });

    if (this.liveLogEntries.length > this.maxLiveLogEntries) {
      this.liveLogEntries = this.liveLogEntries.slice(-this.maxLiveLogEntries);
    }

    this.pushLiveLogs(targetWebviewView);
  }

  /**
   * Limpia los logs en vivo del proyecto activo
   */
  private clearLiveLogs(webviewView: vscode.WebviewView): void {
    this.liveLogEntries = [];
    this.pushLiveLogs(webviewView);
  }

  /**
   * Publica logs en vivo al webview
   */
  private pushLiveLogs(targetWebviewView?: vscode.WebviewView): void {
    const activeWebview = targetWebviewView || this.webviewView;
    if (!activeWebview || !this.activeProjectLogType) {
      return;
    }

    activeWebview.webview.postMessage({
      command: 'updateLiveLogs',
      projectType: this.activeProjectLogType,
      entries: this.liveLogEntries,
    });
  }

  /**
   * Recalcula salud y reinicia el origen de logs del proyecto seleccionado
   */
  private refreshProjectInsights(targetWebviewView?: vscode.WebviewView): void {
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
      command: 'updateProjectHealth',
      projectType: this.selectedProject.type,
      health: healthPayload,
    });

    this.pushLiveLogs(activeWebview);

    if (this.selectedProject.type === 'laravel') {
      this.startLaravelLogWatcher(this.selectedProject.path);
    }

    if (this.selectedProject.type === 'ionic') {
      this.startIonicLogWatcher(this.selectedProject.path);
    }
  }

  /**
   * Empieza seguimiento de storage/logs/laravel.log
   */
  private startLaravelLogWatcher(projectPath: string): void {
    const laravelLogPath = path.join(projectPath, 'storage', 'logs', 'laravel.log');
    this.watchedLaravelLogPath = laravelLogPath;

    if (!fs.existsSync(laravelLogPath)) {
      this.appendLiveLogEntry({
        level: 'info',
        source: 'Laravel Log',
        message: 'Aún no existe storage/logs/laravel.log',
      });
      return;
    }

    const existingContent = fs.readFileSync(laravelLogPath, 'utf8');
    const tailLines = existingContent
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .slice(-60);

    tailLines.forEach((line) => {
      this.appendLiveLogEntry({
        level: this.detectLogLevel(line),
        source: 'Laravel Log',
        message: line,
      });
    });

    fs.watchFile(laravelLogPath, { interval: 1000 }, (current, previous) => {
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

      const fd = fs.openSync(laravelLogPath, 'r');
      try {
        const buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, start);
        const chunk = buffer.toString('utf8');
        chunk
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .forEach((line) => {
            this.appendLiveLogEntry({
              level: this.detectLogLevel(line),
              source: 'Laravel Log',
              message: line,
            });
          });
      } catch (error) {
        this.logger.debug('[SidebarProvider] Error reading Laravel log chunk:', error);
      } finally {
        fs.closeSync(fd);
      }
    });
  }

  /**
   * Detiene seguimiento de logs Laravel si existe watcher activo
   */
  private stopLaravelLogWatcher(): void {
    if (this.watchedLaravelLogPath) {
      fs.unwatchFile(this.watchedLaravelLogPath);
      this.watchedLaravelLogPath = null;
    }
  }

  /**
   * Empieza seguimiento del output de runtime Ionic en .myrmidon/logs/ionic-runtime.log
   */
  private startIonicLogWatcher(projectPath: string): void {
    const logsDir = path.join(projectPath, '.myrmidon', 'logs');
    const ionicLogPath = path.join(logsDir, 'ionic-runtime.log');

    fs.mkdirSync(logsDir, { recursive: true });
    if (!fs.existsSync(ionicLogPath)) {
      fs.writeFileSync(ionicLogPath, '', 'utf8');
    }

    this.watchedIonicLogPath = ionicLogPath;

    const existingContent = fs.readFileSync(ionicLogPath, 'utf8');
    const tailLines = existingContent
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .slice(-80);

    tailLines.forEach((line) => {
      this.appendLiveLogEntry({
        level: this.detectLogLevel(line),
        source: 'Ionic Runtime',
        message: line,
      });
    });

    fs.watchFile(ionicLogPath, { interval: 900 }, (current, previous) => {
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

      const fd = fs.openSync(ionicLogPath, 'r');
      try {
        const buffer = Buffer.alloc(length);
        fs.readSync(fd, buffer, 0, length, start);
        const chunk = buffer.toString('utf8');
        chunk
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .forEach((line) => {
            this.appendLiveLogEntry({
              level: this.detectLogLevel(line),
              source: 'Ionic Runtime',
              message: line,
            });
          });
      } catch (error) {
        this.logger.debug('[SidebarProvider] Error reading Ionic runtime log chunk:', error);
      } finally {
        fs.closeSync(fd);
      }
    });
  }

  /**
   * Detiene seguimiento del log de runtime Ionic
   */
  private stopIonicLogWatcher(): void {
    if (this.watchedIonicLogPath) {
      fs.unwatchFile(this.watchedIonicLogPath);
      this.watchedIonicLogPath = null;
    }
  }

  /**
   * Construye estado de salud del proyecto con checks básicos
   */
  private buildProjectHealth(project: Project): ProjectHealthPayload {
    const checks: ProjectHealthCheck[] = [];

    if (project.type === 'laravel') {
      const vendorExists = fs.existsSync(path.join(project.path, 'vendor'));
      checks.push({
        id: 'laravel-deps',
        label: 'Dependencias Composer',
        status: vendorExists ? 'ok' : 'error',
        detail: vendorExists ? 'vendor/ detectado' : 'Falta vendor/. Ejecuta composer install',
      });

      const hasKeyFiles = ['artisan', 'composer.json', '.env']
        .every(relativePath => fs.existsSync(path.join(project.path, relativePath)));
      checks.push({
        id: 'laravel-files',
        label: 'Archivos clave',
        status: hasKeyFiles ? 'ok' : 'error',
        detail: hasKeyFiles ? 'artisan/composer/.env listos' : 'Faltan archivos clave de Laravel',
      });

      const installedPhp = this.readInstalledVersion('php -v', /(PHP\s+)(\d+\.\d+(?:\.\d+)?)/i);
      const requiredPhp = project.versions?.php || '';
      const phpCompatible = this.isVersionCompatible(installedPhp, requiredPhp);
      checks.push({
        id: 'laravel-php',
        label: 'Compatibilidad PHP',
        status: installedPhp ? (phpCompatible ? 'ok' : 'warn') : 'warn',
        detail: installedPhp
          ? `Instalada ${installedPhp}${requiredPhp ? ` | Requerida ${requiredPhp}` : ''}`
          : 'No se pudo detectar versión local de PHP',
      });

      const appUrl = project.versions?.APP_URL || '';
      const dbDatabase = project.versions?.DB_DATABASE || '';
      const dbUsername = project.versions?.DB_USERNAME || '';
      const configOk = Boolean(appUrl && dbDatabase && dbUsername);
      checks.push({
        id: 'laravel-config',
        label: 'Configuración base',
        status: configOk ? 'ok' : 'warn',
        detail: configOk
          ? 'APP_URL y conexión BBDD principal configuradas'
          : 'Revisa APP_URL / DB_DATABASE / DB_USERNAME',
      });
    } else if (project.type === 'ionic') {
      const nodeModulesExists = fs.existsSync(path.join(project.path, 'node_modules'));
      checks.push({
        id: 'ionic-deps',
        label: 'Dependencias npm',
        status: nodeModulesExists ? 'ok' : 'error',
        detail: nodeModulesExists ? 'node_modules detectado' : 'Falta node_modules. Ejecuta npm i',
      });

      const hasKeyFiles = ['package.json', 'ionic.config.json']
        .every(relativePath => fs.existsSync(path.join(project.path, relativePath)));
      checks.push({
        id: 'ionic-files',
        label: 'Archivos clave',
        status: hasKeyFiles ? 'ok' : 'error',
        detail: hasKeyFiles ? 'package.json e ionic.config.json presentes' : 'Faltan archivos clave de Ionic',
      });

      const installedNode = this.readInstalledVersion('node -v', /(v)(\d+\.\d+(?:\.\d+)?)/i);
      const requiredNode = project.versions?.node || '';
      const nodeCompatible = this.isVersionCompatible(installedNode, requiredNode);
      checks.push({
        id: 'ionic-node',
        label: 'Compatibilidad Node',
        status: installedNode ? (nodeCompatible ? 'ok' : 'warn') : 'warn',
        detail: installedNode
          ? `Instalada ${installedNode}${requiredNode ? ` | Requerida ${requiredNode}` : ''}`
          : 'No se pudo detectar versión local de Node.js',
      });

      const capacitorConfigExists = fs.existsSync(path.join(project.path, 'capacitor.config.json'));
      const androidPlatformExists = fs.existsSync(path.join(project.path, 'android'));
      const configOk = capacitorConfigExists && androidPlatformExists;
      checks.push({
        id: 'ionic-config',
        label: 'Configuración base',
        status: configOk ? 'ok' : 'warn',
        detail: configOk
          ? 'Capacitor y plataforma Android detectados'
          : 'Revisa capacitor.config.json y carpeta android/',
      });
    } else {
      const rootExists = fs.existsSync(project.path);
      checks.push({
        id: 'generic-root',
        label: 'Ruta del proyecto',
        status: rootExists ? 'ok' : 'error',
        detail: rootExists ? 'Carpeta accesible' : 'Ruta de proyecto no accesible',
      });
    }

    const hasError = checks.some(check => check.status === 'error');
    const hasWarn = checks.some(check => check.status === 'warn');
    const overallStatus: HealthStatus = hasError ? 'error' : hasWarn ? 'warn' : 'ok';

    return {
      overallStatus,
      summary: `${checks.length} checks | ${checks.filter(check => check.status === 'ok').length} OK`,
      checks,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Obtiene versión instalada de una herramienta del sistema
   */
  private readInstalledVersion(command: string, matcher: RegExp): string | null {
    try {
      const output = execSync(command, { encoding: 'utf8' });
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
  private isVersionCompatible(installedVersion: string | null, versionRequirement: string): boolean {
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
  private extractMajorMinor(value: string): { major: number; minor: number } | null {
    const normalized = value.trim().replace(/^v/i, '');
    const match = normalized.match(/(\d+)\.(\d+)/);
    if (!match) {
      return null;
    }

    return {
      major: Number(match[1]),
      minor: Number(match[2]),
    };
  }

  /**
   * Obtiene payload serializable de ejecuciones activas
   */
  private getRuntimeRunsPayload(): Array<{ id: string; label: string; commandId: string }> {
    return Array.from(this.runtimeSessions.values()).map(session => ({
      id: session.id,
      label: session.label,
      commandId: session.commandId,
    }));
  }

  /**
   * Sincroniza terminales visibles y ejecuciones activas en el webview
   */
  private pushTerminalAndRuntimeState(targetWebviewView?: vscode.WebviewView): void {
    const activeWebview = targetWebviewView || this.webviewView;
    if (!activeWebview) {
      return;
    }

    const availableTerminals = this.getAvailableTerminals();
    const hasCurrentSelection = this.selectedTerminalId
      ? availableTerminals.some(terminal => terminal.id === this.selectedTerminalId)
      : false;

    if (!hasCurrentSelection) {
      this.selectedTerminalId = '';
    }

    activeWebview.webview.postMessage({
      command: 'updateTerminals',
      terminals: availableTerminals,
      selectedTerminalId: this.selectedTerminalId || ''
    });

    activeWebview.webview.postMessage({
      command: 'updateRuntimeRuns',
      runs: this.getRuntimeRunsPayload()
    });
  }

  /**
   * Lee la versión actual de package.json
   */
  private getCurrentAppVersion(packageJsonPath: string): string | null {
    try {
      const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || null;
    } catch (error) {
      this.logger.error('[SidebarProvider] Error reading package.json version:', error);
      return null;
    }
  }

  /**
   * Actualiza la versión en package.json
   */
  private updateAppVersion(packageJsonPath: string, newVersion: string): void {
    try {
      const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      packageJson.version = newVersion;
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
    } catch (error: any) {
      vscode.window.showErrorMessage(`No se pudo actualizar la versión: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refleja la versión actualizada en la caché del proyecto seleccionado
   */
  private syncSelectedProjectVersion(newVersion: string): void {
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
  private async pickKeystoreFile(projectPath: string): Promise<string | null> {
    const foundKeystores = await this.findKeystoreFiles(projectPath);
    type KeystoreOption = vscode.QuickPickItem & { value: string; browse?: boolean };

    const options: KeystoreOption[] = foundKeystores.map(filePath => ({
      label: path.basename(filePath),
      description: path.relative(projectPath, filePath),
      value: filePath,
    }));

    options.push({
      label: '$(folder-opened) Buscar archivo manualmente...',
      description: 'Seleccionar un .jks o .keystore',
      value: '',
      browse: true,
    });

    const selected = await vscode.window.showQuickPick<KeystoreOption>(options, {
      title: 'Seleccionar keystore',
      placeHolder: 'Elige el keystore para firmar el AAB',
      ignoreFocusOut: true,
    });

    if (!selected) {
      return null;
    }

    if (selected.browse) {
      const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        defaultUri: vscode.Uri.file(projectPath),
        openLabel: 'Seleccionar keystore',
        filters: {
          Keystore: ['jks', 'keystore'],
        },
      });

      return picked?.[0]?.fsPath || null;
    }

    return selected.value;
  }

  /**
   * Busca archivos .jks y .keystore en el proyecto Ionic
   */
  private async findKeystoreFiles(projectPath: string): Promise<string[]> {
    const excludePattern = '**/{node_modules,dist,build,vendor,.git}/**';
    const [jksFiles, keystoreFiles] = await Promise.all([
      vscode.workspace.findFiles(
        new vscode.RelativePattern(projectPath, '**/*.jks'),
        excludePattern,
        100
      ),
      vscode.workspace.findFiles(
        new vscode.RelativePattern(projectPath, '**/*.keystore'),
        excludePattern,
        100
      ),
    ]);

    const allPaths = [...jksFiles, ...keystoreFiles].map(file => file.fsPath);
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
  private getKeystorePriority(filePath: string): number {
    const normalized = filePath.toLowerCase();

    if (normalized.includes(`${path.sep}keystore${path.sep}`)) {
      return 0;
    }

    if (normalized.includes(`${path.sep}android${path.sep}`)) {
      return 1;
    }

    return 2;
  }

  /**
   * Construye el comando final para generar el AAB firmado
   */
  private buildPrepareReleaseCommand(input: ReleaseCommandInput): string {
    const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const projectPath = this.escapeForShellDoubleQuotes(input.projectPath);
    const keystorePath = this.escapeForShellDoubleQuotes(input.keystorePath);
    const storePassword = this.escapeForShellDoubleQuotes(input.storePassword);
    const keyAlias = this.escapeForShellDoubleQuotes(input.keyAlias);
    const keyPassword = this.escapeForShellDoubleQuotes(input.keyPassword);
    const versionCode = this.escapeForShellDoubleQuotes(input.versionCode);

    return `cd "${projectPath}" && ionic cap build android && ionic cap sync android && cd android && ${gradleCmd} bundleRelease -Pandroid.injected.version.code=${versionCode} -Pandroid.injected.signing.store.file="${keystorePath}" -Pandroid.injected.signing.store.password="${storePassword}" -Pandroid.injected.signing.key.alias="${keyAlias}" -Pandroid.injected.signing.key.password="${keyPassword}"`;
  }

  /**
   * Obtiene el versionName Android actual desde build.gradle(.kts)
   */
  private getCurrentAndroidVersionName(projectPath: string): string | null {
    const candidates = [
      path.join(projectPath, 'android', 'app', 'build.gradle'),
      path.join(projectPath, 'android', 'app', 'build.gradle.kts'),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      try {
        const fileContent = fs.readFileSync(candidate, 'utf8');
        const match = fileContent.match(/^\s*versionName\s*(?:=\s*)?["']([^"']+)["']/m);
        if (match?.[1]) {
          return match[1];
        }
      } catch (error) {
        this.logger.debug('[SidebarProvider] Error reading Android versionName:', error);
      }
    }

    return null;
  }

  /**
   * Actualiza versionCode y versionName en build.gradle(.kts)
   */
  private updateAndroidBuildGradle(
    projectPath: string,
    versionCode: string,
    versionName: string
  ): void {
    const candidates = [
      path.join(projectPath, 'android', 'app', 'build.gradle'),
      path.join(projectPath, 'android', 'app', 'build.gradle.kts'),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      let content = fs.readFileSync(candidate, 'utf8');
      const isKts = candidate.endsWith('.kts');

      if (isKts) {
        content = content.replace(
          /^(\s*versionCode\s*=\s*)\d+/m,
          `$1${versionCode}`
        );
        content = content.replace(
          /^(\s*versionName\s*=\s*)["'][^"']*["']/m,
          `$1"${versionName}"`
        );
      } else {
        content = content.replace(
          /^(\s*versionCode\s*)\d+/m,
          `$1${versionCode}`
        );
        content = content.replace(
          /^(\s*versionName\s*)["'][^"']*["']/m,
          `$1"${versionName}"`
        );
      }

      fs.writeFileSync(candidate, content, 'utf8');
      this.logger.log(`[SidebarProvider] Updated build.gradle: versionCode=${versionCode} versionName=${versionName}`);
      return;
    }

    throw new Error('No se encontró android/app/build.gradle en el proyecto');
  }

  /**
   * Obtiene el versionCode Android actual desde build.gradle(.kts)
   */
  private getCurrentAndroidVersionCode(projectPath: string): string | null {
    const candidates = [
      path.join(projectPath, 'android', 'app', 'build.gradle'),
      path.join(projectPath, 'android', 'app', 'build.gradle.kts'),
    ];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue;
      }

      try {
        const fileContent = fs.readFileSync(candidate, 'utf8');
        const match = fileContent.match(/^\s*versionCode\s*(?:=\s*)?(\d+)\b/m);
        if (match?.[1]) {
          return match[1];
        }
      } catch (error) {
        this.logger.debug('[SidebarProvider] Error reading Android versionCode:', error);
      }
    }

    return null;
  }

  /**
   * Escapa caracteres peligrosos para argumentos entre comillas dobles
   */
  private escapeForShellDoubleQuotes(value: string): string {
    return value.replace(/[\\"`$]/g, '\\$&');
  }

  /**
   * Ejecuta un comando en una terminal existente de VS Code
   */
  private executeInSelectedVSCodeTerminal(terminalId: string, fullCommand: string, webviewView?: vscode.WebviewView): void {
    const terminal = this.resolveVSCodeTerminalFromId(terminalId);

    if (terminal) {
      terminal.show();
      terminal.sendText(fullCommand);
      this.logger.log(`[SidebarProvider] Command sent to existing terminal: ${terminal.name}`);
      vscode.window.showInformationMessage(
        `✓ Ejecutando en terminal: ${terminal.name}`
      );
    } else if (webviewView) {
      this.executeInNewVSCodeTerminal(fullCommand, webviewView);
    }
  }

  /**
   * Resuelve una terminal de VS Code a partir de su id serializado
   */
  private resolveVSCodeTerminalFromId(terminalId: string): vscode.Terminal | undefined {
    if (!terminalId.startsWith('vscode:')) {
      return undefined;
    }

    const lastSeparator = terminalId.lastIndexOf(':');
    if (lastSeparator <= 'vscode:'.length) {
      return undefined;
    }

    const namePart = terminalId.slice('vscode:'.length, lastSeparator);
    const indexPart = terminalId.slice(lastSeparator + 1);
    const parsedIndex = Number(indexPart);

    if (!Number.isNaN(parsedIndex)) {
      const byIndex = vscode.window.terminals[parsedIndex];
      if (byIndex && byIndex.name === namePart) {
        return byIndex;
      }
    }

    return vscode.window.terminals.find(terminal => terminal.name === namePart);
  }

  /**
   * Ejecuta un comando en una nueva terminal de VS Code
   */
  private executeInNewVSCodeTerminal(fullCommand: string, webviewView: vscode.WebviewView): void {
    const terminal = vscode.window.createTerminal({
      name: 'Myrmidon',
      hideFromUser: false
    });
    terminal.show();
    terminal.sendText(fullCommand);

    // Guardar referencia a la terminal nueva
    this.selectedTerminalId = `vscode:${terminal.name}:${vscode.window.terminals.length - 1}`;

    this.logger.log(`[SidebarProvider] Created new terminal: ${terminal.name}`);
    vscode.window.showInformationMessage(`✓ Ejecutando en nueva terminal VS Code`);

    // Actualizar el webview con terminales/runs disponibles
    this.pushTerminalAndRuntimeState(webviewView);
  }

  /**
   * Ejecuta un comando en la terminal externa predefinida de VS Code
   */
  private async executeInExternalTerminal(fullCommand: string, terminalId: string): Promise<void> {
    this.logger.log(`[SidebarProvider] Opening external terminal with command: ${fullCommand}`);

    // Copiar comando al portapapeles
    await vscode.env.clipboard.writeText(fullCommand);

    // Abrir la terminal externa configurada en VS Code
    try {
      await vscode.commands.executeCommand('workbench.action.terminal.openNativeConsole');

      this.logger.log(`[SidebarProvider] External terminal opened`);
      vscode.window.showInformationMessage(
        `✓ Terminal externa abierta\n\nComando copiado al portapapeles:\n${fullCommand}\n\nPega (Ctrl+V) y presiona Enter`
      );
    } catch (error: any) {
      this.logger.error('[SidebarProvider] Error opening external terminal:', error);
      vscode.window.showErrorMessage(
        `No se pudo abrir terminal externa. Intenta manualmente:\n\n${fullCommand}`
      );
    }
  }

  /**
   * Abre la terminal nativa configurada en VS Code
   */
  private async openNativeTerminal(fullCommand: string): Promise<void> {
    try {
      // Crear un script temporal con el comando
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tempDir = os.tmpdir();
      const tempScript = path.join(tempDir, `myrmidon_${Date.now()}.sh`);

      // Escribir el comando en un archivo temporal
      fs.writeFileSync(tempScript, `#!/bin/bash\n${fullCommand}\n`, { mode: 0o755 });

      // Ejecutar el script en la terminal nativa
      const { execFile } = require('child_process');
      execFile('sh', [tempScript], (error: any) => {
        // Limpiar archivo temporal
        fs.unlink(tempScript, (err: any) => {
          if (err) {
            this.logger.warn('Could not delete temp script:', err);
          }
        });

        if (error) {
          this.logger.error('[SidebarProvider] Error in native terminal:', error);
          vscode.window.showErrorMessage(`Error al ejecutar en terminal nativa: ${error.message}`);
        } else {
          vscode.window.showInformationMessage(`✓ Ejecutando en terminal nativa`);
        }
      });
    } catch (error: any) {
      this.logger.error('[SidebarProvider] Error opening native terminal:', error);
      vscode.window.showErrorMessage(
        `No se pudo abrir terminal nativa: ${error.message}`
      );
    }
  }

  /**
   * Maneja la selección de un proyecto
   */
  private handleProjectSelection(
    projectName: string,
    webviewView: vscode.WebviewView
  ): void {
    const selected = this.projects.find(p => p.name === projectName);

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
  private async handleProjectQuickAction(
    action: string | undefined,
    projectName: string | undefined,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    const targetProject = this.resolveTargetProject(projectName);
    if (!targetProject) {
      vscode.window.showErrorMessage('No hay un proyecto seleccionado para ejecutar esta acción');
      return;
    }

    switch (action) {
      case 'open-folder': {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(targetProject.path));
        break;
      }

      case 'copy-path': {
        await vscode.env.clipboard.writeText(targetProject.path);
        vscode.window.showInformationMessage('✓ Ruta del proyecto copiada al portapapeles');
        break;
      }

      case 'open-key-file': {
        const keyFilePath = this.resolveKeyFileForProject(targetProject);
        if (!keyFilePath) {
          vscode.window.showWarningMessage('No se encontró un archivo clave para este proyecto');
          break;
        }

        const document = await vscode.workspace.openTextDocument(vscode.Uri.file(keyFilePath));
        await vscode.window.showTextDocument(document, { preview: false });
        break;
      }

      case 'open-project-terminal': {
        const terminal = vscode.window.createTerminal({
          name: `Myrmidon ${targetProject.name}`,
          cwd: targetProject.path,
          hideFromUser: false,
        });
        terminal.show();

        this.selectedTerminalId = `vscode:${terminal.name}:${vscode.window.terminals.length - 1}`;
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
  private resolveTargetProject(projectName: string | undefined): Project | null {
    if (projectName) {
      const byName = this.projects.find(project => project.name === projectName);
      if (byName) {
        return byName;
      }
    }

    return this.selectedProject;
  }

  /**
   * Devuelve un archivo clave del proyecto para abrirlo rápidamente
   */
  private resolveKeyFileForProject(project: Project): string | null {
    const candidateByType: Record<string, string[]> = {
      laravel: ['.env', 'composer.json', 'routes/web.php'],
      ionic: ['package.json', 'ionic.config.json', 'capacitor.config.json'],
      other: ['README.md', 'package.json'],
    };

    const candidates = candidateByType[project.type] || candidateByType.other;
    for (const relativePath of candidates) {
      const absolutePath = path.join(project.path, relativePath);
      if (fs.existsSync(absolutePath)) {
        return absolutePath;
      }
    }

    return null;
  }

  /**
   * Publica en el webview la información del proyecto actualmente seleccionado
   */
  private pushSelectedProjectInfo(webviewView: vscode.WebviewView): void {
    if (!this.selectedProject) {
      return;
    }

    const projectPayload: Record<string, unknown> = { ...this.selectedProject };
    if (this.selectedProject.type === 'ionic') {
      const appLogoUri = this.resolveIonicAppLogoUri(this.selectedProject.path, webviewView.webview);
      if (appLogoUri) {
        projectPayload.appLogoUri = appLogoUri;
      }
    }

    webviewView.webview.postMessage({
      command: 'updateProjectInfo',
      project: projectPayload
    });
  }

  /**
   * Permite editar APP_URL y persistirlo en el archivo .env del proyecto Laravel
   */
  private async handleLaravelAppUrlEdit(currentValue: string | undefined, webviewView: vscode.WebviewView): Promise<void> {
    await this.handleLaravelEnvValueEdit('APP_URL', currentValue, webviewView);
  }

  /**
   * Permite editar una variable del .env en proyectos Laravel
   */
  private async handleLaravelEnvValueEdit(
    envKey: string | undefined,
    currentValue: string | undefined,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    if (!this.selectedProject || this.selectedProject.type !== 'laravel') {
      vscode.window.showErrorMessage('La edición de variables .env solo está disponible para proyectos Laravel');
      return;
    }

    const allowedKeys = ['APP_URL', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];
    if (!envKey || !allowedKeys.includes(envKey)) {
      vscode.window.showErrorMessage('Variable .env no soportada para edición');
      return;
    }

    const envPath = path.join(this.selectedProject.path, '.env');
    if (!fs.existsSync(envPath)) {
      vscode.window.showErrorMessage('No se encontró el archivo .env en el proyecto Laravel');
      return;
    }

    const fieldLabels: Record<string, string> = {
      APP_URL: 'URL base de la aplicación',
      DB_DATABASE: 'nombre de la base de datos',
      DB_USERNAME: 'usuario de la base de datos',
      DB_PASSWORD: 'contraseña de la base de datos'
    };
    const canBeEmpty = envKey === 'DB_PASSWORD';

    const newEnvValue = await vscode.window.showInputBox({
      title: `Editar ${envKey}`,
      prompt: `Ingresa ${fieldLabels[envKey] || 'el nuevo valor'}`,
      value: currentValue ?? this.selectedProject.versions?.[envKey] ?? '',
      password: envKey === 'DB_PASSWORD',
      ignoreFocusOut: true,
      validateInput: value => {
        if (!canBeEmpty && !value.trim()) {
          return `${envKey} no puede estar vacía`;
        }

        return null;
      }
    });

    if (newEnvValue === undefined) {
      return;
    }

    const cleanedEnvValue = canBeEmpty ? newEnvValue : newEnvValue.trim();

    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lineBreak = envContent.includes('\r\n') ? '\r\n' : '\n';
      const escapedValue = this.escapeEnvValue(cleanedEnvValue);
      const envLine = `${envKey}=${escapedValue}`;
      const envRegex = new RegExp(`^(\\s*${this.escapeRegexForPattern(envKey)}\\s*=).*$`, 'm');

      const nextContent = envRegex.test(envContent)
        ? envContent.replace(envRegex, envLine)
        : `${envContent}${envContent.endsWith(lineBreak) || envContent.length === 0 ? '' : lineBreak}${envLine}${lineBreak}`;

      fs.writeFileSync(envPath, nextContent, 'utf8');

      if (!this.selectedProject.versions) {
        this.selectedProject.versions = {};
      }
      this.selectedProject.versions[envKey] = cleanedEnvValue;

      webviewView.webview.postMessage({
        command: 'updateProjectInfo',
        project: this.selectedProject
      });

      this.refreshProjectInsights(webviewView);

      vscode.window.showInformationMessage(`✓ ${envKey} actualizada correctamente en .env`);
    } catch (error: any) {
      this.logger.error(`[SidebarProvider] Error updating ${envKey}:`, error);
      vscode.window.showErrorMessage(`No se pudo actualizar ${envKey}: ${error.message}`);
    }
  }

  /**
   * Permite editar apiUrl en archivos de entorno de Ionic
   */
  private async handleIonicApiUrlEdit(
    apiKey: string | undefined,
    currentValue: string | undefined,
    webviewView: vscode.WebviewView
  ): Promise<void> {
    if (!this.selectedProject || this.selectedProject.type !== 'ionic') {
      vscode.window.showErrorMessage('La edición de apiUrl solo está disponible para proyectos Ionic');
      return;
    }

    const allowedApiKeys = ['apiUrl (dev)', 'apiUrl (prod)'];
    if (!apiKey || !allowedApiKeys.includes(apiKey)) {
      vscode.window.showErrorMessage('Clave de apiUrl no soportada para edición');
      return;
    }

    const newApiUrl = await vscode.window.showInputBox({
      title: `Editar ${apiKey}`,
      prompt: 'Ingresa la nueva URL de apiUrl',
      value: currentValue ?? this.selectedProject.versions?.[apiKey] ?? '',
      ignoreFocusOut: true,
      validateInput: value => (value.trim() ? null : 'apiUrl no puede estar vacía')
    });

    if (newApiUrl === undefined) {
      return;
    }

    const cleanedApiUrl = newApiUrl.trim();
    const targetFilePath = this.resolveIonicApiFilePath(this.selectedProject.path, apiKey);
    if (!targetFilePath) {
      vscode.window.showErrorMessage(`No se encontró archivo de entorno para ${apiKey}`);
      return;
    }

    try {
      const fileContent = fs.readFileSync(targetFilePath, 'utf8');
      const replacementResult = this.replaceActiveTypescriptPropertyValue(fileContent, 'apiUrl', cleanedApiUrl);

      if (!replacementResult.changed) {
        vscode.window.showErrorMessage(`No se encontró una propiedad apiUrl activa (sin comentar) en ${path.basename(targetFilePath)}`);
        return;
      }

      fs.writeFileSync(targetFilePath, replacementResult.nextContent, 'utf8');

      if (!this.selectedProject.versions) {
        this.selectedProject.versions = {};
      }
      this.selectedProject.versions[apiKey] = cleanedApiUrl;

      this.pushSelectedProjectInfo(webviewView);
      this.refreshProjectInsights(webviewView);
      vscode.window.showInformationMessage(`✓ ${apiKey} actualizada correctamente`);
    } catch (error: any) {
      this.logger.error(`[SidebarProvider] Error updating ${apiKey}:`, error);
      vscode.window.showErrorMessage(`No se pudo actualizar ${apiKey}: ${error.message}`);
    }
  }

  /**
   * Resuelve el archivo de entorno Ionic a modificar según clave apiUrl
   */
  private resolveIonicApiFilePath(projectPath: string, apiKey: string): string | null {
    const candidatesByKey: Record<string, string[]> = {
      'apiUrl (dev)': [
        path.join('src', 'environments', 'environment.ts'),
        path.join('src', 'enviroments.ts'),
        'enviroments.ts',
        'environments.ts'
      ],
      'apiUrl (prod)': [
        path.join('src', 'environments', 'environment.prod.ts'),
        path.join('src', 'enviroments.prod.ts'),
        'enviroments.prod.ts',
        'environments.prod.ts'
      ]
    };

    const candidates = candidatesByKey[apiKey] || [];
    for (const relativePath of candidates) {
      const absolutePath = path.join(projectPath, relativePath);
      if (fs.existsSync(absolutePath)) {
        return absolutePath;
      }
    }

    return null;
  }

  /**
   * Reemplaza una propiedad TypeScript activa (sin comentar) conservando comillas
   */
  private replaceActiveTypescriptPropertyValue(
    content: string,
    propertyName: string,
    newValue: string
  ): { nextContent: string; changed: boolean } {
    const lineBreak = content.includes('\r\n') ? '\r\n' : '\n';
    const lines = content.split(/\r?\n/);
    const escapedProperty = this.escapeRegexForPattern(propertyName);
    const objectRegex = new RegExp('(\\b' + escapedProperty + '\\s*:\\s*)([\\\'"`])([^\\\'"`]*)\\2');
    const assignmentRegex = new RegExp('(\\b' + escapedProperty + '\\s*=\\s*)([\\\'"`])([^\\\'"`]*)\\2');

    let insideBlockComment = false;
    let changed = false;

    const updatedLines = lines.map((line) => {
      if (changed) {
        return line;
      }

      const trimmed = line.trim();

      if (!insideBlockComment && trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) {
          insideBlockComment = true;
        }
        return line;
      }

      if (insideBlockComment) {
        if (trimmed.includes('*/')) {
          insideBlockComment = false;
        }
        return line;
      }

      if (trimmed.startsWith('//')) {
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
      changed,
    };
  }

  /**
   * Escapa una cadena para usarla dentro de comillas TypeScript
   */
  private escapeForTypescriptQuotedValue(value: string, quote: string): string {
    let escaped = value.replace(/\\/g, '\\\\');

    if (quote === "'") {
      escaped = escaped.replace(/'/g, "\\'");
    } else if (quote === '"') {
      escaped = escaped.replace(/"/g, '\\"');
    } else {
      escaped = escaped.replace(/`/g, '\\`');
    }

    return escaped;
  }

  /**
   * Escapa valores para el formato de .env
   */
  private escapeEnvValue(value: string): string {
    if (!/[\s#"'`]/.test(value)) {
      return value;
    }

    return `"${value.replace(/"/g, '\\"')}"`;
  }

  /**
   * Escapa caracteres especiales para construir expresiones regulares seguras
   */
  private escapeRegexForPattern(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Copia un comando al portapapeles
   */
  private async handleCopyCommand(commandId: string | undefined, commandText: string | undefined): Promise<void> {
    if (!commandText) {
      vscode.window.showErrorMessage('No hay comando para copiar');
      return;
    }

    let commandToCopy = commandText;
    if (commandId === 'laravel-serve') {
      commandToCopy = this.buildLaravelServeCommand();
    }

    try {
      await vscode.env.clipboard.writeText(commandToCopy);
      vscode.window.showInformationMessage('✓ Comando copiado al portapapeles');
    } catch (error: any) {
      this.logger.error('[SidebarProvider] Error copying command:', error);
      vscode.window.showErrorMessage(`No se pudo copiar el comando: ${error.message}`);
    }
  }

  /**
   * Construye el comando serve de Laravel usando la IP local del dispositivo
   */
  private buildLaravelServeCommand(): string {
    const localIp = this.resolveLocalIpAddress();
    const host = localIp || '0.0.0.0';
    return `php artisan serve --host=${host} --port=8000`;
  }

  /**
   * Obtiene una IP local IPv4 válida para exponer servicios en red local
   */
  private resolveLocalIpAddress(): string | null {
    const interfaces = os.networkInterfaces();

    for (const networkInterface of Object.values(interfaces)) {
      if (!Array.isArray(networkInterface)) {
        continue;
      }

      for (const address of networkInterface) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address;
        }
      }
    }

    return null;
  }

  /**
   * Detecta y resuelve el logo actual de una app Ionic
   */
  private resolveIonicAppLogoUri(projectPath: string, webview: vscode.Webview): string | null {
    const candidateRelativePaths = [
      'resources/icon.png',
      'resources/icon.jpg',
      'resources/icon.jpeg',
      'resources/icon.webp',
      'resources/icon.svg',
      'src/assets/icon/icon.png',
      'src/assets/icon/icon.jpg',
      'src/assets/icon/icon.jpeg',
      'src/assets/icon/icon.svg',
      'src/assets/logo.png',
      'src/assets/logo.svg',
      'src/assets/img/logo.png',
      'src/assets/img/logo.svg',
      'public/assets/icon/icon.png',
      'public/assets/logo.png',
      'public/logo.png',
      'www/assets/icon/icon.png'
    ];

    for (const relativePath of candidateRelativePaths) {
      const absolutePath = path.join(projectPath, relativePath);
      if (fs.existsSync(absolutePath)) {
        return String(webview.asWebviewUri(vscode.Uri.file(absolutePath)));
      }
    }

    const fallbackDirectories = [
      path.join(projectPath, 'src', 'assets'),
      path.join(projectPath, 'public', 'assets'),
      path.join(projectPath, 'resources')
    ];

    for (const directoryPath of fallbackDirectories) {
      const foundLogo = this.findLogoInDirectory(directoryPath);
      if (foundLogo) {
        return String(webview.asWebviewUri(vscode.Uri.file(foundLogo)));
      }
    }

    return null;
  }

  /**
   * Busca un archivo de logo/icono en un directorio y un nivel de subdirectorios
   */
  private findLogoInDirectory(directoryPath: string): string | null {
    if (!fs.existsSync(directoryPath)) {
      return null;
    }

    try {
      const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
      const imageFiles = entries
        .filter(entry => entry.isFile() && /\.(png|jpe?g|svg|webp)$/i.test(entry.name))
        .map(entry => entry.name);

      const preferredFile = imageFiles.find(fileName => /(logo|icon|app)/i.test(fileName));
      if (preferredFile) {
        return path.join(directoryPath, preferredFile);
      }

      const candidateSubDirs = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .filter(name => ['icon', 'icons', 'img', 'images', 'branding', 'logo'].includes(name.toLowerCase()));

      for (const subDirName of candidateSubDirs) {
        const subDirPath = path.join(directoryPath, subDirName);
        const subEntries = fs.readdirSync(subDirPath, { withFileTypes: true });
        const subPreferred = subEntries.find(entry =>
          entry.isFile() &&
          /\.(png|jpe?g|svg|webp)$/i.test(entry.name) &&
          /(logo|icon|app)/i.test(entry.name)
        );

        if (subPreferred) {
          return path.join(subDirPath, subPreferred.name);
        }
      }
    } catch (error) {
      this.logger.debug(`[SidebarProvider] Error searching logo in ${directoryPath}:`, error);
    }

    return null;
  }
}