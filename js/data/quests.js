export const QUESTS = {
  first_song: {
    id:'first_song', title:"A Sword's First Song", subtitle:'GUILD INITIATION · CHAPTER 01', category:'main', recommended:1,
    description:'Guildmaster Elowen meminta bukti bahwa kamu mampu bertahan di Outer Meadows. Kalahkan Mossfang, kumpulkan inti mereka, lalu kembali untuk mengklaim hadiah.',
    objectives:[{ id:'kill_mossfang', label:'Kalahkan Mossfang', event:'kill', target:'mossfang', required:5 }],
    rewards:{ xp:160, gold:110, randomWeapon:true }, state:'active', tracked:true
  },
  light_in_the_grass: {
    id:'light_in_the_grass', title:'Light in the Grass', subtitle:'FIELD RESEARCH · OPTIONAL', category:'side', recommended:1,
    description:'Aether Wisp muncul ketika pecahan langit bereaksi dengan rumput. Kumpulkan shard mereka untuk membantu pencatatan Guild Astral.',
    objectives:[{ id:'collect_wisp', label:'Kumpulkan Wisp Shard', event:'collect', target:'wisp_shard', required:3 }],
    rewards:{ xp:95, gold:70, items:[{id:'mana_potion',qty:2}] }, state:'active', tracked:false
  },
  skyward_steps: {
    id:'skyward_steps', title:'Skyward Steps', subtitle:'EXPLORATION · OPTIONAL', category:'side', recommended:1,
    description:'Kunjungi Skygate di tepi plaza dan Shrine of the First Light di reruntuhan timur.',
    objectives:[{ id:'visit_gate', label:'Temukan Skygate', event:'explore', target:'skygate', required:1 },{ id:'visit_shrine',label:'Kunjungi shrine tua',event:'explore',target:'shrine',required:1 }],
    rewards:{ xp:75, gold:60, items:[{id:'skyglass',qty:1}] }, state:'active', tracked:false
  }
};
