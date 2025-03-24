import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Grid } from '../objects/Grid';
import { Mountains } from '../objects/Mountains';
import { Sun } from '../objects/Sun';
import { HoverBoard } from '../objects/HoverBoard';
import { Obstacle, ObstacleType } from '../objects/Obstacle';
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
  
  // Particle systems
  private crystalParticles: {
    points: THREE.Points;
    creationTime: number;
    duration: number;
    speed: number;
  }[] = [];
  private explosionParticles: THREE.Points | null = null;
  private explosionMaterial: THREE.PointsMaterial | null = null;
  private explosionGeometry: THREE.BufferGeometry | null = null;
  private explosionStartTime: number = 0;
  private explosionDuration: number = 1.5; // seconds
  private isExploding: boolean = false;
  
  // Scene positions
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
    this.grid = new Grid(300); // Larger grid for more immersive environment
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
    
    // Add grid to scene - no need to set position as it's static now with texture scrolling
    const gridMesh = this.grid.getMesh();
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
    
    // Initialize explosion particles system
    this.initializeExplosionParticles();
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
    const poolSize = 15; // Increased pool size to accommodate different obstacle types
    
    for (let i = 0; i < poolSize; i++) {
      // Create obstacles but keep them far away and inactive initially
      // Using 0.8 width instead of 1 to make obstacles less wide
      const obstacle = new Obstacle(0.8, -200, ObstacleType.WALL);
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
    
    // Determine obstacle type based on player progress
    // As the game progresses, increase the chance of double wall obstacles
    const distance = this.hoverboard.getDistance();
    let obstacleType = ObstacleType.WALL;
    
    // After 500 distance, start introducing double walls with increasing probability
    if (distance > 500) {
      // Probability increases with distance, capping at 40% chance
      const doubleWallChance = Math.min(0.4, (distance - 500) / 2000);
      if (Math.random() < doubleWallChance) {
        obstacleType = ObstacleType.DOUBLE_WALL;
      }
    }
    
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
    obstacle.reset(lane, startZ, obstacleType);
    
    // Add to active obstacles list
    this.obstacles.push(obstacle);
    
    // Set time for next obstacle - adjust timing based on current speed
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
    
    // Choose a pattern type
    const patternType = Math.floor(Math.random() * 3); // 0: straight line, 1: zigzag, 2: diagonal
    
    // Pattern parameters
    const startLane = Math.floor(Math.random() * 3); // 0, 1, or 2
    const startZ = -130;
    const spacing = 8; // Spacing between consecutive crystals in a pattern
    
    switch (patternType) {
      case 0: // Straight line of 3 crystals in a single lane
        this.spawnCrystalPattern(startLane, startZ, [
          { laneOffset: 0, zOffset: 0 },
          { laneOffset: 0, zOffset: spacing },
          { laneOffset: 0, zOffset: spacing * 2 }
        ]);
        break;
        
      case 1: // Zigzag pattern across lanes
        this.spawnCrystalPattern(startLane, startZ, [
          { laneOffset: 0, zOffset: 0 },
          { laneOffset: 1, zOffset: spacing * 0.7 },
          { laneOffset: 0, zOffset: spacing * 1.4 },
          { laneOffset: -1, zOffset: spacing * 2.1 },
          { laneOffset: 0, zOffset: spacing * 2.8 }
        ]);
        break;
        
      case 2: // Diagonal line pattern
        this.spawnCrystalPattern(startLane, startZ, [
          { laneOffset: 0, zOffset: 0 },
          { laneOffset: 1, zOffset: spacing },
          { laneOffset: 2, zOffset: spacing * 2 }
        ]);
        break;
    }
    
    // Set time for next pattern - adjust timing based on current speed
    const distance = this.hoverboard.getDistance();
    const speedFactor = Math.min(distance / 1000, 1); // Max speedup factor of 1
    
    // As the game progresses, decrease the crystal spacing
    const adjustedMinSpacing = Math.max(this.minCrystalSpacing - speedFactor, 1.0);
    const adjustedMaxSpacing = Math.max(this.maxCrystalSpacing - speedFactor, 2.0);
    
    // Longer delay between patterns compared to single crystals
    this.nextCrystalTime = this.gameTime + (adjustedMinSpacing + 
                          Math.random() * (adjustedMaxSpacing - adjustedMinSpacing)) * 2;
  }
  
  /**
   * Spawn a pattern of crystals based on offsets
   * @param baseLane The starting lane (0, 1, or 2)
   * @param baseZ The starting Z position
   * @param pattern Array of { laneOffset, zOffset } defining the pattern
   */
  private spawnCrystalPattern(baseLane: number, baseZ: number, pattern: Array<{laneOffset: number, zOffset: number}>): void {
    pattern.forEach(point => {
      const crystal = this.getCrystalFromPool();
      if (!crystal) return;
      
      // Calculate lane, keeping within valid range (0-2) and wrapping around
      let lane = (baseLane + point.laneOffset) % 3;
      if (lane < 0) lane += 3;
      
      // Calculate Z position
      const startZ = baseZ - point.zOffset;
      
      // Initialize and position the crystal
      crystal.reset(lane, startZ);
      
      // Add to active crystals list
      this.crystals.push(crystal);
    });
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
    
    // Create explosion effect at hoverboard position
    this.createExplosion();
  }
  
  /**
   * Handle collecting a crystal
   */
  private handleCrystalCollection(crystal: Crystal): void {
    // Get crystal position before deactivating
    const crystalPosition = crystal.getMesh().position.clone();
    
    // Increase crystal count
    const currentCrystalCount = this.store.get(crystalCountAtom);
    this.store.set(crystalCountAtom, currentCrystalCount + 1);
    
    // Play crystal collection sound
    if (this.crystalSound) {
      // Create a new audio instance for each crystal collection
      // This allows multiple sounds to play simultaneously
      const crystalSoundInstance = new Audio(this.crystalSound.src);
      crystalSoundInstance.volume = this.crystalSound.volume;
      crystalSoundInstance.play().catch(err => console.warn('Could not play crystal sound:', err));
      
      // Clean up the audio element after it finishes playing
      crystalSoundInstance.onended = () => {
        crystalSoundInstance.src = '';
      };
    }
    
    // Create particle effect at crystal position
    this.createCrystalParticles(crystalPosition);
    
    // Deactivate the crystal
    crystal.setActive(false);
    
    // Remove from active crystals list
    const index = this.crystals.indexOf(crystal);
    if (index !== -1) {
      this.crystals.splice(index, 1);
    }
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
    const maxAdditionalSpeed = 50; // Increased from 40 for higher top speed
    const accelerationFactor = 100; // Reduced from 150 for faster acceleration
    
    // Add exponential acceleration for progressively faster speed over time
    const linearAcceleration = distance / accelerationFactor;
    const exponentialFactor = Math.pow(distance / 1000, 1.5) * 5; // Exponential growth with distance
    const additionalSpeed = Math.min(linearAcceleration + exponentialFactor, maxAdditionalSpeed);
    
    const speed = baseSpeed + additionalSpeed;
    
    // Store speed in the hoverboard for distance calculation
    this.hoverboard.setSpeed(speed);
    
    // Update grid texture scrolling (instead of moving the grid)
    this.grid.update(deltaTime, speed);
    
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
    
    // Check for collisions (only if not already exploding)
    if (!this.isExploding) {
      this.checkCollisions();
    }
    
    // Update explosion effect if active
    if (this.isExploding) {
      this.updateExplosion(deltaTime);
    }
    
    // Update crystal particles
    this.updateCrystalParticles(deltaTime);
    
    // Update distance counter
    this.updateDistance();
    
    // Mountains
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
      
      // Make sure the hoverboard is visible (in case it was hidden by an explosion)
      this.hoverboard.getMesh().visible = true;
      
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
    // Reset grid texture offset
    this.grid.resetTextureOffset();
    
    // Reset hoverboard position and state
    if (this.hoverboard) {
      this.hoverboard.reset();
      // Ensure hoverboard is visible - important after an explosion
      this.hoverboard.getMesh().visible = true;
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
    
    // Make sure explosion state is reset
    this.isExploding = false;
    if (this.explosionParticles) {
      this.explosionParticles.visible = false;
      if (this.explosionParticles.parent) {
        this.explosionParticles.parent.remove(this.explosionParticles);
      }
    }
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
    
    // Dispose of particle systems
    if (this.explosionGeometry) this.explosionGeometry.dispose();
    if (this.explosionMaterial) this.explosionMaterial.dispose();
    
    for (const particles of this.crystalParticles) {
      if (particles.points.geometry) particles.points.geometry.dispose();
      if (particles.points.material instanceof THREE.Material) particles.points.material.dispose();
    }
    this.crystalParticles = [];
  }

  /**
   * Initialize explosion particle system for collision effect
   */
  private initializeExplosionParticles(): void {
    // Create particle system for explosion
    this.explosionGeometry = new THREE.BufferGeometry();
    
    // 200 particles for explosion
    const explosionParticleCount = 200;
    const explosionPositions = new Float32Array(explosionParticleCount * 3);
    const explosionColors = new Float32Array(explosionParticleCount * 3);
    const explosionSizes = new Float32Array(explosionParticleCount);
    
    // Initialize with particles at origin, will be positioned during explosion
    for (let i = 0; i < explosionParticleCount; i++) {
      // Initial positions (will be updated when explosion happens)
      explosionPositions[i * 3] = 0;
      explosionPositions[i * 3 + 1] = 0;
      explosionPositions[i * 3 + 2] = 0;
      
      // Colors - cyan/purple gradients
      explosionColors[i * 3] = Math.random() * 0.5 + 0.5; // Red component (0.5-1.0)
      explosionColors[i * 3 + 1] = Math.random() * 0.5; // Green component (0-0.5)
      explosionColors[i * 3 + 2] = Math.random() * 0.5 + 0.5; // Blue component (0.5-1.0)
      
      // Particle sizes - varied for more realistic effect
      explosionSizes[i] = Math.random() * 0.3 + 0.1;
    }
    
    this.explosionGeometry.setAttribute('position', new THREE.BufferAttribute(explosionPositions, 3));
    this.explosionGeometry.setAttribute('color', new THREE.BufferAttribute(explosionColors, 3));
    this.explosionGeometry.setAttribute('size', new THREE.BufferAttribute(explosionSizes, 1));
    
    // Create point material with proper blending for glowing effect
    this.explosionMaterial = new THREE.PointsMaterial({
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create the particle system but don't add to scene yet
    this.explosionParticles = new THREE.Points(this.explosionGeometry, this.explosionMaterial);
    this.explosionParticles.visible = false;
  }

  /**
   * Create crystal particles at the specified position
   */
  private createCrystalParticles(position: THREE.Vector3): void {
    // Create a new particle system for each crystal collection
    const geometry = new THREE.BufferGeometry();
    const particleCount = 30;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Set initial positions around the crystal position
    for (let i = 0; i < particleCount; i++) {
      // Random position within a small sphere around the crystal
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;
      const height = Math.random() * 0.5 - 0.25;
      
      positions[i * 3] = position.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] = position.y + height;
      positions[i * 3 + 2] = position.z + Math.sin(angle) * radius;
      
      // Cyan/teal colors for crystal particles
      colors[i * 3] = 0; // R
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
      
      // Varied sizes
      sizes[i] = Math.random() * 0.3 + 0.1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create point material with proper blending for glowing effect
    const material = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create the particle system and add to the scene
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // Calculate current game speed - use the same logic as in updateSceneMovement
    const distance = this.hoverboard.getDistance();
    const baseSpeed = 16;
    const maxAdditionalSpeed = 40;
    const accelerationFactor = 150;
    const currentSpeed = baseSpeed + Math.min(distance / accelerationFactor, maxAdditionalSpeed);
    
    // Add to array for tracking with creation time and speed
    this.crystalParticles.push({
      points: particles,
      creationTime: this.gameTime,
      duration: 1.5, // 1.5 seconds lifetime
      speed: currentSpeed // Store current game speed
    });
  }

  /**
   * Create explosion effect at the hoverboard's position
   */
  private createExplosion(): void {
    if (!this.explosionParticles || !this.explosionGeometry || this.isExploding) return;
    
    // Get hoverboard position
    const hoverboardPosition = this.hoverboard.getMesh().position.clone();
    
    // Hide the hoverboard
    this.hoverboard.getMesh().visible = false;
    
    // Position the explosion at the hoverboard's location
    this.explosionParticles.position.copy(hoverboardPosition);
    
    // Update positions for a spherical explosion
    const positions = this.explosionGeometry.attributes.position.array as Float32Array;
    const particleCount = positions.length / 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Random direction for each particle
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * 1.5;
      
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
    }
    
    // Tell Three.js to update the attribute
    this.explosionGeometry.attributes.position.needsUpdate = true;
    
    // Add to scene and make visible
    this.scene.add(this.explosionParticles);
    this.explosionParticles.visible = true;
    
    // Track explosion state and time
    this.isExploding = true;
    this.explosionStartTime = this.gameTime;
  }

  /**
   * Update explosion particles
   */
  private updateExplosion(deltaTime: number): void {
    if (!this.isExploding || !this.explosionParticles || !this.explosionMaterial || !this.explosionGeometry) return;
    
    const elapsedTime = this.gameTime - this.explosionStartTime;
    const progress = elapsedTime / this.explosionDuration;
    
    if (progress >= 1.0) {
      // Explosion finished
      this.isExploding = false;
      this.explosionParticles.visible = false;
      if (this.explosionParticles.parent) {
        this.explosionParticles.parent.remove(this.explosionParticles);
      }
      return;
    }
    
    // Update positions for outward movement
    const positions = this.explosionGeometry.attributes.position.array as Float32Array;
    const particleCount = positions.length / 3;
    
    // Move particles outward and fade out opacity based on progress
    const speedFactor = 1 - progress; // Slow down as the explosion progresses
    this.explosionMaterial.opacity = 1 - progress;
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += positions[i * 3] * deltaTime * 2 * speedFactor;
      positions[i * 3 + 1] += positions[i * 3 + 1] * deltaTime * 2 * speedFactor;
      positions[i * 3 + 2] += positions[i * 3 + 2] * deltaTime * 2 * speedFactor;
    }
    
    // Update positions
    this.explosionGeometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update crystal particles
   */
  private updateCrystalParticles(deltaTime: number): void {
    // Update each particle system and remove expired ones
    for (let i = this.crystalParticles.length - 1; i >= 0; i--) {
      const particleSystem = this.crystalParticles[i];
      const particles = particleSystem.points;
      const positions = particles.geometry.attributes.position.array as Float32Array;
      const particleCount = positions.length / 3;
      
      // Calculate lifetime progress (0 to 1)
      const elapsedTime = this.gameTime - particleSystem.creationTime;
      const progress = Math.min(elapsedTime / particleSystem.duration, 1.0);
      
      // Fade out based on progress
      if (particles.material instanceof THREE.PointsMaterial) {
        particles.material.opacity = 0.8 * (1 - progress);
      }
      
      // Move particles upward, outward, and forward with the game
      for (let j = 0; j < particleCount; j++) {
        positions[j * 3] += Math.random() * 0.1 - 0.05; // Random horizontal movement
        positions[j * 3 + 1] += 0.8 * deltaTime; // Upward movement
        positions[j * 3 + 2] += particleSystem.speed * deltaTime; // Continue moving forward with game speed
      }
      
      // Update the attribute
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Remove fully faded particles
      if (progress >= 1.0) {
        if (particles.parent) {
          particles.parent.remove(particles);
        }
        
        // Dispose resources
        particles.geometry.dispose();
        if (particles.material instanceof THREE.Material) {
          particles.material.dispose();
        }
        
        // Remove from array
        this.crystalParticles.splice(i, 1);
      }
    }
  }
} 