const SAVE_KEY = 'aetherion-online-save-v1';

export class Persistence {
  constructor() { this.available=true; }
  load() {
    try { const value=localStorage.getItem(SAVE_KEY);return value?JSON.parse(value):null; }
    catch(error) { this.available=false;console.warn('Aetherion save unavailable',error);return null; }
  }
  save(snapshot) {
    try { localStorage.setItem(SAVE_KEY,JSON.stringify({...snapshot,saveVersion:1,savedAt:new Date().toISOString()}));this.available=true;return true; }
    catch(error) { this.available=false;console.warn('Aetherion save failed',error);return false; }
  }
  hasSave() { return Boolean(this.load()); }
  clear() { try { localStorage.removeItem(SAVE_KEY);return true; } catch { return false; } }
}
