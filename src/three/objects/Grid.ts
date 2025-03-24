import * as THREE from 'three';

/**
 * Represents the grid floor in the cyberpunk scene
 */
export class Grid {
  private gridGroup: THREE.Group;
  private floorPlane!: THREE.Mesh;
  private floorMaterial!: THREE.MeshStandardMaterial;
  private textureOffsetX: number = 0;
  private textureOffsetY: number = 0;
  
  constructor(size: number = 100) {
    // Create a group to hold all grid elements
    this.gridGroup = new THREE.Group();
    
    // Create an opaque floor plane with texture
    this.createFloorPlane(size);
    
    // Add the floor plane to the group
    this.gridGroup.add(this.floorPlane);
    
    // Position grid at y=0 to ensure hoverboard floats above it
    this.gridGroup.position.y = 0;
    
    // Rotate grid to match expected orientation
    // This ensures the grid extends into the distance rather than to the sides
    this.gridGroup.rotation.y = Math.PI / 4;
  }

  /**
   * Create an opaque floor plane with scrollable texture
   */
  private createFloorPlane(size: number): void {
    // Create geometry for the floor
    const geometry = new THREE.PlaneGeometry(size, size, 32, 32);
    geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
    
    // Create a grid texture procedurally
    const textureSize = 2048; // Increased for higher resolution
    const texture = this.createGridTexture(textureSize);
    
    // Make texture repeat many times over the grid
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(15, 15); // Reduced repeat factor to make grid cells larger
    
    // Create material with texture
    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.FrontSide, // Only render top side
      emissive: 0x000000,
      emissiveIntensity: 0.2
    });
    
    // Create mesh
    this.floorPlane = new THREE.Mesh(geometry, this.floorMaterial);
  }
  
  /**
   * Create a procedural grid texture
   */
  private createGridTexture(size: number): THREE.Texture {
    // Create a canvas to draw the grid texture
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    
    // Fill background with gradient from dark blue/purple to black
    const gradient = context.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(13, 0, 51, 1)'); // Dark blue/purple
    gradient.addColorStop(1, 'rgba(5, 0, 20, 1)'); // Nearly black
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // Draw grid lines
    context.strokeStyle = 'rgba(0, 255, 255, 0.7)'; // Cyan color for grid lines
    context.lineWidth = 4; // Thicker lines for better visibility
    
    // Draw lines with gradient opacity
    const lineCount = 8; // Adjusted line count
    const cellSize = size / lineCount;
    
    // Draw horizontal lines
    for (let i = 0; i <= lineCount; i++) {
      const y = i * cellSize;
      const opacity = 1 - (i / lineCount) * 0.7; // Fade out with distance, less fade
      
      context.beginPath();
      context.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
      context.moveTo(0, y);
      context.lineTo(size, y);
      context.stroke();
    }
    
    // Draw vertical lines
    for (let i = 0; i <= lineCount; i++) {
      const x = i * cellSize;
      const opacity = 1 - (i / lineCount) * 0.7; // Fade out with distance, less fade
      
      context.beginPath();
      context.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
      context.moveTo(x, 0);
      context.lineTo(x, size);
      context.stroke();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    return texture;
  }
  
  /**
   * Get the mesh
   */
  public getMesh(): THREE.Group {
    return this.gridGroup;
  }
  
  /**
   * Update the grid texture offset to create scrolling effect
   * @param deltaTime Time since last frame
   * @param speed Speed of movement
   */
  public update(deltaTime: number, speed: number = 0): void {
    // Update texture offset to create scrolling illusion
    if (speed > 0 && this.floorMaterial.map) {
      // Calculate offset amount based on speed and delta time
      const offsetAmount = speed * deltaTime * 0.05; // Adjust multiplier for scroll speed
      
      // Update both X and Y offsets to create diagonal movement toward player
      // Note: Since the grid is rotated 45 degrees (Math.PI/4), we need to adjust both X and Y
      // to create the illusion of forward movement
      this.textureOffsetX += offsetAmount;
      this.textureOffsetY += offsetAmount;
      
      // Apply offset to texture (both X and Y for diagonal scrolling)
      this.floorMaterial.map.offset.set(this.textureOffsetX, this.textureOffsetY);
      this.floorMaterial.map.needsUpdate = true;
    }
  }
  
  /**
   * Reset the texture offset
   */
  public resetTextureOffset(): void {
    this.textureOffsetX = 0;
    this.textureOffsetY = 0;
    if (this.floorMaterial.map) {
      this.floorMaterial.map.offset.set(0, 0);
      this.floorMaterial.map.needsUpdate = true;
    }
  }
  
  /**
   * Dispose resources
   */
  public dispose(): void {
    // Dispose floor plane
    if (this.floorPlane.geometry) {
      this.floorPlane.geometry.dispose();
    }
    
    if (this.floorMaterial) {
      if (this.floorMaterial.map) {
        this.floorMaterial.map.dispose();
      }
      this.floorMaterial.dispose();
    }
  }
} 