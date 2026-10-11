import { ITEMS, randomWeapon } from '../data/items.js';

export class InventorySystem {
  constructor(game) {
    this.game=game;this.capacity=28;this.items=[];this.equipment={weapon:'aetheredge',armor:null};this.selectedUid=null;
    this.add('aetheredge',1);this.equip('aetheredge',false);this.add('health_potion',3);this.add('mana_potion',2);this.add('moss_core',1);
  }
  getItem(definitionId) { return ITEMS[definitionId]||null; }
  count(itemId) { return this.items.filter(entry=>entry.itemId===itemId).reduce((sum,entry)=>sum+entry.quantity,0); }
  all() { return this.items.map(entry=>({...entry,definition:ITEMS[entry.itemId]})).filter(entry=>entry.definition); }
  slotsUsed() { return this.items.length; }
  add(itemId,quantity=1,notify=true) {
    const def=ITEMS[itemId];if(!def||quantity<=0)return false;
    if(def.stackable){const existing=this.items.find(entry=>entry.itemId===itemId);if(existing){existing.quantity+=quantity;this._changed();if(notify)this.game.ui?.toast(`+${quantity} ${def.name}`,'success');return true;}}
    if(this.items.length>=this.capacity){this.game.ui?.toast('Inventory penuh!','danger');return false;}
    const entry={uid:`it_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,itemId,quantity};this.items.push(entry);this.selectedUid=entry.uid;this._changed();if(notify)this.game.ui?.toast(`Diperoleh: ${def.name}`,'success');return true;
  }
  remove(itemId,quantity=1) {
    let need=quantity;
    for(let i=this.items.length-1;i>=0&&need>0;i--){const entry=this.items[i];if(entry.itemId!==itemId)continue;const take=Math.min(entry.quantity,need);entry.quantity-=take;need-=take;if(entry.quantity<=0){if(this.selectedUid===entry.uid)this.selectedUid=null;this.items.splice(i,1);}}
    const removed=need===0;if(removed)this._changed();return removed;
  }
  equip(itemId,notify=true) {
    const def=ITEMS[itemId];if(!def||!def.slot||!this.items.some(entry=>entry.itemId===itemId))return false;
    this.equipment[def.slot]=itemId;this.game.player?.refreshEquipment();this._changed();if(notify){this.game.audio.play('equip');this.game.ui.toast(`${def.name} dipasang`,'success');}return true;
  }
  selected() { return this.items.find(entry=>entry.uid===this.selectedUid)||this.items[0]||null; }
  select(uid) { this.selectedUid=uid;this.game.ui?.renderInventory(); }
  use(itemId) {
    const def=ITEMS[itemId];if(!def||def.type!=='consumable'||this.count(itemId)<=0)return false;
    const stats=this.game.state;
    if(def.heal&&stats.hp>=stats.maxHp){this.game.ui.toast('Vitality masih penuh.','info');return false;}
    if(def.mana&&stats.mp>=stats.maxMp){this.game.ui.toast('Mana masih penuh.','info');return false;}
    if(def.stamina&&stats.stamina>=stats.maxStamina){this.game.ui.toast('Stamina masih penuh.','info');return false;}
    this.remove(itemId,1);
    if(def.heal){stats.hp=Math.min(stats.maxHp,stats.hp+def.heal);this.game.ui.floatText(`+${def.heal} HP`,true);}
    if(def.mana){stats.mp=Math.min(stats.maxMp,stats.mp+def.mana);this.game.ui.floatText(`+${def.mana} MANA`,true);}
    if(def.stamina){stats.stamina=Math.min(stats.maxStamina,stats.stamina+def.stamina);this.game.ui.floatText(`+${def.stamina} STAMINA`,true);}
    this.game.audio.play('pickup');this.game.ui.updateHUD();this.game.save();return true;
  }
  buy(itemId) {
    const def=ITEMS[itemId];if(!def)return false;
    if(this.game.state.gold<def.price){this.game.ui.toast('Gold tidak cukup.','danger');this.game.audio.play('error');return false;}
    if(!def.stackable&&this.items.some(entry=>entry.itemId===itemId)){this.game.ui.toast('Kamu sudah memiliki item ini.','info');return false;}
    const canStack=Boolean(def.stackable&&this.items.some(entry=>entry.itemId===itemId));
    if(this.slotsUsed()>=this.capacity&&!canStack){this.game.ui.toast('Tidak ada slot kosong.','danger');return false;}
    this.game.state.gold-=def.price;const added=this.add(itemId,1,false);if(!added){this.game.state.gold+=def.price;return false;}
    this.game.audio.play('buy');this.game.ui.toast(`${def.name} berhasil dibeli.`,'success');this.game.ui.updateHUD();this.game.save();return true;
  }
  sell(uid) {
    const entry=this.items.find(e=>e.uid===uid);const def=entry&&ITEMS[entry.itemId];if(!entry||!def||def.starter||def.type==='quest')return false;
    const value=Math.max(1,Math.round((def.price||0)*.38));if(!this.remove(entry.itemId,1))return false;
    this.game.state.gold+=value;this.game.ui.toast(`${def.name} dijual · +${value} Gold`,'success');this.game.ui.updateHUD();this.game.save();return true;
  }
  randomRewardWeapon() { const id=randomWeapon();this.add(id,1,false);this.game.ui.toast(`Hadiah senjata: ${ITEMS[id].name}`,'success');return id; }
  getWeapon() { return ITEMS[this.equipment.weapon]||ITEMS.aetheredge; }
  getArmor() { return this.equipment.armor?ITEMS[this.equipment.armor]:null; }
  getAttack() { return 8+(this.getWeapon()?.atk||0)+(this.game.state.atkBonus||0)+(this.game.state.bonusAtk||0); }
  getDefense() { return 2+(this.getArmor()?.def||0)+(this.game.state.defBonus||0)+(this.game.state.bonusDef||0); }
  snapshot() { return {items:this.items.map(e=>({...e})),equipment:{...this.equipment},selectedUid:this.selectedUid}; }
  restore(data) {
    if(!data)return;this.items=Array.isArray(data.items)?data.items.filter(e=>ITEMS[e.itemId]).map(e=>({...e})).slice(0,this.capacity):this.items;
    this.equipment={weapon:'aetheredge',armor:null,...data.equipment};this.selectedUid=data.selectedUid||this.items[0]?.uid||null;
    if(!this.items.some(e=>e.itemId===this.equipment.weapon))this.equipment.weapon='aetheredge';
    if(this.equipment.armor&&!this.items.some(e=>e.itemId===this.equipment.armor))this.equipment.armor=null;
    this.game.player?.refreshEquipment();
  }
  _changed() { this.game.ui?.updateHUD();if(this.game.ui?.activePanel==='inventory')this.game.ui.renderInventory();if(this.game.ui?.activePanel==='character')this.game.ui.renderCharacter();this.game.player?.refreshEquipment(); }
}
