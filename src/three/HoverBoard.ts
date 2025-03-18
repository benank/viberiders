import * as THREE from 'three';
import { RoundedBoxGeometry } from './RoundedBoxGeometry';

class HoverBoard {
  private mesh: THREE.Group;
  private glowEffect: THREE.PointLight;
  private clock: THREE.Clock;
  private boardMesh!: THREE.Mesh;
  private shaderUniforms: { [uniform: string]: THREE.IUniform };

  constructor() {
    this.mesh = new THREE.Group();
    this.clock = new THREE.Clock();
    
    // Set up shader uniforms
    this.shaderUniforms = {
      time: { value: 0 },
      envMap: { value: null },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      colorA: { value: new THREE.Color(0x00ffff) },
      colorB: { value: new THREE.Color(0xff00ff) },
      fresnelBias: { value: 0.1 },
      fresnelScale: { value: 1.0 },
      fresnelPower: { value: 2.0 },
      tilt: { value: 0.0 }
    };
    
    // Create the hoverboard
    this.createHoverboard();
    
    // Add hover glow effect
    this.glowEffect = new THREE.PointLight(0x00ffff, 1, 2);
    this.glowEffect.position.set(0, -0.1, 0);
    this.mesh.add(this.glowEffect);
  }

  private createHoverboard(): void {
    // Create rounded box for the hoverboard 
    // Parameters: width, height, depth, segments, radius
    // Increase radius for more pronounced rounded edges
    const boardGeometry = new RoundedBoxGeometry(0.8, 0.05, 2.4, 10, 0.04);
    
    // We no longer need to manually bend the geometry in code, as we'll do it in the shader
    
    // Fragment shader for holographic/reflective effect
    const fragmentShader = `
      uniform vec2 resolution;
      uniform float time;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform samplerCube envMap;
      uniform float fresnelBias;
      uniform float fresnelScale;
      uniform float fresnelPower;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      
      void main() {
        // Normalized device coordinates
        vec2 uv = gl_FragCoord.xy / resolution;
        
        // Calculate fresnel effect
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = fresnelBias + fresnelScale * pow(1.0 + dot(viewDir, vNormal), fresnelPower);
        
        // Calculate reflection vector for environment mapping
        vec3 reflectVec = reflect(viewDir, vNormal);
        vec4 envColor = textureCube(envMap, reflectVec);
        
        // Create holographic color shift based on angle and time
        float hue = sin(vPosition.x * 2.0 + time) * 0.1 + 
                   sin(vPosition.z * 2.0 + time * 0.7) * 0.1;
                   
        // Grid pattern
        float gridX = step(0.98, sin(vUv.x * 40.0 + time * 0.2) * 0.5 + 0.5);
        float gridY = step(0.98, sin(vUv.y * 40.0 + time * 0.1) * 0.5 + 0.5);
        float grid = max(gridX, gridY) * 0.3;
        
        // Combine effects
        vec3 finalColor = mix(colorA, colorB, sin(time * 0.5 + vUv.x + vUv.y) * 0.5 + 0.5);
        finalColor = mix(finalColor, envColor.rgb, fresnel * 0.7);
        finalColor += grid * vec3(0.5, 1.0, 1.0);
        
        // Add glowing edges
        float edge = 1.0 - abs(dot(vNormal, viewDir));
        finalColor += edge * colorA * 0.5;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    // Vertex shader with snowboard-like curve effect reintroduced
    const vertexShader = `
      uniform float time;
      uniform float tilt;
      
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        
        // Apply snowboard-like curved shape to the board
        vec3 pos = position;
        
        // Board dimensions
        float boardLength = 2.4;
        float boardWidth = 0.8;
        float boardHeight = 0.05;
        
        // Normalize z coordinate (length) to -1...1 range
        float normalizedZ = pos.z / (boardLength * 0.5);
        
        // Apply curve up at front and back (z-axis) - refined snowboard curve
        float curveUpFactor = 0.08;
        // Use a polynomial curve that's more pronounced at the ends and flatter in the middle
        pos.y += curveUpFactor * pow(abs(normalizedZ), 1.6) * (1.0 - 0.2 * pow(1.0 - abs(normalizedZ), 2.5));
        
        // Add subtle tilt animation
        pos.y += sin(time * 1.2) * tilt;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    // Create custom material with shaders
    const boardMaterial = new THREE.ShaderMaterial({
      uniforms: this.shaderUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide
    });
    
    // Create and add the board mesh
    this.boardMesh = new THREE.Mesh(boardGeometry, boardMaterial);
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
  }

  // Set environment map for reflection
  public setEnvironmentMap(envMap: THREE.CubeTexture): void {
    this.shaderUniforms.envMap.value = envMap;
  }

  public getMesh(): THREE.Group {
    return this.mesh;
  }

  public update(deltaTime: number): void {
    // Update time uniform for shader animations
    this.shaderUniforms.time.value += deltaTime;
    
    // Update window resolution if needed
    this.shaderUniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    
    // Update tilt value for subtle animation
    this.shaderUniforms.tilt.value = Math.sin(this.clock.getElapsedTime() * 1.2) * 0.01;
    
    // Animate the glow intensity
    const intensity = 1.2 + Math.sin(this.clock.getElapsedTime() * 2) * 0.3;
    this.glowEffect.intensity = intensity;

    // Subtle floating animation
    this.mesh.position.y = Math.sin(this.clock.getElapsedTime() * 1.5) * 0.03;
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