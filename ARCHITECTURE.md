# Technical architecture

## Runtime layers

- **Application bootstrap (`js/main.js`)** creates the game and handles startup failure messaging.
- **Core runtime (`js/core/`)** owns the renderer/game loop, input, player, world, audio and persistence.
- **Gameplay systems (`js/systems/`)** own combat, interaction, inventory/equipment and quests.
- **Data (`js/data/`)** defines classes, items, enemies and quests as static definitions separated from runtime logic.
- **UI (`js/ui/`)** renders the HUD, target/quest tracker, minimap, modal panels, inventory, shop, character sheet, quest journal and settings.
- **Presentation (`css/`)** separates base components, HUD layout, system panels and visual effects.
- **Assets (`public/assets/textures/`)** stores local surface maps. They are not fetched from a third-party asset URL at runtime.

## Data flow

Input manager records keyboard/mouse state. The game loop passes bounded frame delta to Player, CombatSystem, InteractionSystem, World and UIController. Combat mutations call inventory/quest/save interfaces. Persistence serializes a versioned snapshot to browser localStorage; the world renderer does not own game-economy rules.

## Performance choices

- Instanced meshes reduce draw calls for repeated trees, grass blades, flowers and rocks.
- Shadow quality and renderer pixel ratio are adjustable.
- Texture filtering uses mipmapping and anisotropy capped by hardware capability.
- Audio effects are synthesized using the Web Audio API instead of many individual audio files.
- Terrain/foliage are procedurally placed to keep the bundle self-contained while maintaining variability.

## Build/deploy

Vite resolves the pinned `three` dependency and builds to `dist/`. The public assets directory is copied as-is. Relative URLs keep the project suitable for root deployment and Vercel static hosting after the Vite build.
