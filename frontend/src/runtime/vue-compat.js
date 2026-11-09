/**
 * Vue rendering adapter for recovered JSX business modules.
 *
 * This module contains no React runtime. Hook state, component lifetimes,
 * context, DOM updates and asynchronous components are all owned by Vue.
 */
import {
  Fragment as VueFragment,
  Suspense as VueSuspense,
  Teleport,
  cloneVNode,
  computed,
  defineAsyncComponent,
  defineComponent,
  h,
  inject,
  isVNode,
  nextTick,
  onBeforeUnmount,
  provide,
  shallowRef,
} from 'vue';

const componentCache = new WeakMap();
const directComponents = new WeakSet();
const Fragment = Symbol('recovered.fragment');
const Suspense = Symbol('recovered.suspense');
let renderingFrame;
let idSequence = 0;

function sameDependencies(previous, next) {
  return Array.isArray(previous) && Array.isArray(next)
    && previous.length === next.length
    && previous.every((value, index) => Object.is(value, next[index]));
}

function hookSlot(factory) {
  if (!renderingFrame) throw new Error('A recovered hook must run inside a Vue component render.');
  const frame = renderingFrame;
  const index = frame.index++;
  if (!frame.hooks[index]) frame.hooks[index] = factory();
  return frame.hooks[index];
}

function childrenArray(children, target = []) {
  if (Array.isArray(children)) {
    for (const child of children) childrenArray(child, target);
  } else if (children !== undefined && children !== null && typeof children !== 'boolean') {
    target.push(children);
  }
  return target;
}

// Icons and other static JSX trees are created at module scope. Clone their
// VNodes for each placement so that Vue never shares one mounted DOM instance.
function normalizeChild(child) {
  if (Array.isArray(child)) return child.map(normalizeChild);
  if (child === undefined || child === null || typeof child === 'boolean') return null;
  if (isVNode(child)) {
    const copy = cloneVNode(child);
    if (Array.isArray(child.children)) copy.children = child.children.map(normalizeChild);
    return copy;
  }
  return typeof child === 'bigint' ? String(child) : child;
}

function renderResult(result) {
  const normalized = normalizeChild(result);
  return Array.isArray(normalized) ? h(VueFragment, null, normalized) : normalized;
}

function scheduleEffects(frame) {
  if (frame.scheduled || !frame.pending.size) return;
  frame.scheduled = true;
  nextTick(() => {
    frame.scheduled = false;
    if (!frame.alive) return;
    const pending = [...frame.pending];
    frame.pending.clear();
    for (const slot of pending) {
      if (typeof slot.cleanup === 'function') slot.cleanup();
      slot.cleanup = undefined;
      const cleanup = slot.effect?.();
      if (typeof cleanup === 'function') slot.cleanup = cleanup;
    }
  });
}

/** Wrap a recovered function as a normal Vue component, preserving its identity. */
export function toVue(component) {
  if (component && typeof component === 'object') return component;
  if (typeof component !== 'function') return component;
  if (componentCache.has(component)) return componentCache.get(component);
  const wrapped = defineComponent({
    // Production bundles contain short function names such as `q` or `i`.
    // Prefix them so Vue does not mistake those names for reserved HTML tags.
    name: `Recovered_${component.displayName || component.name || 'View'}`,
    inheritAttrs: false,
    props: { __compatProps: { type: Object, default: undefined } },
    setup(props, { attrs, slots }) {
      const frame = { hooks: [], index: 0, pending: new Set(), scheduled: false, alive: true };
      onBeforeUnmount(() => {
        frame.alive = false;
        frame.pending.clear();
        for (const slot of frame.hooks) {
          if (typeof slot.cleanup === 'function') slot.cleanup();
          slot.cleanup = undefined;
        }
      });
      return () => {
        const previous = renderingFrame;
        renderingFrame = frame;
        frame.index = 0;
        try {
          const input = props.__compatProps || {
            ...attrs,
            ...(slots.default ? { children: slots.default() } : {}),
          };
          const output = component(input);
          scheduleEffects(frame);
          return renderResult(output);
        } finally {
          renderingFrame = previous;
        }
      };
    },
  });
  componentCache.set(component, wrapped);
  return wrapped;
}

function useState(initialValue) {
  const slot = hookSlot(() => {
    const state = shallowRef(typeof initialValue === 'function' ? initialValue() : initialValue);
    const owner = renderingFrame;
    return {
      state,
      update(value) {
        if (!owner.alive) return;
        state.value = typeof value === 'function' ? value(state.value) : value;
      },
    };
  });
  return [slot.state.value, slot.update];
}

function useReducer(reducer, initialArgument, initializer) {
  const [value, setValue] = useState(() => initializer ? initializer(initialArgument) : initialArgument);
  const reducerRef = useRef(reducer);
  reducerRef.current = reducer;
  const dispatch = useCallback(action => setValue(previous => reducerRef.current(previous, action)), []);
  return [value, dispatch];
}

function useRef(initialValue) {
  return hookSlot(() => ({ current: initialValue }));
}

function useMemo(factory, dependencies) {
  const slot = hookSlot(() => ({ initialized: false, dependencies: undefined, value: undefined }));
  if (!slot.initialized || !sameDependencies(slot.dependencies, dependencies)) {
    slot.initialized = true;
    slot.dependencies = dependencies?.slice();
    slot.value = factory();
  }
  return slot.value;
}

function useCallback(callback, dependencies) {
  return useMemo(() => callback, dependencies);
}

function useEffect(effect, dependencies) {
  const frame = renderingFrame;
  const slot = hookSlot(() => ({ initialized: false, dependencies: undefined, cleanup: undefined }));
  if (!slot.initialized || !sameDependencies(slot.dependencies, dependencies)) {
    slot.initialized = true;
    slot.dependencies = dependencies?.slice();
    slot.effect = effect;
    frame.pending.add(slot);
  }
}

function createContext(defaultValue) {
  const key = Symbol('recovered.context');
  const context = { key, defaultValue };
  context.Provider = defineComponent({
    name: 'RecoveredContextProvider',
    inheritAttrs: false,
    props: { __compatProps: { type: Object, required: true } },
    setup(props) {
      provide(key, computed(() => props.__compatProps.value));
      return () => renderResult(props.__compatProps.children);
    },
  });
  directComponents.add(context.Provider);
  context.Consumer = function ContextConsumer(props) {
    return props.children(useContext(context));
  };
  return context;
}

function useContext(context) {
  // inject() supports the active rendering instance as well as setup().
  const value = inject(context.key, undefined);
  return value === undefined ? context.defaultValue : value.value;
}

function lazy(loader) {
  const lazyComponent = defineAsyncComponent({
    loader: async () => {
      const module = await loader();
      return toVue(module.default || module);
    },
    suspensible: true,
  });
  directComponents.add(lazyComponent);
  return lazyComponent;
}

const unitlessStyles = new Set([
  'animationIterationCount', 'aspectRatio', 'borderImageOutset', 'borderImageSlice',
  'borderImageWidth', 'boxFlex', 'boxFlexGroup', 'boxOrdinalGroup', 'columnCount',
  'columns', 'fillOpacity', 'flex', 'flexGrow', 'flexPositive', 'flexShrink',
  'flexNegative', 'flexOrder', 'fontWeight', 'gridArea', 'gridColumn',
  'gridColumnEnd', 'gridColumnSpan', 'gridColumnStart', 'gridRow', 'gridRowEnd',
  'gridRowSpan', 'gridRowStart', 'lineClamp', 'lineHeight', 'opacity', 'order',
  'orphans', 'scale', 'stopOpacity', 'strokeDasharray', 'strokeDashoffset',
  'strokeMiterlimit', 'strokeOpacity', 'strokeWidth', 'tabSize', 'widows', 'zIndex',
  'zoom', 'WebkitLineClamp', 'msFlex', 'msFlexPositive', 'msFlexNegative',
]);
const svgAttributes = {
  strokeWidth: 'stroke-width', strokeLinecap: 'stroke-linecap', strokeLinejoin: 'stroke-linejoin',
  strokeMiterlimit: 'stroke-miterlimit', strokeDasharray: 'stroke-dasharray',
  strokeDashoffset: 'stroke-dashoffset', strokeOpacity: 'stroke-opacity',
  fillRule: 'fill-rule', fillOpacity: 'fill-opacity', clipRule: 'clip-rule',
  clipPath: 'clip-path', stopColor: 'stop-color', stopOpacity: 'stop-opacity',
  colorInterpolation: 'color-interpolation', colorInterpolationFilters: 'color-interpolation-filters',
  dominantBaseline: 'dominant-baseline', textAnchor: 'text-anchor',
  vectorEffect: 'vector-effect', xlinkHref: 'xlink:href',
};

function nativeStyle(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const result = {};
  for (const [key, property] of Object.entries(value)) {
    result[key] = typeof property === 'number' && property !== 0
      && !key.startsWith('--') && !unitlessStyles.has(key) ? `${property}px` : property;
  }
  return result;
}

function eventHandler(callback) {
  if (Array.isArray(callback)) return callback.map(eventHandler);
  if (typeof callback !== 'function') return callback;
  return event => {
    if (event && !event.nativeEvent) {
      try { Object.defineProperty(event, 'nativeEvent', { configurable: true, value: event }); }
      catch { /* Browser events are normally extensible. */ }
    }
    return callback(event);
  };
}

function assignReference(reference, value) {
  if (typeof reference === 'function') reference(value);
  else if (reference && typeof reference === 'object') reference.current = value;
}

function nativeProps(type, props) {
  const output = {};
  for (let [key, value] of Object.entries(props)) {
    if (key === 'children' || key === 'key' || key === '__self' || key === '__source') continue;
    if (key === 'className') key = 'class';
    else if (key === 'htmlFor') key = 'for';
    else if (key === 'style') value = nativeStyle(value);
    else if (key === 'ref') {
      if (value) output.ref = element => assignReference(value, element);
      continue;
    } else if (key === 'dangerouslySetInnerHTML') {
      output.innerHTML = value?.__html || '';
      continue;
    } else if (key === 'defaultValue') {
      if (props.value === undefined) output.value = value;
      continue;
    } else if (key === 'defaultChecked') {
      if (props.checked === undefined) output.checked = value;
      continue;
    } else if (/^on[A-Z]/.test(key)) {
      const capture = key.endsWith('Capture') ? 'Capture' : '';
      let name = key.slice(2, capture ? -7 : undefined).toLowerCase();
      if (name === 'doubleclick') name = 'dblclick';
      // Recovered blur/focus handlers include wrapper-level containment checks.
      // Their source event model bubbles these events from editable descendants.
      if (name === 'focus') name = 'focusin';
      if (name === 'blur') name = 'focusout';
      if (name === 'change' && (type === 'textarea'
        || (type === 'input' && !['checkbox', 'radio', 'file'].includes(props.type)))) name = 'input';
      key = `on${name[0].toUpperCase()}${name.slice(1)}${capture}`;
      value = eventHandler(value);
    } else if (svgAttributes[key]) key = svgAttributes[key];
    output[key] = value;
  }
  return output;
}

export function jsx(type, originalProps, originalKey) {
  const props = originalProps || {};
  const key = originalKey ?? props.key;
  if (type === Fragment || type === VueFragment) {
    return h(VueFragment, key === undefined ? null : { key }, childrenArray(props.children).map(normalizeChild));
  }
  if (type === Suspense) {
    return h(VueSuspense, key === undefined ? null : { key }, {
      default: () => renderResult(props.children),
      fallback: () => renderResult(props.fallback),
    });
  }
  if (typeof type === 'string') {
    const attributes = nativeProps(type, props);
    if (key !== undefined) attributes.key = key;
    const children = props.dangerouslySetInnerHTML ? undefined : normalizeChild(props.children);
    return h(type, attributes, children);
  }
  if (typeof type === 'function' || (type && typeof type === 'object')) {
    const target = directComponents.has(type) ? type : toVue(type);
    return h(target, { __compatProps: props, ...(key === undefined ? {} : { key }) });
  }
  return null;
}

export function createPortal(children, container, key) {
  return container ? h(Teleport, { to: container, key }, childrenArray(children).map(normalizeChild)) : null;
}

function createElement(type, props, ...children) {
  return jsx(type, { ...props, ...(children.length ? { children: children.length === 1 ? children[0] : children } : {}) });
}

function cloneElement(element, props = {}, ...children) {
  if (!isVNode(element)) throw new Error('cloneElement expects a Vue VNode.');
  const cloned = cloneVNode(element, props);
  if (children.length) cloned.children = children.length === 1 ? children[0] : children;
  return cloned;
}

function useId() {
  return hookSlot(() => ({ value: `recovered-${++idSequence}` })).value;
}

function useImperativeHandle(reference, createHandle, dependencies) {
  useEffect(() => {
    assignReference(reference, createHandle());
    return () => assignReference(reference, null);
  }, dependencies === undefined ? undefined : [...dependencies, reference]);
}

function useSyncExternalStore(subscribe, getSnapshot) {
  const [snapshot, setSnapshot] = useState(getSnapshot);
  useEffect(() => {
    const update = () => setSnapshot(getSnapshot());
    update();
    return subscribe(update);
  }, [subscribe, getSnapshot]);
  return snapshot;
}

class Component {
  constructor(props) { this.props = props; this.state = {}; }
  setState(update) { this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state, this.props) : update) }; }
}

export const jsxRuntime = { jsx, jsxs: jsx, jsxDEV: jsx, Fragment };
export const ReactShim = {
  Fragment,
  Suspense,
  StrictMode: ({ children }) => children,
  Component,
  PureComponent: Component,
  createElement,
  cloneElement,
  isValidElement: isVNode,
  createContext,
  createRef: () => ({ current: null }),
  forwardRef: render => function ForwardedComponent(props) { return render(props, props.ref); },
  memo: component => component,
  lazy,
  useState,
  useReducer,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect: useEffect,
  useInsertionEffect: useEffect,
  useContext,
  useId,
  useImperativeHandle,
  useSyncExternalStore,
  useDeferredValue: value => value,
  useTransition: () => [false, callback => callback()],
  startTransition: callback => callback(),
  useDebugValue: () => {},
  Children: {
    toArray: children => childrenArray(children),
    count: children => childrenArray(children).length,
    map: (children, callback) => childrenArray(children).map(callback),
    forEach: (children, callback) => childrenArray(children).forEach(callback),
    only: children => {
      const list = childrenArray(children);
      if (list.length !== 1) throw new Error('Expected exactly one child.');
      return list[0];
    },
  },
};
ReactShim.default = ReactShim;
export default ReactShim;
