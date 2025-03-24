import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Grid } from '../objects/Grid';
import { Mountains } from '../objects/Mountains';
import { Sun } from '../objects/Sun';
import { HoverBoard } from '../objects/HoverBoard';
import { Obstacle } from '../objects/Obstacle';
import { Crystal } from '../objects/Crystal';
import { gameStateAtom, distanceAtom, GameState, scoreAtom, crystalCountAtom } from '../store/gameStore';
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
  private crystals: Crystal[] = [];
  private crystalPool: Crystal[] = [];
  private nextObstacleTime: number = 0;
  private nextCrystalTime: number = 0;
  private minObstacleSpacing: number = 3.0; // Increased minimum spacing for better gameplay
  private maxObstacleSpacing: number = 6.0; // Increased maximum spacing for better gameplay
  private minCrystalSpacing: number = 2.0;
  private maxCrystalSpacing: number = 4.0;
  private obstacleSpawningActive: boolean = false;
  private crystalSpawningActive: boolean = false;
  private hoverboardBox: THREE.Box3 = new THREE.Box3();
  private gameTime: number = 0;
  private keyStates: { [key: string]: boolean } = {};
  private store = getDefaultStore();
  private gameState: GameState = 'idle';
  private backgroundMusic: HTMLAudioElement | null = null;
  private crystalSound: HTMLAudioElement | null = null;
  private explosionSound: HTMLAudioElement | null = null;
  // Flag to ignore the first tap/click after starting the game
  private ignoreNextTap: boolean = false;
  
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
    mountainsMesh.position.y = -5; // Lowered below the grid to prevent floating
    mountainsMesh.scale.set(1.3, 1.8, 1.0); // Increased vertical scale for more dramatic mountains
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
    
    // Initialize crystal pool
    this.initializeCrystalPool();
    
    // Initialize background music
    this.initializeAudio();
  }
  
  /**
   * Initialize audio elements
   */
  private initializeAudio(): void {
    // Create background music
    this.backgroundMusic = new Audio('/vibing.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.25;
    
    // Create crystal sound effect
    this.crystalSound = new Audio('/crystal.mp3');
    this.crystalSound.volume = 0.5;
    
    // Create explosion sound effect
    this.explosionSound = new Audio('/explode.mp3');
    this.explosionSound.volume = 0.6;
  }
  
  /**
   * Initialize a pool of reusable obstacles
   */
  private initializeObstaclePool(): void {
    // Create a pool of obstacles that we can reuse
    const poolSize = 10; // Pool size of 10 obstacles should be more than enough
    
    for (let i = 0; i < poolSize; i++) {
      // Create obstacles but keep them far away and inactive initially
      // Using 0.8 width instead of 1 to make obstacles less wide
      const obstacle = new Obstacle(0.8, -200);
      this.obstaclePool.push(obstacle);
      this.scene.add(obstacle.getMesh());
      obstacle.setActive(false); // Initially inactive
    }
  }
  
  /**
   * Initialize a pool of reusable crystals
   */
  private initializeCrystalPool(): void {
    // Create a pool of crystals that we can reuse
    const poolSize = 8; // Pool size for crystals
    
    for (let i = 0; i < poolSize; i++) {
      // Create crystals but keep them far away and inactive initially
      const crystal = new Crystal(1, -200);
      this.crystalPool.push(crystal);
      this.scene.add(crystal.getMesh());
      crystal.setActive(false); // Initially inactive
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
   * Get a crystal from the pool
   */
  private getCrystalFromPool(): Crystal | null {
    for (const crystal of this.crystalPool) {
      if (!crystal.isCrystalActive()) {
        return crystal;
      }
    }
    return null; // No available crystals in the pool
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
   * Spawn a new crystal
   */
  private spawnCrystal(): void {
    if (!this.crystalSpawningActive) return;
    
    const crystal = this.getCrystalFromPool();
    if (!crystal) return; // No available crystals in the pool
    
    // Choose a random lane (0, 1, or 2)
    let lane = Math.floor(Math.random() * 3);
    
    // Check if there's already a crystal or obstacle in this lane that's too close
    const tooClose = [...this.crystals, ...this.obstacles].some(existing => {
      const existingZ = existing.getMesh().position.z;
      const existingLane = existing instanceof Crystal 
        ? existing.getLane() 
        : (existing as Obstacle).getLane();
      
      // Don't spawn in the same lane if there's already something within 20 units
      return (existingLane === lane) && (existingZ < -80) && (existingZ > -140);
    });
    
    // If too close, try a different lane
    if (tooClose) {
      // Try a different lane (cyclically)
      lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    }
    
    // Ensure crystals are spawned far enough away to be invisible initially
    const startZ = -130;
    
    // Initialize the crystal
    crystal.reset(lane, startZ);
    
    // Add to active crystals list
    this.crystals.push(crystal);
    
    // Set time for next crystal - adjust timing based on current speed
    const distance = this.hoverboard.getDistance();
    const speedFactor = Math.min(distance / 1000, 1); // Max speedup factor of 1
    
    // As the game progresses, decrease the crystal spacing
    const adjustedMinSpacing = Math.max(this.minCrystalSpacing - speedFactor, 1.0);
    const adjustedMaxSpacing = Math.max(this.maxCrystalSpacing - speedFactor, 2.0);
    
    this.nextCrystalTime = this.gameTime + adjustedMinSpacing + 
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
   * Update crystals
   */
  private updateCrystals(deltaTime: number, speed: number): void {
    // Check if it's time to spawn a new crystal
    if (this.gameTime >= this.nextCrystalTime) {
      this.spawnCrystal();
    }
    
    // Update all active crystals
    const maxVisibleCrystals = 6; 
    
    // Sort crystals by z-position (closest first) to prioritize updating the closest ones
    this.crystals.sort((a, b) => b.getMesh().position.z - a.getMesh().position.z);
    
    // Only update the closest crystals
    const crystalsToUpdate = Math.min(this.crystals.length, maxVisibleCrystals);
    
    for (let i = 0; i < crystalsToUpdate; i++) {
      this.crystals[i].update(deltaTime, speed);
    }
    
    // Check for crystals that are past the player
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      
      // Check if crystal is past the player
      if (crystal.isPastPlayer()) {
        // Remove from active crystals
        this.crystals.splice(i, 1);
        crystal.setActive(false);
      }
    }
  }
  
  /**
   * Check for collisions between hoverboard and obstacles/crystals
   */
  private checkCollisions(): void {
    if (this.gameState !== 'playing') return;
    
    // Only update the bounding box once per frame
    const hoverboardMesh = this.hoverboard.getMesh();
    this.hoverboardBox.setFromObject(hoverboardMesh);
    
    // Check collisions with obstacles
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
          this.handleObstacleCollision();
          break;
        }
      }
    }
    
    // Check collisions with crystals
    const closeCrystals = this.crystals.filter(crystal => {
      const crystalZ = crystal.getMesh().position.z;
      // Only check crystals within collision range (between -5 and 8)
      return crystalZ > -5 && crystalZ < 8;
    });
    
    // Check collision with each close crystal
    for (let i = closeCrystals.length - 1; i >= 0; i--) {
      const crystal = closeCrystals[i];
      if (crystal.isCrystalActive()) {
        const crystalBox = crystal.getBoundingBox();
        
        if (this.hoverboardBox.intersectsBox(crystalBox)) {
          // Crystal collected!
          this.handleCrystalCollection(crystal);
        }
      }
    }
  }
  
  /**
   * Handle collision with obstacle
   */
  private handleObstacleCollision(): void {
    // Set game state to game over
    this.store.set(gameStateAtom, 'gameOver');
    
    // Stop obstacle and crystal spawning
    this.obstacleSpawningActive = false;
    this.crystalSpawningActive = false;
    
    // Play explosion sound effect
    if (this.explosionSound) {
      this.explosionSound.currentTime = 0;
      this.explosionSound.play().catch(err => console.warn('Could not play explosion sound:', err));
    }
    
    console.log('Collision! Game Over');
  }
  
  /**
   * Handle collecting a crystal
   */
  private handleCrystalCollection(crystal: Crystal): void {
    // Increase crystal count
    const currentCrystalCount = this.store.get(crystalCountAtom);
    this.store.set(crystalCountAtom, currentCrystalCount + 1);
    
    // Play crystal collection sound
    if (this.crystalSound) {
      // Reset the sound to allow for rapid successive plays
      this.crystalSound.currentTime = 0;
      this.crystalSound.play().catch(err => console.warn('Could not play crystal sound:', err));
    }
    
    // Deactivate the crystal
    crystal.setActive(false);
    
    // Remove from active crystals list
    const index = this.crystals.indexOf(crystal);
    if (index !== -1) {
      this.crystals.splice(index, 1);
    }
    
    // Visual/audio feedback could be added here
    console.log('Crystal collected!');
  }
  
  /**
   * Create lane markers to show the three lanes
   */
  private createLaneMarkers(): void {
    // Lane markers are now invisible - keeping the method for future reference
    // and to maintain the same structure of the code
    
    // The lanes still functionally exist in the game at positions:
    // -2.5, 0, 2.5 (same as HoverBoard.lanes)
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
    
    // Setup touch and click controls
    this.setupTouchClickControls();
  }
  
  /**
   * Set up touch and click controls for the hoverboard
   */
  private setupTouchClickControls(): void {
    // Add click event listener to the document
    document.addEventListener('click', this.handleTouchClick);
    
    // Add touch event listener for mobile devices
    document.addEventListener('touchstart', this.handleTouchClick);
  }
  
  /**
   * Handle touch or click input
   * @param event Mouse or touch event
   */
  private handleTouchClick = (event: MouseEvent | TouchEvent): void => {
    if (this.gameState !== 'playing') return;
    
    // Ignore this tap/click if it's the one that started the game
    if (this.ignoreNextTap) {
      this.ignoreNextTap = false;
      return;
    }
    
    // Prevent default behavior to avoid scrolling or other unwanted actions
    event.preventDefault();
    
    // Get the x coordinate of the click or touch
    let clientX: number;
    
    if ('touches' in event) {
      // Touch event
      clientX = event.touches[0].clientX;
    } else {
      // Mouse event
      clientX = event.clientX;
    }
    
    // Get the width of the screen
    const screenWidth = window.innerWidth;
    const screenMiddle = screenWidth / 2;
    
    // Move left or right based on where the screen was touched/clicked
    if (clientX < screenMiddle) {
      this.hoverboard.moveLeft();
    } else {
      this.hoverboard.moveRight();
    }
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
    // Make speed increase more aggressively over time
    const baseSpeed = 16;
    const maxAdditionalSpeed = 40; // Increased max speed for faster gameplay
    const accelerationFactor = 150; // Smaller number = faster acceleration
    const speed = baseSpeed + Math.min(distance / accelerationFactor, maxAdditionalSpeed);
    
    // Store speed in the hoverboard for distance calculation
    this.hoverboard.setSpeed(speed);
    
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
    
    // Update crystals with the same speed
    this.updateCrystals(deltaTime, speed);
    
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
      // Set flag to ignore the next tap/click (the one that started the game)
      this.ignoreNextTap = true;
      
      // Reset game variables
      this.gameTime = 0;
      this.nextObstacleTime = 4.0; // Start first obstacle after 4 seconds for better player ramp-up
      this.nextCrystalTime = 2.0; // Start first crystal after 2 seconds
      this.obstacleSpawningActive = true;
      this.crystalSpawningActive = true;
      
      // Clear existing obstacles
      for (const obstacle of this.obstacles) {
        obstacle.setActive(false);
      }
      this.obstacles = [];
      
      // Clear existing crystals
      for (const crystal of this.crystals) {
        crystal.setActive(false);
      }
      this.crystals = [];
      
      // Make sure all pool objects are properly hidden
      for (const obstacle of this.obstaclePool) {
        obstacle.setActive(false);
      }
      
      for (const crystal of this.crystalPool) {
        crystal.setActive(false);
      }
      
      // Start hoverboard movement
      this.hoverboard.startMoving();
      
      // Start playing the music when game starts
      if (this.backgroundMusic) {
        this.backgroundMusic.play().catch(err => console.warn('Could not play audio:', err));
      }
    } else if (newState === 'gameOver') {
      // Stop hoverboard movement
      this.hoverboard.stopMoving();
      
      // Stop obstacle and crystal spawning
      this.obstacleSpawningActive = false;
      this.crystalSpawningActive = false;
    }
  }
  
  /**
   * Reset the scene for a new game
   */
  public resetGame(): void {
    // Reset grid position
    const gridMesh = this.grid.getMesh();
    gridMesh.position.z = this.gridInitialZ;
    
    // Reset hoverboard position and state
    if (this.hoverboard) {
      this.hoverboard.reset();
    }
    
    // Clear obstacles
    for (const obstacle of this.obstacles) {
      obstacle.setActive(false);
    }
    this.obstacles = [];
    
    // Clear crystals
    for (const crystal of this.crystals) {
      crystal.setActive(false);
    }
    this.crystals = [];
  }
  
  /**
   * Dispose of all resources
   */
  public dispose(): void {
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyboardInput);
    window.removeEventListener('keyup', this.handleKeyboardInput);
    
    // Remove touch and click event listeners
    document.removeEventListener('click', this.handleTouchClick);
    document.removeEventListener('touchstart', this.handleTouchClick);
    
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
    
    // Dispose crystals
    for (const crystal of this.crystalPool) {
      crystal.dispose();
    }
    
    // Stop and remove music
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic.src = '';
    }
    
    // Clean up crystal sound
    if (this.crystalSound) {
      this.crystalSound.pause();
      this.crystalSound.src = '';
    }
    
    // Clean up explosion sound
    if (this.explosionSound) {
      this.explosionSound.pause();
      this.explosionSound.src = '';
    }
  }
} 