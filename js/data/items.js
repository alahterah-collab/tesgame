export const ITEMS = {
  aetheredge: { id:'aetheredge', name:'Aetheredge', type:'weapon', slot:'weapon', rarity:'uncommon', icon:'⚔', price:0, atk:12, def:0, stackable:false, description:'Pedang guild yang seimbang. Bilahnya menyimpan gema dari bintang jatuh.', lore:'Senjata standar para rekrut Order of the First Light.', starter:true },
  ironfang: { id:'ironfang', name:'Ironfang', type:'weapon', slot:'weapon', rarity:'common', icon:'🗡', price:180, atk:17, def:0, stackable:false, description:'Pedang pendek baja dengan ujung berat untuk memecah pertahanan monster.', lore:'Dibuat untuk mereka yang lebih memilih hasil daripada gaya.' },
  moonveil: { id:'moonveil', name:'Moonveil Saber', type:'weapon', slot:'weapon', rarity:'rare', icon:'⚔', price:520, atk:25, def:0, stackable:false, description:'Pedang lengkung yang berkilau di bawah cahaya malam. Serangan terasa ringan dan cepat.', lore:'Konon bilah ini ditempa saat gerhana pertama.' },
  stormpiercer: { id:'stormpiercer', name:'Stormpiercer', type:'weapon', slot:'weapon', rarity:'epic', icon:'ϟ', price:1200, atk:36, def:0, stackable:false, description:'Pedang rune yang mengalirkan energi badai ke ujung bilah.', lore:'Suara petir terdengar di dalam logamnya.' },
  dawnkeeper: { id:'dawnkeeper', name:'Dawnkeeper', type:'weapon', slot:'weapon', rarity:'legendary', icon:'✧', price:2800, atk:52, def:0, stackable:false, description:'Relik fajar dengan inti kristal. Senjata legendaris untuk penjelajah tingkat tinggi.', lore:'Salah satu dari tujuh relik yang hilang.' },
  copperguard: { id:'copperguard', name:'Copperguard', type:'armor', slot:'armor', rarity:'common', icon:'🛡', price:160, atk:0, def:5, stackable:false, description:'Armor dada tembaga yang ringan dengan lapisan kulit pada bagian dalam.', lore:'Perlindungan awal yang bisa diandalkan.' },
  windrunner: { id:'windrunner', name:'Windrunner Mantle', type:'armor', slot:'armor', rarity:'rare', icon:'◈', price:480, atk:0, def:10, stackable:false, description:'Mantel berlapis benang rune yang meredam sebagian dampak serangan.', lore:'Dibuat untuk pemburu yang tak pernah diam.' },
  starplate: { id:'starplate', name:'Starplate Aegis', type:'armor', slot:'armor', rarity:'epic', icon:'✦', price:1120, atk:0, def:18, stackable:false, description:'Pelat pelindung berukir orbit bintang. Berat, tetapi sangat kuat.', lore:'Ditemukan di ruang bawah menara astronom.' },
  health_potion: { id:'health_potion', name:'Crimson Tonic', type:'consumable', slot:null, rarity:'common', icon:'🧪', price:45, heal:45, stackable:true, description:'Memulihkan 45 Vitality. Tidak dapat digunakan saat Vitality penuh.', lore:'Ramuan penyembuh para petualang.' },
  mana_potion: { id:'mana_potion', name:'Azure Ether', type:'consumable', slot:null, rarity:'common', icon:'⚗', price:38, mana:32, stackable:true, description:'Memulihkan 32 Mana untuk mengaktifkan sword art dan sihir.', lore:'Kristal eter yang dilarutkan dalam air murni.' },
  stamina_potion: { id:'stamina_potion', name:'Verdant Elixir', type:'consumable', slot:null, rarity:'uncommon', icon:'🍃', price:65, stamina:55, stackable:true, description:'Mengembalikan stamina sehingga kamu dapat bergerak dan bertarung kembali.', lore:'Diseduh dari daun dari sisi timur Luminara.' },
  moss_core: { id:'moss_core', name:'Mossfang Core', type:'material', slot:null, rarity:'uncommon', icon:'✹', price:24, stackable:true, description:'Inti hijau yang diambil dari monster Mossfang. Digunakan untuk kontrak guild.', lore:'Masih berdenyut pelan.' },
  wisp_shard: { id:'wisp_shard', name:'Wisp Shard', type:'material', slot:null, rarity:'rare', icon:'✧', price:52, stackable:true, description:'Pecahan energi dari Aether Wisp. Hangat di telapak tangan.', lore:'Menyimpan sedikit cahaya dari dunia lama.' },
  wolf_fang: { id:'wolf_fang', name:'Mossfang Fang', type:'material', slot:null, rarity:'common', icon:'牙', price:16, stackable:true, description:'Taring tajam dari predator padang luar.', lore:'Bisa dijual kepada pedagang.' },
  ancient_coin: { id:'ancient_coin', name:'Ancient Coin', type:'treasure', slot:null, rarity:'epic', icon:'◉', price:140, stackable:true, description:'Koin kuno dengan simbol tujuh menara. Pedagang kolektor menyukainya.', lore:'Mata uang dari era sebelum pecahan langit.' },
  skyglass: { id:'skyglass', name:'Skyglass Fragment', type:'material', slot:null, rarity:'rare', icon:'◇', price:78, stackable:true, description:'Kristal transparan yang terbentuk di pulau-pulau terapung.', lore:'Sangat berguna untuk merakit fokus sihir.' },
  old_map: { id:'old_map', name:'Tattered Sky Map', type:'quest', slot:null, rarity:'uncommon', icon:'▧', price:0, stackable:true, description:'Peta robek yang menunjuk ke sebuah menara di balik awan.', lore:'Quest item yang belum dapat dijual.' }
};

export const SHOP_STOCK = ['ironfang','moonveil','stormpiercer','dawnkeeper','copperguard','windrunner','starplate','health_potion','mana_potion','stamina_potion'];
export const RARITY_ORDER = ['common','uncommon','rare','epic','legendary'];

export function itemStats(item) {
  if (!item) return 'Unknown';
  const bits=[];
  if (item.atk) bits.push(`ATK +${item.atk}`);
  if (item.def) bits.push(`DEF +${item.def}`);
  if (item.heal) bits.push(`HEAL ${item.heal}`);
  if (item.mana) bits.push(`MANA ${item.mana}`);
  if (item.stamina) bits.push(`STA ${item.stamina}`);
  return bits.join(' · ') || item.type.toUpperCase();
}

export function createDropForEnemy(enemyType, random=Math.random) {
  const roll=random();
  if (enemyType==='aether-wisp') return roll < .5 ? 'wisp_shard' : roll < .72 ? 'skyglass' : 'mana_potion';
  if (enemyType==='mossfang') return roll < .52 ? 'moss_core' : roll < .82 ? 'wolf_fang' : 'health_potion';
  return roll < .55 ? 'ancient_coin' : 'skyglass';
}

export function randomWeapon(random=Math.random) {
  const pool = [
    { id:'ironfang', weight:52 }, { id:'moonveil', weight:30 },
    { id:'stormpiercer', weight:14 }, { id:'dawnkeeper', weight:4 }
  ];
  const n = random()*pool.reduce((a,b)=>a+b.weight,0);
  let acc=0;
  for (const entry of pool) { acc+=entry.weight; if (n<=acc) return entry.id; }
  return 'ironfang';
}
