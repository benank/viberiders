import * as THREE from 'three';

/**
 * Represents a collectible crystal that increases the player's crystal count
 */
export class Crystal {
  private mesh: THREE.Group;
  private position: { x: number; z: number };
  private lane: number;
  private isActive: boolean = true;
  private boundingBox: THREE.Box3;
  private rotationSpeed: number = 1;
  
  // Lane system (should match HoverBoard)
  private lanes = [-2.5, 0, 2.5]; // Left, Center, Right
  
  constructor(lane: number = 1, startZ: number = -100) {
    this.mesh = new THREE.Group();
    this.lane = lane;
    this.position = { 
      x: this.lanes[lane],
      z: startZ
    };
    
    // Create the crystal
    this.createCrystal();
    
    // Set initial position - floating above the grid
    this.mesh.position.set(this.position.x, 1.2, this.position.z);
    
    // Create bounding box for collision detection
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }
  
  /**
   * Create the crystal geometry and materials
   */
  private createCrystal(): void {
    // Create a diamond-like geometry for the crystal
    const crystalGeometry = new THREE.OctahedronGeometry(0.6, 1);
    
    // Create a shiny, translucent material for the crystal
    const crystalMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.7,
      wireframe: false,
      depthWrite: true
    });
    
    // Create the main crystal
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    crystal.renderOrder = 0;
    this.mesh.add(crystal);
    
    // Add a glowing edge for more visibility
    const glowGeometry = new THREE.OctahedronGeometry(0.7, 1);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ffee,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
      depthWrite: false
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.renderOrder = 1;
    this.mesh.add(glow);
    
    // Add a small point light for additional glow effect
    const light = new THREE.PointLight(0x00ffcc, 0.6, 3);
    light.position.set(0, 0, 0);
    this.mesh.add(light);
  }
  
  /**
   * Get the mesh for rendering
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  /**
   * Update the crystal
   */
  public update(deltaTime: number, speed: number): void {
    if (!this.isActive) return;
    
    // Move the crystal 
    this.mesh.position.z += speed * deltaTime;
    
    // Rotate the crystal
    this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    this.mesh.rotation.x += this.rotationSpeed * 0.5 * deltaTime;
    
    // Update bounding box
    this.boundingBox.setFromObject(this.mesh);
  }
  
  /**
   * Check if crystal is past the player
   */
  public isPastPlayer(): boolean {
    return this.mesh.position.z > 10;
  }
  
  /**
   * Get the lane of the crystal
   */
  public getLane(): number {
    return this.lane;
  }
  
  /**
   * Get the bounding box for collision detection
   */
  public getBoundingBox(): THREE.Box3 {
    return this.boundingBox;
  }
  
  /**
   * Check if the crystal is active
   */
  public isCrystalActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Set the crystal's active state
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    this.mesh.visible = active;
  }
  
  /**
   * Reset the crystal for reuse
   */
  public reset(lane: number, startZ: number): void {
    this.lane = lane;
    this.position.x = this.lanes[lane];
    this.position.z = startZ;
    this.mesh.position.set(this.position.x, 1.2, this.position.z);
    this.setActive(true);
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
} 