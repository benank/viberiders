import * as THREE from 'three';

/**
 * Shader for the hoverboard effect
 */
export class HoverboardShader {
  /**
   * Create shader material for the hoverboard
   */
  public static createMaterial(): THREE.ShaderMaterial {
    const uniforms = {
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

    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      side: THREE.DoubleSide
    });
  }

  /**
   * Update shader uniforms
   * @param material Shader material
   * @param time Current time
   * @param tilt Tilt value
   * @param width Window width
   * @param height Window height
   */
  public static update(
    material: THREE.ShaderMaterial, 
    time: number, 
    tilt: number,
    width?: number,
    height?: number
  ): void {
    if (material.uniforms) {
      material.uniforms.time.value = time;
      material.uniforms.tilt.value = tilt;
      
      if (width && height) {
        material.uniforms.resolution.value.set(width, height);
      }
    }
  }

  /**
   * Set environment map for reflection
   * @param material Shader material
   * @param envMap Environment map
   */
  public static setEnvironmentMap(material: THREE.ShaderMaterial, envMap: THREE.CubeTexture): void {
    if (material.uniforms) {
      material.uniforms.envMap.value = envMap;
    }
  }

  private static vertexShader = `
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

  private static fragmentShader = `
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
} 