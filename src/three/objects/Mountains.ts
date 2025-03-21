import * as THREE from 'three';
import { PerlinNoise } from '../utils/PerlinNoise';

/**
 * Represents mountain silhouettes that appear in front of the sun
 */
export class Mountains {
  private mountainGroup: THREE.Group;
  private perlinNoise: PerlinNoise;
  
  constructor() {
    // Initialize mountain group
    this.mountainGroup = new THREE.Group();
    
    // Initialize Perlin noise
    this.perlinNoise = new PerlinNoise(Math.random() * 100);
    
    // Create simple mountain silhouettes
    this.createMountainSilhouettes();
  }
  
  /**
   * Create simple mountain silhouettes to place in front of the sun
   */
  private createMountainSilhouettes(): void {
    // Create main center mountain range (wider and taller)
    const centerMountains = this.createSilhouette(
      280, 40, 120, 12, 
      { x: 0, y: 0, z: 0 },
      0x330044  // Slightly brighter dark purple
    );
    this.mountainGroup.add(centerMountains);
    
    // Create left mountains
    const leftMountains = this.createSilhouette(
      200, 35, 80, 10, 
      { x: -110, y: -1, z: 5 },
      0x220033  // Dark purple
    );
    this.mountainGroup.add(leftMountains);
    
    // Create right mountains
    const rightMountains = this.createSilhouette(
      220, 38, 90, 10, 
      { x: 120, y: -2, z: 10 },
      0x330044  // Slightly brighter dark purple
    );
    this.mountainGroup.add(rightMountains);
    
    // Create a foreground accent mountain on the left
    const leftAccentMountain = this.createSilhouette(
      100, 30, 50, 8, 
      { x: -50, y: 1, z: 15 },
      0x220033  // Dark purple
    );
    this.mountainGroup.add(leftAccentMountain);
    
    // Create a foreground accent mountain on the right
    const rightAccentMountain = this.createSilhouette(
      120, 32, 55, 8, 
      { x: 60, y: 0, z: 18 },
      0x220033  // Dark purple
    );
    this.mountainGroup.add(rightAccentMountain);
  }
  
  /**
   * Create a simple mountain silhouette
   */
  private createSilhouette(
    width: number, 
    depth: number, 
    widthSegments: number, 
    depthSegments: number,
    position: { x: number, y: number, z: number },
    color: number
  ): THREE.Mesh {
    // Create a plane geometry for the silhouette
    const geometry = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
    
    // Position and rotate the mountains
    geometry.rotateX(-Math.PI / 2);
    
    // Get a different seed for varied mountains
    const noiseSeed = Math.random() * 100;
    
    // Update vertices to create mountain peaks
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // Use perlin noise for mountain peaks - increased height
      const noise1 = this.perlinNoise.noise(x * 0.01 + noiseSeed, z * 0.01) * 2.5;
      const noise2 = this.perlinNoise.noise(x * 0.03 + noiseSeed, z * 0.03) * 1.2;
      
      // Combine noise layers for final height - increased for better visibility
      const heightNoise = noise1 + noise2;
      
      // Apply height to vertex with increased value
      vertices[i + 1] = heightNoise * 1.5;
      
      // Create a smoother transition near the edges
      const distanceFromCenter = Math.sqrt(x*x + z*z) / (width/2);
      if (distanceFromCenter > 0.7) {
        const fadeOut = Math.max(0, 1 - (distanceFromCenter - 0.7) / 0.3);
        vertices[i + 1] *= fadeOut;
      }
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create material - using basic material to ensure visibility
    const material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide
    });
    
    // Create the mesh and position it
    const mountainMesh = new THREE.Mesh(geometry, material);
    mountainMesh.position.set(position.x, position.y, position.z);
    
    return mountainMesh;
  }
  
  /**
   * Get the mountain group containing all silhouettes
   */
  public getMesh(): THREE.Group {
    return this.mountainGroup;
  }
  
  /**
   * Update the mountains (can be used for animations)
   * @param deltaTime Time since last frame
   */
  public update(deltaTime: number): void {
    // No update needed for static silhouettes
  }
  
  /**
   * Dispose resources
   */
  public dispose(): void {
    this.mountainGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }
} 