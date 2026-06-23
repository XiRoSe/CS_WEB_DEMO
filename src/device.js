// Device gating. The mobile/touch controls (engine/touch.js) are kept intact, but for now the game
// is gated to desktop/laptop (mouse + keyboard). Phones/tablets get a "play on a computer" screen.

/** @returns {boolean} true for phones/tablets (incl. desktop-UA iPads); false for desktop/laptop. */
export function isMobileOrTablet() {
  const ua = navigator.userAgent || "";
  // Gate purely on the user-agent — pointer media queries falsely flag touchscreen LAPTOPS as
  // mobile (their primary pointer reads as "coarse" even with a trackpad), which blocked desktops.
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(ua)) return true;
  // iPadOS 13+ reports a Mac user-agent but exposes multi-touch (real Macs report 0 touch points)
  if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return true;
  return false;
}

/** Full-screen "desktop & laptop only" briefing shown instead of booting the game on mobile. */
export function showDesktopOnlyScreen() {
  const d = document.createElement("div");
  d.style.cssText =
    "position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;" +
    "text-align:center;padding:34px;background:#0a0e13;color:#e8eef2;font-family:'Rajdhani','Saira Condensed',system-ui,sans-serif;";
  d.innerHTML =
    '<div style="letter-spacing:.3em;text-transform:uppercase;font-size:12px;color:#8a9bb0;margin-bottom:16px;">Operation Briefing</div>' +
    '<div style="font-size:30px;font-weight:700;letter-spacing:.03em;line-height:1.25;max-width:560px;">' +
      'This operation runs on <span style="color:#f0a000;">desktop &amp; laptop</span> only — for now.</div>' +
    '<div style="margin-top:18px;font-size:16px;color:#aab6c2;max-width:520px;line-height:1.55;">' +
      'It needs a mouse and keyboard for proper aiming and controls. Mobile support is coming — please deploy from a computer. 🖥️</div>';
  document.body.appendChild(d);
}
