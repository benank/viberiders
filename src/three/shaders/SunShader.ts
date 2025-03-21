import * as THREE from 'three';

/**
 * Shader for the synthwave sun effect
 */
export class SunShader {
  /**
   * Create shader material for the sun
   */
  public static createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
  }

  /**
   * Update shader uniforms
   * @param material Shader material
   * @param time Current time
   */
  public static update(material: THREE.ShaderMaterial, time: number): void {
    material.uniforms.time.value = time;
  }

  private static vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private static fragmentShader = `
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
  `;
} 