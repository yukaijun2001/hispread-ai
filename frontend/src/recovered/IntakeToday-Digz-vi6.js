// origin: assets/IntakeToday-Digz-vi6.js
import {
  C as e,
  S as t,
  X as n,
  g as r,
  h as i,
  mt as a,
  o,
  s
} from "./index-Dnr0i-H9.js";
import {
  i as c,
  n as l,
  t as u
} from "./labels-DaPzz6Ie.js"; /* empty css               */
var d = n();

function f({
  active: n = !0
}) {
  let {
    user: f
  } = e(), p = t(n && f.supplierId ? `/cc-intake/mine` : null, 3e4);
  return f.supplierId ? (0, d.jsxs)(`div`, {
    className: `cc-intake-today`,
    "aria-label": a(`今日上号额度`),
    children: [(0, d.jsxs)(`div`, {
      className: `cc-intake-today-heading`,
      children: [(0, d.jsxs)(`div`, {
        className: `cc-intake-today-summary`,
        children: [(0, d.jsx)(`h3`, {
          children: a(`今日上号额度`)
        }), p.data && !p.error && (0, d.jsxs)(`div`, {
          className: `cc-intake-today-totals`,
          children: [(0, d.jsxs)(`span`, {
            children: [f.role === `SUPPLIER` ? a(`供应商今日成功总数`) : a(`本人今日成功总数`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.total)
            })]
          }), (0, d.jsxs)(`span`, {
            children: [a(`套餐未识别`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.unknown)
            })]
          }), (0, d.jsxs)(`span`, {
            children: [a(`处理中及待核实`), ` `, (0, d.jsx)(`strong`, {
              children: u(p.data.processing)
            })]
          })]
        })]
      }), (0, d.jsxs)(`span`, {
        children: [a(`北京时间`), p.data ? ` · ${p.data.date}` : ``]
      })]
    }), p.error ? (0, d.jsxs)(r, {
      tone: `red`,
      children: [p.error, (0, d.jsx)(s, {
        onClick: p.reload,
        children: a(`重新加载`)
      })]
    }) : p.data ? (0, d.jsx)(`div`, {
      className: `cc-intake-today-rows`,
      role: `list`,
      "aria-label": a(`今日上号分类额度`),
      children: [`pro`, `nonPro`].map(e => {
        let t = e === `pro` ? p.data.proAllowance : p.data.nonProAllowance,
          n = e === `pro` ? p.data.canPro : p.data.accepting,
          r = e === `pro` ? p.data.proBlockReason : p.data.nonProBlockReason;
        return (0, d.jsxs)(`div`, {
          className: `cc-intake-today-row`,
          role: `listitem`,
          children: [(0, d.jsxs)(`div`, {
            className: `cc-intake-today-category`,
            children: [(0, d.jsx)(`strong`, {
              children: e === `pro` ? `PRO` : a(`非PRO`)
            }), (0, d.jsx)(o, {
              state: n ? `ACCEPTING` : `CLOSED`,
              label: l(n, r)
            })]
          }), (0, d.jsxs)(`dl`, {
            className: `cc-intake-today-values`,
            children: [(0, d.jsxs)(`div`, {
              className: `cc-intake-today-source`,
              children: [(0, d.jsx)(`dt`, {
                children: a(`来源`)
              }), (0, d.jsxs)(`dd`, {
                children: [c(t.source), t.reclaimed && (0, d.jsx)(`small`, {
                  children: a(`今日个人额度已回收，次日使用共享额度`)
                })]
              })]
            }), (0, d.jsxs)(`div`, {
              children: [(0, d.jsx)(`dt`, {
                children: f.role === `SUPPLIER` ? a(`供应商今日成功`) : a(`本人今日成功`)
              }), (0, d.jsx)(`dd`, {
                children: u(p.data[e])
              })]
            }), (0, d.jsxs)(`div`, {
              children: [(0, d.jsx)(`dt`, {
                children: a(`来源已用／每日上限`)
              }), (0, d.jsxs)(`dd`, {
                children: [u(t.used), ` / `, u(t.limit), t.limit !== null && t.used > t.limit && (0, d.jsx)(`small`, {
                  className: `cc-intake-overage`,
                  children: a(`超出{0}个`, [t.used - t.limit])
                })]
              })]
            }), (0, d.jsxs)(`div`, {
              className: `cc-intake-today-balance`,
              children: [(0, d.jsx)(`dt`, {
                children: a(`本账号可用`)
              }), (0, d.jsx)(`dd`, {
                children: (0, d.jsx)(`strong`, {
                  children: u(t.remaining)
                })
              })]
            })]
          }), t.reservedRemaining > 0 && (0, d.jsx)(`p`, {
            className: `cc-intake-today-reservation`,
            children: a(`已预留给成员／交付组 {0} 个，不计入本账号可用额度。`, [u(t.reservedRemaining)])
          })]
        }, e)
      })
    }) : (0, d.jsx)(i, {})]
  }) : null
}
export {
  f as
  default
};