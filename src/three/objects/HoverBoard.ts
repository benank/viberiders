import * as THREE from 'three';
import { RoundedBoxGeometry } from '../utils/RoundedBoxGeometry';
import { HoverboardShader } from '../shaders/HoverboardShader';

/**
 * Represents the hovering board
 */
export class HoverBoard {
  private mesh: THREE.Group;
  private glowEffect: THREE.PointLight;
  private clock: THREE.Clock;
  private boardMesh: THREE.Mesh;
  private boardMaterial: THREE.ShaderMaterial;
  private hoverHeight: number = 0.8; // Base hover height
  
  // Movement properties
  private position = { x: 0, z: 5 };
  private targetPosition = { x: 0, z: 5 };
  private velocity = { x: 0, z: 0 };
  private speed = 0; // Forward speed
  private maxSpeed = 20; // Maximum forward speed
  private acceleration = 0.05; // Speed increase per second
  private lateralSpeed = 5; // Side-to-side movement speed
  private laneWidth = 2.5; // Width of a lane
  private isMoving = false;
  
  // Lane system
  private lanes = [-this.laneWidth, 0, this.laneWidth]; // Left, Center, Right
  private currentLane = 1; // Start in center lane (index 1)

  constructor() {
    this.mesh = new THREE.Group();
    this.clock = new THREE.Clock();
    
    // Create the hoverboard
    this.createHoverboard();
    
    // Add hover glow effect
    this.glowEffect = new THREE.PointLight(0x00ffff, 1, 2);
    this.glowEffect.position.set(0, -0.1, 0);
    this.mesh.add(this.glowEffect);
  }

  /**
   * Create the hoverboard geometry and materials
   */
  private createHoverboard(): void {
    // Create rounded box for the hoverboard 
    // Parameters: width, height, depth, segments, radius
    const boardGeometry = new RoundedBoxGeometry(0.8, 0.05, 2.4, 10, 0.04);
    
    // Create custom material with shaders
    this.boardMaterial = HoverboardShader.createMaterial();
    
    // Create and add the board mesh
    this.boardMesh = new THREE.Mesh(boardGeometry, this.boardMaterial);
    this.mesh.add(this.boardMesh);
    
    // Add orange thruster at the back
    const thrusterLight = new THREE.PointLight(0xff6600, 2, 1);
    thrusterLight.position.set(0, 0, 1.2);
    this.mesh.add(thrusterLight);

    // Add thruster visual effect
    const thrusterGeometry = new THREE.CircleGeometry(0.1, 16);
    const thrusterMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    thruster.position.set(0, 0, 1.2);
    thruster.rotation.y = Math.PI / 2;
    this.mesh.add(thruster);
    
    // Add hover glow effect beneath the board
    const hoverGlowGeometry = new THREE.PlaneGeometry(0.7, 2.2);
    const hoverGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const hoverGlow = new THREE.Mesh(hoverGlowGeometry, hoverGlowMaterial);
    hoverGlow.position.set(0, -0.15, 0);
    hoverGlow.rotation.x = Math.PI / 2;
    this.mesh.add(hoverGlow);
  }

  /**
   * Set environment map for reflection
   */
  public setEnvironmentMap(envMap: THREE.CubeTexture): void {
    HoverboardShader.setEnvironmentMap(this.boardMaterial, envMap);
  }

  /**
   * Get the mesh
   */
  public getMesh(): THREE.Group {
    return this.mesh;
  }

  /**
   * Start the hoverboard movement
   */
  public startMoving(): void {
    this.isMoving = true;
    this.speed = 8; // Initial speed
    this.currentLane = 1; // Reset to center lane
    this.targetPosition.x = this.lanes[this.currentLane];
    this.position.z = 5; // Reset z position
  }

  /**
   * Stop the hoverboard movement
   */
  public stopMoving(): void {
    this.isMoving = false;
    this.speed = 0;
  }

  /**
   * Move the hoverboard to the left
   */
  public moveLeft(): void {
    if (!this.isMoving || this.currentLane === 0) return;
    
    this.currentLane--;
    this.targetPosition.x = this.lanes[this.currentLane];
  }

  /**
   * Move the hoverboard to the right
   */
  public moveRight(): void {
    if (!this.isMoving || this.currentLane === 2) return;
    
    this.currentLane++;
    this.targetPosition.x = this.lanes[this.currentLane];
  }

  /**
   * Get the current distance traveled
   */
  public getDistance(): number {
    return Math.abs(this.position.z - 5);
  }

  /**
   * Update the hoverboard animation
   * @param deltaTime Time since last frame
   */
  public update(deltaTime: number): void {
    // Update time uniform for shader animations
    const elapsedTime = this.clock.getElapsedTime();
    const tilt = Math.sin(elapsedTime * 1.2) * 0.01;
    
    // Update shader
    HoverboardShader.update(
      this.boardMaterial,
      this.boardMaterial.uniforms.time.value + deltaTime,
      tilt
    );
    
    // Animate the glow intensity
    const intensity = 1.2 + Math.sin(elapsedTime * 2) * 0.3;
    this.glowEffect.intensity = intensity;

    // Handle forward movement
    if (this.isMoving) {
      // Accelerate up to max speed
      this.speed = Math.min(this.speed + this.acceleration * deltaTime, this.maxSpeed);
      
      // Move forward (decrease z value)
      this.position.z -= this.speed * deltaTime;
    }

    // Handle lateral movement (smooth transition to target position)
    const lateralDiff = this.targetPosition.x - this.position.x;
    if (Math.abs(lateralDiff) > 0.01) {
      this.position.x += Math.sign(lateralDiff) * Math.min(this.lateralSpeed * deltaTime, Math.abs(lateralDiff));
    }

    // Update mesh position
    this.mesh.position.x = this.position.x;
    this.mesh.position.z = 5; // Keep the hoverboard at a fixed z position relative to camera
    
    // Calculate board tilt based on lateral movement
    const lateralTilt = -Math.sign(lateralDiff) * Math.min(Math.abs(lateralDiff) * 0.2, 0.2);
    this.mesh.rotation.z = lateralTilt;

    // Subtle floating animation - adjust to hover above the grid
    const floatOffset = Math.sin(elapsedTime * 1.5) * 0.05;
    
    // Ensure the hoverboard maintains its hover height plus the floating animation
    this.mesh.position.y = this.hoverHeight + floatOffset;
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