/**
 * Configuración y constantes de la extensión
 */

import { ProjectConfig } from '../types';

/** Profundidad máxima de búsqueda recursiva */
export const MAX_SEARCH_DEPTH = 2;

/** Carpetas a ignorar durante la búsqueda */
export const IGNORED_FOLDERS = [
    '.',
    '.git',
    '.vscode',
    '.idea',
    'node_modules',
    'vendor',
    'dist',
    'build',
    '.next',
    'coverage'
];

/** Configuración de proyectos Laravel */
export const LARAVEL_CONFIG: ProjectConfig = {
    type: 'laravel',
    icon: 'laravel-svgrepo-com.svg',
    color: '#FF2D20',
    description: 'Framework PHP para desarrollo backend. Incluye ORM Eloquent, migraciones, y autenticación integrada.',
    versionKeys: ['version', 'laravel', 'php', 'phpunit', 'pest', 'APP_URL', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'min-stability', 'license'],
    commands: [
        { id: 'laravel-serve', label: 'Serve', command: 'php artisan serve --host=<IP_LOCAL> --port=8000', description: 'Inicia el servidor de desarrollo con la IP local del dispositivo' },
        { id: 'laravel-migrate', label: 'Migrate', command: 'php artisan migrate', description: 'Ejecuta las migraciones' },
        { id: 'laravel-tinker', label: 'Tinker', command: 'php artisan tinker', description: 'Abre la consola interactiva' },
        { id: 'laravel-optimize-clear', label: 'Optimize Clear', command: 'php artisan optimize:clear', description: 'Limpia caches optimizadas de Laravel' },
        { id: 'laravel-config-clear', label: 'Config Clear', command: 'php artisan config:clear', description: 'Limpia caché de configuración' },
        { id: 'laravel-cache-clear', label: 'Cache Clear', command: 'php artisan cache:clear', description: 'Limpia caché de aplicación' }
    ]
};

/** Configuración de proyectos Ionic */
export const IONIC_CONFIG: ProjectConfig = {
    type: 'ionic',
    icon: 'ionic light logo black.svg',
    color: '#3880FF',
    description: 'Framework mobile híbrido basado en Angular/React/Vue. Compila para iOS, Android y web.',
    versionKeys: ['app', 'apiUrl (dev)', 'apiUrl (prod)', 'version', 'ionic', '@ionic/angular', '@capacitor/core', '@capacitor/android', '@angular/core', 'typescript', 'node', 'package-manager'],
    commands: [
        { id: 'ionic-install-deps', label: 'Instalación dependencias', command: 'npm i', description: 'Instala dependencias del proyecto' },
        { id: 'ionic-build', label: 'Build', command: 'ionic cap build android', description: 'Compila para Android' },
        { id: 'ionic-sync', label: 'Sync', command: 'ionic cap sync', description: 'Sincroniza archivos y plugins' },
        { id: 'ionic-run-device', label: 'Run Device', command: 'ionic cap run android -l --external', description: 'Ejecuta en dispositivo' },
        { id: 'ionic-serve', label: 'Run Web', command: 'ionic serve', description: 'Ejecuta en navegador' },
        {
            id: 'ionic-prepare-release',
            label: 'Prepare To Release',
            command: 'build + sync + signed aab',
            description: 'Prepara un Android App Bundle firmado para Play Store'
        }
    ]
};

/** Configuración de proyectos desconocidos */
export const OTHER_CONFIG: ProjectConfig = {
    type: 'other',
    icon: '📦',
    color: '#808080',
    description: 'Proyecto no identificado.',
    versionKeys: [],
    commands: []
};

/** Mapeo de configuraciones por tipo */
export const PROJECT_CONFIGS: Record<string, ProjectConfig> = {
    laravel: LARAVEL_CONFIG,
    ionic: IONIC_CONFIG,
    other: OTHER_CONFIG
};


