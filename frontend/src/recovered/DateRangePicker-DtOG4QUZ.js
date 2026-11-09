// origin: assets/DateRangePicker-DtOG4QUZ.js
import {
  K as e,
  X as t,
  Z as n,
  j as r,
  mt as i,
  pt as a,
  vt as o
} from "./index-Dnr0i-H9.js";
var s = o(n(), 1),
  c = e();

function l() {
  let e = r();
  return {
    from: e,
    to: e
  }
}

function u(e = r()) {
  let [t, n, i] = e.split(`-`).map(Number), a = e => new Date(Date.UTC(t, n - 1, i - e)).toISOString().slice(0, 10);
  return [{
    label: `当日`,
    from: e,
    to: e
  }, {
    label: `近7天`,
    from: a(6),
    to: e
  }, {
    label: `近30天`,
    from: a(29),
    to: e
  }, {
    label: `本月`,
    from: `${e.slice(0,7)}-01`,
    to: new Date(Date.UTC(t, n, 0)).toISOString().slice(0, 10)
  }]
}
var d = t(),
  f = [i(`一`), i(`二`), i(`三`), i(`四`), i(`五`), i(`六`), i(`日`)];

function p(e) {
  return `${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`
}

function m(e) {
  let t = /^(\d{4})-(\d{2})-\d{2}$/.exec(e);
  if (t) return new Date(Number(t[1]), Number(t[2]) - 1, 1);
  let n = new Date;
  return new Date(n.getFullYear(), n.getMonth(), 1)
}

function h(e, t) {
  return new Date(e.getFullYear(), e.getMonth() + t, 1)
}

function g(e) {
  return e.replaceAll(`-`, `/`)
}

function _({
  month: e,
  from: t,
  to: n,
  start: r,
  hover: o,
  minDate: s,
  onPick: c,
  onHover: l
}) {
  let u = e.getFullYear(),
    m = e.getMonth(),
    h = (new Date(u, m, 1).getDay() + 6) % 7,
    g = r ? o && o < r ? o : r : t,
    _ = r ? o && o > r ? o : r : n;
  return (0, d.jsxs)(`div`, {
    className: `date-range-month`,
    children: [(0, d.jsx)(`strong`, {
      children: new Intl.DateTimeFormat(a(), {
        year: `numeric`,
        month: `long`
      }).format(e)
    }), (0, d.jsxs)(`div`, {
      className: `date-range-grid`,
      children: [f.map(e => (0, d.jsx)(`span`, {
        className: `date-range-weekday`,
        children: e
      }, e)), Array.from({
        length: 42
      }, (e, a) => {
        let o = new Date(u, m, a - h + 1),
          f = p(o);
        if (o.getMonth() !== m) return (0, d.jsx)(`span`, {
          className: `date-range-day outside`,
          "aria-hidden": `true`
        }, f);
        let v = f === (r || t) || !r && f === n,
          y = !!(g && _ && f >= g && f <= _),
          b = !!(s && f < s);
        return (0, d.jsx)(`button`, {
          className: `date-range-day${y?` in-range`:``}${v?` endpoint`:``}`,
          type: `button`,
          "data-date": f,
          "aria-label": i(`{0}年{1}月{2}日`, [o.getFullYear(), o.getMonth() + 1, o.getDate()]),
          "aria-pressed": v,
          disabled: b,
          onClick: () => c(f),
          onPointerEnter: () => !b && l(f),
          children: o.getDate()
        }, f)
      })]
    })]
  })
}

function v({
  from: e,
  to: t,
  label: n = i(`适用期间`),
  disabled: r,
  minDate: a,
  fromLocked: o = !1,
  onChange: l
}) {
  let [f, p] = (0, s.useState)(!1), [v, y] = (0, s.useState)(() => m(e)), [b, x] = (0, s.useState)(``), [S, C] = (0, s.useState)(``), [w, T] = (0, s.useState)({
    top: 0,
    left: 0
  }), E = (0, s.useRef)(null), D = (0, s.useRef)(null), O = u(), k = O.find(n => n.from === e && n.to === t);
  (0, s.useLayoutEffect)(() => {
    if (!f) return;
    let n = o ? t : a && e < a ? a : e,
      r = D.current?.querySelector(`[data-date="${n}"]`);
    (r?.disabled ? D.current?.querySelector(`.date-range-day:not(:disabled)`) : r || D.current?.querySelector(`.date-range-day:not(:disabled)`))?.focus()
  }, [f]), (0, s.useLayoutEffect)(() => {
    if (!f || !E.current || !D.current) return;
    let e = () => {
      if (!E.current || !D.current) return;
      let e = E.current.getBoundingClientRect(),
        t = D.current.getBoundingClientRect(),
        n = Math.max(8, Math.min(e.left, window.innerWidth - t.width - 8)),
        r = e.bottom + 8,
        i = r + t.height <= window.innerHeight - 8 ? r : Math.max(8, e.top - t.height - 8);
      T({
        top: i,
        left: n
      })
    };
    return e(), window.addEventListener(`resize`, e), window.addEventListener(`scroll`, e, !0), () => {
      window.removeEventListener(`resize`, e), window.removeEventListener(`scroll`, e, !0)
    }
  }, [f, v]), (0, s.useEffect)(() => {
    if (!f) return;
    let e = e => {
        let t = e.target;
        !E.current?.contains(t) && !D.current?.contains(t) && (p(!1), x(``), C(``))
      },
      t = e => {
        e.key === `Escape` && (e.preventDefault(), p(!1), x(``), C(``), E.current?.focus())
      },
      n = e => {
        let t = e.target;
        !E.current?.contains(t) && !D.current?.contains(t) && (p(!1), x(``), C(``))
      };
    return document.addEventListener(`pointerdown`, e), document.addEventListener(`keydown`, t), document.addEventListener(`focusin`, n), () => {
      document.removeEventListener(`pointerdown`, e), document.removeEventListener(`keydown`, t), document.removeEventListener(`focusin`, n)
    }
  }, [f]);

  function A(t) {
    if (!(a && t < a)) {
      if (o) {
        l(e, t), p(!1), E.current?.focus();
        return
      }
      if (!b) {
        x(t), C(``);
        return
      }
      l(b < t ? b : t, b > t ? b : t), x(``), C(``), p(!1), E.current?.focus()
    }
  }

  function j(e, t) {
    o || a && e < a || (l(e, t), x(``), C(``), p(!1), E.current?.focus())
  }
  return (0, d.jsxs)(d.Fragment, {
    children: [(0, d.jsxs)(`button`, {
      className: `date-range-trigger`,
      type: `button`,
      ref: E,
      disabled: r,
      "aria-label": i(`{0}：{1}`, [n, e && t ? i(`{0} 至 {1}`, [g(e), g(t)]) : i(`未选择`)]),
      "aria-haspopup": `dialog`,
      "aria-expanded": f,
      onClick: () => {
        f ? p(!1) : (y(m(o ? t : a && e < a ? a : e)), x(``), C(``), p(!0))
      },
      children: [(0, d.jsx)(`span`, {
        className: `date-range-trigger-dates`,
        children: e && t ? (0, d.jsxs)(d.Fragment, {
          children: [(0, d.jsxs)(`span`, {
            children: [i(`起 `), g(e)]
          }), (0, d.jsxs)(`span`, {
            children: [i(`止 `), g(t)]
          })]
        }) : (0, d.jsx)(`span`, {
          children: i(`选择{0}`, [n])
        })
      }), (0, d.jsxs)(`svg`, {
        "aria-hidden": `true`,
        width: `17`,
        height: `17`,
        viewBox: `0 0 24 24`,
        fill: `none`,
        children: [(0, d.jsx)(`rect`, {
          x: `3`,
          y: `5`,
          width: `18`,
          height: `16`,
          rx: `2`,
          stroke: `currentColor`,
          strokeWidth: `1.7`
        }), (0, d.jsx)(`path`, {
          d: `M7 3v4m10-4v4M3 10h18`,
          stroke: `currentColor`,
          strokeWidth: `1.7`,
          strokeLinecap: `round`
        })]
      })]
    }), f && (0, c.createPortal)((0, d.jsxs)(`div`, {
      className: `date-range-popup`,
      role: `dialog`,
      "aria-label": i(`选择{0}`, [n]),
      ref: D,
      style: {
        top: w.top,
        left: w.left
      },
      children: [(0, d.jsxs)(`div`, {
        className: `date-range-popup-head`,
        children: [(0, d.jsx)(`span`, {
          children: i(o ? `开始日期已锁定，请选择结束日期` : b ? `选择结束日期` : `选择开始日期，再选择结束日期`)
        }), (0, d.jsxs)(`div`, {
          children: [(0, d.jsx)(`button`, {
            type: `button`,
            "aria-label": i(`上两个月`),
            onClick: () => y(e => h(e, -2)),
            children: `‹`
          }), (0, d.jsx)(`button`, {
            type: `button`,
            "aria-label": i(`下两个月`),
            onClick: () => y(e => h(e, 2)),
            children: `›`
          })]
        })]
      }), (0, d.jsx)(`div`, {
        className: `date-range-months`,
        children: [v, h(v, 1)].map(n => (0, d.jsx)(_, {
          month: n,
          from: e,
          to: t,
          start: b,
          hover: S,
          minDate: a,
          onPick: A,
          onHover: C
        }, `${n.getFullYear()}-${n.getMonth()}`))
      }), (0, d.jsxs)(`div`, {
        className: `date-range-popup-foot`,
        children: [(0, d.jsx)(`span`, {
          children: o ? i(`开始日期 {0} 保留，历史期间不可修改`, [g(e)]) : b ? i(`已选开始：{0}，请选择结束日期`, [g(b)]) : i(`区间包含开始和结束当天`)
        }), !o && (0, d.jsx)(`div`, {
          className: `date-range-shortcuts`,
          role: `group`,
          "aria-label": i(`快捷日期`),
          children: O.map(e => (0, d.jsx)(`button`, {
            type: `button`,
            "aria-pressed": !b && e === k,
            disabled: !!(a && e.from < a),
            onClick: () => j(e.from, e.to),
            children: i(e.label)
          }, e.label))
        })]
      })]
    }), E.current?.closest(`dialog[open]`) || document.body)]
  })
}
export {
  u as n, l as r, v as t
};