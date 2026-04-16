import * as vscode from 'vscode';
import { ProjectDetector } from './services/ProjectDetector';
import { SidebarProvider } from './SidebarProvider';

/**
 * Punto de entrada de la extensión
 * Se ejecuta cuando VS Code la activa
 */
export function activate(context: vscode.ExtensionContext): void {
	console.log('[Myrmidon] Extension activated');

	try {
		// Detectar proyectos en el workspace
		const detector = new ProjectDetector();
		const projects = detector.detectProjects();

		console.log(`[Myrmidon] Found ${projects.length} projects:`, projects);

		// Crear instancia del proveedor del panel lateral
		const sidebarProvider = new SidebarProvider(context.extensionUri, projects);

		// Registrar el proveedor del webview
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				'myrmidon-vista-panel',
				sidebarProvider,
				{
					webviewOptions: {
						retainContextWhenHidden: true
					}
				}
			)
		);

		console.log('[Myrmidon] Sidebar provider registered successfully');
	} catch (error) {
		console.error('[Myrmidon] Error during activation:', error);
		vscode.window.showErrorMessage('Error initializing Myrmidon extension');
	}
}

/**
 * Se ejecuta cuando la extensión se desactiva
 */
export function deactivate(): void {
	console.log('[Myrmidon] Extension deactivated');
}