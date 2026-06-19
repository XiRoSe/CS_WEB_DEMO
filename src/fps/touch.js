// On-screen touch controls for mobile: left virtual joystick (move),
// right side drag (look), and FIRE / JUMP / RELOAD / DUCK buttons.
const CSS = `
#touch { position:absolute; inset:0; z-index:20; pointer-events:none; display:none; touch-action:none; }
#touch.on { display:block; pointer-events:auto; }
#touch .joy { position:absolute; left:34px; bottom:44px; width:200px; height:200px; border-radius:50%;
  border:3px solid rgba(216,224,200,.4); background:rgba(20,26,18,.3); }
#touch .knob { position:absolute; left:55px; top:55px; width:90px; height:90px; border-radius:50%;
  background:rgba(216,224,200,.55); border:3px solid rgba(255,255,255,.45); }
#touch .tbtn { position:absolute; pointer-events:auto; border:3px solid rgba(216,224,200,.5);
  background:rgba(18,22,16,.55); color:#d8e0c8; font-family:"Saira Condensed",sans-serif; font-weight:700;
  letter-spacing:.06em; border-radius:18px; display:flex; align-items:center; justify-content:center;
  user-select:none; -webkit-user-select:none; font-size:21px; }
#touch .tbtn:active { background:rgba(224,163,46,.6); color:#12160e; }
#touch .fire { right:28px; bottom:150px; width:152px; height:152px; border-radius:50%; font-size:26px; }
#touch .jump { right:206px; bottom:200px; width:110px; height:110px; border-radius:50%; }
#touch .duck { right:206px; bottom:66px; width:110px; height:110px; border-radius:50%; }
#touch .reload { right:34px; bottom:320px; width:130px; height:88px; }
#touch .lookhint { position:absolute; left:58%; top:34%; transform:translate(-50%,-50%);
  color:rgba(216,224,200,.5); font-family:"Saira Condensed",sans-serif; font-weight:700; font-size:18px;
  letter-spacing:.12em; text-align:center; transition:opacity .6s; pointer-events:none; line-height:1.5; }
`;

export class TouchControls {
  constructor(input) {
    this.input = input;
    this.enabled = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || "ontouchstart" in window;
    if (!this.enabled) return;

    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    const root = document.createElement("div"); root.id = "touch";
    root.innerHTML = `
      <div class="joy"><div class="knob"></div></div>
      <div class="lookhint">↻<br>DRAG TO LOOK</div>
      <div class="tbtn fire">FIRE</div>
      <div class="tbtn jump">JUMP</div>
      <div class="tbtn duck">DUCK</div>
      <div class="tbtn reload">RELOAD</div>`;
    document.getElementById("ui").appendChild(root);
    this.root = root;
    this.joy = root.querySelector(".joy");
    this.knob = root.querySelector(".knob");
    this.lookhint = root.querySelector(".lookhint");

    this.C = 55;       // knob center offset (joy 200 / knob 90)
    this.R = 78;       // drag radius
    this.baseC = { x: 0, y: 0 };
    this.joyId = null;
    this.lookId = null; this.lookLast = { x: 0, y: 0 };
    this._looked = false;

    this._bindButtons(root);
    this._bindZones(root);
  }

  show() {
    if (!this.enabled) return;
    this.root.classList.add("on");
    this.knob.style.left = this.C + "px"; this.knob.style.top = this.C + "px";
    if (!this._looked && this.lookhint) this.lookhint.style.opacity = "1";
  }
  hide() { if (this.enabled) this.root.classList.remove("on"); }

  _hideLookHint() { this._looked = true; if (this.lookhint) this.lookhint.style.opacity = "0"; }

  _moveJoy(x, y) {
    let dx = x - this.baseC.x, dy = y - this.baseC.y;
    const len = Math.hypot(dx, dy) || 1, cl = Math.min(len, this.R);
    dx = dx / len * cl; dy = dy / len * cl;
    this.knob.style.left = this.C + dx + "px"; this.knob.style.top = this.C + dy + "px";
    this.input.touch.mx = dx / this.R; this.input.touch.mz = -dy / this.R;
  }

  _bindButtons(root) {
    const t = this.input.touch;
    const hold = (sel, on, off) => {
      const el = root.querySelector(sel);
      el.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); on(); }, { passive: false });
      el.addEventListener("touchend", (e) => { e.preventDefault(); e.stopPropagation(); off && off(); }, { passive: false });
      el.addEventListener("touchcancel", () => off && off());
    };
    hold(".fire", () => (t.fire = true), () => (t.fire = false));
    hold(".duck", () => (t.duck = true), () => (t.duck = false));
    hold(".jump", () => this.input.down.add(" "), () => this.input.down.delete(" "));
    hold(".reload", () => this.input.pressed.push("r"));
  }

  _bindZones(root) {
    const t = this.input.touch;
    const isBtn = (el) => el && el.classList && el.classList.contains("tbtn");
    root.addEventListener("touchstart", (e) => {
      for (const tc of e.changedTouches) {
        if (isBtn(tc.target)) continue;
        // left half grabs the FIXED joystick (relative to its anchored base center)
        if (tc.clientX < window.innerWidth * 0.5 && this.joyId === null) {
          this.joyId = tc.identifier;
          const r = this.joy.getBoundingClientRect();
          this.baseC = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          this._moveJoy(tc.clientX, tc.clientY);
        } else if (this.lookId === null) {
          this.lookId = tc.identifier; this.lookLast = { x: tc.clientX, y: tc.clientY };
          this._hideLookHint();
        }
      }
    }, { passive: true });

    root.addEventListener("touchmove", (e) => {
      for (const tc of e.changedTouches) {
        if (tc.identifier === this.joyId) {
          this._moveJoy(tc.clientX, tc.clientY);
        } else if (tc.identifier === this.lookId) {
          t.lookDX += (tc.clientX - this.lookLast.x) * 2.2;
          t.lookDY += (tc.clientY - this.lookLast.y) * 2.2;
          this.lookLast = { x: tc.clientX, y: tc.clientY };
        }
      }
    }, { passive: true });

    const end = (e) => {
      for (const tc of e.changedTouches) {
        if (tc.identifier === this.joyId) {
          this.joyId = null; t.mx = 0; t.mz = 0;
          this.knob.style.left = this.C + "px"; this.knob.style.top = this.C + "px";
        } else if (tc.identifier === this.lookId) { this.lookId = null; }
      }
    };
    root.addEventListener("touchend", end, { passive: true });
    root.addEventListener("touchcancel", end, { passive: true });
  }
}
