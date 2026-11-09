// origin: assets/useSummaryRefresh-B-5uMwFV.js
import {
  Z as e,
  vt as t
} from "./index-Dnr0i-H9.js";
var n = t(e(), 1);

function r(e, t) {
  (0, n.useEffect)(() => {
    if (!e?.summaryUpdating) return;
    let n = () => {
        document.hidden || t()
      },
      r = window.setTimeout(n, 2500);
    return document.addEventListener(`visibilitychange`, n), () => {
      window.clearTimeout(r), document.removeEventListener(`visibilitychange`, n)
    }
  }, [e, t])
}
export {
  r as t
};