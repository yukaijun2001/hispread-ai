// Login artwork: an hourglass of drifting particles rendered with three.js.
// Colours come from the container's --particle-base/-cyan/-purple custom
// properties. Honours prefers-reduced-motion (single still frame), pauses
// while the tab is hidden, and reports failure (no WebGL, context lost) so the
// caller can show the static fallback.
import { random } from './staticParticles';
import { BufferAttribute, BufferGeometry, Color, PerspectiveCamera, Points, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three';

const VERTEX = `uniform float uTime;
uniform float uDpr;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uReduced;
attribute vec4 aSeed;
varying float vAlpha;
varying float vScan;
varying float vTone;
void main(){
 float t=uTime;
 float y=mod(aSeed.x*8.0+t*(0.27+aSeed.w*.16),8.0)-4.0;
 float waist=.22+1.5*pow(abs(y)/4.0,1.65);
 float angle=aSeed.y*6.283185+t*.095+y*.5;
 float radius=waist*sqrt(aSeed.z);
 float breath=1.0+.055*sin(t*1.2);
 vec3 p=vec3(cos(angle)*radius*breath,y,sin(angle)*radius*.62);
 p.x+=.16*sin(y*1.3+t*.36)+.06*sin(aSeed.y*88.0+t*.6);
 p.z+=.09*cos(y*1.6+t*.4+aSeed.w*33.0);
 vec2 delta=p.xy-uMouse;
 float force=exp(-dot(delta,delta)*2.5)*uMouseActive*(1.0-uReduced);
 p.xy+=normalize(delta+vec2(.0001))*.45*force;
 float scanY=mod(t*.62,10.0)-5.0;
 float spiralY=scanY+.28*sin(angle*2.0+t*.8);
 float scan=exp(-pow((y-spiralY)*3.5,2.0));
 vec4 mv=modelViewMatrix*vec4(p,1.0);
 gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp((1.1+aSeed.w*1.3)*(1.0+scan*.16)*uDpr*(7.0/-mv.z),1.0,4.5);
 vAlpha=(.23+aSeed.z*.44)*(.7+.3*sin(t*1.8+aSeed.x*120.0));
 vAlpha*=1.0-smoothstep(3.3,4.0,abs(y));
 vScan=scan;vTone=aSeed.y;
}
`;

const FRAGMENT = `uniform vec3 uBase;
uniform vec3 uCyan;
uniform vec3 uPurple;
varying float vAlpha;
varying float vScan;
varying float vTone;
void main(){
 vec2 uv=gl_PointCoord-.5;
 float radius=length(uv);
 if(radius>.5)discard;
 float edge=1.0-smoothstep(.28,.5,radius);
 vec3 base=mix(uBase,uPurple,vTone*.65);
 vec3 scan=mix(uCyan,uPurple,smoothstep(.65,.95,vTone));
 gl_FragColor=vec4(mix(base,scan,vScan*.8),(vAlpha+vScan*.14)*edge);
}
`;

/** Mount the animated field into `container`. Returns a cleanup function. */
export function mountParticles(container: HTMLElement, onFailure: () => void): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ alpha: true, antialias: false });
  } catch {
    onFailure();
    return () => {};
  }
  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.z = 8.5;

  const count = window.matchMedia('(max-width: 700px)').matches ? 4200 : 6200;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
  const seeds = new Float32Array(count * 4);
  const next = random(9182);
  for (let i = 0; i < seeds.length; i++) seeds[i] = next();
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4));

  const style = getComputedStyle(container);
  const colour = (name: string) => new Color(style.getPropertyValue(name).trim());
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const uniforms = {
    uTime: { value: 12 },
    uDpr: { value: 1 },
    uMouse: { value: new Vector2(50, 50) },
    uMouseActive: { value: 0 },
    uReduced: { value: Number(reducedMotion.matches) },
    uBase: { value: colour('--particle-base') },
    uCyan: { value: colour('--particle-cyan') },
    uPurple: { value: colour('--particle-purple') },
  };
  const material = new ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, blending: 1 });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  points.rotation.z = -0.11;
  scene.add(points);

  const canvas = renderer.domElement;
  container.append(canvas);
  const target = new Vector2(50, 50);
  const pointer = new Vector2(50, 50);
  let pointerActive = 0;
  let frame = 0;
  let last = performance.now();
  let disposed = false;
  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uDpr.value = renderer.getPixelRatio();
    render();
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || document.hidden) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reducedMotion.matches) uniforms.uTime.value += delta;
    pointer.lerp(target, 1 - Math.exp(-delta * 7));
    uniforms.uMouse.value.copy(pointer);
    uniforms.uMouseActive.value += (pointerActive - uniforms.uMouseActive.value) * (1 - Math.exp(-delta * 5));
    uniforms.uReduced.value = Number(reducedMotion.matches);
    render();
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  };
  const restart = () => { cancelAnimationFrame(frame); last = performance.now(); tick(last); };
  const onPointerMove = (event: PointerEvent) => {
    if (reducedMotion.matches) return;
    const box = canvas.getBoundingClientRect();
    const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    target.set(((event.clientX - box.left) / box.width - 0.5) * height * camera.aspect, (0.5 - (event.clientY - box.top) / box.height) * height);
    pointerActive = 1;
  };
  const onPointerLeave = () => { pointerActive = 0; };
  const onContextLost = () => { cancelAnimationFrame(frame); onFailure(); };

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('webglcontextlost', onContextLost);
  document.addEventListener('visibilitychange', restart);
  reducedMotion.addEventListener('change', restart);
  resize();
  restart();

  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    document.removeEventListener('visibilitychange', restart);
    reducedMotion.removeEventListener('change', restart);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
}
