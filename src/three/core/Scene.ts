import * as THREE from 'three';

/**
 * Base Scene class that all scene types will inherit from
 */
export abstract class Scene {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected clock: THREE.Clock;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.clock = new THREE.Clock();
  }

  /**
   * Initialize the scene
   */
  public abstract initialize(): void;

  /**
   * Update the scene (called every frame)
   */
  public abstract update(): void;

  /**
   * Handle window resize events
   * @param width Window width
   * @param height Window height
   */
  public handleResize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Dispose of all resources
   */
  public abstract dispose(): void;

  /**
   * Get the scene object
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera
   */
  public getCamera(): THREE.Camera {
    return this.camera;
  }
} 