import * as THREE from 'three';

const ASSET_ROOT = './assets/textures/';
const TEXTURE_FILES = {
  floorA:'forest_floor_albedo.webp',floorN:'forest_floor_normal.webp',floorR:'forest_floor_roughness.webp',
  pathA:'mud_path_albedo.webp',pathN:'mud_path_normal.webp',pathR:'mud_path_roughness.webp',
  barkA:'bark_albedo.webp',barkN:'bark_normal.webp',barkR:'bark_roughness.webp',
  leafA:'foliage_albedo.webp',leafN:'foliage_normal.webp',leafR:'foliage_roughness.webp',
  stoneA:'stone_albedo.webp',stoneN:'stone_normal.webp',stoneR:'stone_roughness.webp',
  waterN:'water_normal.webp',waterR:'water_roughness.webp'
};

export class World {
  constructor(game) {
    this.game=game;this.scene=game.scene;this.textures={};this.materials={};this.colliders=[];this.interactables=[];this.treeRecords=[];this.animated=[];this.time=0;this.random=this._seeded(71821);
    this.region='LUMINARA · OUTER MEADOWS';this.landmarks=[];this.grassShader=null;this.pathX=z=>Math.sin(z*.036)*3.4+Math.sin(z*.105)*1.25;
  }
  _seeded(seed){let x=seed>>>0;return()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};}
  rand(min=0,max=1){return min+this.random()*(max-min);}
  async build(onProgress=()=>{}) {
    this._setupScene();
    const entries=Object.entries(TEXTURE_FILES);let done=0;
    const loader=new THREE.TextureLoader();
    await Promise.all(entries.map(async([key,file])=>{
      try{
        const texture=await loader.loadAsync(ASSET_ROOT+file);
        texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,this.game.renderer.capabilities.getMaxAnisotropy());texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
        texture.colorSpace=key.endsWith('A')?THREE.SRGBColorSpace:THREE.NoColorSpace;
        this.textures[key]=texture;
      }catch(error){console.warn(`Material ${file} gagal dimuat; fallback prosedural dipakai.`,error);}
      done++;onProgress(Math.round(done/entries.length*45),`Memuat material permukaan ${done}/${entries.length}`);
    }));
    this._buildTerrain();onProgress(49,'Membangun terrain dan jalur petualangan');
    this._buildForest();onProgress(63,'Menumbuhkan hutan dan vegetasi');
    this._buildWater();this._buildMountains();onProgress(71,'Membentuk landmark dan pulau langit');
    this._buildTown();this._buildSkygate();this._buildShrine();onProgress(84,'Merakit Luminara dan Skygate');
    this._buildParticles();this._buildLightingAccents();onProgress(94,'Menyiapkan cahaya, atmosfer, dan interaksi');
    this.landmarks.push({id:'skygate',name:'Skygate',x:0,z:-18},{id:'shrine',name:'Shrine of the First Light',x:-45,z:-55},{id:'lake',name:'Mirrorfall Lake',x:47,z:-37});
    onProgress(100,'World instance siap');
  }
  _setupScene(){
    this.scene.background=new THREE.Color(0x9dbbc8);this.scene.fog=new THREE.FogExp2(0x9cb8c4,.0029);
    const hemi=new THREE.HemisphereLight(0xc5e7f7,0x36412c,1.42);this.scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xffe4bc,3.15);sun.position.set(-48,72,37);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-78;sun.shadow.camera.right=78;sun.shadow.camera.top=78;sun.shadow.camera.bottom=-78;sun.shadow.camera.near=1;sun.shadow.camera.far=210;sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=3;this.scene.add(sun);sun.target.position.set(0,0,0);this.scene.add(sun.target);this.sun=sun;
    const fill=new THREE.DirectionalLight(0x8bc8ec,.48);fill.position.set(30,24,-40);this.scene.add(fill);
    const skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(0x486b96)},mid:{value:new THREE.Color(0xc3dbe0)},low:{value:new THREE.Color(0xf0d8b5)}},vertexShader:'varying vec3 vDir; void main(){vDir=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform vec3 top;uniform vec3 mid;uniform vec3 low;varying vec3 vDir;void main(){float h=clamp(vDir.y*.5+.5,0.0,1.0);vec3 c=mix(low,mid,smoothstep(0.02,.43,h));c=mix(c,top,smoothstep(.4,1.0,h));gl_FragColor=vec4(c,1.0);}'});
    const sky=new THREE.Mesh(new THREE.SphereGeometry(420,32,20),skyMat);sky.renderOrder=-10;this.scene.add(sky);
    const sunDisk=new THREE.Mesh(new THREE.SphereGeometry(4.6,20,12),new THREE.MeshBasicMaterial({color:0xffebcb}));sunDisk.position.set(-123,102,-180);this.scene.add(sunDisk);
    const halo=new THREE.Mesh(new THREE.SphereGeometry(8,20,12),new THREE.MeshBasicMaterial({color:0xffddad,transparent:true,opacity:.12,depthWrite:false}));halo.position.copy(sunDisk.position);this.scene.add(halo);
    this.sunDisk=sunDisk;this.skyMat=skyMat;
  }
  _tex(key,rx=1,ry=1){const t=this.textures[key];if(t){t.repeat.set(rx,ry);t.needsUpdate=true;}return t||null;}
  _material(color,roughness=.85,metalness=0,extras={}){return new THREE.MeshStandardMaterial({color,roughness,metalness,...extras});}
  _standardMat(prefix,color=0xffffff,repeat=[1,1],extras={}){
    const map=this._tex(`${prefix}A`,...repeat),normalMap=this._tex(`${prefix}N`,...repeat),roughnessMap=this._tex(`${prefix}R`,...repeat);
    return this._material(color,.96,0,{map,normalMap,roughnessMap,normalScale:new THREE.Vector2(.72,.72),...extras});
  }
  _mesh(geometry,material,parent=this.scene,cast=true,receive=true){const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=cast;mesh.receiveShadow=receive;parent.add(mesh);return mesh;}
  terrainHeight(x,z){return Math.sin(x*.027)*Math.cos(z*.024)*.65+Math.sin((x+z)*.061)*.18+Math.cos((x-z)*.043)*.14;}
  _buildTerrain(){
    const size=420,segments=180,positions=[],uvs=[],indices=[];for(let iz=0;iz<=segments;iz++){const z=-size/2+size*iz/segments;for(let ix=0;ix<=segments;ix++){const x=-size/2+size*ix/segments;positions.push(x,this.terrainHeight(x,z),z);uvs.push(ix/segments,iz/segments);}}
    for(let iz=0;iz<segments;iz++)for(let ix=0;ix<segments;ix++){const a=iz*(segments+1)+ix,b=a+1,c=a+segments+1,d=c+1;indices.push(a,c,b,b,c,d);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const groundMat=this._standardMat('floor',0xd6dfcc,[24,24],{roughness:.98});const ground=this._mesh(geometry,groundMat,this.scene,false,true);ground.name='PBR World Terrain';this.ground=ground;
    this._buildPath();
    const underlay=this._mesh(new THREE.PlaneGeometry(650,650),this._material(0x3a4636,1),this.scene,false,false);underlay.rotation.x=-Math.PI/2;underlay.position.y=-4.2;
  }
  _buildPath(){
    const geometry=new THREE.BufferGeometry(),positions=[],uvs=[],indices=[];const steps=210,width=3.75;let uv=0;
    for(let i=0;i<=steps;i++){const z=70-170*i/steps,x=this.pathX(z),l=this.terrainHeight(x-width/2,z)+.035,r=this.terrainHeight(x+width/2,z)+.035;positions.push(x-width/2,l,z,x+width/2,r,z);uvs.push(0,uv,1,uv);uv+=.31;}
    for(let i=0;i<steps;i++){const a=i*2,b=a+1,c=a+2,d=a+3;indices.push(a,c,b,b,c,d);}
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const pathMat=this._standardMat('path',0xd6c3a1,[1,1],{roughness:.99});const path=this._mesh(geometry,pathMat,this.scene,false,true);path.name='Winding Mud Trail';
    const vergeMat=this._material(0x2e4836,.99);for(const side of [-1,1]){const points=[];for(let i=0;i<=steps;i++){const z=70-170*i/steps,x=this.pathX(z)+side*(width/2+.32);points.push(new THREE.Vector3(x,this.terrainHeight(x,z)+.02,z));}const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),steps,.055,4,false),vergeMat);line.receiveShadow=true;this.scene.add(line);}
  }
  _buildForest(){
    const n=405,trunkGeo=new THREE.CylinderGeometry(.2,.38,5.6,10,2),bark=this._standardMat('bark',0xffffff,[1,1],{roughness:.95}),treeColor=[0x244c37,0x2f5a3d,0x3d6541,0x426947,0x31533a,0x4a7049];
    const trunks=new THREE.InstancedMesh(trunkGeo,bark,n);trunks.castShadow=true;trunks.receiveShadow=true;trunks.frustumCulled=false;
    const foliageMat=this._standardMat('leaf',0x3a6c42,[1,1],{roughness:.98,vertexColors:true,side:THREE.DoubleSide});this._addWind(foliageMat);
    const pineGeo=[new THREE.ConeGeometry(2.45,4.1,9,3),new THREE.ConeGeometry(1.9,3.7,9,3),new THREE.ConeGeometry(1.35,3.15,9,3)];
    const pineMeshes=pineGeo.map(g=>{const m=new THREE.InstancedMesh(g,foliageMat,n);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;this.scene.add(m);return m;});
    const broadGeo=new THREE.IcosahedronGeometry(1.45,1),broadMeshes=[0,1,2].map(()=>{const m=new THREE.InstancedMesh(broadGeo,foliageMat,100);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;this.scene.add(m);return m;});
    const dummy=new THREE.Object3D();let pineCount=0,broadCount=0,tries=0;
    while(this.treeRecords.length<n&&tries<n*36){tries++;const x=this.rand(-154,154),z=this.rand(-154,154);if(Math.abs(x-this.pathX(z))<6.2||Math.hypot(x,z-5)<19||Math.hypot(x,z+18)<13||Math.hypot(x-47,z+37)<20||Math.hypot(x+45,z+55)<14||Math.hypot(x+13,z-2)<9||Math.hypot(x-13,z-2)<9)continue;if(this.treeRecords.some(t=>Math.hypot(t.x-x,t.z-z)<3.4))continue;
      const pine=this.random()<.67,scale=this.rand(.72,1.32),yaw=this.rand(0,Math.PI*2),phase=this.rand(0,6.28),base=this.terrainHeight(x,z);this.treeRecords.push({x,z,pine,scale,yaw,phase});this.colliders.push({x,z,r:.64*scale,type:'tree'});
      dummy.position.set(x,base+2.65*scale,z);dummy.rotation.set(this.rand(-.06,.06),yaw,this.rand(-.05,.05));dummy.scale.set(scale,scale,scale);dummy.updateMatrix();trunks.setMatrixAt(this.treeRecords.length-1,dummy.matrix);
      if(pine){for(let j=0;j<3;j++){dummy.position.set(x,base+(4.0+j*1.45)*scale,z);dummy.rotation.set(0,yaw+(j%2)*.3,0);const s=scale*(1.08-j*.16);dummy.scale.set(s,s,s);dummy.updateMatrix();pineMeshes[j].setMatrixAt(pineCount,dummy.matrix);pineMeshes[j].setColorAt(pineCount,new THREE.Color(treeColor[Math.floor(this.random()*treeColor.length)]));}pineCount++;}
      else{const offsets=[[-.7,4.5,.15],[.7,5.0,-.3],[0,5.4,.55]];offsets.forEach((o,j)=>{dummy.position.set(x+o[0]*scale,base+o[1]*scale,z+o[2]*scale);dummy.rotation.set(this.rand(-.3,.3),yaw+j*.7,this.rand(-.2,.2));const s=(1.05-j*.08)*scale;dummy.scale.set(s,s*.88,s);dummy.updateMatrix();broadMeshes[j].setMatrixAt(broadCount,dummy.matrix);broadMeshes[j].setColorAt(broadCount,new THREE.Color(treeColor[Math.floor(this.random()*treeColor.length)]));});broadCount++;}
    }
    trunks.count=this.treeRecords.length;trunks.instanceMatrix.needsUpdate=true;this.scene.add(trunks);for(const mesh of [...pineMeshes,...broadMeshes]){mesh.count=mesh===broadMeshes[0]||mesh===broadMeshes[1]||mesh===broadMeshes[2]?broadCount:pineCount;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    this._buildUnderstory();this._buildRocks();
  }
  _addWind(material){
    material.onBeforeCompile=(shader)=>{shader.uniforms.uWindTime={value:0};shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uWindTime;');shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 windWorld = modelMatrix * instanceMatrix * vec4(position, 1.0);
float windWeight = clamp(position.y + 0.6, 0.0, 1.0);
transformed.x += sin(uWindTime * 1.15 + windWorld.x * 0.16 + windWorld.z * 0.08) * 0.12 * windWeight;
transformed.z += cos(uWindTime * 0.92 + windWorld.z * 0.15 - windWorld.x * 0.06) * 0.075 * windWeight;
#endif`);material.userData.windUniform=shader.uniforms.uWindTime;};material.customProgramCacheKey=()=>`aetherion-wind-${material.uuid}`;this.windMaterials=(this.windMaterials||[]).concat(material);
  }
  _buildUnderstory(){
    const geo=new THREE.ConeGeometry(.052,.42,3,1);geo.translate(0,.21,0);const grassMat=this._material(0x6f9c55,.99,0,{vertexColors:true,side:THREE.DoubleSide});this._addWind(grassMat);
    const count=8800,grass=new THREE.InstancedMesh(geo,grassMat,count);grass.castShadow=false;grass.receiveShadow=false;grass.frustumCulled=false;const d=new THREE.Object3D(),colors=[0x365d39,0x4b7644,0x6d8f4b,0x89965a,0x426640,0x2f5536];let used=0;
    for(let i=0;i<count;i++){const x=this.rand(-105,105),z=this.rand(-105,105);if(Math.abs(x-this.pathX(z))<3.2||Math.hypot(x,z-3)<14||Math.hypot(x,z+18)<9||Math.hypot(x-47,z+37)<17||Math.hypot(x+45,z+55)<11||Math.hypot(x+13,z-2)<6||Math.hypot(x-13,z-2)<6){continue;}const h=this.rand(.7,1.5);d.position.set(x,this.terrainHeight(x,z),z);d.rotation.set(this.rand(-.06,.06),this.rand(0,6.28),this.rand(-.08,.08));d.scale.set(this.rand(.7,1.25),h,this.rand(.7,1.25));d.updateMatrix();grass.setMatrixAt(used,d.matrix);grass.setColorAt(used,new THREE.Color(colors[Math.floor(this.random()*colors.length)]));used++;}
    grass.count=used;grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;this.scene.add(grass);this.grassMesh=grass;
    const flowerGeo=new THREE.SphereGeometry(.055,5,4),flowerMat=new THREE.MeshStandardMaterial({color:0xf0d5d9,emissive:0x45202d,emissiveIntensity:.15,roughness:.8,vertexColors:true});const flowers=new THREE.InstancedMesh(flowerGeo,flowerMat,620);flowers.castShadow=false;flowers.receiveShadow=true;const pinks=[0xf0d5d9,0xe0c2f3,0xe8d7a2,0xc5e5dc];let n=0;
    for(let i=0;i<620;i++){const x=this.rand(-94,94),z=this.rand(-94,94);if(Math.abs(x-this.pathX(z))<4||Math.hypot(x,z)<17||Math.hypot(x-47,z+37)<16)continue;d.position.set(x,this.terrainHeight(x,z)+.07,z);d.scale.set(1,.5,1);d.rotation.y=this.rand(0,6.28);d.updateMatrix();flowers.setMatrixAt(n,d.matrix);flowers.setColorAt(n,new THREE.Color(pinks[Math.floor(this.random()*pinks.length)]));n++;}flowers.count=n;flowers.instanceMatrix.needsUpdate=true;this.scene.add(flowers);
  }
  _buildRocks(){
    const geo=new THREE.IcosahedronGeometry(1,1),mat=this._standardMat('stone',0xffffff,[1,1],{roughness:.98,vertexColors:true}),mesh=new THREE.InstancedMesh(geo,mat,520);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;const d=new THREE.Object3D(),palette=[0x727e7d,0x91968c,0x626f6b,0x9b9a8b,0x526562];let i=0;
    while(i<520){const x=this.rand(-120,120),z=this.rand(-120,120);if(Math.abs(x-this.pathX(z))<5||Math.hypot(x,z)<15||Math.hypot(x-47,z+37)<18||Math.hypot(x+45,z+55)<12)continue;const s=this.rand(.18,1.3);d.position.set(x,this.terrainHeight(x,z)+s*.28,z);d.rotation.set(this.rand(0,3),this.rand(0,6),this.rand(0,3));d.scale.set(s*this.rand(.8,1.6),s*this.rand(.35,.8),s*this.rand(.65,1.3));d.updateMatrix();mesh.setMatrixAt(i,d.matrix);mesh.setColorAt(i,new THREE.Color(palette[Math.floor(this.random()*palette.length)]));if(s>.85)this.colliders.push({x,z,r:s*.55,type:'rock'});i++;}mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;this.scene.add(mesh);
  }
  _buildWater(){
    const root=new THREE.Group();root.position.set(47,this.terrainHeight(47,-37)-.08,-37);this.scene.add(root);this.lakeRoot=root;
    const waterMat=new THREE.MeshPhysicalMaterial({color:0x4c9cad,normalMap:this.textures.waterN,roughnessMap:this.textures.waterR,roughness:.22,metalness:.12,clearcoat:.95,clearcoatRoughness:.12,transparent:true,opacity:.91,side:THREE.DoubleSide});if(waterMat.normalMap){waterMat.normalMap.repeat.set(2.7,2.7);waterMat.normalMap.wrapS=waterMat.normalMap.wrapT=THREE.RepeatWrapping;waterMat.normalScale.set(.32,.32);}
    const water=this._mesh(new THREE.CircleGeometry(13.8,80),waterMat,root,false,true);water.rotation.x=-Math.PI/2;water.position.y=.04;root.userData.water=water;
    const ringMat=new THREE.MeshBasicMaterial({color:0x97efff,transparent:true,opacity:.12,depthWrite:false});this.lakeRings=[];for(let r=3;r<14;r+=2.5){const ring=this._mesh(new THREE.TorusGeometry(r,.018,4,72),ringMat,root,false,false);ring.rotation.x=Math.PI/2;ring.position.y=.06;this.lakeRings.push(ring);}
    const shoreGeo=new THREE.DodecahedronGeometry(.7,0),shoreMat=this._standardMat('stone',0xbbb7a4,[1,1],{roughness:1,vertexColors:true}),shore=new THREE.InstancedMesh(shoreGeo,shoreMat,70),d=new THREE.Object3D();for(let i=0;i<70;i++){const a=i/70*Math.PI*2,r=14+this.rand(.2,1.5),s=this.rand(.3,1.1);d.position.set(Math.cos(a)*r,.1,Math.sin(a)*r);d.rotation.set(this.rand(0,2),this.rand(0,6),this.rand(0,2));d.scale.set(s,s*.65,s*.95);d.updateMatrix();shore.setMatrixAt(i,d.matrix);shore.setColorAt(i,new THREE.Color([0x858d81,0xaaa38e,0x68756c][i%3]));}shore.instanceMatrix.needsUpdate=true;root.add(shore);
    this.colliders.push({x:47,z:-37,r:11.6,type:'water'});
  }
  _buildMountains(){
    const rockMatA=this._material(0x596f78,1),rockMatB=this._material(0x7e8b8a,1),geo=new THREE.IcosahedronGeometry(1,2),random=this.random;
    for(let i=0;i<58;i++){const a=i/58*Math.PI*2,r=this.rand(151,184),h=this.rand(15,42),w=this.rand(16,31),d=this.rand(19,36);const mountain=this._mesh(geo,i%3?rockMatA:rockMatB,this.scene,false,true);mountain.position.set(Math.cos(a)*r,h*.25,Math.sin(a)*r);mountain.scale.set(w,h,d);mountain.rotation.y=random()*6;}
    for(let i=0;i<6;i++)this._buildFloatingIsland(this.rand(-135,135),this.rand(43,72),this.rand(-145,-72),this.rand(.7,1.25),i);
  }
  _buildFloatingIsland(x,y,z,scale,index){
    const root=new THREE.Group();root.position.set(x,y,z);root.scale.setScalar(scale);this.scene.add(root);const stoneMat=this._standardMat('stone',0x8b9697,[1,1],{roughness:1});const rock=this._mesh(new THREE.IcosahedronGeometry(6,2),stoneMat,root,true,true);rock.scale.set(1.6,.75,1.25);rock.position.y=-1.5;rock.rotation.set(.2,index*.8,.1);
    const grassTop=this._mesh(new THREE.CylinderGeometry(6.8,7.2,.45,9),this._material(0x597952,.95),root,true,true);grassTop.position.y=1.55;
    for(let t=0;t<3;t++){const shard=this._mesh(new THREE.OctahedronGeometry(this.rand(.55,1.15),1),new THREE.MeshStandardMaterial({color:0x8bdff4,emissive:0x229ec8,emissiveIntensity:1.6,metalness:.22,roughness:.2}),root,true,true);shard.position.set(this.rand(-4,4),2.2+this.rand(0,3),this.rand(-4,4));shard.rotation.set(this.rand(0,1),this.rand(0,6),this.rand(0,1));}
    const tower=this._mesh(new THREE.CylinderGeometry(.6,.9,5.4,7),this._material(0x73818b,.72,.15),root,true,true);tower.position.set(0,4.1,0);const crystal=this._mesh(new THREE.OctahedronGeometry(1.4,1),new THREE.MeshStandardMaterial({color:0xb1f0fc,emissive:0x4acbec,emissiveIntensity:2.2,metalness:.1,roughness:.2}),root,false,false);crystal.position.set(0,7.4,0);const light=new THREE.PointLight(0x5fdcf6,.8,22);light.position.set(0,5,0);root.add(light);this.animated.push({kind:'floating',root,phase:index*1.7,baseY:y});
  }
  _buildTown(){
    const wood=this._material(0x533b2f,.9),woodLight=this._material(0x886347,.8),roof=this._material(0x273e56,.78,.12),plaster=this._standardMat('stone',0xc7c9be,[1,1],{roughness:.93}),trim=this._material(0x9d7f4b,.47,.45),glowGlass=new THREE.MeshStandardMaterial({color:0x81d9ed,emissive:0x2e8bb1,emissiveIntensity:1.1,roughness:.26});
    const buildHouse=(x,z,rotation=0,scale=1)=>{const root=new THREE.Group();root.position.set(x,this.terrainHeight(x,z),z);root.rotation.y=rotation;root.scale.setScalar(scale);this.scene.add(root);
      const base=this._mesh(new THREE.BoxGeometry(6.5,.38,5),wood,root,true,true);base.position.y=.19;
      const walls=this._mesh(new THREE.BoxGeometry(6,3.1,4.5),plaster,root,true,true);walls.position.y=1.82;
      const roofGeo=new THREE.ConeGeometry(4.55,2.65,4,1);roofGeo.rotateY(Math.PI/4);const r=this._mesh(roofGeo,roof,root,true,true);r.position.y=4.55;r.rotation.y=Math.PI/4;
      for(const side of [-1,1]){const post=this._mesh(new THREE.BoxGeometry(.22,3.2,.22),woodLight,root,true,true);post.position.set(side*2.75,1.82,2.3);const window=this._mesh(new THREE.BoxGeometry(.78,1.05,.08),glowGlass,root,false,false);window.position.set(side*1.55,2.05,2.31);const frame=this._mesh(new THREE.BoxGeometry(.95,1.21,.11),trim,root,true,false);frame.position.set(side*1.55,2.05,2.34);}
      const door=this._mesh(new THREE.BoxGeometry(1.1,2.05,.12),wood,root,true,true);door.position.set(0,1.13,2.33);const lintel=this._mesh(new THREE.BoxGeometry(1.4,.18,.2),trim,root,true,false);lintel.position.set(0,2.2,2.35);
      this.colliders.push({x,z,r:4.2*scale,type:'building'});return root;};
    buildHouse(-14,3,.12,1.08);buildHouse(14,4,-.15,.98);buildHouse(-18,-9,.4,.78);buildHouse(19,-8,-.4,.84);
    this._buildGuildHall(0,28);
    this._createNPC('Elowen','GUILDMASTER · FIRST LIGHT',9.2,1.7,0xc4d1e0,0x334d72,'guild');
    this._createNPC('Orik','QUARTERMASTER',-9.5,1.7,0xcfa16d,0x806044,'merchant');
    this._createNPC('Lyra','ASTRAL CARTOGRAPHER',4.2,-2.8,0xb1a8da,0x474c80,'cartographer');
    const well=new THREE.Group();well.position.set(0,this.terrainHeight(0,0),0);this.scene.add(well);const stoneMat=this._standardMat('stone',0xadb5b0,[1,1],{roughness:.92});const cylinder=this._mesh(new THREE.CylinderGeometry(2.2,2.4,1.2,12),stoneMat,well,true,true);cylinder.position.y=.6;const lip=this._mesh(new THREE.TorusGeometry(2.15,.18,8,24),this._material(0x8b9b9e,.78),well,true,true);lip.position.y=1.2;const water=this._mesh(new THREE.CircleGeometry(1.9,24),new THREE.MeshStandardMaterial({color:0x307a94,metalness:.25,roughness:.18}),well,false,false);water.rotation.x=-Math.PI/2;water.position.y=.83;
    const emblem=this._mesh(new THREE.TorusGeometry(3.1,.035,4,100),new THREE.MeshBasicMaterial({color:0x9aefff,transparent:true,opacity:.6}),well,false,false);emblem.position.y=.05;this.animated.push({kind:'well',mesh:emblem,phase:0});
  }
  _buildGuildHall(x,z){
    const root=new THREE.Group();root.position.set(x,this.terrainHeight(x,z),z);this.scene.add(root);const stone=this._standardMat('stone',0x9ca9ae,[1,1],{roughness:.93}),metal=this._material(0x4c6676,.46,.47),roof=this._material(0x1d3045,.6,.2);
    const plinth=this._mesh(new THREE.BoxGeometry(12,.75,8),stone,root,true,true);plinth.position.y=.38;
    const rear=this._mesh(new THREE.BoxGeometry(10,5,1),stone,root,true,true);rear.position.set(0,3,-3.4);
    for(const sx of [-1,1])for(const sz of [-1,1]){const c=this._mesh(new THREE.CylinderGeometry(.42,.58,5.7,9),stone,root,true,true);c.position.set(sx*5.25,3.2,sz*3.1);const cap=this._mesh(new THREE.CylinderGeometry(.62,.62,.32,9),metal,root,true,true);cap.position.set(sx*5.25,6.05,sz*3.1);}
    const beam=this._mesh(new THREE.BoxGeometry(12,.55,.9),metal,root,true,true);beam.position.y=6;
    const arch=this._mesh(new THREE.TorusGeometry(2.1,.22,9,42,Math.PI),new THREE.MeshStandardMaterial({color:0x91def0,emissive:0x3fb5cf,emissiveIntensity:.65,metalness:.3,roughness:.25}),root,false,false);arch.position.set(0,2.4,-2.4);arch.rotation.z=Math.PI;
    const crest=this._mesh(new THREE.OctahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0xa5efff,emissive:0x49c7e5,emissiveIntensity:1.6,roughness:.22,metalness:.24}),root,false,false);crest.position.set(0,6.7,0);
    this.colliders.push({x,z,r:5.7,type:'building'});
  }
  _createNPC(name,role,x,z,hairColor,clothColor,kind){
    const group=new THREE.Group();group.position.set(x,this.terrainHeight(x,z),z);this.scene.add(group);const skin=this._material(0xe2b99e,.68),hair=this._material(hairColor,.66),cloth=this._material(clothColor,.72,.04),trim=this._material(0xd7c386,.48,.48),eye=new THREE.MeshBasicMaterial({color:0x8cecff});
    const torso=this._mesh(new THREE.CylinderGeometry(.3,.43,.85,8),cloth,group,true,true);torso.position.y=1.08;
    const sash=this._mesh(new THREE.BoxGeometry(.58,.13,.09),trim,group,true,false);sash.position.set(0,1.12,-.24);
    const head=this._mesh(new THREE.SphereGeometry(.25,14,12),skin,group,true,true);head.position.y=1.78;
    const hairCap=this._mesh(new THREE.SphereGeometry(.26,12,10,0,Math.PI*2,0,Math.PI*.62),hair,group,true,true);hairCap.position.y=1.88;
    const eyeL=this._mesh(new THREE.SphereGeometry(.028,6,5),eye,group,false,false);eyeL.position.set(-.085,1.79,-.23);const eyeR=eyeL.clone();eyeR.position.x=.085;group.add(eyeR);
    for(const sx of [-1,1]){const arm=this._mesh(new THREE.CapsuleGeometry(.09,.42,3,6),cloth,group,true,true);arm.position.set(sx*.37,1.13,-.015);arm.rotation.z=sx*.18;const leg=this._mesh(new THREE.CapsuleGeometry(.105,.38,3,6),this._material(0x223044,.85),group,true,true);leg.position.set(sx*.16,.4,0);}
    const ring=this._mesh(new THREE.TorusGeometry(.43,.025,4,36),new THREE.MeshBasicMaterial({color:0x86e3f2,transparent:true,opacity:.7}),group,false,false);ring.rotation.x=Math.PI/2;ring.position.y=.04;
    const sigil=this._mesh(new THREE.OctahedronGeometry(.16,0),new THREE.MeshStandardMaterial({color:0x9fefff,emissive:0x47c5e7,emissiveIntensity:1.4}),group,false,false);sigil.position.set(0,2.3,0);const sigLight=new THREE.PointLight(0x5fd8f4,.45,5);sigLight.position.set(0,2,0);group.add(sigLight);
    const npc={kind:'npc',npcType:kind,name,role,x,z,object:group,interactRadius:3.6};this.interactables.push(npc);this.animated.push({kind:'npc',mesh:sigil,ring,phase:this.rand(0,6.28)});return npc;
  }
  _buildSkygate(){
    const root=new THREE.Group();const x=0,z=-18;root.position.set(x,this.terrainHeight(x,z),z);this.scene.add(root);this.skygate=root;
    const stone=this._standardMat('stone',0x929fa3,[1,1],{roughness:.85});const trim=this._material(0x455d71,.36,.58);const glow=new THREE.MeshStandardMaterial({color:0x8bedff,emissive:0x31c2f4,emissiveIntensity:1.8,metalness:.24,roughness:.22});
    const plinth=this._mesh(new THREE.CylinderGeometry(4.25,4.5,.65,48),stone,root,true,true);plinth.position.y=.25;
    const runeRing=this._mesh(new THREE.TorusGeometry(3.65,.06,6,96),new THREE.MeshBasicMaterial({color:0x81efff,transparent:true,opacity:.85}),root,false,false);runeRing.rotation.x=Math.PI/2;runeRing.position.y=.62;this.animated.push({kind:'ring',mesh:runeRing,phase:0});
    for(const sx of [-1,1]){const column=this._mesh(new THREE.CylinderGeometry(.48,.68,5.7,9),stone,root,true,true);column.position.set(sx*3.05,3.2,-.15);const cap=this._mesh(new THREE.BoxGeometry(1.6,.38,1.3),trim,root,true,true);cap.position.set(sx*3.05,6.1,-.15);const crystal=this._mesh(new THREE.OctahedronGeometry(.55,1),glow,root,false,false);crystal.position.set(sx*3.05,6.9,-.15);this.animated.push({kind:'crystal',mesh:crystal,phase:sx});}
    const lintel=this._mesh(new THREE.BoxGeometry(6.8,.8,1.4),stone,root,true,true);lintel.position.set(0,6.2,-.15);
    const arch=this._mesh(new THREE.TorusGeometry(2.35,.15,9,56,Math.PI),glow,root,false,false);arch.position.set(0,3.8,-.05);arch.rotation.z=Math.PI;const inner=this._mesh(new THREE.CircleGeometry(2.2,64),new THREE.MeshBasicMaterial({color:0x2588b5,transparent:true,opacity:.28,side:THREE.DoubleSide,depthWrite:false}),root,false,false);inner.position.set(0,3.85,-.07);
    for(let i=0;i<13;i++){const shard=this._mesh(new THREE.OctahedronGeometry(this.rand(.13,.32),0),glow,root,false,false);const a=this.rand(0,6.28),r=this.rand(2.7,4.6);shard.position.set(Math.cos(a)*r,this.rand(.9,5.6),Math.sin(a)*.55-.1);this.animated.push({kind:'shard',mesh:shard,phase:this.rand(0,6.28),baseY:shard.position.y});}
    const light=new THREE.PointLight(0x42c9f0,2.4,26,1.8);light.position.set(0,3.6,1);root.add(light);this.animated.push({kind:'skygateLight',light,phase:0});
    this.interactables.push({kind:'portal',name:'Skygate',role:'GATE TO THE FRONTIER',x,z,object:root,interactRadius:4.5});
  }
  _buildShrine(){
    const root=new THREE.Group(),x=-45,z=-55;root.position.set(x,this.terrainHeight(x,z),z);this.scene.add(root);const stone=this._standardMat('stone',0x9ca7a1,[1,1],{roughness:.95});
    const base=this._mesh(new THREE.CylinderGeometry(3.4,4,.65,9),stone,root,true,true);base.position.y=.32;
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=2.8;const p=this._mesh(new THREE.BoxGeometry(.48,this.rand(2.8,4.2),.58),stone,root,true,true);p.position.set(Math.cos(a)*r,this.rand(1.5,2.1),Math.sin(a)*r);p.rotation.y=-a;}
    const orb=this._mesh(new THREE.IcosahedronGeometry(.72,2),new THREE.MeshStandardMaterial({color:0xb9efff,emissive:0x55bfe9,emissiveIntensity:2.0,metalness:.18,roughness:.2}),root,false,false);orb.position.y=3.2;const light=new THREE.PointLight(0x50caee,1.4,15);light.position.y=3.3;root.add(light);const ring=this._mesh(new THREE.TorusGeometry(1.5,.035,4,72),new THREE.MeshBasicMaterial({color:0xa4e8fc,transparent:true,opacity:.65}),root,false,false);ring.rotation.x=Math.PI/2;ring.position.y=3.2;this.animated.push({kind:'shrine',mesh:orb,ring,phase:0});this.colliders.push({x,z,r:2.5,type:'shrine'});this.interactables.push({kind:'shrine',name:'Shrine of the First Light',role:'ANCIENT LANDMARK',x,z,object:root,interactRadius:3.8});
  }
  _buildParticles(){
    const count=900,geo=new THREE.BufferGeometry(),positions=new Float32Array(count*3),sizes=new Float32Array(count);this.dustData=[];
    for(let i=0;i<count;i++){const x=this.rand(-85,85),z=this.rand(-85,85),y=this.rand(.4,13);positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;sizes[i]=this.rand(.35,1);this.dustData.push({x,y,z,phase:this.rand(0,6.28),speed:this.rand(.15,.65)});}
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));const mat=new THREE.PointsMaterial({color:0xe4f6ff,size:.075,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});this.dust=new THREE.Points(geo,mat);this.scene.add(this.dust);
  }
  _buildLightingAccents(){
    this.fireflies=[];const geo=new THREE.SphereGeometry(.035,5,5),mat=new THREE.MeshBasicMaterial({color:0xc6f6a5});for(let i=0;i<50;i++){const x=this.rand(-56,56),z=this.rand(-65,35),y=this.rand(.4,2.7);const orb=this._mesh(geo,mat,this.scene,false,false);orb.position.set(x,y,z);this.fireflies.push({mesh:orb,x,y,z,phase:this.rand(0,6.28),speed:this.rand(.5,1.3)});}
  }
  update(dt,time){
    this.time=time;for(const mat of this.windMaterials||[])if(mat.userData.windUniform)mat.userData.windUniform.value=time;
    if(this.lakeRings)this.lakeRings.forEach((ring,i)=>{ring.scale.setScalar(1+Math.sin(time*.7+i)*.009);ring.material.opacity=.08+(.04*Math.sin(time*.6+i));});
    for(const item of this.animated){if(item.kind==='floating'){item.root.position.y=item.baseY+Math.sin(time*.23+item.phase)*.75;item.root.rotation.y+=dt*.02;}
      else if(item.kind==='ring'){item.mesh.rotation.z=time*.12;}
      else if(item.kind==='crystal'){item.mesh.rotation.y+=dt*.34;item.mesh.position.y=6.9+Math.sin(time*1.2+item.phase)*.12;}
      else if(item.kind==='shard'){item.mesh.rotation.x+=dt*.35;item.mesh.rotation.y+=dt*.6;item.mesh.position.y=item.baseY+Math.sin(time*1.5+item.phase)*.22;}
      else if(item.kind==='npc'){item.mesh.position.y=2.3+Math.sin(time*1.35+item.phase)*.15;item.ring.rotation.z=time*.15;}
      else if(item.kind==='shrine'){item.mesh.position.y=3.2+Math.sin(time*1.3)*.2;item.mesh.rotation.y+=dt*.3;item.ring.rotation.z=time*.25;}
      else if(item.kind==='well'){item.mesh.rotation.z=time*.08;}
      else if(item.kind==='skygateLight'){item.light.intensity=2.1+Math.sin(time*2.2)*.45;}
    }
    if(this.dust){const attr=this.dust.geometry.attributes.position;for(let i=0;i<this.dustData.length;i++){const p=this.dustData[i];attr.array[i*3+1]=p.y+Math.sin(time*p.speed+p.phase)*.38;attr.array[i*3]+=Math.sin(time*.12+p.phase)*.002;}attr.needsUpdate=true;}
    for(const f of this.fireflies){f.mesh.position.set(f.x+Math.sin(time*.4+f.phase)*.7,f.y+Math.sin(time*f.speed+f.phase)*.32,f.z+Math.cos(time*.35+f.phase)*.6);f.mesh.material.opacity=.3+.6*(.5+.5*Math.sin(time*2+f.phase));}
  }
  collisionAt(x,z,radius=.5){
    if(Math.abs(x)>188||Math.abs(z)>188)return true;
    if(Math.hypot(x-47,z+37)<11.7)return true;
    for(const c of this.colliders){if(Math.hypot(x-c.x,z-c.z)<c.r+radius)return true;}
    return false;
  }
  findInteractableNear(position,maxDistance=4){let best=null,bestD=maxDistance;for(const item of this.interactables){if(item.active===false)continue;const d=Math.hypot(position.x-item.x,position.z-item.z);if(d<(item.interactRadius||3.4)&&d<bestD){best=item;bestD=d;}}return best;}
  markLandmark(id){const mark=this.landmarks.find(l=>l.id===id);if(mark)this.game.quests.progress('explore',id,1);}
  worldToMap(x,z){return{x:(x+110)/220,z:(z+110)/220};}
}
