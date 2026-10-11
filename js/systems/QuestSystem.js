import { QUESTS } from '../data/quests.js';

export class QuestSystem {
  constructor(game) {
    this.game=game;this.quests={};
    for(const q of Object.values(QUESTS))this.quests[q.id]={id:q.id,state:'active',tracked:Boolean(q.tracked),objectives:Object.fromEntries(q.objectives.map(o=>[o.id,0]))};
  }
  definition(id) { return QUESTS[id]; }
  state(id) { return this.quests[id]; }
  all() { return Object.values(QUESTS).map(def=>({definition:def,state:this.quests[def.id]})).filter(q=>q.state); }
  tracked() { return this.all().find(q=>q.state.tracked&&q.state.state!=='claimed')||this.all().find(q=>q.state.state==='active')||this.all().find(q=>q.state.state==='ready')||null; }
  progress(event,target,amount=1) {
    for(const def of Object.values(QUESTS)){
      const state=this.quests[def.id];if(!state||state.state!=='active')continue;
      for(const objective of def.objectives){
        if(objective.event!==event||objective.target!==target)continue;
        const old=state.objectives[objective.id]||0;state.objectives[objective.id]=Math.min(objective.required,old+amount);
      }
      const finished=def.objectives.every(o=>(state.objectives[o.id]||0)>=o.required);
      if(finished){state.state='ready';this.game.audio.play('quest');this.game.ui.toast(`QUEST READY · ${def.title}`,'success');}
    }
    this.game.ui?.refreshQuestTracker();if(this.game.ui?.activePanel==='quests')this.game.ui.renderQuests();this.game.save();
  }
  progressData(event,target,amount=1) { this.progress(event,target,amount); }
  setTracked(id) {const entry=this.quests[id];if(!entry)return;for(const q of Object.values(this.quests))q.tracked=false;entry.tracked=true;this.game.ui.refreshQuestTracker();if(this.game.ui.activePanel==='quests')this.game.ui.renderQuests();}
  claim(id) {
    const def=QUESTS[id],state=this.quests[id];if(!def||!state||state.state!=='ready')return false;
    const reward=def.rewards;this.game.gainXP(reward.xp||0);this.game.state.gold+=reward.gold||0;
    for(const item of reward.items||[])this.game.inventory.add(item.id,item.qty||1,false);
    if(reward.randomWeapon)this.game.inventory.randomRewardWeapon();
    state.state='claimed';this.game.audio.play('quest');this.game.ui.toast(`REWARD CLAIMED · +${reward.gold||0} GOLD`,'success');this.game.ui.updateHUD();this.game.ui.renderQuests();this.game.save();return true;
  }
  snapshot() { return JSON.parse(JSON.stringify(this.quests)); }
  restore(data) {
    if(!data)return;
    for(const def of Object.values(QUESTS)){
      const source=data[def.id];if(!source)continue;
      const target=this.quests[def.id];if(['active','ready','claimed'].includes(source.state))target.state=source.state;target.tracked=Boolean(source.tracked);
      for(const obj of def.objectives)target.objectives[obj.id]=Math.max(0,Math.min(obj.required,Number(source.objectives?.[obj.id])||0));
    }
  }
}
