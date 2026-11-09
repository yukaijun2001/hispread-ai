// origin: assets/usePaymentEvidence-DFI1SOk7.js
import {
  X as e,
  Z as t,
  at as n,
  g as r,
  mt as i,
  s as a,
  vt as o
} from "./index-Dnr0i-H9.js";
var s = o(t(), 1),
  c = () => ({
    type: `doc`,
    children: []
  }),
  l = {
    P: `paragraph`,
    DIV: `paragraph`,
    B: `bold`,
    STRONG: `bold`,
    I: `italic`,
    EM: `italic`,
    U: `underline`,
    UL: `bulletList`,
    OL: `orderedList`,
    LI: `listItem`
  };

function u(e) {
  let t = e => {
    if (e.nodeType === Node.TEXT_NODE) return e.textContent ? [{
      type: `text`,
      text: e.textContent
    }] : [];
    if (!(e instanceof HTMLElement) || [`SCRIPT`, `STYLE`, `IFRAME`, `IMG`].includes(e.tagName)) return [];
    if (e.tagName === `BR`) return [{
      type: `br`
    }];
    let n = Array.from(e.childNodes).flatMap(t),
      r = l[e.tagName];
    return r ? [{
      type: r,
      children: n
    }] : n
  };
  return {
    type: `doc`,
    children: Array.from(e.childNodes).flatMap(t)
  }
}

function d(e) {
  return e.type === `text` ? e.text : e.type === `br` ? `
` : e.children.map(d).join(``)
}

function f(e) {
  if (e.type === `text`) return document.createTextNode(e.text);
  if (e.type === `br`) return document.createElement(`br`);
  let t = document.createElement({
    doc: `div`,
    paragraph: `p`,
    bold: `strong`,
    italic: `em`,
    underline: `u`,
    bulletList: `ul`,
    orderedList: `ol`,
    listItem: `li`
  } [e.type]);
  return e.children.forEach(e => t.append(f(e))), t
}
var p = e();

function m({
  draft: e,
  disabled: t,
  onRemove: n
}) {
  let [r, o] = (0, s.useState)(``);
  return (0, s.useEffect)(() => {
    if (!e.file.type.startsWith(`image/`)) return;
    let t = URL.createObjectURL(e.file);
    return o(t), () => URL.revokeObjectURL(t)
  }, [e.file]), (0, p.jsxs)(`div`, {
    className: `payment-evidence-file`,
    children: [r && (0, p.jsx)(`img`, {
      src: r,
      alt: e.file.name
    }), (0, p.jsxs)(`div`, {
      children: [(0, p.jsx)(`strong`, {
        children: e.file.name
      }), (0, p.jsxs)(`small`, {
        children: [(e.file.size / 1024).toFixed(1), ` KB`]
      })]
    }), (0, p.jsx)(a, {
      type: `button`,
      icon: `close`,
      disabled: t,
      "aria-label": i(`移除附件 {0}`, [e.file.name]),
      onClick: n
    })]
  })
}

function h({
  value: e,
  disabled: t = !1
}) {
  let n = (0, s.useRef)(null),
    o = (0, s.useRef)(null),
    c = (0, s.useRef)(null),
    [l, h] = (0, s.useState)(!1),
    [g, _] = (0, s.useState)({});
  (0, s.useEffect)(() => {
    if (!n.current) return;
    let t = f(e.content);
    n.current.replaceChildren(...Array.from(t.childNodes))
  }, []);
  let v = () => {
      let e = window.getSelection();
      e?.rangeCount && n.current?.contains(e.anchorNode) && (c.current = e.getRangeAt(0).cloneRange(), _(Object.fromEntries([`bold`, `italic`, `underline`, `insertUnorderedList`, `insertOrderedList`].map(e => [e, document.queryCommandState(e)]))))
    },
    y = () => {
      n.current && e.setContent(u(n.current)), v()
    },
    b = (e, r) => {
      if (t) return;
      n.current?.focus();
      let i = window.getSelection();
      c.current && n.current?.contains(c.current.commonAncestorContainer) && (i?.removeAllRanges(), i?.addRange(c.current)), document.execCommand(`styleWithCSS`, !1, `false`), document.execCommand(e, !1, r), y()
    },
    x = [{
      command: `bold`,
      label: i(`加粗`),
      text: (0, p.jsx)(`strong`, {
        children: `B`
      })
    }, {
      command: `italic`,
      label: i(`斜体`),
      text: (0, p.jsx)(`em`, {
        children: `I`
      })
    }, {
      command: `underline`,
      label: i(`下划线`),
      text: (0, p.jsx)(`u`, {
        children: `U`
      })
    }, {
      command: `insertUnorderedList`,
      label: i(`无序列表`),
      text: i(`无序列表`)
    }, {
      command: `insertOrderedList`,
      label: i(`有序列表`),
      text: i(`有序列表`)
    }];
  return (0, p.jsxs)(`div`, {
    className: `payment-evidence-editor${l?` is-dragging`:``}${t?` is-disabled`:``}`,
    onDragOver: e => {
      e.preventDefault(), t || h(!0)
    },
    onDragLeave: e => {
      e.currentTarget.contains(e.relatedTarget) || h(!1)
    },
    onDrop: n => {
      n.preventDefault(), h(!1), !t && (n.dataTransfer.files.length ? e.addFiles(Array.from(n.dataTransfer.files)) : b(`insertText`, n.dataTransfer.getData(`text/plain`)))
    },
    onPaste: n => {
      if (n.preventDefault(), t) return;
      let r = Array.from(n.clipboardData.items).filter(e => e.kind === `file`).map(e => e.getAsFile()).filter(e => !!e);
      r.length ? e.addFiles(r) : b(`insertText`, n.clipboardData.getData(`text/plain`))
    },
    children: [(0, p.jsxs)(`div`, {
      className: `payment-evidence-toolbar`,
      role: `toolbar`,
      "aria-label": i(`付款说明格式`),
      children: [x.map(e => (0, p.jsx)(`button`, {
        type: `button`,
        disabled: t,
        "aria-label": e.label,
        title: e.label,
        "aria-pressed": !!g[e.command],
        onMouseDown: e => e.preventDefault(),
        onClick: () => b(e.command),
        children: e.text
      }, e.command)), (0, p.jsx)(a, {
        type: `button`,
        icon: `upload`,
        disabled: t,
        onClick: () => o.current?.click(),
        children: i(`添加文件`)
      }), (0, p.jsx)(`input`, {
        ref: o,
        className: `payment-evidence-input`,
        type: `file`,
        multiple: !0,
        accept: `application/pdf,image/png,image/jpeg`,
        disabled: t,
        "aria-label": i(`添加付款凭证文件`),
        onChange: t => {
          e.addFiles(Array.from(t.target.files || [])), t.target.value = ``
        }
      })]
    }), (0, p.jsx)(`div`, {
      ref: n,
      className: `payment-evidence-content`,
      role: `textbox`,
      "aria-label": i(`付款说明`),
      "aria-multiline": `true`,
      contentEditable: !t,
      suppressContentEditableWarning: !0,
      spellCheck: !1,
      "data-empty": !d(e.content).trim(),
      "data-placeholder": i(`填写付款说明，可直接粘贴图片或将文件拖到这里`),
      onInput: y,
      onMouseUp: v,
      onKeyUp: v,
      onBlur: v
    }), !!e.files.length && (0, p.jsx)(`div`, {
      className: `payment-evidence-files`,
      children: e.files.map(n => (0, p.jsx)(m, {
        draft: n,
        disabled: t,
        onRemove: () => e.removeFile(n.key)
      }, n.key))
    }), (0, p.jsx)(`div`, {
      className: `payment-evidence-hint`,
      children: i(`支持拖入文件、粘贴图片；PDF / PNG / JPG，单个最多10 MB，最多10个附件`)
    }), e.error && (0, p.jsx)(r, {
      tone: `red`,
      children: e.error
    })]
  })
}

function g() {
  let [e, t] = (0, s.useState)(c), [r, a] = (0, s.useState)([]), [o, l] = (0, s.useState)(``), u = (0, s.useRef)(new Map);
  return {
    content: e,
    setContent: t,
    files: r,
    addFiles: e => {
      let t = e.filter(e => !r.some(t => t.file.name === e.name && t.file.size === e.size && t.file.lastModified === e.lastModified));
      if (r.length + t.length > 10) {
        l(i(`最多添加10个付款凭证附件`));
        return
      }
      for (let e of t) {
        if (!e.size || e.size > 10485760) {
          l(i(`付款凭证大小须在1 B至10 MB之间`));
          return
        }
        if (![`application/pdf`, `image/png`, `image/jpeg`].includes(e.type) && !/\.(pdf|png|jpe?g)$/i.test(e.name)) {
          l(i(`仅支持PDF、PNG、JPG付款凭证`));
          return
        }
      }
      l(``), a(e => [...e, ...t.map(e => ({
        key: crypto.randomUUID(),
        file: e
      }))])
    },
    removeFile: e => {
      a(t => t.filter(t => t.key !== e)), l(``)
    },
    error: o,
    prepare: async t => {
      if (!r.length) throw Error(i(`请上传付款凭证`));
      if (d(e).length > 1e4) throw Error(i(`付款说明过长，最多10000字`));
      let a = [];
      for (let e of r) {
        let r = u.current.get(e.key);
        r || (r = (await n(t, e.file, `PAYMENT_PROOF`)).id, u.current.set(e.key, r)), a.push(r)
      }
      return {
        evidenceId: a[0],
        evidenceIds: a,
        evidenceContent: JSON.stringify(e)
      }
    }
  }
}
export {
  h as n, d as r, g as t
};