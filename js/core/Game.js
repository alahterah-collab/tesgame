import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { AudioSystem } from './AudioSystem.js';
import { Persistence } from './Persistence.js';
import { World } from './World.js';
import { Player } from './Player.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { UIController } from '../ui/UIController.js';
import { CLASSES } from '../data/classes.js';

const defaultState=()=>({characterName:'ARIN VALE',characterClass:'Blade Warden',classId:'blade-warden',atkBonus:2,defBonus:3,magicMultiplier:1,level:1,xp:0,xpToNext:120,gold:250,hp:100,maxHp:100,mp:60,maxMp:60,stamina:100,maxStamina:100,critChance:8,moveSpeed:6.2,bonusAtk:0,bonusDef:0,kills:0});

export class Game {
  constructor(){
    this.host=document.getElementById('render-host');this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,.1,550);this.camera.position.set(0,4,18);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.canvas=this.renderer.domElement;this.renderer.domElement.id='world-canvas';this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('aria-label','Klik untuk mengunci kamera dan mulai bermain');this.host.appendChild(this.renderer.domElement);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));this.renderer.setSize(window.innerWidth,window.innerHeight);this.renderer.domElement.style.touchAction='none';
    this.settings={quality:'high',volume:.55,sensitivity:.0022,reducedMotion:false};this.state=defaultState();this.pendingClassId='blade-warden';this.persistence=new Persistence();this.audio=new AudioSystem();this.input=new InputManager(this.renderer.domElement);this.world=new World(this);
    this.started=false;this.paused=false;this.isDead=false;this.time=0;this.delta=0;this.lastFrame=performance.now();this.autosaveTimer=0;this.hintDismissed=false;this._bindWindow();
  }
  async init(){
    this.ui=new UIController(this);this.ui.setLoading(1,'Menyiapkan Astral Network');
    try{
      await this.world.build((pct,msg)=>this.ui.setLoading(8+pct*.82,msg));
      this.player=new Player(this);this.inventory=new InventorySystem(this);this.quests=new QuestSystem(this);this.combat=new CombatSystem(this);this.interactions=new InteractionSystem(this);this.combat.spawnInitial();
      this.ui.updateHUD();this.ui.refreshQuestTracker();this.applyQuality();this.ui.hideLoading();this.ui.showTitle();this.renderer.setAnimationLoop((time)=>this._frame(time));
    }catch(error){console.error(error);this.ui.showFatal(error);throw error;}
    return this;
  }
  _bindWindow(){
    window.addEventListener('resize',()=>{this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(window.innerWidth,window.innerHeight);this.applyQuality();});
    this.renderer.domElement.addEventListener('webglcontextlost',(e)=>{e.preventDefault();this.ui?.toast('WebGL context lost. Kurangi kualitas grafis dan muat ulang.','danger',5000);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.started&&!this.paused&&!this.ui?.modalOpen){this.paused=true;this.input.unlock();this.ui?.pauseOverlay.classList.remove('hidden');}});
  }
  _frame(now){
    this.delta=Math.min(.05,Math.max(0,(now-this.lastFrame)/1000));this.lastFrame=now;this.time+=this.delta;
    try{
      if(this.started&&!this.paused&&!this.ui.modalOpen)this._processInput();
      if(this.player)this.player.update(this.delta);
      if(this.combat)this.combat.update(this.delta);
      if(this.interactions)this.interactions.update(this.delta);
      if(this.world)this.world.update(this.delta,this.time);
      if(this.started&&!this.paused&&!this.ui.modalOpen&&!this.isDead){this.state.mp=Math.min(this.state.maxMp,this.state.mp+2.8*this.delta);this.autosaveTimer+=this.delta;if(this.autosaveTimer>18){this.autosaveTimer=0;this.save(false);}}
      this.ui?.update(this.delta);this.renderer.render(this.scene,this.camera);
    }catch(error){console.error('Aetherion frame error:',error);if(!this.frameErrorShown){this.frameErrorShown=true;this.ui?.toast('Ada kesalahan pada frame game. Coba turunkan kualitas grafis.','danger',5000);}}
  }
  _processInput(){
    const input=this.input;
    if(input.wasPressed('KeyQ'))this.triggerAction('slash');
    if(input.wasPressed('KeyE'))this.triggerAction('fireball');
    if(input.wasPressed('KeyR'))this.triggerAction('dash');
    if(input.wasPressed('KeyT'))this.triggerAction('arcane');
    if(input.wasPressed('Digit1'))this.triggerAction('healthPotion');
    if(input.wasPressed('Digit2'))this.triggerAction('manaPotion');
    if(input.wasPressed('KeyI'))this.ui.openPanel('inventory');
    if(input.wasPressed('KeyC'))this.ui.openPanel('character');
    if(input.wasPressed('KeyJ'))this.ui.openPanel('quests');
    if(input.wasPressed('KeyM'))this.ui.openPanel('map');
    if(input.wasPressed('KeyK'))this.ui.openPanel('skills');
    if(input.wasPressed('KeyB'))this.ui.openPanel('shop');
  }
  triggerAction(action){
    if(!this.started||this.paused||this.ui.modalOpen||this.isDead)return false;this.audio.ensure();
    switch(action){case 'attack':return this.combat.basicAttack();case 'slash':return this.combat.castSlash();case 'fireball':return this.combat.castFireball();case 'dash':return this.player.dash();case 'arcane':return this.combat.castArcane();case 'healthPotion':return this.inventory.use('health_potion');case 'manaPotion':return this.inventory.use('mana_potion');case 'staminaPotion':return this.inventory.use('stamina_potion');default:return false;}
  }
  applyClass(classId, refill=true){const profile=CLASSES[classId]||CLASSES['blade-warden'];this.state.classId=profile.id;this.state.characterClass=profile.name;this.state.maxHp=profile.maxHp;this.state.maxMp=profile.maxMp;this.state.maxStamina=profile.maxStamina;this.state.atkBonus=profile.atkBonus;this.state.defBonus=profile.defBonus;this.state.moveSpeed=profile.moveSpeed;this.state.critChance=profile.critChance;this.state.magicMultiplier=profile.magicMultiplier;this.state.staminaRegen=profile.staminaRegen;if(refill){this.state.hp=this.state.maxHp;this.state.mp=this.state.maxMp;this.state.stamina=this.state.maxStamina;}if(this.player){this.player.moveSpeed=profile.moveSpeed;this.player.sprintSpeed=profile.moveSpeed*1.5;}this.ui?.updateHUD();}
  gainXP(amount){if(!amount)return;this.state.xp+=amount;let leveled=false;while(this.state.xp>=this.state.xpToNext){this.state.xp-=this.state.xpToNext;this.state.level++;this.state.xpToNext=Math.round(this.state.xpToNext*1.24+30);this.state.maxHp+=12;this.state.maxMp+=7;this.state.hp=this.state.maxHp;this.state.mp=this.state.maxMp;leveled=true;}if(leveled){this.audio.play('level');this.ui.toast(`LEVEL UP · LEVEL ${this.state.level}`,'success',2400);}this.ui.updateHUD();this.save(false);}
  handlePlayerDeath(){if(this.isDead)return;this.isDead=true;this.audio.play('death');this.state.gold=Math.floor(this.state.gold*.9);this.ui.showDeath();this.save();}
  revivePlayer(){this.isDead=false;this.state.hp=Math.max(35,Math.floor(this.state.maxHp*.7));this.state.mp=Math.max(20,Math.floor(this.state.maxMp*.6));this.state.stamina=this.state.maxStamina;this.player.root.position.set(0,this.world.terrainHeight(0,11),11);this.player.model.rotation.y=0;this.player.invuln=2.2;this.started=true;this.paused=false;this.ui.gameUI.classList.remove('hidden');this.ui.pauseOverlay.classList.add('hidden');this.ui.updateHUD();this.ui.toast('Kembali ke Luminara. Perkuat gear sebelum hunt berikutnya.','info',2500);this.save();this.input.enabled=true;this.input.lock();}
  applyQuality(){
    const quality=this.settings.quality||'high';const map={low:{pixel:0.8,shadow:512,enabled:false},medium:{pixel:1.0,shadow:1024,enabled:true},high:{pixel:1.4,shadow:2048,enabled:true},ultra:{pixel:1.85,shadow:3072,enabled:true}}[quality]||{pixel:1.3,shadow:2048,enabled:true};
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,map.pixel));this.renderer.setSize(window.innerWidth,window.innerHeight);this.renderer.shadowMap.enabled=map.enabled;if(this.world?.sun){this.world.sun.castShadow=map.enabled;this.world.sun.shadow.mapSize.set(map.shadow,map.shadow);this.world.sun.shadow.needsUpdate=true;}if(this.world?.grassMesh&&quality==='low')this.world.grassMesh.visible=false;else if(this.world?.grassMesh)this.world.grassMesh.visible=true;
  }
  save(notify=false){if(!this.player||!this.inventory||!this.quests)return false;const snapshot={state:{...this.state},position:{x:this.player.root.position.x,y:this.player.root.position.y,z:this.player.root.position.z,yaw:this.player.model.rotation.y},inventory:this.inventory.snapshot(),quests:this.quests.snapshot(),settings:{...this.settings}};const ok=this.persistence.save(snapshot);if(notify)this.ui.toast(ok?'Progress tersimpan di browser.':'Save gagal; penyimpanan browser mungkin penuh.','info');return ok;}
  load(){const data=this.persistence.load();if(!data)return false;if(data.state)this.state={...defaultState(),...data.state};this.pendingClassId=this.state.classId||'blade-warden';if(data.settings)this.settings={...this.settings,...data.settings};this.inventory.restore(data.inventory);this.quests.restore(data.quests);if(data.position){const p=data.position;this.player.root.position.set(p.x,this.world.terrainHeight(p.x,p.z),p.z);this.player.model.rotation.y=Number(p.yaw)||0;}this.player.moveSpeed=this.state.moveSpeed||6.2;this.player.sprintSpeed=this.player.moveSpeed*1.5;this.player.refreshEquipment();this.applyQuality();this.ui.updateHUD();this.ui.refreshQuestTracker();return true;}
  resetNewGame(classId=this.pendingClassId||'blade-warden'){this.state=defaultState();this.applyClass(classId,true);this.inventory.items=[];this.inventory.equipment={weapon:'aetheredge',armor:null};this.inventory.add('aetheredge',1,false);this.inventory.add('health_potion',3,false);this.inventory.add('mana_potion',2,false);this.inventory.add('moss_core',1,false);this.inventory.equip('aetheredge',false);for(const q of Object.values(this.quests.quests)){q.state='active';q.tracked=q.id==='first_song';for(const key of Object.keys(q.objectives))q.objectives[key]=0;}this.player.root.position.set(0,this.world.terrainHeight(0,11),11);this.player.model.rotation.y=0;this.isDead=false;this.save();this.ui.updateHUD();this.ui.refreshQuestTracker();}
}
