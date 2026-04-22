/**
 * Gestor de sesiones de ejecución larga
 * Controla procesos como serve, run, etc.
 */

import * as vscode from 'vscode';
import { Project } from '../types';

export interface RuntimeSession {
    id: string;
    label: string;
    commandId: string;
    projectName: string;
    projectType: Project['type'];
    terminal: vscode.Terminal;
    startTime: number;
    status: 'running' | 'stopped';
}

export class RuntimeSessionManager {
    private readonly logger = console;
    private sessions = new Map<string, RuntimeSession>();
    private onSessionChangeCallbacks: Array<() => void> = [];

    /**
     * Inicia una nueva sesión de ejecución
     */
    public startSession(input: Omit<RuntimeSession, 'id' | 'startTime' | 'status'>): RuntimeSession {
        const session: RuntimeSession = {
            id: `runtime:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
            ...input,
            startTime: Date.now(),
            status: 'running'
        };

        this.sessions.set(session.id, session);
        this.notifyChange();

        this.logger.log(`[RuntimeSessionManager] Session started: ${session.label} (${session.id})`);
        return session;
    }

    /**
     * Obtiene una sesión por su ID
     */
    public getSession(sessionId: string): RuntimeSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Obtiene todas las sesiones activas
     */
    public getAllSessions(): RuntimeSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Obtiene sesiones de un proyecto específico
     */
    public getSessionsByProject(projectName: string): RuntimeSession[] {
        return this.getAllSessions().filter(s => s.projectName === projectName);
    }

    /**
     * Detiene una sesión
     */
    public stopSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }

        session.status = 'stopped';
        this.sessions.delete(sessionId);
        this.notifyChange();

        this.logger.log(`[RuntimeSessionManager] Session stopped: ${session.label} (${sessionId})`);
    }

    /**
     * Detiene todas las sesiones de un proyecto
     */
    public stopProjectSessions(projectName: string): void {
        const sessions = this.getSessionsByProject(projectName);
        sessions.forEach(session => this.stopSession(session.id));
    }

    /**
     * Detiene todas las sesiones
     */
    public stopAllSessions(): void {
        const sessionIds = Array.from(this.sessions.keys());
        sessionIds.forEach(id => this.stopSession(id));
    }

    /**
     * Obtiene el tiempo de ejecución de una sesión en segundos
     */
    public getSessionDuration(sessionId: string): number {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return 0;
        }

        return Math.floor((Date.now() - session.startTime) / 1000);
    }

    /**
     * Suscribe a cambios en las sesiones
     */
    public onSessionsChange(callback: () => void): vscode.Disposable {
        this.onSessionChangeCallbacks.push(callback);
        return {
            dispose: () => {
                const index = this.onSessionChangeCallbacks.indexOf(callback);
                if (index >= 0) {
                    this.onSessionChangeCallbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Notifica sobre cambios en las sesiones
     */
    private notifyChange(): void {
        this.onSessionChangeCallbacks.forEach(callback => callback());
    }

    /**
     * Limpia todas las sesiones
     */
    public cleanup(): void {
        this.stopAllSessions();
        this.sessions.clear();
        this.onSessionChangeCallbacks = [];
        this.logger.log('[RuntimeSessionManager] Cleaned up all sessions');
    }
}
