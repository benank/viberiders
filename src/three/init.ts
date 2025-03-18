import CyberpunkGrid from './CyberpunkGrid';

// Store the instance so we can access it later for cleanup
let gridInstance: CyberpunkGrid | null = null;

/**
 * Initialize the cyberpunk grid background
 * @param containerId The ID of the container element to add the Three.js canvas to
 */
export function initCyberpunkGrid(containerId: string): void {
  // Clean up any existing instance
  if (gridInstance) {
    gridInstance.dispose();
  }
  
  // Create and initialize a new instance
  gridInstance = new CyberpunkGrid();
  gridInstance.init(containerId);
}

/**
 * Clean up the Three.js resources
 */
export function cleanupCyberpunkGrid(): void {
  if (gridInstance) {
    gridInstance.dispose();
    gridInstance = null;
  }
} 