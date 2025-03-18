import * as THREE from 'three';

// Simple Perlin noise implementation for procedural generation
class PerlinNoise {
  private perm: number[] = [];
  
  constructor(seed = 0) {
    // Initialize permutation table
    this.perm = new Array(512);
    const p = new Array(256);
    
    // Fill with values 0-255
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle based on seed
    for (let i = 255; i > 0; i--) {
      const j = Math.floor((seed + i) % (i + 1));
      [p[i], p[j]] = [p[j], p[i]]; // Swap
    }
    
    // Duplicate for faster lookups
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }
  
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }
  
  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }
  
  noise(x: number, y: number, z: number = 0): number {
    // Find unit cube that contains point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    
    // Find relative x, y, z of point in cube
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    
    // Compute fade curves for each of x, y, z
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    
    // Hash coordinates of the 8 cube corners
    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;
    
    // Add blended results from 8 corners of cube
    return this.lerp(w, 
      this.lerp(v, 
        this.lerp(u, 
          this.grad(this.perm[AA], x, y, z),
          this.grad(this.perm[BA], x - 1, y, z)
        ),
        this.lerp(u,
          this.grad(this.perm[AB], x, y - 1, z),
          this.grad(this.perm[BB], x - 1, y - 1, z)
        )
      ),
      this.lerp(v,
        this.lerp(u,
          this.grad(this.perm[AA + 1], x, y, z - 1),
          this.grad(this.perm[BA + 1], x - 1, y, z - 1)
        ),
        this.lerp(u,
          this.grad(this.perm[AB + 1], x, y - 1, z - 1),
          this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1)
        )
      )
    );
  }
}

class CyberpunkGrid {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private grid: THREE.GridHelper;
  private sunGeometry: THREE.PlaneGeometry;
  private sunMaterial: THREE.ShaderMaterial;
  private sun: THREE.Mesh;
  private mountains: THREE.Mesh;
  private perlinNoise: PerlinNoise;
  private clock: THREE.Clock;
  private animationId: number | null = null;
  private container: HTMLElement | null = null;

  constructor() {
    // Initialize Perlin noise
    this.perlinNoise = new PerlinNoise(Math.random() * 100);
    
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 1, 50);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.camera.position.y = 1;
    this.camera.rotation.x = -0.2;

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
          m.opacity = 0.4;
          m.transparent = true;
        }
      });
    } else if (gridMaterial instanceof THREE.LineBasicMaterial) {
      gridMaterial.color.set(0x00ffff);
      gridMaterial.opacity = 0.4;
      gridMaterial.transparent = true;
    }
    this.scene.add(this.grid);
    
    // Add procedurally generated mountains
    this.mountains = this.createMountains();
    this.scene.add(this.mountains);
    
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
  
  private createMountains(): THREE.Mesh {
    // Create a plane geometry for the mountains
    const geometry = new THREE.PlaneGeometry(200, 40, 150, 20);
    
    // Position and rotate the mountains
    geometry.rotateX(-Math.PI / 2);
    
    // Update vertices to create mountain peaks using Perlin noise
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const z = vertices[i + 2];
      
      // Use Perlin noise to determine height
      const scale1 = 0.02; // Large features
      const scale2 = 0.1;  // Small features
      let height = this.perlinNoise.noise(x * scale1, z * scale1) * 8.0; // Increased height
      height += this.perlinNoise.noise(x * scale2, z * scale2) * 2.0;
      height = Math.max(0, height); // Ensure no negative heights
      
      // Apply height to y-coordinate
      vertices[i + 1] = height;
    }
    
    // Update vertex normals for proper lighting
    geometry.computeVertexNormals();

    // Create a shader material for the mountains
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // Predefined colors
        vec3 purple = vec3(0.5, 0.0, 0.8);
        vec3 cyan = vec3(0.0, 0.9, 1.0);
        vec3 magenta = vec3(1.0, 0.0, 0.8);
        
        void main() {
          // Base height-based gradient
          float height = clamp(vPosition.y * 0.15 + 0.4, 0.0, 1.0);
          
          // Noise based on position for color variation
          float noise = fract(sin(dot(vPosition.xz, vec2(12.9898, 78.233))) * 43758.5453);
          
          // Time-based animation
          float t = time * 0.2;
          
          // Mix colors based on height and animated noise
          vec3 color;
          if (height < 0.4) {
            color = mix(purple, cyan, height * 2.5 + noise * 0.3);
          } else if (height < 0.7) {
            color = mix(cyan, magenta, (height - 0.4) * 3.33 + noise * 0.3);
          } else {
            color = mix(magenta, cyan, (height - 0.7) * 3.33 + noise * 0.3);
          }
          
          // Apply subtle pulsing glow
          float glow = 0.8 + 0.2 * sin(time * 0.5 + vPosition.y);
          color *= glow;
          
          // Scanline effect
          if (mod(gl_FragCoord.y * 0.5, 2.0) < 1.0) {
            color *= 0.95;
          }
          
          // Apply normal-based lighting
          float light = dot(vNormal, normalize(vec3(0.5, 1.0, 0.5))) * 0.5 + 0.5;
          color *= light * 1.5;
          
          // Fog effect for distance
          float fogFactor = smoothstep(0.0, 40.0, -vPosition.z);
          vec3 fogColor = vec3(0.0, 0.0, 0.1); // Slight blue tint to fog
          color = mix(color, fogColor, fogFactor * 0.8);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: false, // Changed to false to prevent transparency issues
      side: THREE.FrontSide // Changed to FrontSide for better performance
    });
    
    const mountains = new THREE.Mesh(geometry, material);
    mountains.position.z = -20; // Moved closer to camera
    mountains.position.y = -2; // Raised up
    mountains.scale.set(1, 1, 2); // Stretched on z-axis for more depth
    
    return mountains;
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
    this.renderer.domElement.style.zIndex = '1'; // Ensure this is lower than the text
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
    this.scene.remove(this.mountains);
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
    
    // Update mountain shader time uniform
    const mountainMaterial = this.mountains.material as THREE.ShaderMaterial;
    if (mountainMaterial.uniforms) {
      mountainMaterial.uniforms.time.value = elapsedTime;
    }
    
    // Move the grid to create infinite scrolling effect
    if (this.grid.position.z > 1) {
      this.grid.position.z = 0;
    }
    this.grid.position.z += delta * 2.5;
    
    // Add a subtle floating effect to the camera
    this.camera.position.y = 1 + Math.sin(elapsedTime * 0.5) * 0.05;

    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

export default CyberpunkGrid; 