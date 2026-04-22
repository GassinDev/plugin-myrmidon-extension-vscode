/**
 * Gestor centralizado de terminales
 * Maneja la creación, seguimiento y ejecución en terminales de VS Code
 */

import * as vscode from 'vscode';

export interface TerminalExecutionOptions {
    cwd?: string;
    showTerminal?: boolean;
    newTerminal?: boolean;
    terminalName?: string;
}

export class TerminalManager {
    private readonly logger = console;
    private terminalPool = new Map<string, vscode.Terminal>();

    /**
     * Obtiene todas las terminales disponibles en VS Code
     */
    public getAvailableTerminals(): vscode.Terminal[] {
        return [...vscode.window.terminals];
    }

    /**
     * Crea una nueva terminal con opciones personalizadas
     */
    public createTerminal(name: string): vscode.Terminal {
        const terminal = vscode.window.createTerminal({
            name,
            hideFromUser: false,
        });

        this.logger.log(`[TerminalManager] Terminal created: ${name}`);
        return terminal;
    }

    /**
     * Obtiene o crea una terminal con nombre específico
     */
    public getOrCreateTerminal(name: string): vscode.Terminal {
        const existing = this.terminalPool.get(name);
        if (existing) {
            return existing;
        }

        const terminal = this.createTerminal(name);
        this.terminalPool.set(name, terminal);
        return terminal;
    }

    /**
     * Ejecuta un comando en una terminal específica
     */
    public async executeInTerminal(
        terminal: vscode.Terminal,
        command: string,
        options?: TerminalExecutionOptions
    ): Promise<void> {
        const fullCommand = options?.cwd
            ? `cd "${options.cwd}" && ${command}`
            : command;

        terminal.show(options?.showTerminal !== false);
        terminal.sendText(fullCommand);

        this.logger.log('[TerminalManager] Command sent to terminal:', fullCommand);
    }

    /**
     * Crea una nueva terminal y ejecuta un comando
     */
    public async executeInNewTerminal(
        name: string,
        command: string,
        options?: TerminalExecutionOptions
    ): Promise<vscode.Terminal> {
        const terminal = this.createTerminal(name);
        await this.executeInTerminal(terminal, command, {
            ...options,
            showTerminal: true
        });
        return terminal;
    }

    /**
     * Obtiene una terminal existente por su nombre
     */
    public getTerminalByName(name: string): vscode.Terminal | undefined {
        return vscode.window.terminals.find(t => t.name === name);
    }

    /**
     * Cierra y limpia una terminal
     */
    public closeTerminal(terminal: vscode.Terminal): void {
        terminal.dispose();

        for (const [name, term] of this.terminalPool.entries()) {
            if (term === terminal) {
                this.terminalPool.delete(name);
            }
        }

        this.logger.log('[TerminalManager] Terminal closed and cleaned');
    }

    /**
     * Limpia todas las terminales del pool
     */
    public cleanup(): void {
        this.terminalPool.forEach(terminal => terminal.dispose());
        this.terminalPool.clear();
        this.logger.log('[TerminalManager] All terminals cleaned');
    }

    /**
     * Envía Ctrl+C a una terminal para detenerla
     */
    public stopTerminal(terminal: vscode.Terminal): void {
        try {
            terminal.sendText('\u0003', false);
            this.logger.log('[TerminalManager] Stop signal sent to terminal');
        } catch (error) {
            this.logger.error('[TerminalManager] Error stopping terminal:', error);
        }
    }
}
