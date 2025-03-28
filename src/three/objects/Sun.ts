import * as THREE from 'three';
import { SunShader } from '../shaders/SunShader';

/**
 * Represents the synthwave sun with gradient shader that covers the entire background
 */
export class Sun {
  private sun: THREE.Mesh;
  private sunMaterial: THREE.ShaderMaterial;
  
  constructor() {
    // Create geometry for the sun - much larger to fill the entire background
    const sunGeometry = new THREE.PlaneGeometry(200, 100);
    
    // Create shader material
    this.sunMaterial = SunShader.createMaterial();
    
    // Create the mesh
    this.sun = new THREE.Mesh(sunGeometry, this.sunMaterial);
    this.sun.position.z = -140; // Far back in the background
    this.sun.position.y = 15;   // Higher in the sky to fill more of the background
  }
  
  /**
   * Get the mesh
   */
  public getMesh(): THREE.Mesh {
    return this.sun;
  }
  
  /**
   * Update the sun animation
   * @param deltaTime Time since last frame
   */
  public update(deltaTime: number): void {
    // Update shader uniforms
    SunShader.update(this.sunMaterial, this.sunMaterial.uniforms.time.value + deltaTime);
  }
  
  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.sun.geometry) {
      this.sun.geometry.dispose();
    }
    
    if (this.sunMaterial) {
      this.sunMaterial.dispose();
    }
  }
} 