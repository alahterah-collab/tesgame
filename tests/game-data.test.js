import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASSES } from '../js/data/classes.js';
import { ENEMY_TYPES } from '../js/data/enemies.js';
import { ITEMS, SHOP_STOCK, createDropForEnemy, itemStats, randomWeapon } from '../js/data/items.js';
import { QUESTS } from '../js/data/quests.js';

test('classes have unique ids and playable baseline statistics', () => {
  const classes = Object.values(CLASSES);
  assert.equal(classes.length, 3);
  assert.equal(new Set(classes.map(c => c.id)).size, classes.length);
  for (const c of classes) {
    assert.ok(c.maxHp >= 80, `${c.name} should have usable vitality`);
    assert.ok(c.maxMp >= 45, `${c.name} should have usable mana`);
    assert.ok(c.moveSpeed > 0);
    assert.ok(c.staminaRegen > 0);
  }
});

test('shop contains ten unique and defined products', () => {
  assert.equal(SHOP_STOCK.length, 10);
  assert.equal(new Set(SHOP_STOCK).size, 10);
  for (const id of SHOP_STOCK) {
    assert.ok(ITEMS[id], `Shop item ${id} must exist`);
    assert.ok(Number.isFinite(ITEMS[id].price));
    assert.ok(ITEMS[id].price >= 0);
  }
});

test('enemy definitions have combat values and known loot tables', () => {
  assert.ok(Object.keys(ENEMY_TYPES).length >= 3);
  for (const enemy of Object.values(ENEMY_TYPES)) {
    assert.ok(enemy.hp > 0);
    assert.ok(enemy.attack > 0);
    assert.ok(enemy.xp > 0);
    assert.equal(enemy.gold.length, 2);
  }
  for (const type of Object.keys(ENEMY_TYPES)) {
    for (const roll of [0, .2, .51, .8, .99]) {
      assert.ok(ITEMS[createDropForEnemy(type, () => roll)], `Unknown drop for ${type} at ${roll}`);
    }
  }
});

test('quest definitions use unique ids and valid reward items', () => {
  const quests = Object.values(QUESTS);
  assert.equal(new Set(quests.map(q => q.id)).size, quests.length);
  for (const quest of quests) {
    assert.ok(quest.objectives.length > 0);
    assert.ok(quest.objectives.every(o => o.required > 0 && o.id && o.event));
    for (const item of quest.rewards.items || []) assert.ok(ITEMS[item.id], `Unknown quest reward: ${item.id}`);
  }
});

test('item stat formatting and weighted random weapon table are valid', () => {
  assert.match(itemStats(ITEMS.moonveil), /ATK \+25/);
  for (const roll of [0, .1, .51, .82, .97, .999]) {
    const id = randomWeapon(() => roll);
    assert.ok(ITEMS[id] && ITEMS[id].type === 'weapon');
  }
});
