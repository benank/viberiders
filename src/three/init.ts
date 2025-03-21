import { SceneManager } from './core/SceneManager';

// Store the instance so we can access it later for cleanup
let sceneManager: SceneManager | null = null;

/**
 * Initialize the cyberpunk grid background
 * @param containerId The ID of the container element to add the Three.js canvas to
 */
export function initCyberpunkGrid(containerId: string): void {
  // Clean up any existing instance
  if (sceneManager) {
    sceneManager.dispose();
  }
  
  // Create and initialize a new instance
  sceneManager = new SceneManager();
  sceneManager.init(containerId);
}

/**
 * Clean up the Three.js resources
 */
export function cleanupCyberpunkGrid(): void {
  if (sceneManager) {
    sceneManager.dispose();
    sceneManager = null;
  }
} 