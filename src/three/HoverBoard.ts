import * as THREE from 'three';

class HoverBoard {
  private mesh: THREE.Group;
  private glowEffect: THREE.PointLight;
  private clock: THREE.Clock;

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

  private createHoverboard(): void {
    // Create the main board shape - longer and more streamlined
    const boardGeometry = new THREE.BoxGeometry(0.8, 0.05, 2.4);
    const boardMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.2,
      metalness: 0.8,
    });
    const board = new THREE.Mesh(boardGeometry, boardMaterial);
    this.mesh.add(board);

    // Add top cyan line
    const lineGeometry = new THREE.BoxGeometry(0.01, 0.06, 2.2);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.9
    });
    const topLine = new THREE.Mesh(lineGeometry, lineMaterial);
    topLine.position.set(0, 0.03, 0);
    this.mesh.add(topLine);

    // Add line glow
    const glowGeometry = new THREE.BoxGeometry(0.04, 0.08, 2.2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.copy(topLine.position);
    this.mesh.add(glow);

    // Add bottom hover effect
    const hoverGeometry = new THREE.PlaneGeometry(0.7, 2.2);
    const hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const hoverPlane = new THREE.Mesh(hoverGeometry, hoverMaterial);
    hoverPlane.rotation.x = Math.PI / 2;
    hoverPlane.position.y = -0.15;
    this.mesh.add(hoverPlane);

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

    // Add subtle edge bevels using additional geometry
    const bevelGeometry = new THREE.BoxGeometry(0.82, 0.07, 2.42);
    const bevelMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.4,
      metalness: 0.6,
    });
    const bevel = new THREE.Mesh(bevelGeometry, bevelMaterial);
    bevel.position.y = -0.01;
    this.mesh.add(bevel);
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public update(deltaTime: number): void {
    // Animate the glow intensity
    const intensity = 1.2 + Math.sin(this.clock.getElapsedTime() * 2) * 0.3;
    this.glowEffect.intensity = intensity;

    // Subtle floating animation
    this.mesh.position.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.03;
    
    // Very slight tilt animation
    this.mesh.rotation.x = Math.sin(this.clock.getElapsedTime() * 1.2) * 0.01;
  }

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

export default HoverBoard; 