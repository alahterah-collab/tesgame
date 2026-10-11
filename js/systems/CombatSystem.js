import * as THREE from 'three';
import { ENEMY_TYPES } from '../data/enemies.js';
import { createDropForEnemy, ITEMS } from '../data/items.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,t)=>a+(b-a)*t;

export class CombatSystem {
  constructor(game){this.game=game;this.enemies=[];this.projectiles=[];this.slashWaves=[];this.firePatches=[];this.lootEntities=[];this.cooldowns={basic:0,slash:0,fireball:0,arcane:0};this.target=null;this.mobSerial=0;this.hitSet=new Set();}
  spawnInitial(){
    const points=[[-7,-29,'mossfang'],[7,-32,'mossfang'],[-8,-40,'mossfang'],[9,-44,'mossfang'],[14,-53,'aether-wisp'],[-12,-54,'aether-wisp'],[49,-21,'mossfang'],[52,-48,'aether-wisp'],[-46,-49,'mossfang'],[-43,-60,'aether-wisp']];
    points.forEach(([x,z,type])=>this.spawnEnemy(type,x,z));
  }
  spawnEnemy(typeId,x,z){
    const def=ENEMY_TYPES[typeId];if(!def)return null;const group=new THREE.Group();group.position.set(x,this.game.world.terrainHeight(x,z),z);group.name=`Enemy ${def.name}`;this.game.scene.add(group);
    const material=(color,roughness=.72,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
    const mesh=(geo,mat,parent=group,cast=true,receive=true)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=receive;(parent||group).add(m);return m;};
    const baseMat=material(def.color,.78,.06),darkMat=material(0x21313a,.64,.1),glowMat=material(def.glow,.28,.15,{emissive:def.glow,emissiveIntensity:1.1}),eyeMat=new THREE.MeshBasicMaterial({color:typeId==='mossfang'?0xffb4a1:0xc9f8ff});
    const enemy={id:`mob_${++this.mobSerial}`,type:typeId,definition:def,group,hp:def.hp,maxHp:def.hp,dead:false,attackTimer:1+Math.random(),hitFlash:0,phase:Math.random()*6.28,legs:[],baseY:group.position.y,lootRoll:false};
    if(typeId==='mossfang'||typeId==='ruin-sentinel'){
      if(typeId==='mossfang'){
        const torso=mesh(new THREE.CapsuleGeometry(.38,.5,4,8),baseMat);torso.position.set(0,.64,0);torso.rotation.x=Math.PI/2;torso.scale.set(1,.9,.75);
        const neck=mesh(new THREE.CapsuleGeometry(.2,.34,3,7),darkMat);neck.position.set(0,.82,-.32);neck.rotation.x=-.25;
        const head=mesh(new THREE.SphereGeometry(.29,12,10),baseMat);head.position.set(0,.98,-.5);head.scale.set(1,.8,1.1);
        const muzzle=mesh(new THREE.ConeGeometry(.16,.32,7),darkMat);muzzle.position.set(0,.88,-.78);muzzle.rotation.x=-Math.PI/2;
        for(const sx of [-1,1]){const ear=mesh(new THREE.ConeGeometry(.095,.25,5),baseMat);ear.position.set(sx*.19,1.23,-.49);ear.rotation.z=-sx*.26;const eye=mesh(new THREE.SphereGeometry(.042,7,6),eyeMat,null,false,false);eye.position.set(sx*.15,1.02,-.74);const brow=mesh(new THREE.BoxGeometry(.12,.04,.06),darkMat);brow.position.set(sx*.14,1.1,-.72);}
        for(const sx of [-1,1])for(const sz of [-1,1]){const leg=new THREE.Group();leg.position.set(sx*.23,.57,sz*.3);group.add(leg);const upper=mesh(new THREE.CapsuleGeometry(.095,.29,3,6),darkMat,leg);upper.position.y=-.13;const paw=mesh(new THREE.SphereGeometry(.12,7,6),baseMat,leg);paw.position.set(0,-.34,-.02);enemy.legs.push({leg,sx,sz});}
        const tail=mesh(new THREE.CapsuleGeometry(.075,.43,3,6),baseMat);tail.position.set(0,.77,.43);tail.rotation.x=-.82;tail.rotation.z=.15;
        for(let i=0;i<4;i++){const spike=mesh(new THREE.ConeGeometry(.09,.25,5),darkMat);spike.position.set((i-1.5)*.14,1.08,-.08+(i%2)*.1);spike.rotation.x=.45;}
      }else{
        const torso=mesh(new THREE.BoxGeometry(.86,1.15,.56),baseMat);torso.position.y=1.45;
        const head=mesh(new THREE.DodecahedronGeometry(.42,1),darkMat);head.position.set(0,2.25,-.02);
        for(const sx of [-1,1]){const eye=mesh(new THREE.BoxGeometry(.1,.07,.045),eyeMat,null,false,false);eye.position.set(sx*.14,2.28,-.4);const arm=mesh(new THREE.BoxGeometry(.24,.78,.26),baseMat);arm.position.set(sx*.61,1.43,0);const leg=mesh(new THREE.BoxGeometry(.27,.7,.3),darkMat);leg.position.set(sx*.22,.46,0);enemy.legs.push({leg, sx,sz:1});}
        const rune=mesh(new THREE.OctahedronGeometry(.22,1),glowMat,null,false,false);rune.position.set(0,1.56,-.31);enemy.rune=rune;
      }
    }else{
      const core=mesh(new THREE.IcosahedronGeometry(.48,2),glowMat,null,false,false);core.position.y=1.05;core.scale.set(1,1.2,.9);enemy.core=core;
      const inner=mesh(new THREE.SphereGeometry(.23,16,12),material(0xe2fbff,.18,.05,{emissive:0x69e5ff,emissiveIntensity:2}),null,false,false);inner.position.y=1.05;
      const ring=mesh(new THREE.TorusGeometry(.68,.045,6,36),glowMat,null,false,false);ring.position.y=1.05;ring.rotation.x=.7;enemy.ring=ring;
      for(const sx of [-1,1]){const wing=mesh(new THREE.OctahedronGeometry(.34,1),material(0x7dbed7,.36,.16,{transparent:true,opacity:.72,emissive:0x236b95,emissiveIntensity:.5}),null,false,false);wing.position.set(sx*.48,1.05,.05);wing.scale.set(.38,.95,.2);enemy.wings??=[];enemy.wings.push({mesh:wing,sx});}
      const glow=new THREE.PointLight(def.glow,.65,6);glow.position.y=1.05;group.add(glow);enemy.glow=glow;
    }
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(def.radius*.82,16),new THREE.MeshBasicMaterial({color:0x02080d,transparent:true,opacity:.23,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.035;group.add(shadow);
    enemy.shadow=shadow;enemy.visualParts=group.children.filter(child=>child.isMesh);this.enemies.push(enemy);return enemy;
  }
  getAlive(){return this.enemies.filter(e=>!e.dead);}
  getTarget(){return this.target;}
  _forward(yaw){return new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));}
  _nearestInRange(range,arc=true){const p=this.game.player.root.position,f=this.game.player.forward();let best=null,bestD=range;for(const e of this.enemies){if(e.dead)continue;const dx=e.group.position.x-p.x,dz=e.group.position.z-p.z,d=Math.hypot(dx,dz);if(d>bestD)continue;if(arc&&d>.1&&f.x*(dx/d)+f.z*(dz/d)<.1)continue;best=e;bestD=d;}return best;}
  basicAttack(){
    if(!this.game.started||this.game.paused||this.cooldowns.basic>0||this.game.isDead)return false;this.cooldowns.basic=.48;this.game.player.playAction('attack',.38);this.game.audio.play('sword');
    const player=this.game.player,origin=player.root.position,forward=player.forward();let hitCount=0;const range=3.35+((this.game.inventory.getWeapon()?.atk||0)>30?.2:0);
    for(const e of this.enemies){if(e.dead)continue;const dx=e.group.position.x-origin.x,dz=e.group.position.z-origin.z,d=Math.hypot(dx,dz);if(d>range+e.definition.radius||d<.1)continue;const dot=forward.x*(dx/d)+forward.z*(dz/d);if(dot<.2)continue;let amount=Math.max(3,Math.round(this.game.inventory.getAttack()-e.definition.def));const critical=Math.random()<((this.game.state.critChance??8)/100);if(critical)amount=Math.round(amount*1.75);this.damageEnemy(e,amount,critical,origin);hitCount++;}
    if(!hitCount)this.game.ui.toast('Serangan mengenai udara','info',620);return true;
  }
  castSlash(){
    if(!this.game.started||this.game.paused||this.game.isDead)return false;if(this.cooldowns.slash>0){this.game.ui.cooldownToast('Aether Slash',this.cooldowns.slash);return false;}if(this.game.state.mp<16){this.game.ui.toast('Mana tidak cukup.','danger');this.game.audio.play('error');return false;}
    this.game.state.mp-=16;this.cooldowns.slash=6.2;this.game.player.playAction('slash',.42);this.game.audio.play('slash');this.game.ui.updateHUD();const p=this.game.player,forward=p.forward();
    const group=new THREE.Group();const arcMat=new THREE.MeshBasicMaterial({color:0x8deeff,transparent:true,opacity:.92,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false});const arc=new THREE.Mesh(new THREE.TorusGeometry(1.42,.105,8,42,Math.PI*1.15),arcMat);arc.rotation.z=.25;group.add(arc);
    const inner=new THREE.Mesh(new THREE.TorusGeometry(1.08,.035,5,42,Math.PI*1.1),new THREE.MeshBasicMaterial({color:0xf1ffff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));inner.rotation.z=.25;inner.scale.set(.86,1.05,1);group.add(inner);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(2.9,.075),new THREE.MeshBasicMaterial({color:0x7de7ff,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));plane.position.y=.12;group.add(plane);
    group.position.set(p.root.position.x+forward.x*1.5,p.root.position.y+1.15,p.root.position.z+forward.z*1.5);group.rotation.y=p.model.rotation.y;this.game.scene.add(group);
    const light=new THREE.PointLight(0x56dcff,1.9,5);group.add(light);this.slashWaves.push({group,forward:forward.clone(),life:1.05,travel:0,hit:new Set(),light});this.game.ui.toast('AETHER ART · SLASH','success',900);return true;
  }
  castFireball(){
    if(!this.game.started||this.game.paused||this.game.isDead)return false;if(this.cooldowns.fireball>0){this.game.ui.cooldownToast('Solar Flare',this.cooldowns.fireball);return false;}if(this.game.state.mp<20){this.game.ui.toast('Mana tidak cukup.','danger');this.game.audio.play('error');return false;}
    this.game.state.mp-=20;this.cooldowns.fireball=7.2;this.game.player.playAction('fireball',.38);this.game.audio.play('fireball');this.game.ui.updateHUD();const p=this.game.player,forward=p.forward();const group=new THREE.Group();const core=new THREE.Mesh(new THREE.SphereGeometry(.28,14,12),new THREE.MeshBasicMaterial({color:0xfff5c7}));const flame=new THREE.Mesh(new THREE.SphereGeometry(.47,12,10),new THREE.MeshBasicMaterial({color:0xff6a2d,transparent:true,opacity:.74,blending:THREE.AdditiveBlending,depthWrite:false}));flame.scale.set(1,.86,1);group.add(flame,core);const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.06,5,18),new THREE.MeshBasicMaterial({color:0xffaa56,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=Math.PI/2;group.add(ring);const light=new THREE.PointLight(0xff6b24,2.2,8);group.add(light);group.position.set(p.root.position.x+forward.x*.9,p.root.position.y+1.5,p.root.position.z+forward.z*.9);this.game.scene.add(group);this.projectiles.push({kind:'fireball',group,forward:forward.clone(),life:2.1,speed:18,light});return true;
  }
  castArcane(){
    if(!this.game.started||this.game.paused||this.game.isDead)return false;if(this.cooldowns.arcane>0)return false;if(this.game.state.mp<9){this.game.ui.toast('Mana tidak cukup.','danger',700);return false;}
    this.game.state.mp-=9;this.cooldowns.arcane=1.4;this.game.audio.play('magic');this.game.ui.updateHUD();const p=this.game.player,forward=p.forward(),target=this._nearestInRange(20,true);const destination=target?target.group.position.clone().add(new THREE.Vector3(0,.9,0)):p.root.position.clone().add(forward.clone().multiplyScalar(15)).add(new THREE.Vector3(0,1,0));
    const group=new THREE.Group();const core=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),new THREE.MeshBasicMaterial({color:0xc8fcff}));group.add(core);const glow=new THREE.Mesh(new THREE.SphereGeometry(.24,12,10),new THREE.MeshBasicMaterial({color:0x43bdff,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}));group.add(glow);const light=new THREE.PointLight(0x56caff,1,4);group.add(light);const start=p.root.position.clone().add(new THREE.Vector3(0,1.5,0)).add(forward.clone().multiplyScalar(.7));group.position.copy(start);this.game.scene.add(group);const direction=destination.clone().sub(start).normalize();this.projectiles.push({kind:'arcane',group,forward:direction,life:1.25,speed:21,light,targetId:target?.id||null});return true;
  }
  spawnDashTrail(position,yaw){const ring=new THREE.Mesh(new THREE.TorusGeometry(.66,.06,5,30),new THREE.MeshBasicMaterial({color:0xb3afff,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.position.copy(position);ring.position.y+=.06;this.game.scene.add(ring);this.firePatches.push({kind:'fadeObject',group:ring,life:.38,maxLife:.38});}
  damageEnemy(enemy,rawDamage,critical=false,sourcePosition=null){
    if(!enemy||enemy.dead)return 0;const amount=Math.max(1,Math.round(rawDamage));enemy.hp=Math.max(0,enemy.hp-amount);enemy.hitFlash=.16;enemy.group.scale.set(1.06,.94,1.06);this.game.audio.play('hit');this.game.ui.damageFloat(enemy.group.position,amount,critical?'critical':'player');this.game.ui.updateTarget(enemy);this._spawnHitSparks(enemy.group.position,critical?0xffd17a:0x8de6ff);if(enemy.hp<=0)this._killEnemy(enemy);return amount;
  }
  _spawnHitSparks(position,color){const group=new THREE.Group();group.position.copy(position);group.position.y+=.9;for(let i=0;i<6;i++){const bit=new THREE.Mesh(new THREE.OctahedronGeometry(.045,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95,blending:THREE.AdditiveBlending}));bit.position.set((Math.random()-.5)*.65,(Math.random()-.5)*.7,(Math.random()-.5)*.55);group.add(bit);}this.game.scene.add(group);this.firePatches.push({kind:'sparks',group,life:.28,maxLife:.28});}
  _killEnemy(enemy){if(enemy.dead)return;enemy.dead=true;enemy.group.visible=false;const type=enemy.type;this.game.audio.play('quest');this.game.state.kills=(this.game.state.kills||0)+1;this.game.gainXP(enemy.definition.xp);const gold=Math.floor(enemy.definition.gold[0]+Math.random()*(enemy.definition.gold[1]-enemy.definition.gold[0]+1));this.spawnLoot('gold',gold,enemy.group.position.x,enemy.group.position.z);const itemId=createDropForEnemy(type);this.spawnLoot(itemId,1,enemy.group.position.x+this.game.world.rand(-.7,.7),enemy.group.position.z+this.game.world.rand(-.7,.7));if(Math.random()<.095){const gear=['ironfang','moonveil','copperguard','windrunner'][Math.floor(Math.random()*4)];this.spawnLoot(gear,1,enemy.group.position.x+this.game.world.rand(-1,1),enemy.group.position.z+this.game.world.rand(-1,1));}
    this.game.quests.progress('kill',type,1);this.game.ui.toast(`${enemy.definition.name} dikalahkan · +${enemy.definition.xp} XP`,'success',1100);this.game.ui.updateTarget(null);this.game.save();
  }
  spawnLoot(itemId,quantity,x,z){
    const isGold=itemId==='gold';const def=isGold?null:ITEMS[itemId];const group=new THREE.Group();group.position.set(x,this.game.world.terrainHeight(x,z)+.24,z);const color=isGold?0xf4cd6e:(def?.rarity==='legendary'?0xffd476:def?.rarity==='epic'?0xc2a1ff:def?.rarity==='rare'?0x82caff:def?.type==='material'?0x7ce6b4:0xe4edf4);
    const gemGeo=isGold?new THREE.DodecahedronGeometry(.18,0):new THREE.OctahedronGeometry(.2,1);const gem=new THREE.Mesh(gemGeo,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.85,metalness:.28,roughness:.22}));gem.position.y=.12;group.add(gem);const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.017,4,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.position.y=.05;group.add(ring);const light=new THREE.PointLight(color,.7,3.3);light.position.y=.3;group.add(light);this.game.scene.add(group);
    const loot={kind:'loot',name:isGold?`${quantity} Gold`:def?.name||itemId,itemId,quantity,x,z,object:group,active:true,baseY:group.position.y,phase:Math.random()*6.28,ring,light};this.lootEntities.push(loot);this.game.world.interactables.push(loot);return loot;
  }
  collectLoot(loot){if(!loot||!loot.active)return false;if(loot.itemId==='gold'){this.game.state.gold+=loot.quantity;this.game.ui.toast(`+${loot.quantity} Gold`,'success');}else{
      if(!this.game.inventory.add(loot.itemId,loot.quantity,false)){return false;}
      this.game.ui.toast(`Loot diperoleh: ${ITEMS[loot.itemId]?.name||loot.itemId}`,'success');this.game.quests.progress('collect',loot.itemId,loot.quantity);
    }
    loot.active=false;this.game.scene.remove(loot.object);this.game.world.interactables=this.game.world.interactables.filter(e=>e!==loot);this.game.audio.play('pickup');this.game.ui.updateHUD();this.game.save();return true;
  }
  spawnFirePatch(position){
    const group=new THREE.Group();group.position.set(position.x,this.game.world.terrainHeight(position.x,position.z)+.08,position.z);this.game.scene.add(group);
    const disc=new THREE.Mesh(new THREE.CircleGeometry(2.1,32),new THREE.MeshBasicMaterial({color:0xff5b19,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));disc.rotation.x=-Math.PI/2;group.add(disc);
    const inner=new THREE.Mesh(new THREE.CircleGeometry(1.25,24),new THREE.MeshBasicMaterial({color:0xffb43f,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));inner.rotation.x=-Math.PI/2;inner.position.y=.01;group.add(inner);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9,.055,5,32),new THREE.MeshBasicMaterial({color:0xff8a37,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=Math.PI/2;ring.position.y=.05;group.add(ring);
    const flames=[];for(let i=0;i<13;i++){const flame=new THREE.Mesh(new THREE.ConeGeometry(this.game.world.rand(.09,.19),this.game.world.rand(.35,.8),5),new THREE.MeshBasicMaterial({color:i%3===0?0xffd46b:0xff5c19,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));const a=i/13*Math.PI*2,r=this.game.world.rand(.3,1.8);flame.position.set(Math.cos(a)*r,this.game.world.rand(.18,.4),Math.sin(a)*r);group.add(flame);flames.push({mesh:flame,phase:Math.random()*6.28,baseY:flame.position.y});}
    const light=new THREE.PointLight(0xff5d17,2.1,7,2);light.position.y=.55;group.add(light);this.firePatches.push({kind:'fire',group,disc,inner,ring,flames,light,life:3,maxLife:3,tick:0,position:position.clone()});
    for(const e of this.enemies){if(!e.dead&&Math.hypot(e.group.position.x-position.x,e.group.position.z-position.z)<2.65)this.damageEnemy(e,27,false,position);}this.game.audio.play('explosion');
  }
  _impactProjectile(projectile,position,target=null){
    this.game.scene.remove(projectile.group);if(projectile.kind==='fireball'){this.spawnFirePatch(position);this.game.ui.toast('SOLAR FLARE · BURNING GROUND','success',950);}
    else if(projectile.kind==='arcane'){this._spawnHitSparks(position,0x70d7ff);if(target&&!target.dead)this.damageEnemy(target,Math.max(8,Math.round((this.game.inventory.getAttack()*.78+10)*(this.game.state.magicMultiplier||1))),false,position);}
  }
  update(dt){
    const active=this.game.started&&!this.game.paused&&!this.game.isDead&&!this.game.ui?.modalOpen;
    if(active)for(const key of Object.keys(this.cooldowns))this.cooldowns[key]=Math.max(0,this.cooldowns[key]-dt);
    for(const loot of this.lootEntities){if(!loot.active)continue;loot.object.position.y=loot.baseY+Math.sin(this.game.time*2.1+loot.phase)*.13;loot.ring.rotation.z=this.game.time*.5;loot.light.intensity=.5+.25*Math.sin(this.game.time*3+loot.phase);}
    let nextTarget=null,closest=22;const player=this.game.player?.root.position;
    for(const enemy of this.enemies){if(enemy.dead)continue;const group=enemy.group,def=enemy.definition;enemy.hitFlash=Math.max(0,enemy.hitFlash-dt);group.scale.x=smooth(group.scale.x,1,Math.min(1,dt*12));group.scale.y=smooth(group.scale.y,1,Math.min(1,dt*12));group.scale.z=smooth(group.scale.z,1,Math.min(1,dt*12));
      const p=player?new THREE.Vector3(player.x,group.position.y,player.z):null;const dx=player?player.x-group.position.x:0,dz=player?player.z-group.position.z:0,d=player?Math.hypot(dx,dz):999;
      if(d<closest){closest=d;nextTarget=enemy;}
      if(active&&d<def.aggro){
        if(d>def.range){const nx=group.position.x+dx/d*def.speed*dt,nz=group.position.z+dz/d*def.speed*dt;if(!this.game.world.collisionAt(nx,nz,def.radius*.4)){group.position.x=nx;group.position.z=nz;}group.rotation.y=Math.atan2(-dx,-dz);}
        else{group.rotation.y=Math.atan2(-dx,-dz);enemy.attackTimer-=dt;if(enemy.attackTimer<=0){enemy.attackTimer=def.cooldown;if(enemy.type==='aether-wisp'){const start=group.position.clone().add(new THREE.Vector3(0,1.05,0)),destination=player.clone().add(new THREE.Vector3(0,1.15,0)),direction=destination.sub(start).normalize();const orb=new THREE.Group();const core=new THREE.Mesh(new THREE.SphereGeometry(.12,9,8),new THREE.MeshBasicMaterial({color:0xe7fdff})),glow=new THREE.Mesh(new THREE.SphereGeometry(.22,9,8),new THREE.MeshBasicMaterial({color:0x68dfff,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));orb.add(core,glow);orb.position.copy(start);const light=new THREE.PointLight(0x54d7ff,.6,3);orb.add(light);this.game.scene.add(orb);this.projectiles.push({kind:'enemyOrb',group:orb,forward:direction,speed:10,life:1.25,damage:def.attack,light});}
            else{this.game.player.takeDamage(def.attack);this._spawnHitSparks(this.game.player.root.position,0xff7a83);}
          }}
      }
      group.position.y=this.game.world.terrainHeight(group.position.x,group.position.z)+ (enemy.type==='aether-wisp'?.25+Math.sin(this.game.time*2+enemy.phase)*.18:0);
      if(enemy.type==='mossfang'){enemy.legs.forEach((leg,i)=>{leg.leg.rotation.x=active&&d<def.aggro&&d>def.range?Math.sin(this.game.time*9+i*Math.PI)*.43:Math.sin(this.game.time*.7+enemy.phase+i)*.025;});}
      else if(enemy.core){enemy.core.rotation.x=this.game.time*.32;enemy.core.rotation.y=this.game.time*.58;enemy.ring.rotation.x=.7+Math.sin(this.game.time+enemy.phase)*.25;enemy.ring.rotation.z=this.game.time*.55;enemy.wings?.forEach(w=>{w.mesh.rotation.z=Math.sin(this.game.time*2.8+enemy.phase)*.32*w.sx;});}
      if(enemy.rune){enemy.rune.rotation.y=this.game.time*.6;}
    }
    if(this.target!==nextTarget){this.target=nextTarget;this.game.ui.updateTarget(nextTarget);}
    if(active&&this.game.input.consumeLeftClick()&&this.game.input.pointerLocked)this.basicAttack();
    this._updateProjectiles(dt,active);this._updateSlashWaves(dt);this._updateFirePatches(dt,active);
  }
  _updateProjectiles(dt,active){
    for(let i=this.projectiles.length-1;i>=0;i--){const p=this.projectiles[i];p.life-=dt;p.group.position.addScaledVector(p.forward,p.speed*dt);if(p.kind==='fireball'){p.group.rotation.z+=dt*3.5;p.group.rotation.x+=dt*1.8;p.group.scale.setScalar(1+Math.sin(this.game.time*18)*.08);p.light.intensity=2+Math.random()*.45;}
      else if(p.kind==='arcane'){p.group.rotation.y+=dt*4;p.light.intensity=.8+Math.random()*.15;}
      else if(p.kind==='enemyOrb'&&active){const player=this.game.player.root.position;if(Math.hypot(p.group.position.x-player.x,p.group.position.z-player.z)<.7){this.game.player.takeDamage(p.damage);p.life=0;}}
      if(p.kind==='fireball'||p.kind==='arcane'){let hit=null;for(const e of this.enemies){if(e.dead)continue;const d=p.group.position.distanceTo(e.group.position.clone().add(new THREE.Vector3(0,.8,0)));if(d<e.definition.radius+.42){hit=e;break;}}
        if(hit){if(p.kind==='arcane')this._impactProjectile(p,p.group.position.clone(),hit);else this._impactProjectile(p,p.group.position.clone());p.impacted=true;p.life=0;}
      }
      if(p.life<=0){if(p.kind==='fireball'&&!p.impacted){this._impactProjectile(p,p.group.position.clone());p.impacted=true;}else if(p.kind==='arcane'){this.game.scene.remove(p.group);}else this.game.scene.remove(p.group);this.projectiles.splice(i,1);}
    }
  }
  _updateSlashWaves(dt){
    for(let i=this.slashWaves.length-1;i>=0;i--){const wave=this.slashWaves[i];wave.life-=dt;wave.travel+=dt*21;wave.group.position.addScaledVector(wave.forward,dt*21);wave.group.rotation.z+=dt*.55;wave.group.scale.setScalar(1+wave.travel*.018);wave.light.intensity=Math.max(0,1.8-wave.travel*.12);
      for(const enemy of this.enemies){if(enemy.dead||wave.hit.has(enemy.id))continue;const d=Math.hypot(enemy.group.position.x-wave.group.position.x,enemy.group.position.z-wave.group.position.z);if(d<2.2){wave.hit.add(enemy.id);this.damageEnemy(enemy,Math.max(14,Math.round((this.game.inventory.getAttack()*1.65+18)*(this.game.state.magicMultiplier||1))),false,wave.group.position);}}
      if(wave.life<=0||wave.travel>19){this.game.scene.remove(wave.group);this.slashWaves.splice(i,1);}
    }
  }
  _updateFirePatches(dt,active){
    for(let i=this.firePatches.length-1;i>=0;i--){const fx=this.firePatches[i];fx.life-=dt;if(fx.kind==='fire'){
        const alpha=clamp(fx.life/fx.maxLife,0,1);fx.disc.material.opacity=.22*alpha;fx.inner.material.opacity=.24*alpha;fx.ring.material.opacity=.62*alpha;fx.ring.rotation.z+=dt*.5;fx.light.intensity=alpha*(1.8+Math.sin(this.game.time*14)*.5);
        fx.flames.forEach(f=>{f.mesh.position.y=f.baseY+Math.sin(this.game.time*8+f.phase)*.15;f.mesh.scale.y=.7+.45*Math.sin(this.game.time*10+f.phase);f.mesh.material.opacity=.35+.4*Math.sin(this.game.time*9+f.phase);});
        fx.tick-=dt;if(active&&fx.tick<=0&&fx.life>.1){fx.tick=.55;for(const enemy of this.enemies){if(!enemy.dead&&Math.hypot(enemy.group.position.x-fx.position.x,enemy.group.position.z-fx.position.z)<2.35)this.damageEnemy(enemy,6,false,fx.position);}}
      }else if(fx.kind==='sparks'){fx.group.children.forEach((child,j)=>{child.position.y+=dt*(1.4+j%3*.5);child.material.opacity=clamp(fx.life/fx.maxLife,0,1);});}
      else if(fx.kind==='fadeObject'){fx.group.material.opacity=clamp(fx.life/fx.maxLife,0,1);fx.group.scale.setScalar(1+(1-fx.life/fx.maxLife)*.6);}
      if(fx.life<=0){this.game.scene.remove(fx.group);this.firePatches.splice(i,1);}
    }
  }
  cooldown(action){return this.cooldowns[action]||0;}
  snapshot(){return {kills:this.enemies.filter(e=>e.dead).length};}
}
