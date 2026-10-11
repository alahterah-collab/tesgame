export class InteractionSystem {
  constructor(game){this.game=game;this.current=null;this.lastPrompt='';this.interactCooldown=0;}
  update(dt){if(this.interactCooldown>0)this.interactCooldown-=dt;if(!this.game.started||this.game.paused||this.game.ui?.modalOpen||this.game.isDead){this.current=null;this.game.ui?.setInteraction(null);return;}
    this.current=this.game.world.findInteractableNear(this.game.player.root.position,5.1);this.game.ui.setInteraction(this.current);
    if(this.game.input.wasPressed('KeyF'))this.tryInteract();
  }
  tryInteract(){if(this.interactCooldown>0)return false;const item=this.current;if(!item){this.game.ui.toast('Tidak ada yang bisa diinteraksikan di dekatmu.','info',850);return false;}this.interactCooldown=.22;
    switch(item.kind){
      case 'loot': return this.game.combat.collectLoot(item);
      case 'npc': return this._talk(item);
      case 'portal': this.game.world.markLandmark('skygate');this.game.ui.openPortal();this.game.audio.play('open');return true;
      case 'shrine': this.game.world.markLandmark('shrine');this.game.ui.toast('Shrine of the First Light ditemukan.','success');this.game.audio.play('quest');this.game.save();return true;
      default: this.game.ui.toast('Belum ada interaksi untuk objek ini.','info');return false;
    }
  }
  _talk(npc){this.game.audio.play('open');if(npc.npcType==='merchant'){this.game.ui.openPanel('shop');return true;}
    if(npc.npcType==='guild'){this.game.quests.setTracked('first_song');this.game.ui.openPanel('quests');return true;}
    if(npc.npcType==='cartographer'){this.game.world.markLandmark('shrine');this.game.ui.openPanel('map');return true;}
    return false;
  }
}
