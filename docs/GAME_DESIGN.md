# Aetherion Online — Skybound Chronicles

## Product pillar

Aetherion is an original anime-fantasy action RPG about an adventurer joining an astral guild on a chain of floating continents. The experience combines readable action combat, gathering and equipment progression, discovery-focused exploration, and a deliberate “one more hunt” reward loop.

## Core loop

1. Visit Luminara's guild plaza and accept a contract.
2. Prepare weapon, armor and consumables at the quartermaster.
3. Traverse the meadow, forest, lake and ruins.
4. Fight hostile creatures using light attacks and Sword Arts.
5. Collect gold, materials, rare drops and quest items.
6. Return to a landmark, claim rewards, upgrade gear, and prepare for the next contract.

## Player archetypes

- **Blade Warden** — stable frontline sword fighter with reliable vitality and defense.
- **Spellblade** — hybrid weapon/magic user with increased mana and stronger spell scaling.
- **Wind Ranger** — mobile archetype with high stamina, movement and critical potential.

## Combat readability

- Attack animations communicate startup, active hit and recovery.
- Aether Slash travels forward and can hit multiple enemies in its lane.
- Solar Flare creates an area impact and a short-lived burning zone.
- Phantom Step is a mobility action with cooldown and stamina cost.
- Arcane Bolt provides a ranged option, with audio cues and hit feedback.
- Enemies use different silhouettes, range, speed, attack cadence and aggro distance.

## World landmarks

- **Luminara Plaza** — safe starting point, guild, quartermaster and cartographer.
- **Outer Meadows** — early combat and first contracts.
- **Mirrorfall Lake** — scenic landmark and exploration objective.
- **Shrine of the First Light** — old astral structure containing exploration lore.
- **Skygate** — expedition interface and narrative destination.
- **Sky islands** — visible distant world-building and future expansion hooks.

## Reward systems

- XP feeds character level; level-ups raise basic survivability.
- Gold purchases equipment and field supplies.
- Item rarity affects UI and weapon appearance.
- Material drops support contracts and gathering quests.
- Quest rewards may include XP, gold, consumables, and weighted random weapons.
- Local saving preserves character, location, inventory, quests and settings.

## Current vertical slice scope

This repository is a client-only single-player vertical slice. It includes the world, combat, loot, equipment, quests, audio cues, UI panels and local save. It does **not** currently include live multiplayer, real-time server authority, account service, matchmaking, persistent cloud database, anti-cheat, monetization, moderation, or live-operation tooling. Those features require backend services and separate security/gameplay engineering.

## Next milestones

1. **Content pass:** more enemy archetypes, multi-stage dungeons, boss encounters and dialogue trees.
2. **Animation pass:** imported glTF rigged characters with locomotion blend trees and weapon-specific action animation.
3. **World streaming:** chunked terrain, biome boundaries, asset LOD and spawn directors.
4. **Production assets:** authored environment kits, VFX spritesheets, weapon icons and original character concept art.
5. **Backend:** account auth, server-authoritative simulation, persistent characters, inventory transaction validation and party instances.
6. **QA/performance:** repeatable functional tests, WebGL GPU profiling, device-quality presets and input/accessibility testing.
