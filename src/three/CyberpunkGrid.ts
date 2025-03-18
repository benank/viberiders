import * as THREE from 'three';

class CyberpunkGrid {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private grid: THREE.GridHelper;
  private sunGeometry: THREE.PlaneGeometry;
  private sunMaterial: THREE.ShaderMaterial;
  private sun: THREE.Mesh;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 30);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.camera.position.y = 0.5;
    this.camera.rotation.x = -0.15;

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0); // Transparent background

    // Initialize grid
    this.grid = new THREE.GridHelper(100, 80);
    // Make the grid turquoise
    const gridMaterial = this.grid.material as THREE.Material;
    if (Array.isArray(gridMaterial)) {
      gridMaterial.forEach(m => {
        if (m instanceof THREE.LineBasicMaterial) {
          m.color.set(0x00ffff);
          m.opacity = 0.6;
          m.transparent = true;
        }
      });
    } else if (gridMaterial instanceof THREE.LineBasicMaterial) {
      gridMaterial.color.set(0x00ffff);
      gridMaterial.opacity = 0.6;
      gridMaterial.transparent = true;
    }
    this.scene.add(this.grid);
    
    // Add synthwave sun with gradient shader
    this.sunGeometry = new THREE.PlaneGeometry(50, 25);
    this.sunMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        vec3 purple = vec3(0.5, 0.0, 0.8);
        vec3 pink = vec3(0.98, 0.3, 0.8);
        vec3 blue = vec3(0.0, 0.5, 1.0);
        
        void main() {
          float t = sin(time * 0.5) * 0.5 + 0.5;
          float y = clamp(1.0 - vUv.y * 1.5, 0.0, 1.0);
          
          vec3 color;
          if (y < 0.5) {
            color = mix(purple, pink, y * 2.0);
          } else {
            color = mix(pink, blue, (y - 0.5) * 2.0);
          }
          
          // Create glow effect
          float glow = 0.5 + 0.5 * sin(time * 0.5);
          color = mix(color, color * 1.5, glow * 0.3);
          
          // Add scan lines
          if (mod(gl_FragCoord.y * 0.5, 2.0) < 1.0) {
            color *= 0.9;
          }
          
          // Apply gradient falloff for sun shape
          float circle = distance(vUv, vec2(0.5, 0.5)) * 2.0;
          float alpha = smoothstep(1.0, 0.7, circle);
          
          gl_FragColor = vec4(color, alpha * (1.0 - vUv.y));
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    this.sun = new THREE.Mesh(this.sunGeometry, this.sunMaterial);
    this.sun.position.z = -40;
    this.sun.position.y = 2;
    this.scene.add(this.sun);

    // Initialize clock for animation
    this.clock = new THREE.Clock();

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x9900ff, 0.2);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0x00ffff, 0.2);
    directionalLight.position.set(0, 4, 5);
    this.scene.add(directionalLight);

    // Handle resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  public init(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }

    // Add the renderer to the container with absolute positioning
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.container.appendChild(this.renderer.domElement);

    // Start animation
    this.animate();
  }

  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    window.removeEventListener('resize', this.handleResize.bind(this));

    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }

    // Dispose resources
    this.scene.remove(this.grid);
    this.scene.remove(this.sun);
    this.sunGeometry.dispose();
    this.sunMaterial.dispose();
    this.renderer.dispose();
  }

  private handleResize(): void {
    if (!this.container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();
    
    // Update sun shader time uniform
    if (this.sunMaterial.uniforms) {
      this.sunMaterial.uniforms.time.value = elapsedTime;
    }
    
    // Move the grid to create infinite scrolling effect
    if (this.grid.position.z > 1) {
      this.grid.position.z = 0;
    }
    this.grid.position.z += delta * 2.5;
    
    // Add a subtle floating effect to the camera
    this.camera.position.y = 0.5 + Math.sin(elapsedTime * 0.5) * 0.05;

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

export default CyberpunkGrid; 