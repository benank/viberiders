import * as THREE from 'three';
import { CyberpunkScene } from '../scenes/CyberpunkScene';

/**
 * SceneManager acts as the main controller for the ThreeJS application.
 * It handles initialization, resizing, rendering, and cleanup.
 */
export class SceneManager {
  private renderer: THREE.WebGLRenderer;
  private currentScene: CyberpunkScene | null = null;
  private container: HTMLElement | null = null;
  private animationId: number | null = null;

  constructor() {
    // Initialize the renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0); // Transparent background
  }

  /**
   * Initialize the scene with the given container
   * @param containerId ID of the container element
   */
  public init(containerId: string): void {
    // Get the container element
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID ${containerId} not found`);
      return;
    }

    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    // Create and initialize the scene
    this.currentScene = new CyberpunkScene();
    this.currentScene.initialize();

    // Set up event listeners
    window.addEventListener('resize', this.handleResize.bind(this));

    // Start the animation loop
    this.animate();
  }

  /**
   * Handle window resize events
   */
  private handleResize(): void {
    if (!this.container || !this.currentScene) return;

    // Update renderer and camera
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.currentScene.handleResize(window.innerWidth, window.innerHeight);
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    if (this.currentScene) {
      // Update scene
      this.currentScene.update();
      
      // Render scene
      this.renderer.render(
        this.currentScene.getScene(),
        this.currentScene.getCamera()
      );
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Stop animation
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Dispose scene resources
    if (this.currentScene) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    // Dispose renderer
    this.renderer.dispose();

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Remove canvas from DOM
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    this.container = null;
  }
} 