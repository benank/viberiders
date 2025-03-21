import * as THREE from 'three';
import { PerlinNoise } from '../utils/PerlinNoise';

/**
 * Represents the procedurally generated mountains in the background
 */
export class Mountains {
  private mountains: THREE.Mesh;
  private perlinNoise: PerlinNoise;
  
  constructor() {
    // Initialize Perlin noise
    this.perlinNoise = new PerlinNoise(Math.random() * 100);
    
    // Create the mountains mesh
    this.mountains = this.createMountains();
  }
  
  /**
   * Create procedurally generated mountains using Perlin noise
   */
  private createMountains(): THREE.Mesh {
    // Create a plane geometry for the mountains - larger size for distant mountains
    const geometry = new THREE.PlaneGeometry(300, 80, 150, 30);
    
    // Position and rotate the mountains
    geometry.rotateX(-Math.PI / 2);
    
    // Update vertices to create mountain peaks using Perlin noise
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // Different noise layers for varied terrain - significantly reduced height
      const noise1 = this.perlinNoise.noise(x * 0.02, z * 0.02) * 4; // Large hills - reduced height
      const noise2 = this.perlinNoise.noise(x * 0.05, z * 0.05) * 2; // Medium details - reduced height
      const noise3 = this.perlinNoise.noise(x * 0.1, z * 0.1) * 1; // Small details - reduced height
      
      // Combine noise layers for final height
      const heightNoise = noise1 + noise2 + noise3;
      
      // Make mountains taller in the back for better perspective - reduced multiplier
      const distanceFromCenter = Math.abs(z);
      const heightMultiplier = Math.max(0, (distanceFromCenter - 10) / 20);
      
      // Apply height to vertex - overall lower height
      vertices[i + 1] = heightNoise * (1 + heightMultiplier);
      
      // Create a smoother transition near the front edge
      if (z > -20) {
        vertices[i + 1] *= Math.max(0, (z + 20) / 10);
      }
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create material with purple/blue gradient
    const material = new THREE.MeshStandardMaterial({
      color: 0x9900ff,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
      side: THREE.DoubleSide,
      emissive: 0x330066,
      emissiveIntensity: 0.3,
      fog: true // Ensure mountains are affected by fog for distance effect
    });
    
    // Create the mesh
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * Get the mesh
   */
  public getMesh(): THREE.Mesh {
    return this.mountains;
  }
  
  /**
   * Update the mountains (can be used for animations)
   * @param deltaTime Time since last frame
   */
  public update(deltaTime: number): void {
    // Update logic can be added here in the future
  }
  
  /**
   * Dispose resources
   */
  public dispose(): void {
    if (this.mountains.geometry) {
      this.mountains.geometry.dispose();
    }
    
    if (this.mountains.material) {
      if (Array.isArray(this.mountains.material)) {
        this.mountains.material.forEach(material => material.dispose());
      } else {
        this.mountains.material.dispose();
      }
    }
  }
} 