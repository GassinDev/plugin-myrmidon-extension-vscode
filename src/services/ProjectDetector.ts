/**
 * Servicio de detección de proyectos
 * Responsable de identificar y analizar proyectos en el workspace
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Project, ProjectType } from '../types';
import { MAX_SEARCH_DEPTH, IGNORED_FOLDERS } from '../constants';

export class ProjectDetector {
    private readonly logger = console;

    /**
     * Detecta todos los proyectos en el workspace
     */
    public detectProjects(): Project[] {
        const projects: Project[] = [];

        try {
            if (!vscode.workspace.workspaceFolders) {
                this.logger.log('No workspace folders found');
                return projects;
            }

            for (const folder of vscode.workspace.workspaceFolders) {
                const folderPath = folder.uri.fsPath;
                const folderName = path.basename(folderPath);

                // Verificar si la carpeta actual es un proyecto
                const projectType = this.detectProjectType(folderPath);
                if (projectType) {
                    projects.push({
                        name: folderName,
                        type: projectType,
                        path: folderPath,
                        versions: this.extractVersions(folderPath, projectType)
                    });
                } else {
                    // Si no es un proyecto, explorar subcarpetas
                    projects.push(...this.exploreDirectory(folderPath));
                }
            }
        } catch (error) {
            this.logger.error('Error detecting projects:', error);
        }

        return projects;
    }

    /**
     * Detecta el tipo de un proyecto
     */
    private detectProjectType(folderPath: string): ProjectType | null {
        try {
            // Detectar Laravel (composer.json)
            if (this.hasLaravelMarkers(folderPath)) {
                return 'laravel';
            }

            // Detectar Ionic (package.json)
            if (this.hasIonicMarkers(folderPath)) {
                return 'ionic';
            }
        } catch (error) {
            this.logger.error(`Error detecting project type in ${folderPath}:`, error);
        }

        return null;
    }

    /**
     * Verifica si una carpeta es un proyecto Laravel
     */
    private hasLaravelMarkers(folderPath: string): boolean {
        try {
            const composerPath = path.join(folderPath, 'composer.json');
            if (!fs.existsSync(composerPath)) {
                return false;
            }

            const content = fs.readFileSync(composerPath, 'utf8');
            const composerJson = JSON.parse(content);

            return !!(
                composerJson?.require?.['laravel/framework'] ||
                composerJson?.requireDev?.['laravel/framework']
            );
        } catch (error) {
            this.logger.debug(`Error checking Laravel markers in ${folderPath}:`, error);
        }

        return false;
    }

    /**
     * Verifica si una carpeta es un proyecto Ionic
     */
    private hasIonicMarkers(folderPath: string): boolean {
        try {
            const packagePath = path.join(folderPath, 'package.json');
            if (!fs.existsSync(packagePath)) {
                return false;
            }

            const content = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(content);
            const dependencies = {
                ...(packageJson.dependencies || {}),
                ...(packageJson.devDependencies || {})
            };

            return !!(
                dependencies['@ionic/angular'] ||
                dependencies['@ionic/core'] ||
                dependencies['@capacitor/core'] ||
                dependencies['ionic']
            );
        } catch (error) {
            this.logger.debug(`Error checking Ionic markers in ${folderPath}:`, error);
        }

        return false;
    }

    /**
     * Explora recursivamente un directorio buscando proyectos
     */
    private exploreDirectory(
        dirPath: string,
        maxDepth: number = MAX_SEARCH_DEPTH,
        currentDepth: number = 0
    ): Project[] {
        const projects: Project[] = [];

        if (currentDepth > maxDepth) {
            return projects;
        }

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                // Saltar carpetas ignoradas
                if (IGNORED_FOLDERS.includes(entry.name) || entry.name.startsWith('.')) {
                    continue;
                }

                if (entry.isDirectory()) {
                    const subPath = path.join(dirPath, entry.name);
                    const projectType = this.detectProjectType(subPath);

                    if (projectType) {
                        projects.push({
                            name: entry.name,
                            type: projectType,
                            path: subPath,
                            versions: this.extractVersions(subPath, projectType)
                        });
                    } else if (currentDepth < maxDepth) {
                        // Explorar recursivamente si no es un proyecto
                        projects.push(...this.exploreDirectory(subPath, maxDepth, currentDepth + 1));
                    }
                }
            }
        } catch (error) {
            this.logger.debug(`Error exploring directory ${dirPath}:`, error);
        }

        return projects;
    }

    /**
     * Extrae versiones de dependencias de un proyecto
     */
    private extractVersions(folderPath: string, projectType: ProjectType): Record<string, string> {
        const versions: Record<string, string> = {};

        try {
            if (projectType === 'laravel') {
                // Extraer versión de Laravel y PHP
                const composerPath = path.join(folderPath, 'composer.json');
                if (fs.existsSync(composerPath)) {
                    const content = fs.readFileSync(composerPath, 'utf8');
                    const composerJson = JSON.parse(content);

                    if (composerJson.version) {
                        versions['version'] = composerJson.version;
                    }

                    if (composerJson['minimum-stability']) {
                        versions['min-stability'] = composerJson['minimum-stability'];
                    }

                    if (composerJson.license) {
                        versions['license'] = Array.isArray(composerJson.license)
                            ? composerJson.license.join(', ')
                            : String(composerJson.license);
                    }

                    if (composerJson.require) {
                        if (composerJson.require['laravel/framework']) {
                            versions['laravel'] = composerJson.require['laravel/framework'];
                        }
                        if (composerJson.require['php']) {
                            versions['php'] = composerJson.require['php'];
                        }
                    }

                    if (composerJson.requireDev) {
                        if (composerJson.requireDev['phpunit/phpunit']) {
                            versions['phpunit'] = composerJson.requireDev['phpunit/phpunit'];
                        }
                        if (composerJson.requireDev['pestphp/pest']) {
                            versions['pest'] = composerJson.requireDev['pestphp/pest'];
                        }
                    }
                }

                const envPath = path.join(folderPath, '.env');
                if (fs.existsSync(envPath)) {
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const envLines = envContent.split(/\r?\n/);
                    const envKeys = ['APP_URL', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD'];

                    envKeys.forEach((envKey) => {
                        const envLine = envLines.find(line => line.trim().startsWith(`${envKey}=`));
                        if (!envLine) {
                            return;
                        }

                        const rawValue = envLine.split('=').slice(1).join('=').trim();
                        const cleanedValue = rawValue.replace(/^['"]|['"]$/g, '');

                        if (envKey === 'APP_URL') {
                            if (cleanedValue) {
                                versions[envKey] = cleanedValue;
                            }
                            return;
                        }

                        versions[envKey] = cleanedValue;
                    });
                }
            } else if (projectType === 'ionic') {
                // Extraer versiones de Ionic, Capacitor y Angular
                const packagePath = path.join(folderPath, 'package.json');
                if (fs.existsSync(packagePath)) {
                    const content = fs.readFileSync(packagePath, 'utf8');
                    const packageJson = JSON.parse(content);

                    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

                    const capacitorConfigPath = path.join(folderPath, 'capacitor.config.json');
                    if (fs.existsSync(capacitorConfigPath)) {
                        try {
                            const capacitorContent = fs.readFileSync(capacitorConfigPath, 'utf8');
                            const capacitorConfig = JSON.parse(capacitorContent);
                            if (capacitorConfig?.appName) {
                                versions['app'] = String(capacitorConfig.appName);
                            }
                        } catch (error) {
                            this.logger.debug(`Error parsing capacitor config at ${capacitorConfigPath}:`, error);
                        }
                    }

                    if (packageJson.version) {
                        versions['version'] = packageJson.version;
                    }

                    if (packageJson.engines?.node) {
                        versions['node'] = packageJson.engines.node;
                    }

                    if (packageJson.packageManager) {
                        versions['package-manager'] = packageJson.packageManager;
                    }

                    if (dependencies['ionic']) {
                        versions['ionic'] = dependencies['ionic'];
                    }
                    if (dependencies['@ionic/angular']) {
                        versions['@ionic/angular'] = dependencies['@ionic/angular'];
                    }
                    if (dependencies['@capacitor/core']) {
                        versions['@capacitor/core'] = dependencies['@capacitor/core'];
                    }
                    if (dependencies['@capacitor/android']) {
                        versions['@capacitor/android'] = dependencies['@capacitor/android'];
                    }
                    if (dependencies['@angular/core']) {
                        versions['@angular/core'] = dependencies['@angular/core'];
                    }
                    if (dependencies['typescript']) {
                        versions['typescript'] = dependencies['typescript'];
                    }
                }

                const apiUrlDev = this.readIonicApiUrl(folderPath, [
                    path.join('src', 'environments', 'environment.ts'),
                    path.join('src', 'enviroments.ts'),
                    'enviroments.ts',
                    'environments.ts'
                ]);
                if (apiUrlDev) {
                    versions['apiUrl (dev)'] = apiUrlDev;
                }

                const apiUrlProd = this.readIonicApiUrl(folderPath, [
                    path.join('src', 'environments', 'environment.prod.ts'),
                    path.join('src', 'enviroments.prod.ts'),
                    'enviroments.prod.ts',
                    'environments.prod.ts'
                ]);
                if (apiUrlProd) {
                    versions['apiUrl (prod)'] = apiUrlProd;
                }
            }
        } catch (error) {
            this.logger.debug(`Error extracting versions from ${folderPath}:`, error);
        }

        return versions;
    }

    /**
     * Lee apiUrl desde un archivo de entorno Ionic
     */
    private readIonicApiUrl(projectPath: string, relativeCandidates: string[]): string | null {
        for (const relativePath of relativeCandidates) {
            const absolutePath = path.join(projectPath, relativePath);
            if (!fs.existsSync(absolutePath)) {
                continue;
            }

            try {
                const content = fs.readFileSync(absolutePath, 'utf8');
                const parsedValue = this.parseApiUrlFromTypescript(content);
                if (parsedValue) {
                    return parsedValue;
                }
            } catch (error) {
                this.logger.debug(`Error reading Ionic apiUrl from ${absolutePath}:`, error);
            }
        }

        return null;
    }

    /**
     * Extrae apiUrl de contenido TypeScript con sintaxis objeto o asignacion
     */
    private parseApiUrlFromTypescript(content: string): string | null {
        const lines = content.split(/\r?\n/);
        let insideBlockComment = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!insideBlockComment && trimmed.startsWith('/*')) {
                if (!trimmed.includes('*/')) {
                    insideBlockComment = true;
                }
                continue;
            }

            if (insideBlockComment) {
                if (trimmed.includes('*/')) {
                    insideBlockComment = false;
                }
                continue;
            }

            if (trimmed.startsWith('//')) {
                continue;
            }

            const objectStyleMatch = line.match(/\bapiUrl\s*:\s*['"`]([^'"`]+)['"`]/);
            if (objectStyleMatch?.[1]) {
                return objectStyleMatch[1].trim();
            }

            const assignmentStyleMatch = line.match(/\bapiUrl\s*=\s*['"`]([^'"`]+)['"`]/);
            if (assignmentStyleMatch?.[1]) {
                return assignmentStyleMatch[1].trim();
            }
        }

        return null;
    }
}
