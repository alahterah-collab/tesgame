import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerpAngle=(a,b,t)=>{let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+d*t;};

export class Player {
  constructor(game) {
    this.game=game;this.scene=game.scene;this.root=new THREE.Group();this.root.name='PlayerRoot';this.root.position.set(0,game.world.terrainHeight(0,11),11);this.scene.add(this.root);
    this.model=new THREE.Group();this.root.add(this.model);this.model.rotation.y=0;
    this.cameraYaw=0;this.cameraPitch=.22;this.cameraDistance=7.0;this.cameraLookHeight=1.4;this.moveSpeed=game.state.moveSpeed||6.2;this.sprintSpeed=this.moveSpeed*1.5;this.dashVelocity=0;this.dashTimer=0;this.dashCooldown=0;this.attackTimer=0;this.attackType='';this.hitFlash=0;this.invuln=0;this.jumpVelocity=0;this.grounded=true;this.walkPhase=0;this.stepDistance=0;this.lastStep=0;this.lastPosition=this.root.position.clone();this._buildModel();this.refreshEquipment();
  }
  _mat(color,roughness=.7,metalness=0,extra={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});}
  _mesh(geo,mat,parent,cast=true,receive=true){const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=receive;parent.add(m);return m;}
  _buildModel(){
    const dark=this._mat(0x172a3a,.75,.13),skin=this._mat(0xf0c8ab,.68),hair=this._mat(0x15253a,.42,.05),armor=this._mat(0xb7d0d8,.36,.36),cloth=this._mat(0x2a4d73,.8,.06),capeMat=this._mat(0x18334f,.86,.05,{side:THREE.DoubleSide}),gold=this._mat(0xd9bd7e,.36,.62),glow=this._mat(0x90ebff,.22,.24,{emissive:0x43c8ed,emissiveIntensity:1.6}),eyeMat=new THREE.MeshBasicMaterial({color:0x7ce7ff});
    this.materials={dark,skin,hair,armor,cloth,capeMat,gold,glow,eyeMat};
    const torso=this._mesh(new THREE.CapsuleGeometry(.33,.54,5,10),dark,this.model,true,true);torso.position.y=1.12;torso.scale.set(1,1.12,.8);
    const chest=this._mesh(new THREE.CylinderGeometry(.31,.4,.65,8,1),armor,this.model,true,true);chest.position.set(0,1.25,-.015);chest.rotation.x=.03;
    const frontPlate=this._mesh(new THREE.BoxGeometry(.33,.37,.07),this._mat(0x4e7085,.4,.38),this.model,true,true);frontPlate.position.set(0,1.25,-.31);
    const rune=this._mesh(new THREE.OctahedronGeometry(.09,0),glow,this.model,false,false);rune.position.set(0,1.26,-.37);this.chestRune=rune;
    const belt=this._mesh(new THREE.CylinderGeometry(.33,.34,.13,9),gold,this.model,true,true);belt.position.y=.88;
    const buckle=this._mesh(new THREE.BoxGeometry(.13,.14,.07),glow,this.model,false,false);buckle.position.set(0,.89,-.34);
    const cape=this._mesh(new THREE.BoxGeometry(.62,1.05,.075),capeMat,this.model,true,true);cape.position.set(0,1.1,.28);cape.rotation.x=-.16;this.cape=cape;
    const capePin=this._mesh(new THREE.OctahedronGeometry(.12,0),gold,this.model,true,true);capePin.position.set(0,1.52,.31);
    const headGroup=new THREE.Group();headGroup.position.y=1.78;this.model.add(headGroup);this.headGroup=headGroup;
    const head=this._mesh(new THREE.SphereGeometry(.245,18,16),skin,headGroup,true,true);head.scale.set(.93,1.12,.92);
    const hairCap=this._mesh(new THREE.SphereGeometry(.26,16,12,0,Math.PI*2,0,Math.PI*.64),hair,headGroup,true,true);hairCap.position.set(0,.095,.018);
    for(let i=0;i<5;i++){const spike=this._mesh(new THREE.ConeGeometry(.105,.31,5),hair,headGroup,true,true);const x=(i-2)*.09;spike.position.set(x,.16+(i%2)*.045,-.08);spike.rotation.z=(i-2)*-.32;spike.rotation.x=-.3;}
    const fringe=this._mesh(new THREE.BoxGeometry(.36,.14,.13),hair,headGroup,true,true);fringe.position.set(0,.035,-.205);fringe.rotation.x=-.14;
    for(const sx of [-1,1]){const eye=this._mesh(new THREE.SphereGeometry(.026,8,6),eyeMat,headGroup,false,false);eye.position.set(sx*.087,-.005,-.226);}
    const earL=this._mesh(new THREE.SphereGeometry(.055,8,6),skin,headGroup,true,true);earL.position.set(-.235,.015,0);const earR=earL.clone();earR.position.x=.235;headGroup.add(earR);
    this.legs=[];this.arms=[];
    for(const sx of [-1,1]){
      const legPivot=new THREE.Group();legPivot.position.set(sx*.17,.72,0);this.model.add(legPivot);const upper=this._mesh(new THREE.CapsuleGeometry(.115,.36,4,8),dark,legPivot,true,true);upper.position.y=-.21;
      const knee=this._mesh(new THREE.SphereGeometry(.115,8,7),armor,legPivot,true,true);knee.position.y=-.41;
      const boot=this._mesh(new THREE.BoxGeometry(.22,.16,.38),this._mat(0x1b2631,.46,.18),legPivot,true,true);boot.position.set(0,-.53,-.07);const sole=this._mesh(new THREE.BoxGeometry(.22,.045,.38),gold,legPivot,true,true);sole.position.set(0,-.61,-.07);
      const shinTrim=this._mesh(new THREE.CylinderGeometry(.117,.108,.13,8),armor,legPivot,true,true);shinTrim.position.y=-.46;this.legs.push({pivot:legPivot,upper,knee,boot,sole,sx});
      const armPivot=new THREE.Group();armPivot.position.set(sx*.39,1.44,-.005);this.model.add(armPivot);const upperArm=this._mesh(new THREE.CapsuleGeometry(.092,.36,4,8),cloth,armPivot,true,true);upperArm.position.y=-.22;
      const shoulder=this._mesh(new THREE.SphereGeometry(.16,10,8),armor,armPivot,true,true);shoulder.position.set(0,-.04,0);const shoulderMark=this._mesh(new THREE.OctahedronGeometry(.07,0),gold,armPivot,true,true);shoulderMark.position.set(0,-.03,-.105);
      const forearm=this._mesh(new THREE.CapsuleGeometry(.078,.3,4,8),armor,armPivot,true,true);forearm.position.set(0,-.43,-.01);const glove=this._mesh(new THREE.SphereGeometry(.09,8,7),dark,armPivot,true,true);glove.position.y=-.59;
      this.arms.push({pivot:armPivot,upperArm,forearm,glove,sx});if(sx>0)this.rightArm=armPivot;else this.leftArm=armPivot;
    }
    this.swordPivot=new THREE.Group();this.swordPivot.position.set(.02,-.61,-.02);this.rightArm.add(this.swordPivot);
    const grip=this._mesh(new THREE.CylinderGeometry(.045,.04,.27,8),dark,this.swordPivot,true,true);grip.position.y=-.04;const crossguard=this._mesh(new THREE.BoxGeometry(.35,.065,.1),gold,this.swordPivot,true,true);crossguard.position.y=.1;
    const bladeShape=new THREE.Shape();bladeShape.moveTo(-.075,0);bladeShape.lineTo(-.105,.18);bladeShape.lineTo(-.075,.82);bladeShape.lineTo(0,1.12);bladeShape.lineTo(.075,.82);bladeShape.lineTo(.105,.18);bladeShape.lineTo(.075,0);bladeShape.close();const bladeGeo=new THREE.ExtrudeGeometry(bladeShape,{depth:.065,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.02});bladeGeo.translate(0,.1,-.032);
    this.swordBlade=this._mesh(bladeGeo,this._mat(0xc9e7ee,.24,.8,{emissive:0x1c7192,emissiveIntensity:.22}),this.swordPivot,true,true);this.swordBlade.name='Aetheredge blade';
    const fuller=this._mesh(new THREE.BoxGeometry(.024,.64,.012),glow,this.swordPivot,false,false);fuller.position.set(0,.55,-.04);this.swordFuller=fuller;
    const pommel=this._mesh(new THREE.OctahedronGeometry(.07,0),gold,this.swordPivot,true,true);pommel.position.y=-.18;
    this.backSheath=new THREE.Group();this.backSheath.position.set(-.23,1.02,.28);this.backSheath.rotation.x=.22;this.backSheath.rotation.z=-.28;this.model.add(this.backSheath);const sheath=this._mesh(new THREE.BoxGeometry(.13,1.02,.12),dark,this.backSheath,true,true);sheath.position.y=.15;const sheathTrim=this._mesh(new THREE.BoxGeometry(.16,.1,.15),gold,this.backSheath,true,false);sheathTrim.position.y=-.1;
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(.65,24),new THREE.MeshBasicMaterial({color:0x07121a,transparent:true,opacity:.25,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;this.root.add(shadow);this.shadow=shadow;
    this._createAura();
  }
  _createAura(){const mat=new THREE.MeshBasicMaterial({color:0x8deaff,transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});this.auraRing=new THREE.Mesh(new THREE.TorusGeometry(.63,.022,4,48),mat);this.auraRing.rotation.x=Math.PI/2;this.auraRing.position.y=.06;this.root.add(this.auraRing);this.auraRing.visible=false;}
  refreshEquipment(){
    if(!this.game.inventory)return;const weapon=this.game.inventory.getWeapon();const colors={common:0x9baeb8,uncommon:0x6edbb6,rare:0x75c9ff,epic:0xb99aff,legendary:0xffcf78};const color=colors[weapon?.rarity]||0xc9e7ee;
    if(this.swordBlade){this.swordBlade.material.color.setHex(color);this.swordBlade.material.emissive.setHex(color);this.swordBlade.material.emissiveIntensity=weapon?.rarity==='legendary'?.9:.22;this.swordFuller.material.color.setHex(color);this.swordFuller.material.emissive.setHex(color);}
    const armor=this.game.inventory.getArmor();if(armor){this.materials.armor.color.setHex(armor.rarity==='epic'?0x8b7fb8:armor.rarity==='rare'?0x5c99b7:0xb7d0d8);this.materials.armor.metalness=.52;}else{this.materials.armor.color.setHex(0xb7d0d8);this.materials.armor.metalness=.36;}
  }
  forward(){const yaw=this.model.rotation.y;return new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));}
  update(dt){
    const input=this.game.input,state=this.game.state,active=this.game.started&&!this.game.paused&&!this.game.isDead&&!this.game.ui?.modalOpen;
    const delta=input.consumeMouseDelta();if(active&&input.pointerLocked){this.cameraYaw-=delta.dx*(this.game.settings.sensitivity||.0022);this.cameraPitch=clamp(this.cameraPitch+delta.dy*.0016,-.2,.95);}
    this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.invuln=Math.max(0,this.invuln-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);
    let move=new THREE.Vector3();if(active){const forward=new THREE.Vector3(-Math.sin(this.cameraYaw),0,-Math.cos(this.cameraYaw));const right=new THREE.Vector3(Math.cos(this.cameraYaw),0,-Math.sin(this.cameraYaw));if(input.isDown('KeyW')||input.isDown('ArrowUp'))move.add(forward);if(input.isDown('KeyS')||input.isDown('ArrowDown'))move.sub(forward);if(input.isDown('KeyD')||input.isDown('ArrowRight'))move.add(right);if(input.isDown('KeyA')||input.isDown('ArrowLeft'))move.sub(right);}
    const moving=move.lengthSq()>.001;if(moving)move.normalize();const sprint=active&&moving&&(input.isDown('ShiftLeft')||input.isDown('ShiftRight'))&&state.stamina>1;const speed=sprint?this.sprintSpeed:this.moveSpeed;
    if(active){if(sprint)state.stamina=Math.max(0,state.stamina-23*dt);else state.stamina=Math.min(state.maxStamina,state.stamina+(state.staminaRegen||17)*dt);}
    if(active&&moving&&this.dashTimer<=0){const nx=this.root.position.x+move.x*speed*dt,nz=this.root.position.z+move.z*speed*dt;if(!this.game.world.collisionAt(nx,nz,.46)){this.root.position.x=nx;this.root.position.z=nz;}else{const nx2=this.root.position.x+move.x*speed*dt,nz2=this.root.position.z;if(!this.game.world.collisionAt(nx2,nz2,.46))this.root.position.x=nx2;const nx3=this.root.position.x,nz3=this.root.position.z+move.z*speed*dt;if(!this.game.world.collisionAt(nx3,nz3,.46))this.root.position.z=nz3;}}
    if(moving&&active){const targetYaw=Math.atan2(-move.x,-move.z);this.model.rotation.y=lerpAngle(this.model.rotation.y,targetYaw,Math.min(1,dt*11));this.walkPhase+=dt*(sprint?12:8.3);this.stepDistance+=speed*dt;const stride=sprint?1.75:1.32;if(this.stepDistance>=stride){this.stepDistance=0;this.game.audio.play('step');if(Math.abs(this.root.position.x-this.game.world.pathX(this.root.position.z))>2.4&&this.game.world.rand(0,1)>.45)this.game.audio.play('grass');}}
    const groundedY=this.game.world.terrainHeight(this.root.position.x,this.root.position.z);if(this.jumpVelocity!==0||this.root.position.y>groundedY+.025){this.jumpVelocity-=18*dt;this.root.position.y+=this.jumpVelocity*dt;if(this.root.position.y<=groundedY){this.root.position.y=groundedY;this.jumpVelocity=0;this.grounded=true;}}else{this.root.position.y=groundedY;this.grounded=true;}
    if(active&&input.wasPressed('Space')){if(this.grounded){this.jumpVelocity=6.1;this.grounded=false;this.game.audio.play('dash');}}
    this._animate(dt,moving,sprint);
    this._updateCamera(dt);
    if(this.auraRing){this.auraRing.visible=state.hp<state.maxHp*.28;this.auraRing.material.opacity=.08+.08*Math.sin(this.game.time*5);}
    if(this.hitFlash>0){this.materials.armor.emissive.setHex(0xb02f47);this.materials.armor.emissiveIntensity=.8;}else{this.materials.armor.emissive.setHex(0x000000);this.materials.armor.emissiveIntensity=0;}
  }
  _animate(dt,moving,sprint){
    const amp=moving?(sprint?.72:.43):.035;const wave=Math.sin(this.walkPhase);for(const leg of this.legs){leg.pivot.rotation.x=wave*amp*(leg.sx===1?1:-1);leg.pivot.rotation.z=0;}
    this.leftArm.rotation.x=moving?-wave*amp*.56:.02;this.leftArm.rotation.z=-.12;
    if(this.attackTimer>0){this.attackTimer=Math.max(0,this.attackTimer-dt);const t=1-this.attackTimer/this.attackDuration;const windup=Math.sin(Math.min(1,t*1.6)*Math.PI*.5);const hit=Math.max(0,Math.sin((t-.26)*Math.PI*1.25));if(this.attackType==='slash'){this.rightArm.rotation.x=-1.0+windup*.5;this.rightArm.rotation.z=-.9+hit*1.7;this.swordPivot.rotation.x=-.45+hit*.65;this.swordPivot.rotation.z=-1.25+hit*2.2;}else if(this.attackType==='fireball'){this.rightArm.rotation.x=-.75;this.rightArm.rotation.z=-.35+Math.sin(t*Math.PI)*.25;this.swordPivot.rotation.z=-.15;}else{this.rightArm.rotation.x=-.3-windup*1.0+hit*.95;this.rightArm.rotation.z=-.38+hit*1.12;this.swordPivot.rotation.x=-.35+hit*.6;this.swordPivot.rotation.z=-.4+hit*1.25;}}
    else{this.rightArm.rotation.x=moving?-wave*amp*.48:.01;this.rightArm.rotation.z=-.16;this.swordPivot.rotation.set(0,0,.08);}
    this.cape.rotation.x=-.16+(moving?Math.sin(this.walkPhase*.5)*.08:Math.sin(this.game.time*1.2)*.025);this.cape.rotation.z=moving?Math.sin(this.walkPhase)*.04:0;
    this.headGroup.rotation.y=Math.sin(this.game.time*.35)*.025;
    this.chestRune.material.emissiveIntensity=1.25+Math.sin(this.game.time*2.1)*.3;
    if(this.dashTimer>0){this.dashTimer=Math.max(0,this.dashTimer-dt);this.root.position.addScaledVector(this._dashDir,this.dashSpeed*dt);}
  }
  _updateCamera(dt){
    const distance=this.cameraDistance;const horizontal=distance*Math.cos(this.cameraPitch),vertical=distance*Math.sin(this.cameraPitch);const target=new THREE.Vector3(this.root.position.x,this.root.position.y+1.48,this.root.position.z);
    const desired=new THREE.Vector3(target.x+Math.sin(this.cameraYaw)*horizontal,target.y+vertical,target.z+Math.cos(this.cameraYaw)*horizontal);
    this.game.camera.position.lerp(desired,Math.min(1,dt*7));this.game.camera.lookAt(target);
  }
  playAction(type,duration=.34){this.attackType=type;this.attackDuration=duration;this.attackTimer=duration;}
  dash(){if(this.dashCooldown>0||this.game.state.stamina<18)return false;this.dashCooldown=3.0;this.game.state.stamina-=18;this.dashTimer=.18;this.dashSpeed=24;this._dashDir=this.forward();this.playAction('slash',.2);this.game.audio.play('dash');this.auraRing.visible=true;this.game.combat.spawnDashTrail(this.root.position,this.model.rotation.y);return true;}
  takeDamage(amount){if(this.invuln>0||this.game.isDead)return 0;const defense=this.game.inventory.getDefense();const final=Math.max(1,Math.round(amount*(100/(100+defense*8))));this.game.state.hp=Math.max(0,this.game.state.hp-final);this.invuln=.5;this.hitFlash=.22;this.game.audio.play('enemyHit');this.game.ui.floatText(`-${final}`,false);this.game.ui.updateHUD();if(this.game.state.hp<=0)this.game.handlePlayerDeath();return final;}
  healToFull(){this.game.state.hp=this.game.state.maxHp;this.game.state.mp=this.game.state.maxMp;this.game.state.stamina=this.game.state.maxStamina;this.root.position.set(0,this.game.world.terrainHeight(0,11),11);this.model.rotation.y=0;this.game.ui.updateHUD();}
}
