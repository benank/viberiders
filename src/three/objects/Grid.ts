import * as THREE from 'three';

/**
 * Represents the grid floor in the cyberpunk scene
 */
export class Grid {
  private gridGroup: THREE.Group;
  private gridLines!: THREE.GridHelper;
  private floorPlane!: THREE.Mesh;
  
  constructor(size: number = 100, divisions: number = 80) {
    // Create a group to hold all grid elements
    this.gridGroup = new THREE.Group();
    
    // Create an opaque floor plane
    this.createFloorPlane(size);
    
    // Create grid lines
    this.createGridLines(size, divisions);
    
    // Add both elements to the group
    this.gridGroup.add(this.floorPlane);
    this.gridGroup.add(this.gridLines);
    
    // Position grid at y=0 to ensure hoverboard floats above it
    this.gridGroup.position.y = 0;
    
    // Rotate grid to match expected orientation
    // This ensures the grid extends into the distance rather than to the sides
    this.gridGroup.rotation.y = Math.PI / 4;
  }

  /**
   * Create an opaque floor plane with gradient shading
   */
  private createFloorPlane(size: number): void {
    // Create geometry for the floor
    const geometry = new THREE.PlaneGeometry(size, size, 32, 32);
    geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
    
    // Create vertex colors for gradient effect
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const positions = geometry.attributes.position.array;
    
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      // Distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z) / (size * 0.5);
      const normalizedDistance = Math.min(1.0, distanceFromCenter);
      
      // Closest point is vibrant cyan, farthest point is dark blue/purple
      // RGB for Cyan (0, 1, 1)
      // RGB for Dark Blue/Purple (0.05, 0, 0.2)
      const r = 0.05 * normalizedDistance;
      const g = 0.1 + (1 - normalizedDistance) * 0.3; // More green near player
      const b = 0.2 + (1 - normalizedDistance) * 0.5; // More blue near player
      
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
    
    // Add color attribute to geometry
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create material with vertex colors
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.FrontSide, // Only render top side
      emissive: 0x000000,
      emissiveIntensity: 0.2
    });
    
    // Create mesh
    this.floorPlane = new THREE.Mesh(geometry, material);
  }

  /**
   * Create grid lines to overlay on the floor
   */
  private createGridLines(size: number, divisions: number): void {
    // Initialize grid
    this.gridLines = new THREE.GridHelper(size, divisions);
    
    // Raise slightly above floor to prevent z-fighting
    this.gridLines.position.y = 0.01;
    
    // Make the grid cyan color
    const gridMaterial = this.gridLines.material as THREE.Material;
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach(m => {
        if (m instanceof THREE.LineBasicMaterial) {
          m.color.set(0x00ffff);
          m.opacity = 0.7;
          m.transparent = true;
        }
      });
    } else if (gridMaterial instanceof THREE.LineBasicMaterial) {
      gridMaterial.color.set(0x00ffff);
      gridMaterial.opacity = 0.7;
      gridMaterial.transparent = true;
    }
  }
  
  /**
   * Get the mesh
   */
  public getMesh(): THREE.Group {
    return this.gridGroup;
  }
  
  /**
   * Update the grid (can be used for animations)
   * @param deltaTime Time since last frame
   */
  public update(_deltaTime: number): void {
    // We could add grid animation here in the future, like:
    // - Pulsing grid lines
    // - Flowing grid movement for cyberpunk effect
  }
  
  /**
   * Dispose resources
   */
  public dispose(): void {
    // Dispose grid lines
    const gridMaterial = this.gridLines.material as THREE.Material;
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach(m => m.dispose());
    } else {
      gridMaterial.dispose();
    }
    
    if (this.gridLines.geometry) {
      this.gridLines.geometry.dispose();
    }
    
    // Dispose floor plane
    if (this.floorPlane.geometry) {
      this.floorPlane.geometry.dispose();
    }
    
    if (this.floorPlane.material) {
      if (Array.isArray(this.floorPlane.material)) {
        this.floorPlane.material.forEach(m => m.dispose());
      } else {
        this.floorPlane.material.dispose();
      }
    }
  }
} 