# Aetherion Online — Skybound Chronicles

Proyek game browser 3D modular bergenre anime-fantasy action RPG. Ini adalah **vertical slice single-player**, bukan MMORPG multiplayer live-service. Struktur proyek sengaja dipisahkan seperti proyek game sungguhan: core runtime, input, audio, persistence, world, player, combat, quests, inventory, interaction, UI, data, CSS, dan tekstur lokal.

## Fitur utama

- Dunia 3D open-world bergaya fantasy dengan Three.js, terrain prosedural, PBR ground materials, pepohonan, rumput instanced, danau, reruntuhan, village, NPC, dan landmark.
- Third-person controller, kamera orbit/pointer lock, sprint, jump, dodge, basic sword combo, Slash, Fireball, Arcane Bolt.
- Enemy AI untuk Mossfang, Aether Wisp, dan variasi musuh lainnya; aggro, chase, attack, hit flash, loot drop.
- Inventory, equipment, rarity, random drops, shop, consumables, class selection, XP/level, quest claim, minimap/map, settings, local save.
- Audio effects procedural via Web Audio (tidak perlu download sound files terpisah).
- 17 tekstur WebP resolusi tinggi disimpan di `public/assets/textures/`, termasuk albedo, normal, dan roughness maps.
- Reduced motion, graphics quality presets, save lokal, UI yang responsif untuk layar yang cukup lebar.

## Jalankan secara lokal

Memerlukan Node.js 20.19+ atau 22.12+ (persyaratan Vite 8).

```bash
npm install
npm run dev
```

Buka URL local yang ditampilkan Vite (biasanya `http://localhost:5173`). Jangan membuka `index.html` lewat `file://`, karena browser membatasi ES modules dan aset lintas origin.

## Build produksi

```bash
npm run build
npm run preview
```

Folder hasil produksi adalah `dist/`.

## Deployment ke Vercel

1. Push seluruh folder proyek ke repository GitHub.
2. Import repository ke Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy. Aset lokal dari `public/assets` otomatis disalin ke output.

## Kontrol

| Tombol | Aksi |
|---|---|
| `W A S D` | Bergerak |
| Mouse | Mengubah arah kamera |
| `Shift` | Sprint |
| `Space` | Lompat |
| Klik kiri | Basic attack |
| `Q` | Aether Slash |
| `E` | Solar Flare / Fireball |
| `R` | Phantom Step / dash |
| `T` | Arcane Bolt |
| `1` / `2` | Health / Mana Potion |
| `F` | Interaksi, pickup, NPC |
| `I` | Inventory |
| `C` | Character |
| `J` | Quest journal |
| `M` | Map |
| `K` | Skills |
| `B` | Shop |
| `Esc` | Pause / release mouse |

## Arsitektur

- `js/main.js` — application bootstrap.
- `js/core/` — game loop, world, player controller, input, audio, persistence.
- `js/systems/` — combat, interaction, inventory, quests.
- `js/ui/` — HUD, menus, panels, shop, inventory, journal, settings.
- `js/data/` — item, enemy, class, quest definitions.
- `css/` — base styles, HUD, panels, visual effects.
- `public/assets/textures/` — local PBR textures.

## Catatan teknis

Three.js dipakai sebagai renderer 3D WebGL melalui ES module. `three` dikunci pada versi 0.170.0 di `package.json`; Vite membundel dependency pada build produksi. Model karakter dan musuh saat ini merupakan geometri prosedural, bukan asset skeletal/animation rig kelas studio. Multiplayer server-authoritative, akun lintas perangkat, matchmaking, backend persistence, anti-cheat, dan live operations belum diimplementasikan. Save game saat ini disimpan secara lokal di browser.
