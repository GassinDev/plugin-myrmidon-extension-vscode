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

/** Configuración de proyectos Ionic con Cordova */
export const IONIC_CORDOVA_CONFIG: ProjectConfig = {
    type: 'ionic-cordova',
    icon: 'ionic light logo black.svg',
    color: '#3880FF',
    description: 'Framework mobile híbrido Ionic con Cordova. Compila para iOS, Android y web usando el motor de Cordova.',
    versionKeys: ['app', 'apiUrl (dev)', 'apiUrl (prod)', 'version', 'ionic', '@ionic/angular', 'cordova', '@angular/core', 'typescript', 'node', 'package-manager'],
    commands: [
        { id: 'ionic-install-deps', label: 'Instalación dependencias', command: 'npm i', description: 'Instala dependencias del proyecto' },
        { id: 'ionic-build', label: 'Build', command: 'ionic cordova build android', description: 'Compila para Android con Cordova' },
        { id: 'ionic-build-release', label: 'Prepare To Release', command: 'ionic cordova build android --release', description: 'Compila para Android en modo release con Cordova' },
        { id: 'ionic-sync', label: 'Prepare', command: 'ionic cordova prepare android', description: 'Prepara archivos y plugins Cordova' },
        { id: 'ionic-run-device', label: 'Run Device', command: 'ionic cordova run android -l --external', description: 'Ejecuta en dispositivo con Cordova' },
        { id: 'ionic-serve', label: 'Run Web', command: 'ionic serve', description: 'Ejecuta en navegador' }
    ]
};

/** Configuración de proyectos React Native */
export const REACT_NATIVE_CONFIG: ProjectConfig = {
    type: 'react-native',
    icon: 'react-native.svg',
    color: '#61DAFB',
    description: 'Framework cross-platform con React Native + Expo. Desarrolla apps nativas para iOS y Android con JavaScript.',
    versionKeys: ['name', 'version', 'react-native', 'expo', '@react-native-community', 'node', 'npm', 'package-manager'],
    commands: [
        { id: 'rn-install-deps', label: 'Install Deps', command: 'npx install', description: 'Instala dependencias del proyecto' },
        { id: 'rn-start', label: 'Start Metro', command: 'npx expo start', description: 'Inicia el servidor de desarrollo Expo' }
    ]
};

/** Configuración de proyectos Cordova */
export const CORDOVA_CONFIG: ProjectConfig = {
    type: 'cordova',
    icon: 'cordova.svg',
    color: '#E8AA2C',
    description: 'Framework mobile híbrido que utiliza web technologies (HTML, CSS, JS) para aplicaciones nativas multiplataforma.',
    versionKeys: ['name', 'version', 'cordova', 'platforms', '@ionic/cli-utils', 'node', 'npm', 'package-manager'],
    commands: [
        { id: 'cordova-install-deps', label: 'Install Deps', command: 'npm install', description: 'Instala dependencias del proyecto' },
        { id: 'cordova-add-android', label: 'Add Android', command: 'cordova platform add android', description: 'Añade plataforma Android' },
        { id: 'cordova-add-ios', label: 'Add iOS', command: 'cordova platform add ios', description: 'Añade plataforma iOS' },
        { id: 'cordova-run-android', label: 'Run Android', command: 'cordova run android', description: 'Ejecuta en Android' },
        { id: 'cordova-run-ios', label: 'Run iOS', command: 'cordova run ios', description: 'Ejecuta en iOS' },
        { id: 'cordova-build-release', label: 'Build Release', command: 'cordova build android --release', description: 'Construye versión release firmada' }
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
    'ionic-cordova': IONIC_CORDOVA_CONFIG,
    'react-native': REACT_NATIVE_CONFIG,
    cordova: CORDOVA_CONFIG,
    other: OTHER_CONFIG
};


