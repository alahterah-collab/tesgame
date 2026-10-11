import { Game } from './core/Game.js';

const boot = async () => {
  const status=document.getElementById('loading-status');
  try {
    const game=new Game();
    window.AETHERION_GAME=game;
    await game.init();
    if(status)status.textContent='Dunia siap. Selamat datang di Aetherion.';
  } catch (error) {
    console.error('Aetherion failed to initialize:',error);
    if(status)status.textContent='Gagal memuat game. Coba gunakan Chrome/Edge terbaru dan jalankan melalui web server.';
  }
};
boot();

if ('serviceWorker' in navigator && location.protocol === 'https:' && !['localhost','127.0.0.1'].includes(location.hostname)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Aetherion offline cache unavailable:', error)));
}
