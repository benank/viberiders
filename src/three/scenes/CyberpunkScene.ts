import * as THREE from 'three';
import { Scene } from '../core/Scene';
import { Grid } from '../objects/Grid';
import { Mountains } from '../objects/Mountains';
import { Sun } from '../objects/Sun';
import { HoverBoard } from '../objects/HoverBoard';
import { gameStateAtom, distanceAtom, GameState } from '../store/gameStore';
import { getDefaultStore } from 'jotai';

/**
 * The main cyberpunk-themed scene
 */
export class CyberpunkScene extends Scene {
  private grid: Grid;
  private mountains: Mountains;
  private sun: Sun;
  private hoverboard: HoverBoard;
  private keyStates: { [key: string]: boolean } = {};
  private store = getDefaultStore();
  private gameState: GameState = 'idle';
  private speed = 5;
  private cameraOffset = new THREE.Vector3(0, 3, 10);
  
  // Scene positions
  private gridInitialZ = 0;
  private mountainsInitialZ = -80;
  private sunInitialZ = -60;
  
  constructor() {
    super();
    
    // Initialize scene properties
    this.scene.fog = new THREE.Fog(0x000000, 25, 140); // Adjusted fog for better visibility
    
    // Initialize camera
    this.camera.position.set(0, 3, 10); // Slightly further back for better perspective
    this.camera.rotation.x = -0.3; // Adjusted angle to look at board and grid
    
    // Create scene objects
    this.grid = new Grid(200, 100); // Larger grid for more immersive environment
    this.mountains = new Mountains();
    this.sun = new Sun();
    this.hoverboard = new HoverBoard();
    
    // Setup keyboard controls
    this.setupKeyboardControls();
    
    // Store subscription
    this.store.sub(gameStateAtom, () => {
      this.gameState = this.store.get(gameStateAtom);
      if (this.gameState === 'playing') {
        this.hoverboard.startMoving();
      } else {
        this.hoverboard.stopMoving();
      }
    });
  }
  
  /**
   * Initialize the scene
   */
  public initialize(): void {
    // Add grid to scene
    const gridMesh = this.grid.getMesh();
    gridMesh.position.z = this.gridInitialZ;
    this.scene.add(gridMesh);
    
    // Add mountains to scene - position them far back and lower
    const mountainsMesh = this.mountains.getMesh();
    mountainsMesh.position.z = this.mountainsInitialZ; // Keep mountains far back
    mountainsMesh.position.y = -12; // Lower position further to reduce visibility under the grid
    this.scene.add(mountainsMesh);
    
    // Adjust sun position for better composition
    const sunMesh = this.sun.getMesh();
    sunMesh.position.z = this.sunInitialZ; // Move back with mountains
    sunMesh.position.y = 6; // Higher in the sky
    this.scene.add(sunMesh);
    
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
    
    // Create lane marker visuals
    this.createLaneMarkers();
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
      const markerGeometry = new THREE.BoxGeometry(0.2, 0.05, 40);
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
    const speed = 8 + Math.min(distance / 500, 12); // Gradually increase speed
    
    // Move the grid to create illusion of movement
    const gridMesh = this.grid.getMesh();
    
    // Reset grid position if it's gone too far
    if (gridMesh.position.z > 20) {
      gridMesh.position.z = this.gridInitialZ;
    }
    
    // Move grid forward
    gridMesh.position.z += speed * deltaTime;
    
    // Move mountains slightly for parallax effect
    const mountainsSpeed = speed * 0.2;
    const mountainsMesh = this.mountains.getMesh();
    
    // Reset mountains position if they've gone too far
    if (mountainsMesh.position.z > -40) {
      mountainsMesh.position.z = this.mountainsInitialZ;
    }
    
    // Move mountains forward
    mountainsMesh.position.z += mountainsSpeed * deltaTime;
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
    
    // Handle keyboard input
    this.handleKeyboardInput();
    
    // Update scene movement
    this.updateSceneMovement(deltaTime);
    
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
    
    // Clear the scene
    while(this.scene.children.length > 0) { 
      const object = this.scene.children[0];
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
      this.scene.remove(object);
    }
  }
} 