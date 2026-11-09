import { ReactShim as r, jsxRuntime as Vs } from "../runtime/vue-compat.js";
import { WebGLRenderer as Bs, Scene as Hr, PerspectiveCamera as Nr, BufferGeometry as ar, BufferAttribute as Jn, Color as X, Vector2 as K, ShaderMaterial as Or, Points as ni } from "three";
function Hs() {
  let e = 871,
    t = () => (e = e * 1664525 + 1013904223 >>> 0, e / 4294967296),
    n = Array.from({
      length: 2100
    }, (e, n) => {
      let r = t() * 800,
        i = 24 + 145 * (Math.abs(r - 400) / 400) ** 1.6,
        a = t() * Math.PI * 2,
        o = 230 + Math.cos(a) * i * Math.sqrt(t()) + 14 * Math.sin(r / 85),
        s = .55 + t() * 1.1;
      return (0, Vs.jsx)(`circle`, {
        cx: o,
        cy: r,
        r: s / 2,
        fill: n % 9 == 0 ? `var(--particle-cyan)` : n % 3 == 0 ? `var(--particle-purple)` : `var(--particle-base)`,
        opacity: .18 + t() * .38
      }, n)
    });
  return (0, Vs.jsx)(`div`, {
    className: `static-field`,
    children: (0, Vs.jsx)(`svg`, {
      viewBox: `0 0 460 800`,
      preserveAspectRatio: `xMidYMid meet`,
      "aria-hidden": `true`,
      children: n
    })
  })
}
var Us = `uniform float uTime;
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
`,
  Ws = `uniform vec3 uBase;
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

function Gs() {
  let e = (0, r.useRef)(null),
    [t, n] = (0, r.useState)(!1);
  return (0, r.useEffect)(() => {
    let t = e.current;
    if (!t) return;
    let r;
    try {
      r = new Bs({
        alpha: !0,
        antialias: !1
      })
    } catch {
      n(!0);
      return
    }
    let i = new Hr,
      a = new Nr(48, 1, .1, 100);
    a.position.z = 8.5;
    let o = new ar,
      s = window.matchMedia(`(max-width: 700px)`).matches ? 4200 : 6200;
    o.setAttribute(`position`, new Jn(new Float32Array(s * 3), 3));
    let c = new Float32Array(s * 4),
      l = 9182;
    for (let e = 0; e < c.length; e++) l = l * 1664525 + 1013904223 >>> 0, c[e] = l / 4294967296;
    o.setAttribute(`aSeed`, new Jn(c, 4));
    let u = getComputedStyle(t),
      d = e => new X(u.getPropertyValue(e).trim()),
      f = window.matchMedia(`(prefers-reduced-motion: reduce)`),
      p = {
        uTime: {
          value: 12
        },
        uDpr: {
          value: 1
        },
        uMouse: {
          value: new K(50, 50)
        },
        uMouseActive: {
          value: 0
        },
        uReduced: {
          value: +!!f.matches
        },
        uBase: {
          value: d(`--particle-base`)
        },
        uCyan: {
          value: d(`--particle-cyan`)
        },
        uPurple: {
          value: d(`--particle-purple`)
        }
      },
      m = new Or({
        vertexShader: Us,
        fragmentShader: Ws,
        uniforms: p,
        transparent: !0,
        depthWrite: !1,
        blending: 1
      }),
      h = new ni(o, m);
    h.frustumCulled = !1, h.rotation.z = -.11, i.add(h);
    let g = r.domElement;
    t.append(g);
    let _ = new K(50, 50),
      v = new K(50, 50),
      y = 0,
      b = 0,
      x = performance.now(),
      S = !1,
      C = () => r.render(i, a),
      w = () => {
        let {
          width: e,
          height: n
        } = t.getBoundingClientRect();
        e && n && (r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)), r.setSize(e, n, !1), a.aspect = e / n, a.updateProjectionMatrix(), p.uDpr.value = r.getPixelRatio(), C())
      },
      T = e => {
        if (b = 0, S || document.hidden) return;
        let t = Math.min((e - x) / 1e3, .05);
        x = e, f.matches || (p.uTime.value += t), v.lerp(_, 1 - Math.exp(-t * 7)), p.uMouse.value.copy(v), p.uMouseActive.value += (y - p.uMouseActive.value) * (1 - Math.exp(-t * 5)), p.uReduced.value = +!!f.matches, C(), f.matches || (b = requestAnimationFrame(T))
      },
      E = () => {
        cancelAnimationFrame(b), x = performance.now(), T(x)
      },
      D = e => {
        if (f.matches) return;
        let t = g.getBoundingClientRect(),
          n = 2 * Math.tan(a.fov * Math.PI / 360) * a.position.z;
        _.set(((e.clientX - t.left) / t.width - .5) * n * a.aspect, (.5 - (e.clientY - t.top) / t.height) * n), y = 1
      },
      O = () => {
        y = 0
      },
      k = () => {
        cancelAnimationFrame(b), n(!0)
      },
      A = new ResizeObserver(w);
    return A.observe(t), g.addEventListener(`pointermove`, D), g.addEventListener(`pointerleave`, O), g.addEventListener(`webglcontextlost`, k), document.addEventListener(`visibilitychange`, E), f.addEventListener(`change`, E), w(), E(), () => {
      S = !0, cancelAnimationFrame(b), A.disconnect(), g.removeEventListener(`pointermove`, D), g.removeEventListener(`pointerleave`, O), g.removeEventListener(`webglcontextlost`, k), document.removeEventListener(`visibilitychange`, E), f.removeEventListener(`change`, E), o.dispose(), m.dispose(), r.dispose(), r.forceContextLoss(), g.remove()
    }
  }, []), t ? (0, Vs.jsx)(Hs, {}) : (0, Vs.jsx)(`div`, {
    className: `login-particle-canvas`,
    ref: e
  })
}
export {
  Gs as
  default
};