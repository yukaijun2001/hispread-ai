import { ReactShim, createPortal, jsxRuntime } from './vue-compat.js';

function activeToastHost() {
  const dialogs = [...document.querySelectorAll('dialog:modal')];
  const focusedDialog = document.activeElement?.closest('dialog:modal');
  return focusedDialog || dialogs.at(-1) || document.body;
}

export function Toast({ message, error, children }) {
  const element = ReactShim.useRef(null);
  const [host, setHost] = ReactShim.useState(activeToastHost);
  const supportsPopover = typeof HTMLElement.prototype.showPopover === 'function';

  ReactShim.useEffect(() => {
    const updateHost = () => setHost(activeToastHost());
    const observer = new MutationObserver(updateHost);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    document.addEventListener('focusin', updateHost);
    updateHost();
    return () => {
      observer.disconnect();
      document.removeEventListener('focusin', updateHost);
    };
  }, []);

  ReactShim.useEffect(() => {
    const node = element.current;
    if (!supportsPopover || !node?.isConnected) return;
    if (node.matches(':popover-open')) node.hidePopover();
    node.showPopover();
    return () => {
      if (node.isConnected && node.matches(':popover-open')) node.hidePopover();
    };
  }, [host, message, error]);

  return createPortal(jsxRuntime.jsx('div', {
    ref: element,
    role: 'status',
    className: `toast ${error ? 'toast-error' : ''}`,
    popover: supportsPopover ? 'manual' : undefined,
    style: { margin: 0, inset: 'auto auto 25px 50%', width: 'max-content', overflow: 'visible', pointerEvents: 'none' },
    children,
  }), host);
}
