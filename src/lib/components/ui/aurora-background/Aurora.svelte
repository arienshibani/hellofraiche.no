<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
  import './Aurora.css';

  export let colorStops: string[] = ["#5227FF", "#7cff67", "#5227FF"];
  export let amplitude = 1.0;
  export let blend = 0.5;
  export let time = 0;
  export let speed = 1.0;

  let container: HTMLDivElement;
  let renderer: Renderer;
  let program: Program;
  let animateId: number;

  const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  // Simple animated gradient
  vec3 color1 = vec3(1.0, 0.0, 0.0); // Red
  vec3 color2 = vec3(0.0, 1.0, 0.0); // Green
  vec3 color3 = vec3(0.0, 0.0, 1.0); // Blue
  
  float t = uTime * 0.5;
  vec3 color = mix(color1, color2, sin(t + uv.x) * 0.5 + 0.5);
  color = mix(color, color3, sin(t * 0.7 + uv.y) * 0.5 + 0.5);
  
  // Add some wave effect
  float wave = sin(uv.x * 10.0 + t) * sin(uv.y * 10.0 + t * 0.5) * 0.1;
  color += wave;
  
  fragColor = vec4(color, 0.8);
}
`;

  const resize = () => {
    if (!container || !renderer) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    renderer.setSize(width, height);
    if (program) {
      program.uniforms.uResolution.value = [width, height];
    }
  };

  const update = (t: number) => {
    animateId = requestAnimationFrame(update);
    if (program && renderer) {
      program.uniforms.uTime.value = t * 0.01 * speed;
      
      // Render the scene
      const mesh = new Mesh(renderer.gl, { geometry: new Triangle(renderer.gl), program });
      renderer.render({ scene: mesh });
    }
  };

    onMount(() => {
    if (!container) return;

    console.log('Initializing Aurora component...');

    renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: true,
      antialias: true
    });
    
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.canvas.style.backgroundColor = 'transparent';

    window.addEventListener("resize", resize);

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv;
    }

    const colorStopsArray = colorStops.map((hex) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    });

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: [container.offsetWidth, container.offsetHeight] }
      }
    });

    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);

    // Set canvas positioning
    gl.canvas.style.position = 'absolute';
    gl.canvas.style.top = '0';
    gl.canvas.style.left = '0';
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.zIndex = '-1';

    console.log('Aurora component initialized, starting animation...');
    console.log('Canvas dimensions:', gl.canvas.width, 'x', gl.canvas.height);
    console.log('Container dimensions:', container.offsetWidth, 'x', container.offsetHeight);
    
    animateId = requestAnimationFrame(update);
    resize();

    return () => {
      if (animateId) {
        cancelAnimationFrame(animateId);
      }
      window.removeEventListener("resize", resize);
      if (container && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  });

  onDestroy(() => {
    if (animateId) {
      cancelAnimationFrame(animateId);
    }
    if (renderer) {
      const gl = renderer.gl;
      if (container && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  });
</script>

<div bind:this={container} class="aurora-container">
  <slot />
</div>
