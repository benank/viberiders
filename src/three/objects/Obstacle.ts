import * as THREE from 'three';

// Type of obstacle
export enum ObstacleType {
  WALL,        // Regular wall in one lane
  DOUBLE_WALL  // Two walls forcing player to use a specific lane
}

/**
 * Represents a cyberpunk obstacle that the player must avoid
 */
export class Obstacle {
  private mesh: THREE.Group;
  private position: { x: number; z: number };
  private lane: number;
  private isActive: boolean = true;
  private boundingBox: THREE.Box3;
  private obstacleType: ObstacleType;
  
  // Lane system (should match HoverBoard)
  private lanes = [-2.5, 0, 2.5]; // Left, Center, Right
  
  constructor(width: number = 0.8, startZ: number = -100, type: ObstacleType = ObstacleType.WALL, lane: number = 1) {
    this.mesh = new THREE.Group();
    this.lane = lane;
    this.obstacleType = type;
    this.position = { 
      x: this.lanes[lane],
      z: startZ
    };
    
    // Create the obstacle based on type
    this.createObstacle(width);
    
    // Set initial position
    this.mesh.position.set(this.position.x, 0.8, this.position.z);
    
    // Create bounding box for collision detection
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }
  
  /**
   * Create the obstacle geometry and materials
   */
  private createObstacle(width: number): void {
    switch (this.obstacleType) {
      case ObstacleType.WALL:
        this.createWallObstacle(width);
        break;
      case ObstacleType.DOUBLE_WALL:
        this.createDoubleWallObstacle();
        break;
    }
  }
  
  /**
   * Create a standard wall obstacle
   */
  private createWallObstacle(width: number): void {
    // Create a wall-shaped obstacle (wider, thinner, taller)
    const wallGeometry = new THREE.BoxGeometry(3.0 * width, 3.0, 0.2);
    
    // Create material with built-in glow effect to avoid expensive lighting
    const wallMaterial = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.7,
      depthWrite: true // Enable depth writing to prevent transparency issues
    });
    
    // Create the main wall
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 1.5; // Position above grid
    wall.renderOrder = 0; // Base render order
    this.mesh.add(wall);
    
    // Add a brighter edge frame with proper z-offset
    const edgeGeometry = new THREE.BoxGeometry(3.1 * width, 3.1, 0.1);
    const edgeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      depthWrite: true,
      depthTest: true
    });
    
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
    edge.position.y = 1.5;
    edge.position.z = -0.15; // Position behind the main wall
    edge.renderOrder = -1; // Render before the main wall
    this.mesh.add(edge);
    
    // Add horizontal grid lines to the wall for cyberpunk effect
    this.addGridLines(wall, width);
  }
  
  /**
   * Create a double wall obstacle with an opening in one lane
   */
  private createDoubleWallObstacle(): void {
    // Determine positions of the two walls based on the lane
    // We'll create two walls that block two lanes, forcing the player to use the third lane
    const lanesBlocked = [];
    let widthMultiplier = 0.65; // Slightly narrower walls
    
    // Choose the two lanes to block
    if (this.lane === 0) {
      // Block center and right lanes (force player to left)
      lanesBlocked.push(1, 2);
    } else if (this.lane === 1) {
      // Block left and right lanes (force player to center)
      lanesBlocked.push(0, 2);
    } else {
      // Block left and center lanes (force player to right)
      lanesBlocked.push(0, 1);
    }
    
    // Create each wall
    lanesBlocked.forEach(blockedLane => {
      // Create a wall-shaped obstacle
      const wallGeometry = new THREE.BoxGeometry(3.0 * widthMultiplier, 3.0, 0.2);
      
      // Create material with built-in glow effect
      const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3366, // Slightly different color for dual walls
        transparent: true,
        opacity: 0.7,
        depthWrite: true
      });
      
      // Create the main wall
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.y = 1.5; // Position above grid
      wall.position.x = this.lanes[blockedLane] - this.lanes[this.lane]; // Position relative to the lane of the obstacle
      wall.renderOrder = 0;
      this.mesh.add(wall);
      
      // Add a brighter edge frame
      const edgeGeometry = new THREE.BoxGeometry(3.1 * widthMultiplier, 3.1, 0.1);
      const edgeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        depthWrite: true,
        depthTest: true
      });
      
      const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
      edge.position.y = 1.5;
      edge.position.x = wall.position.x;
      edge.position.z = -0.15; // Position behind the main wall
      edge.renderOrder = -1;
      this.mesh.add(edge);
      
      // Add grid lines
      this.addGridLines(wall, widthMultiplier);
    });
  }
  
  /**
   * Add grid lines to the wall for cyberpunk effect
   */
  private addGridLines(wall: THREE.Mesh, widthMultiplier: number = 1): void {
    const width = 3.0 * widthMultiplier;
    const height = 3.0;
    
    // Add horizontal grid lines
    const lineCount = 6;
    const lineSpacing = height / lineCount;
    
    for (let i = 0; i <= lineCount; i++) {
      const lineGeometry = new THREE.PlaneGeometry(width - 0.1, 0.03);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false, // Disable depth writing for overlapping transparency
        depthTest: true
      });
      
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.y = -height/2 + i * lineSpacing;
      line.position.z = 0.12; // Ensure sufficient z-offset (in front of wall)
      line.renderOrder = 1; // Render after the main wall
      wall.add(line);
    }
    
    // Add 2 vertical lines for a portal/doorway look
    const vertLineGeometry = new THREE.PlaneGeometry(0.03, height - 0.1);
    const vertLineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false, // Disable depth writing for overlapping transparency
      depthTest: true
    });
    
    const leftLine = new THREE.Mesh(vertLineGeometry, vertLineMaterial);
    leftLine.position.x = -width/2 + 0.3;
    leftLine.position.z = 0.12; // Match the horizontal lines z-offset
    leftLine.renderOrder = 1; // Same as horizontal lines
    wall.add(leftLine);
    
    const rightLine = new THREE.Mesh(vertLineGeometry, vertLineMaterial);
    rightLine.position.x = width/2 - 0.3;
    rightLine.position.z = 0.12; // Match the horizontal lines z-offset
    rightLine.renderOrder = 1; // Same as horizontal lines
    wall.add(rightLine);
  }
  
  /**
   * Get the mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }
  
  /**
   * Update the obstacle position
   */
  public update(deltaTime: number, speed: number): void {
    if (!this.isActive) return;
    
    // Move forward (increase z value)
    this.position.z += speed * deltaTime;
    this.mesh.position.z = this.position.z;
    
    // No rotation - walls don't rotate
    
    // Update bounding box only when close to player (performance optimization)
    if (this.position.z > -10 && this.position.z < 15) {
      this.boundingBox.setFromObject(this.mesh);
    }
  }
  
  /**
   * Check if obstacle is past the player
   */
  public isPastPlayer(): boolean {
    return this.position.z > 10;
  }
  
  /**
   * Get the obstacle type
   */
  public getType(): ObstacleType {
    return this.obstacleType;
  }
  
  /**
   * Check if the obstacle is in the given lane
   */
  public getLane(): number {
    return this.lane;
  }
  
  /**
   * Get the obstacle's bounding box for collision detection
   */
  public getBoundingBox(): THREE.Box3 {
    return this.boundingBox;
  }
  
  /**
   * Check if the obstacle is active
   */
  public isObstacleActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Set obstacle active state
   */
  public setActive(active: boolean): void {
    this.isActive = active;
    this.mesh.visible = active;
  }
  
  /**
   * Reset the obstacle to a new position
   */
  public reset(lane: number, startZ: number, type: ObstacleType = ObstacleType.WALL): void {
    this.lane = lane;
    this.position.x = this.lanes[lane];
    this.position.z = startZ;
    
    // If type has changed, rebuild the obstacle
    if (type !== this.obstacleType) {
      this.obstacleType = type;
      
      // Clear existing meshes
      while (this.mesh.children.length > 0) {
        const child = this.mesh.children[0];
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else if (child.material) {
            child.material.dispose();
          }
        }
        this.mesh.remove(child);
      }
      
      // Create new obstacle
      this.createObstacle(0.8);
    }
    
    this.mesh.position.set(this.position.x, 0.8, startZ);
    this.isActive = true;
    this.mesh.visible = true;
  }
  
  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.mesh.traverse((object) => {
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