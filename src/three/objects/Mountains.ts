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
      280, 45, 140, 16, 
      { x: 0, y: 0, z: 0 },
      0xff4488  // Pink
    );
    this.mountainGroup.add(centerMountains);
    
    // Create left mountains
    const leftMountains = this.createSilhouette(
      200, 40, 100, 14, 
      { x: -110, y: -1, z: 5 },
      0xff8833  // Orange
    );
    this.mountainGroup.add(leftMountains);
    
    // Create right mountains
    const rightMountains = this.createSilhouette(
      220, 42, 110, 14, 
      { x: 120, y: -2, z: 10 },
      0x9933ff  // Purple
    );
    this.mountainGroup.add(rightMountains);
    
    // Create a foreground accent mountain on the left
    const leftAccentMountain = this.createSilhouette(
      100, 35, 60, 12, 
      { x: -50, y: 1, z: 15 },
      0x33aaff  // Blue
    );
    this.mountainGroup.add(leftAccentMountain);
    
    // Create a foreground accent mountain on the right
    const rightAccentMountain = this.createSilhouette(
      120, 38, 65, 12, 
      { x: 60, y: 0, z: 18 },
      0xff66aa  // Pink-Purple
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
      
      // Use perlin noise for mountain peaks - increased factors for spikier mountains
      const noise1 = this.perlinNoise.noise(x * 0.015 + noiseSeed, z * 0.015) * 4.0;
      const noise2 = this.perlinNoise.noise(x * 0.04 + noiseSeed, z * 0.04) * 2.5;
      const sharpNoise = this.perlinNoise.noise(x * 0.08 + noiseSeed * 2, z * 0.08) * 1.2;
      
      // Add sharp peaks at random intervals
      const spikeFactor = Math.pow(Math.abs(this.perlinNoise.noise(x * 0.02, z * 0.02)), 2) * 3.0;
      
      // Combine noise layers for final height - increased for spikier mountains
      const heightNoise = noise1 + noise2 + sharpNoise + spikeFactor;
      
      // Apply height to vertex with increased value
      vertices[i + 1] = heightNoise * 2.5;
      
      // Create a smoother transition near the edges
      const distanceFromCenter = Math.sqrt(x*x + z*z) / (width/2);
      if (distanceFromCenter > 0.7) {
        const fadeOut = Math.max(0, 1 - (distanceFromCenter - 0.7) / 0.3);
        vertices[i + 1] *= fadeOut;
      }
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    
    // Create shader material with gradient effect for more synthwave style
    const colors = [
      new THREE.Color(color), 
      new THREE.Color(0x220033) // Dark purple base
    ];
    
    // Create gradient material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: colors[0] },
        color2: { value: colors[1] },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = position.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying float vY;
        void main() {
          // Create gradient based on y position
          float t = clamp(vY / 5.0, 0.0, 1.0);
          gl_FragColor = vec4(mix(color2, color1, t), 1.0);
        }
      `,
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
  public update(_deltaTime: number): void {
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