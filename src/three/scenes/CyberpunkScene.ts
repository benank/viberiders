import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Grid } from '../objects/Grid';
import { Mountains } from '../objects/Mountains';
import { Sun } from '../objects/Sun';
import { HoverBoard } from '../objects/HoverBoard';
import { Obstacle } from '../objects/Obstacle';
import { gameStateAtom, distanceAtom, GameState, scoreAtom } from '../store/gameStore';
import { getDefaultStore } from 'jotai';

/**
 * The main cyberpunk-themed scene
 */
export class CyberpunkScene extends Scene {
  private grid: Grid;
  private mountains: Mountains;
  private sun: Sun;
  private hoverboard: HoverBoard;
  private obstacles: Obstacle[] = [];
  private obstaclePool: Obstacle[] = [];
  private nextObstacleTime: number = 0;
  private minObstacleSpacing: number = 3.0; // Increased minimum spacing for better gameplay
  private maxObstacleSpacing: number = 6.0; // Increased maximum spacing for better gameplay
  private obstacleSpawningActive: boolean = false;
  private hoverboardBox: THREE.Box3 = new THREE.Box3();
  private gameTime: number = 0;
  private keyStates: { [key: string]: boolean } = {};
  private store = getDefaultStore();
  private gameState: GameState = 'idle';
  private speed = 5;
  private cameraOffset = new THREE.Vector3(0, 3, 10);
  
  // Scene positions
  private gridInitialZ = 0;
  private mountainsInitialZ = -138; // Slightly in front of the sun
  private sunInitialZ = -140; // Far back as a background element
  
  constructor() {
    super();
    
    // Initialize scene properties - increased fog distance to ensure mountains are visible
    this.scene.fog = new THREE.Fog(0x000000, 30, 250);
    
    // Initialize camera
    this.camera.position.set(0, 3, 10); // Slightly further back for better perspective
    this.camera.rotation.x = -0.3; // Adjusted angle to look at board and grid
    
    // Create scene objects
    this.grid = new Grid(300, 120); // Larger grid for more immersive environment
    this.mountains = new Mountains();
    this.sun = new Sun();
    this.hoverboard = new HoverBoard();
    
    // Setup keyboard controls
    this.setupKeyboardControls();
    
    // Store subscription
    this.store.sub(gameStateAtom, () => {
      const newState = this.store.get(gameStateAtom);
      this.handleGameStateChange(newState);
    });
  }
  
  /**
   * Initialize the scene
   */
  public initialize(): void {
    // Add sun first as the background
    const sunMesh = this.sun.getMesh();
    sunMesh.position.z = this.sunInitialZ; // Far back as background
    sunMesh.position.y = 15; // Higher in the sky to cover more background
    sunMesh.scale.set(1.5, 1.5, 1); // Make it even larger to fill the background
    this.scene.add(sunMesh);
    
    // Add mountains to scene - position them as silhouettes in front of the sun
    const mountainsMesh = this.mountains.getMesh();
    mountainsMesh.position.z = this.mountainsInitialZ; // Position in front of the sun
    mountainsMesh.position.y = 0; // Positioned at the horizon line
    mountainsMesh.scale.set(1.2, 1.5, 1.0); // Larger scale for better visibility
    this.scene.add(mountainsMesh);
    
    // Add grid to scene
    const gridMesh = this.grid.getMesh();
    gridMesh.position.z = this.gridInitialZ;
    this.scene.add(gridMesh);
    
    // Set up hoverboard - let it hover above the grid naturally
    const hoverboardMesh = this.hoverboard.getMesh();
    hoverboardMesh.position.z = 5; // Positioned in front of the camera
    this.scene.add(hoverboardMesh);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x9900ff, 0.3); // Increased ambient light
    this.scene.add(ambientLight);
    
    // Add directional light to simulate sun
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.3); // Increased intensity
    directionalLight.position.set(0, 6, 5);
    this.scene.add(directionalLight);
    
    // Add ground glow to enhance grid effect
    const groundGlow = new THREE.PointLight(0x00ffff, 0.6, 20);
    groundGlow.position.set(0, -0.5, 5);
    this.scene.add(groundGlow);
    
    // Add spotlight to illuminate the hoverboard
    const spotlight = new THREE.SpotLight(0xffffff, 0.6, 30, Math.PI * 0.3);
    spotlight.position.set(0, 10, 8);
    spotlight.target.position.set(0, 0, 5);
    this.scene.add(spotlight);
    this.scene.add(spotlight.target);
    
    // Create lane markers to show the three lanes
    this.createLaneMarkers();
    
    // Initialize obstacle pool
    this.initializeObstaclePool();
  }
  
  /**
   * Initialize a pool of reusable obstacles
   */
  private initializeObstaclePool(): void {
    // Create a pool of obstacles that we can reuse
    const poolSize = 10; // Pool size of 10 obstacles should be more than enough
    
    for (let i = 0; i < poolSize; i++) {
      // Create obstacles but keep them far away and inactive initially
      const obstacle = new Obstacle(1, -200);
      this.obstaclePool.push(obstacle);
      this.scene.add(obstacle.getMesh());
      obstacle.setActive(false); // Initially inactive
    }
  }
  
  /**
   * Get an obstacle from the pool
   */
  private getObstacleFromPool(): Obstacle | null {
    for (const obstacle of this.obstaclePool) {
      if (!obstacle.isObstacleActive()) {
        return obstacle;
      }
    }
    return null; // No available obstacles in the pool
  }
  
  /**
   * Spawn a new obstacle
   */
  private spawnObstacle(): void {
    if (!this.obstacleSpawningActive) return;
    
    const obstacle = this.getObstacleFromPool();
    if (!obstacle) return; // No available obstacles in the pool
    
    // Choose a random lane (0, 1, or 2)
    let lane = Math.floor(Math.random() * 3);
    
    // Check if there's already an obstacle in this lane that's too close
    const tooClose = this.obstacles.some(existing => {
      const existingZ = existing.getMesh().position.z;
      const existingLane = existing.getLane();
      // Don't spawn in the same lane if there's already an obstacle within 20 units
      return (existingLane === lane) && (existingZ < -80) && (existingZ > -140);
    });
    
    // If too close, try a different lane
    if (tooClose) {
      // Try a different lane (cyclically)
      lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    }
    
    // Ensure obstacles are spawned far enough away to be invisible initially
    // This helps with performance as they become visible more gradually
    const startZ = -140; 
    
    // Initialize the obstacle
    obstacle.reset(lane, startZ);
    
    // Add to active obstacles list
    this.obstacles.push(obstacle);
    
    // Set time for next obstacle - adjust timing based on current speed
    const distance = this.hoverboard.getDistance();
    const speedFactor = Math.min(distance / 1000, 1); // Max speedup factor of 1
    
    // As the game progresses, decrease the minimum and maximum obstacle spacing
    // This makes the game gradually more challenging
    const adjustedMinSpacing = Math.max(this.minObstacleSpacing - speedFactor, 1.5);
    const adjustedMaxSpacing = Math.max(this.maxObstacleSpacing - speedFactor * 2, 3.0);
    
    this.nextObstacleTime = this.gameTime + adjustedMinSpacing + 
                          Math.random() * (adjustedMaxSpacing - adjustedMinSpacing);
  }
  
  /**
   * Update obstacles
   */
  private updateObstacles(deltaTime: number, speed: number): void {
    // Check if it's time to spawn a new obstacle
    if (this.gameTime >= this.nextObstacleTime) {
      this.spawnObstacle();
    }
    
    // Update all active obstacles - limit the number of active obstacles for performance
    const maxVisibleObstacles = 6; // Slight increase to ensure smooth performance
    
    // Sort obstacles by z-position (closest first) to prioritize updating the closest ones
    this.obstacles.sort((a, b) => b.getMesh().position.z - a.getMesh().position.z);
    
    // Only update the closest obstacles
    const obstaclesToUpdate = Math.min(this.obstacles.length, maxVisibleObstacles);
    
    for (let i = 0; i < obstaclesToUpdate; i++) {
      this.obstacles[i].update(deltaTime, speed);
    }
    
    // Check for obstacles that are past the player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      
      // Check if obstacle is past the player
      if (obstacle.isPastPlayer()) {
        // Remove from active obstacles
        this.obstacles.splice(i, 1);
        obstacle.setActive(false);
        
        // Update score (player successfully avoided this obstacle)
        const currentScore = this.store.get(scoreAtom);
        this.store.set(scoreAtom, currentScore + 10);
      }
    }
  }
  
  /**
   * Check for collisions between hoverboard and obstacles
   */
  private checkCollisions(): void {
    if (this.gameState !== 'playing') return;
    
    // Only update the bounding box once per frame
    const hoverboardMesh = this.hoverboard.getMesh();
    this.hoverboardBox.setFromObject(hoverboardMesh);
    
    // Only check collisions with obstacles that are close to the player
    // Sort obstacles by proximity to player for more efficient checks
    const closeObstacles = this.obstacles.filter(obstacle => {
      const obstacleZ = obstacle.getMesh().position.z;
      // Only check obstacles within collision range (between -5 and 8)
      return obstacleZ > -5 && obstacleZ < 8;
    });
    
    // Check collision with each close obstacle
    for (const obstacle of closeObstacles) {
      if (obstacle.isObstacleActive()) {
        const obstacleBox = obstacle.getBoundingBox();
        
        if (this.hoverboardBox.intersectsBox(obstacleBox)) {
          // Collision detected!
          this.handleCollision();
          break;
        }
      }
    }
  }
  
  /**
   * Handle collision with obstacle
   */
  private handleCollision(): void {
    // Set game state to game over
    this.store.set(gameStateAtom, 'gameOver');
    
    // Stop obstacle spawning
    this.obstacleSpawningActive = false;
    
    // Visual/audio feedback could be added here
    console.log('Collision! Game Over');
  }
  
  /**
   * Create lane markers to show the three lanes
   */
  private createLaneMarkers(): void {
    const laneWidth = 2.5;
    const lanePositions = [-laneWidth, 0, laneWidth]; // Same as HoverBoard.lanes
    
    // Create a simple lane marker for each lane
    lanePositions.forEach(xPos => {
      // Create a glowing line to represent the lane
      const markerGeometry = new THREE.BoxGeometry(0.2, 0.05, 60); // Made markers longer
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
      });
      
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(xPos, 0.01, 5); // Slightly above the grid
      this.scene.add(marker);
    });
  }
  
  /**
   * Set up keyboard controls for the hoverboard
   */
  private setupKeyboardControls(): void {
    // Set up key event listeners
    window.addEventListener('keydown', (event) => {
      this.keyStates[event.code] = true;
    });
    
    window.addEventListener('keyup', (event) => {
      this.keyStates[event.code] = false;
    });
  }
  
  /**
   * Check and handle keyboard input
   */
  private handleKeyboardInput(): void {
    if (this.gameState !== 'playing') return;
    
    // Left movement - left arrow or A
    if (this.keyStates['ArrowLeft'] || this.keyStates['KeyA']) {
      this.hoverboard.moveLeft();
    }
    
    // Right movement - right arrow or D
    if (this.keyStates['ArrowRight'] || this.keyStates['KeyD']) {
      this.hoverboard.moveRight();
    }
  }
  
  /**
   * Update the scene elements to create illusion of forward movement
   * @param deltaTime Time since last frame
   */
  private updateSceneMovement(deltaTime: number): void {
    if (this.gameState !== 'playing') return;
    
    // Get the speed from hoverboard
    const distance = this.hoverboard.getDistance();
    const speed = 12 + Math.min(distance / 300, 18); // Increased base speed and max speed
    
    // Move the grid to create illusion of movement
    const gridMesh = this.grid.getMesh();
    
    // Reset grid position if it's gone too far
    if (gridMesh.position.z > 30) {
      gridMesh.position.z = this.gridInitialZ;
    }
    
    // Move grid forward
    gridMesh.position.z += speed * deltaTime;
    
    // Update obstacles with the same speed
    this.updateObstacles(deltaTime, speed);
    
    // Mountains and sun remain stationary - no movement code for these objects
  }
  
  /**
   * Update the distance in the store
   */
  private updateDistance(): void {
    if (this.gameState === 'playing') {
      const distance = this.hoverboard.getDistance();
      this.store.set(distanceAtom, Math.floor(distance));
    }
  }
  
  /**
   * Update the scene (called every frame)
   */
  public update(): void {
    const deltaTime = this.clock.getDelta();
    this.gameTime += deltaTime;
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Update scene movement
    this.updateSceneMovement(deltaTime);
    
    // Check for collisions
    this.checkCollisions();
    
    // Update distance counter
    this.updateDistance();
    
    // Update grid
    this.grid.update(deltaTime);
    
    // Update mountains
    this.mountains.update(deltaTime);
    
    // Update sun
    this.sun.update(deltaTime);
    
    // Update hoverboard
    this.hoverboard.update(deltaTime);
  }
  
  /**
   * Handle window resize
   */
  public handleResize(width: number, height: number): void {
    // Update camera aspect ratio and projection matrix
    super.handleResize(width, height);
  }
  
  /**
   * Handle game state changes
   */
  private handleGameStateChange(newState: GameState): void {
    this.gameState = newState;
    
    if (newState === 'playing') {
      // Reset game variables
      this.gameTime = 0;
      this.nextObstacleTime = 4.0; // Start first obstacle after 4 seconds for better player ramp-up
      this.obstacleSpawningActive = true;
      
      // Clear existing obstacles
      for (const obstacle of this.obstacles) {
        obstacle.setActive(false);
      }
      this.obstacles = [];
      
      // Make sure all pool objects are properly hidden
      for (const obstacle of this.obstaclePool) {
        obstacle.setActive(false);
      }
      
      // Start hoverboard movement
      this.hoverboard.startMoving();
    } else if (newState === 'gameOver') {
      // Stop hoverboard movement
      this.hoverboard.stopMoving();
      
      // Stop obstacle spawning
      this.obstacleSpawningActive = false;
    }
  }
  
  /**
   * Reset the scene for a new game
   */
  public resetGame(): void {
    // Reset all obstacles to inactive
    for (const obstacle of this.obstacles) {
      obstacle.setActive(false);
    }
    this.obstacles = [];
    
    // Reset game variables
    this.gameTime = 0;
    this.nextObstacleTime = 0;
  }
  
  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyboardInput);
    window.removeEventListener('keyup', this.handleKeyboardInput);
    
    // Dispose grid
    this.grid.dispose();
    
    // Dispose mountains
    this.mountains.dispose();
    
    // Dispose sun
    this.sun.dispose();
    
    // Dispose hoverboard
    this.hoverboard.dispose();
    
    // Dispose obstacles
    for (const obstacle of this.obstaclePool) {
      obstacle.dispose();
    }
  }
} 