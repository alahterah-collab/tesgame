const BLOCKED_KEYS = new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { dx:0, dy:0, down:false, leftPressed:false };
    this.pointerLocked = false;
    this.enabled = true;
    this.keyPressed = new Set();
    this._onKeyDown = (event) => {
      if (BLOCKED_KEYS.has(event.code)) event.preventDefault();
      if (!this.keys.has(event.code)) this.keyPressed.add(event.code);
      this.keys.add(event.code);
      if (event.repeat && ['KeyI','KeyJ','KeyM','KeyC','Escape'].includes(event.code)) return;
    };
    this._onKeyUp = (event) => { this.keys.delete(event.code); };
    this._onMouseMove = (event) => {
      if (this.pointerLocked && this.enabled) {
        this.mouse.dx += event.movementX || 0;
        this.mouse.dy += event.movementY || 0;
      }
    };
    this._onMouseDown = (event) => {
      if (event.button===0) { this.mouse.down=true; this.mouse.leftPressed=true; }
    };
    this._onMouseUp = (event) => { if (event.button===0) this.mouse.down=false; };
    this._onLockChange = () => { this.pointerLocked = document.pointerLockElement === this.canvas; };
    window.addEventListener('keydown',this._onKeyDown,{passive:false});
    window.addEventListener('keyup',this._onKeyUp);
    window.addEventListener('mousemove',this._onMouseMove);
    window.addEventListener('mousedown',this._onMouseDown);
    window.addEventListener('mouseup',this._onMouseUp);
    document.addEventListener('pointerlockchange',this._onLockChange);
    window.addEventListener('blur',()=>{ this.keys.clear(); this.mouse.down=false; });
  }
  isDown(code) { return this.enabled && this.keys.has(code); }
  wasPressed(code) { const found=this.keyPressed.has(code); this.keyPressed.delete(code); return found; }
  consumeMouseDelta() { const delta={dx:this.mouse.dx,dy:this.mouse.dy};this.mouse.dx=0;this.mouse.dy=0;return delta; }
  consumeLeftClick() { const result=this.mouse.leftPressed;this.mouse.leftPressed=false;return result; }
  lock() { if (this.canvas?.requestPointerLock) this.canvas.requestPointerLock(); }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
  clearTransient() { this.keyPressed.clear();this.mouse.leftPressed=false;this.mouse.dx=0;this.mouse.dy=0; }
  destroy() {
    window.removeEventListener('keydown',this._onKeyDown);window.removeEventListener('keyup',this._onKeyUp);
    window.removeEventListener('mousemove',this._onMouseMove);window.removeEventListener('mousedown',this._onMouseDown);window.removeEventListener('mouseup',this._onMouseUp);
    document.removeEventListener('pointerlockchange',this._onLockChange);
  }
}
