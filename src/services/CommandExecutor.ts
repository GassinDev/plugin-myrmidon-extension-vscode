/**
 * Ejecutor de comandos
 * Encapsula la lógica de ejecución de comandos en diferentes contextos
 */

import * as path from 'path';
import * as fs from 'fs';
import { Project } from '../types';
import { TerminalManager } from './TerminalManager';

export interface CommandExecutionContext {
    project: Project;
    projectPath: string;
    command: string;
    isRuntimeCommand?: boolean;
    captureOutput?: boolean;
}

export class CommandExecutor {
    private readonly logger = console;

    constructor(private terminalManager: TerminalManager) { }

    /**
     * Construye un comando completo con el contexto del proyecto
     */
    public buildFullCommand(context: CommandExecutionContext): string {
        const { projectPath, command } = context;
        return `cd "${projectPath}" && ${command}`;
    }

    /**
     * Envuelve un comando para capturar output (opcional)
     */
    public wrapCommandForLogging(
        command: string,
        projectPath: string,
        logFileName: string
    ): string {
        const logsDir = path.join(projectPath, '.myrmidon', 'logs');
        fs.mkdirSync(logsDir, { recursive: true });

        const logPath = path.join(logsDir, logFileName);
        if (!fs.existsSync(logPath)) {
            fs.writeFileSync(logPath, '', 'utf8');
        }

        if (process.platform === 'win32') {
            return `(${command}) >> "${logPath}" 2>&1`;
        }

        return `(${command}) 2>&1 | tee -a "${logPath}"`;
    }

    /**
     * Valida que el comando sea seguro de ejecutar
     */
    public isCommandSafe(commandId: string, terminalType: 'vscode' | 'external'): boolean {
        // Comandos sensibles requieren terminal de VS Code
        const sensitiveCmds = ['ionic-prepare-release', 'cordova-build-release'];

        if (sensitiveCmds.includes(commandId) && terminalType === 'external') {
            return false;
        }

        return true;
    }

    /**
     * Prepara el comando basado en su tipo
     */
    public prepareCommand(commandId: string, baseCommand: string, projectPath: string): string {
        // Especializaciones por tipo de comando
        const specializations: Record<string, (cmd: string, path: string) => string> = {
            'ionic-serve': (cmd) => this.wrapCommandForLogging(cmd, projectPath, 'ionic-serve.log'),
            'ionic-run-device': (cmd) => this.wrapCommandForLogging(cmd, projectPath, 'ionic-device.log'),
            'laravel-serve': (cmd) => this.wrapCommandForLogging(cmd, projectPath, 'laravel-serve.log'),
            'react-native-start': (cmd) => this.wrapCommandForLogging(cmd, projectPath, 'rn-metro.log'),
            'cordova-run': (cmd) => this.wrapCommandForLogging(cmd, projectPath, 'cordova-run.log'),
        };

        return specializations[commandId]?.(baseCommand, projectPath) || baseCommand;
    }

    /**
     * Detecta el tipo de terminal a partir de su ID
     */
    public getTerminalType(terminalId: string): 'vscode' | 'external' {
        if (terminalId.startsWith('vscode:')) {
            return 'vscode';
        }
        return 'external';
    }
}
