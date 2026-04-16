/**
 * Tipos principales de la extensión
 */

/** Tipos de proyectos soportados */
export type ProjectType = 'laravel' | 'ionic' | 'other';

/** Información de versiones de un proyecto */
export interface ProjectVersions {
    [key: string]: string | undefined;
}

/** Información de un proyecto detectado */
export interface Project {
    name: string;
    type: ProjectType;
    path: string;
    versions?: ProjectVersions;
}

/** Comando ejecutable de un proyecto */
export interface Command {
    id: string;
    label: string;
    command: string; // Comando a ejecutar
    description: string;
}

/** Configuración de un tipo de proyecto */
export interface ProjectConfig {
    type: ProjectType;
    icon: string;
    selectIcon?: string;
    color: string;
    description: string;
    versionKeys: string[]; // Keys a mostrar de las versiones
    commands: Command[]; // Comandos disponibles
}

/** Mensaje del webview */
export interface WebviewMessage {
    command: string;
    [key: string]: any;
}

/** Terminal disponible */
export interface Terminal {
    id: string;
    name: string;
    type: 'vscode' | 'external';
    processId?: number;
}
