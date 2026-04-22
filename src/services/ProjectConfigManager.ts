/**
 * Gestor de configuraciones de proyectos
 * Centraliza las configuraciones de cada tipo de proyecto
 */

import { ProjectConfig, ProjectType } from '../types';
import {
    LARAVEL_CONFIG,
    IONIC_CONFIG,
    IONIC_CORDOVA_CONFIG,
    REACT_NATIVE_CONFIG,
    CORDOVA_CONFIG,
    OTHER_CONFIG,
} from '../constants';

export class ProjectConfigManager {
    private configs: Map<ProjectType, ProjectConfig>;
    private readonly logger = console;

    constructor() {
        this.configs = new Map([
            ['laravel', LARAVEL_CONFIG],
            ['ionic', IONIC_CONFIG],
            ['ionic-cordova', IONIC_CORDOVA_CONFIG],
            ['react-native', REACT_NATIVE_CONFIG],
            ['cordova', CORDOVA_CONFIG],
            ['other', OTHER_CONFIG],
        ]);

        this.logger.log('[ProjectConfigManager] Initialized with project types:', Array.from(this.configs.keys()));
    }

    /**
     * Obtiene la configuración de un tipo de proyecto
     */
    public getConfig(projectType: ProjectType): ProjectConfig {
        return this.configs.get(projectType) || this.configs.get('other')!;
    }

    /**
     * Obtiene todos los comandos disponibles para un tipo de proyecto
     */
    public getCommands(projectType: ProjectType) {
        const config = this.getConfig(projectType);
        return config.commands || [];
    }

    /**
     * Obtiene las claves de versión a mostrar para un tipo de proyecto
     */
    public getVersionKeys(projectType: ProjectType): string[] {
        const config = this.getConfig(projectType);
        return config.versionKeys || [];
    }

    /**
     * Obtiene el color asociado a un tipo de proyecto
     */
    public getProjectColor(projectType: ProjectType): string {
        const config = this.getConfig(projectType);
        return config.color;
    }

    /**
     * Obtiene el icono asociado a un tipo de proyecto
     */
    public getProjectIcon(projectType: ProjectType): string {
        const config = this.getConfig(projectType);
        return config.icon;
    }

    /**
     * Obtiene la descripción de un tipo de proyecto
     */
    public getProjectDescription(projectType: ProjectType): string {
        const config = this.getConfig(projectType);
        return config.description;
    }

    /**
     * Obtiene todas las configuraciones
     */
    public getAllConfigs(): Map<ProjectType, ProjectConfig> {
        return new Map(this.configs);
    }

    /**
     * Obtiene todos los tipos de proyecto soportados
     */
    public getSupportedTypes(): ProjectType[] {
        return Array.from(this.configs.keys()).filter(type => type !== 'other');
    }

    /**
     * Verifica si un tipo de proyecto es soportado
     */
    public isSupported(projectType: ProjectType): boolean {
        return this.configs.has(projectType) && projectType !== 'other';
    }

    /**
     * Obtiene información completa de un proyecto
     */
    public getProjectInfo(projectType: ProjectType) {
        const config = this.getConfig(projectType);
        return {
            type: projectType,
            name: projectType.charAt(0).toUpperCase() + projectType.slice(1),
            icon: config.icon,
            color: config.color,
            description: config.description,
            commands: config.commands || [],
            versionKeys: config.versionKeys || [],
        };
    }
}
