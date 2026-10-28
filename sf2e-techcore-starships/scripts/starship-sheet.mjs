import {FRAME_STATS, SENSOR_BASE} from "./frame-data.mjs";
import {BAY_CATALOG,validateConstruction} from "./construction-rules.mjs";
import {CATALOG,STATION_TYPES as RULE_STATION_TYPES} from "./station-rules.mjs";
import {WEAPONS,DRONES,ESCAPE_PODS} from "./equipment-data.mjs";
import {applyFrameStats,applyIncomingDamage,validateOverride} from "./ship-state.mjs";
/* SF2E Tech Core Starship Sheets - Foundry V14 */
const MODULE_ID = "sf2e-techcore-starships";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { DocumentSheetConfig } = foundry.applications.apps;

const STATIONS = [
  {id:"pilot",name:"Primary Pilot's Console",deck:"Upper",upgrade:"Advanced",operator:"",gear:"Advanced Thasteron Afterburner; Commercial Nova Prow",actions:[
    {name:"Boost Thrusters",cost:"1",description:"Move up to Speed in current heading."},
    {name:"Change Heading",cost:"1",description:"Reverse heading; remove off-kilter."},
    {name:"Evade",cost:"1–2",description:"+1 circumstance AC for 1 round (+2 if two actions)."},
    {name:"Juke",cost:"1",description:"Piloting check vs target Perception DC; off-guard/off-kilter on success."},
    {name:"Stick to Cover",cost:"1",description:"Gain situational +2 AC and Reflex against attacks."},
    {name:"Clear a Path",cost:"1",description:"Piloting vs target Reflex DC in same zone."},
    {name:"Smoke and Mirrors",cost:"R",description:"Redirect a missed Strike to another ship in your zone."},
    {name:"Thasteron Burst",cost:"2",description:"Once per 10 minutes: Boost Thrusters, +1 Speed; other ships in starting zone basic Fortitude vs Piloting DC; 1d12 fire.",roll:"1d12[fire]"},
    {name:"Nova Ram (graviton)",cost:"2",description:"Boost Thrusters then collide; target basic Fortitude vs solarian class DC; 2d8 bludgeoning.",roll:"2d8[bludgeoning]"},
    {name:"Nova Ram (photon)",cost:"2",description:"Boost Thrusters then collide; target basic Reflex vs solarian class DC; 2d8 fire.",roll:"2d8[fire]"}
  ]},
  {id:"generator",name:"Generator",deck:"Upper",upgrade:"Advanced",operator:"",gear:"Tactical Pulse Shield; Solar Generator Crystal",actions:[
    {name:"Generate Shields",cost:"1",description:"Restore 3d4 Shield Points at level 6 (apply manually).",roll:"3d4"},
    {name:"Reposition Shield",cost:"1",description:"Crafting or Perception vs attacker's Reflex DC; apply according to Tech Core."},
    {name:"Vent Power",cost:"2",description:"Level 6: 2d10 fire; adjudicate saves and effects by rules.",roll:"2d10[fire]"},
    {name:"Shield Pulse",cost:"1",description:"Requires full SP; spend SP to affect ships. Tactical upgrade can exclude ships or extend range."},
    {name:"Nova Shield",cost:"1",description:"Solarian solar shield feature; once per 10 minutes."}
  ]},
  {id:"gunnery",name:"Gunnery",deck:"Lower",upgrade:"Advanced",operator:"",gear:"Advanced Light Laser Cannon; Advanced Fragment Launcher; Secondary Armaments; Advanced Starship Weapon Crystal",actions:[
    {name:"Light Laser Cannon damage",cost:"1",description:"Tracking +1; 2d8 fire; range 5 zones. Make the attack from the operator's character sheet.",roll:"2d8[fire]"},
    {name:"Fragment Launcher damage",cost:"2",description:"Tracking +1; 2d8 piercing; range 2 zones; area cone. Resolve Area Fire per rules.",roll:"2d8[piercing]"},
    {name:"Lock On",cost:"1",description:"Target takes -1 status AC and -1 circumstance Reflex vs your weapons until end of turn."},
    {name:"Target Battle Station",cost:"1",description:"Use station targeting procedure from Tech Core."},
    {name:"Switch Armament",cost:"1",description:"Interact to change active weapon (Secondary Armaments)."},
    {name:"Nova Weapon",cost:"Free",description:"Manifest solarian weapon scaled to ship."},
    {name:"Nova Strike",cost:"1",description:"Make melee Strike in same zone with nova weapon."},
    {name:"Nova Blast",cost:"1",description:"Solar flare option; attack and damage depend on solarian abilities."},
    {name:"Nova Surge",cost:"R",description:"Reaction Strike using nova weapon when triggered."}
  ]},
  {id:"scanners",name:"Scanners & Comms",deck:"Upper",upgrade:"Advanced",operator:"",gear:"Communications Overlay; Tactical Security Relay",actions:[
    {name:"Seek Starships",cost:"1",description:"Search for hidden or undetected starships."},
    {name:"Target Lock",cost:"1",description:"Improve targeting according to station action."},
    {name:"Scan Target",cost:"1",description:"Learn information about target ship."},
    {name:"Hack Comms",cost:"1",description:"Attempt a computer-based communications intrusion."},
    {name:"Hack Battle Station",cost:"1",description:"Disrupt target battle station."},
    {name:"Hack Munition",cost:"1",description:"Disrupt incoming munition."},
    {name:"Security Scan",cost:"1",description:"Tactical Security Relay action."}
  ]},
  {id:"magic",name:"Magic Conduit",deck:"Upper",upgrade:"Advanced",operator:"",gear:"Witchwarper Magic Module; Tactical Tangle Ward",actions:[
    {name:"Counter Magic",cost:"R",description:"Counter starship magic using station rules."},
    {name:"Scan for Magic",cost:"1",description:"Detect magic affecting a starship."},
    {name:"Warp Space and Time",cost:"Varies",description:"Witchwarper Magic Module action; refer to Tech Core."},
    {name:"Snare Boarders",cost:"Varies",description:"Tactical Tangle Ward action; refer to Tech Core."},
    {name:"Cast Starship Spell",cost:"Varies",description:"Use caster's spell slot and applicable starship spell rules."}
  ]},
  {id:"auxpilot",name:"Emergency Pilot's Console",deck:"Lower",upgrade:"Advanced",operator:"",gear:"Rotational Thrusters; Solar Thrusters",actions:[
    {name:"Boost Thrusters",cost:"1",description:"Move up to Speed in current heading."},
    {name:"Change Heading",cost:"1",description:"Reverse heading; remove off-kilter."},
    {name:"Evade",cost:"1–2",description:"Circumstance AC bonus."},
    {name:"Juke",cost:"1",description:"Piloting vs Perception DC."},
    {name:"Uncanny Turn",cost:"R",description:"Rotational Thrusters; once per round when Boost Thrusters."},
    {name:"Nova Dash",cost:"2",description:"Solarian Solar Thrusters action."}
  ]}
];
const BAY_OPTIONS = BAY_CATALOG.map(x=>x.id);
const STATION_TYPES = RULE_STATION_TYPES;
const STATION_DEFAULTS = ["Pilot’s Console","Generator","Gunnery","Scanners","Magic Conduit","Pilot’s Console"];
const MAX_UPGRADES = 6;
function defaultBuilds(frame="Explorer",level=1){
 const result=STATION_DEFAULTS.map(type=>({type,upgrades:[],capacity:stationGrade(type,level).slots}));
 if(frame==="Explorer")result[1].upgrades=[{id:"pulse-shield",grade:"commercial"}];
 if(frame==="Bulwark")result[0].upgrades=[{id:"ramming-prow",grade:"commercial"}];
 if(frame==="Skirmisher")result[0].upgrades=[{id:"rotational-thrusters",grade:""}];
 return result;
}
const GRADE_NAMES=["Commercial","Tactical","Advanced","Superior","Elite","Ultimate","Paragon"];
function stationGrade(type,level){
  const cutoffs=(type==="Gunnery"||type==="Drone Console")?[1,2,4,10,12,16,19]:[1,2,5,8,11,14,18];
  let idx=0; for(let i=0;i<cutoffs.length;i++)if(level>=cutoffs[i])idx=i;
  return {name:GRADE_NAMES[idx],slots:idx>=6?4:idx>=4?3:idx>=2?2:idx>=1?1:0};
}
const UPGRADE_ACTIONS={
 "pulse-shield":["Shield Pulse"],"thasteron-afterburner":["Thasteron Burst"],"nova-prow":["Nova Ram"],
 "ramming-prow":["Ram"],"rotational-thrusters":["Uncanny Turn"],"solar-thrusters":["Nova Dash"],
 "powerful-thrusters":["Overload Thrusters"],"solar-generator":["Nova Shield"],"tractor-beam":["Tractor Beam"],
 "primal-shielding":["Primal Shielding"],"secondary-armaments":["Switch Armament"],
 "starship-weapon-crystal":["Nova Weapon","Nova Strike","Nova Blast","Nova Surge"],
 "security-relay":["Security Scan"],"cloaking-unit":["Cloak Starship"],
 "witchwarper-module":["Warp Space and Time"],"mystic-module":["Mystic Magic Module"],
 "technomancer-module":["Overclock Magic Conduit"],"technomancer-module-graded":["Overclock Magic Conduit"],
 "tangle-ward":["Snare Boarders"],"drone-shield":["Fetch and Fix"],"mine-shell":["Install Mine"],
 "pet-shell":["Onboard Pet"],"gravity-toggle":["Switch Gravity"],"mechanic-module":["Mechanic Module"],
 "operators-switchboard":["Boost Battle Station"],"towing-winch":["Towing Winch"],
 "gunnery-turret":["Gunnery Turret"],"munitions-deflection":["Deflect Munition"],
 "ordnance-hinges":["Ordnance Hinges"],"communications-overlay":["Hack Comms"]
};
function builtActions(build,level){
 const grade=stationGrade(build.type,level);
 const names=[...(GENERIC_ACTIONS[build.type]??[])];
 for(const u of build.upgrades??[])for(const name of UPGRADE_ACTIONS[u.id]??[])if(!names.includes(name))names.push(name);
 const actions=names.map(name=>({name,cost:'See Tech Core',description:'Resolve using the operator’s character statistics and Tech Core station action.'}));
 if(build.type==='Generator'){
  const dice=1+Math.floor((level-1)/2);
  const action=actions.find(a=>a.name==='Generate Shields');if(action){action.roll=`${dice}d4`;action.cost='1';}
 }
 if(build.type==='Gunnery'){
  for(const wname of build.weapons??[]){
   const w=WEAPONS.find(x=>x.name===wname);if(!w)continue;
   // The ship's station grade controls improvements; show base damage to avoid guessing modifiers.
   actions.push({name:`${w.name} (base damage)`,cost:'Strike / Area Fire',description:`${w.proficiency} weapon; range ${w.range} zones. Apply weapon grade, tracking and damage improvements per Tech Core.`,roll:`${w.damage}[${w.type}]`});
  }
 }
 if(build.type==='Drone Console')for(const name of build.drones??[])actions.push({name,cost:'Drone',description:'Deploy and operate this drone using Tech Core drone actions.'});
 return actions;
}
const GENERIC_ACTIONS={
 "Pilot’s Console":["Boost Thrusters","Change Heading","Evade","Juke"],
 "Generator":["Generate Shields","Reposition Shield","Vent Power"],
 "Gunnery":["Strike","Area Fire","Lock On","Target Battle Station"],
 "Scanners":["Seek Starships","Scan Target","Target Lock","Hack Comms"],
 "Magic Conduit":["Counter Magic","Scan for Magic","Cast Starship Spell"],
 "Drone Console":["Command Drone","Deploy Drone","Recall Drone"]
};
const BASE = {
  frame:"Explorer",level:6,hp:90,hpMax:90,sp:42,spMax:42,ac:21,fort:14,ref:14,will:15,
  speed:3,sensors:8,zone:6,heading:"right",condition:"",notes:"",bays:"",crewQuarters:"Bunks",passengerQuarters:"Basic",gmOverride:false,overrideReason:"",escapePod:"Standard",baySlots:["Unassigned","Unassigned","Unassigned","Unassigned"],
  stations:STATIONS.map(s=>({id:s.id,operator:"",notes:""})),
  stationBuilds:defaultBuilds("Explorer",6)
};
const FIELDS = ["frame","level","hp","hpMax","sp","spMax","ac","fort","ref","will","speed","sensors","zone","heading","condition","notes","bays","crewQuarters","passengerQuarters","overrideReason","escapePod"];
const NUMERIC = new Set(["level","hp","hpMax","sp","spMax","ac","fort","ref","will","speed","sensors","zone"]);
function dataFor(actor){
  const stored = actor.getFlag(MODULE_ID,"starship") ?? {};
  const data = foundry.utils.mergeObject(foundry.utils.deepClone(BASE),stored,{inplace:false});
  if(!data.escapePod)data.escapePod="Standard";
  if(!Array.isArray(data.baySlots)) data.baySlots=["Unassigned","Unassigned","Unassigned","Unassigned"];
  if(!Array.isArray(data.stationBuilds)) data.stationBuilds=defaultBuilds(data.frame,data.level);
  data.stationBuilds=STATION_DEFAULTS.map((type,i)=>({type,upgrades:[],capacity:null,...(data.stationBuilds[i]??{})}));
  return data;
}
class TechCoreStarshipSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes:["sf2e-techcore-sheet"],
    position:{width:920,height:760},
    window:{resizable:true},
    form:{submitOnChange:false,closeOnSubmit:false},
    actions:{
      save: TechCoreStarshipSheet.save,
      roll: TechCoreStarshipSheet.roll,
      tab: TechCoreStarshipSheet.tab,
      damage: TechCoreStarshipSheet.damage,
      repair: TechCoreStarshipSheet.repair,
      applyFrame: TechCoreStarshipSheet.applyFrame,
      refreshBuilder: TechCoreStarshipSheet.refreshBuilder,
      exportShip: TechCoreStarshipSheet.exportShip,
      importShip: TechCoreStarshipSheet.importShip
    }
  };
  static PARTS = {main:{template:`modules/${MODULE_ID}/templates/starship.hbs`}};
  constructor(options={}){super(options);this.activeTab="overview";}
  get title(){return `${this.actor.name} — Tech Core Starship`}
  async _prepareContext(options){
    const context = await super._prepareContext(options);
    const data = this._pending ?? dataFor(this.actor);
    const stations=data.stationBuilds.map((build,i)=>{
      const preset=STATIONS[i];const matchingPreset=preset && STATION_DEFAULTS[i]===build.type;
      const info=data.stations[i]??{};
      return {id:preset?.id??String(i),name:matchingPreset?preset.name:`${build.type} · Station ${i+1}`,deck:info.deck|| (matchingPreset?preset.deck:""),upgrade:stationGrade(build.type,Number(data.level)).name,
        operator:info.operator??"",notes:info.notes??"",gear:(build.upgrades??[]).map(u=>u.custom?u.name:(CATALOG.find(x=>x.id===u.id)?.name??u.id)).join("; ")||info.gear||"None selected",
        actions:builtActions(build,Number(data.level))};
    });
    const bayCount = 4 + (data.crewQuarters === "Comfortable" ? 1 : 0);
    const bays = Array.from({length:bayCount},(_,i)=>({index:i,selected:data.baySlots[i]??"Unassigned",options:BAY_OPTIONS.map(name=>({name,selected:name===(data.baySlots[i]??"Unassigned")}))}));
    const frames = Object.keys(FRAME_STATS).map(name=>({name,selected:name===data.frame}));
    const stationTypes = STATION_TYPES;
    const stationBuildRows=data.stationBuilds.map((build,index)=>({
      isGunnery:build.type==="Gunnery",isDrone:build.type==="Drone Console",
      weaponOptions:WEAPONS.map(w=>({name:w.name,selected:(build.weapons??[]).includes(w.name)})),
      droneOptions:DRONES.map(name=>({name,selected:(build.drones??[]).includes(name)})),
      index,number:index+1,type:build.type,capacity:stationGrade(build.type,Number(data.level)).slots,grade:stationGrade(build.type,Number(data.level)).name,
      types:stationTypes.map(name=>({name,selected:name===build.type})),
      upgrades:Array.from({length:MAX_UPGRADES},(_,j)=>{
        const selected=build.upgrades?.[j]??{id:"",grade:""};
        const catalog=CATALOG.filter(item=>item.station===build.type);
        const item=catalog.find(x=>x.id===selected.id);
        return {index:j,number:j+1,selected:selected.id,grade:selected.grade??"",
          options:[{id:"",name:"— None —",selected:!selected.id&&!selected.custom},...catalog.map(x=>({id:x.id,name:x.name,selected:x.id===selected.id})),{id:"__custom__",name:"Custom / GM homebrew",selected:!!selected.custom}],custom:!!selected.custom,customName:selected.name??"",customCost:selected.cost??0,
          grades:item?.grades?.map(g=>({name:g.grade,selected:g.grade===selected.grade}))??[],
          isGraded:!!item?.grades};
      })
    }));
    return {...context,actor:this.actor,ship:data,stations,canEdit:this.actor.isOwner,activeTab:this.activeTab,
      isOverview:this.activeTab==="overview",isStations:this.activeTab==="stations",isNotes:this.activeTab==="notes",
      bays,frames,stationTypes,stationBuildRows,constructionWarnings:validateConstruction(data),hasWarnings:validateConstruction(data).length>0,overrideChecked:!!data.gmOverride,bayCatalog:BAY_CATALOG,crewQuartersOptions:["Bunks","Budget","Comfortable","Extravagant"].map(name=>({name,selected:name===data.crewQuarters})),
      passengerOptions:["Basic","Prison","Luxury"].map(name=>({name,selected:name===data.passengerQuarters})),
      isBuilder:this.activeTab==="builder",escapePodOptions:ESCAPE_PODS.map(({name})=>({name,selected:name===data.escapePod})),headingLeft:data.heading==="left",headingRight:data.heading!=="left"};
  }
  _onRender(context,options){
    super._onRender(context,options);
    const root=this.element;
    root.querySelectorAll("input, textarea, select").forEach(el=>{
      if(!this.actor.isOwner || (el.hasAttribute("data-gm-override") && !game.user.isGM)
        || (!game.user.isGM && (el.closest('.tc-builder-only') || el.hasAttribute('data-actor-name')))) el.disabled=true;
    });
  }
  static tab(event,target){
    const form=this.element.querySelector("form");
    // Preserve unsaved edits when navigating between tabs.
    if(form) this._pending = this._collect(form);
    this.activeTab=target.dataset.tab;
    this.render({force:true});
  }
  _collect(form){
    const next=foundry.utils.deepClone(this._pending ?? dataFor(this.actor));
    const override=form.querySelector("[data-gm-override]");
    if(override)next.gmOverride=override.checked;
    for(const el of form.querySelectorAll("[data-field]")){
      const key=el.dataset.field;
      let value=el.value;
      if(NUMERIC.has(key)) value=Number.isFinite(Number(value))?Number(value):0;
      next[key]=value;
    }
    for(const el of form.querySelectorAll("[data-bay-index]")){next.baySlots[Number(el.dataset.bayIndex)]=el.value;}
    for(const el of form.querySelectorAll("[data-station-field]")){
      const id=el.dataset.stationId;
      const station=next.stations.find(s=>s.id===id);
      if(station) station[el.dataset.stationField]=el.value;
    }
    for(const el of form.querySelectorAll("[data-build-type]")){
      const i=Number(el.dataset.buildType);
      if(next.stationBuilds[i].type!==el.value){next.stationBuilds[i].type=el.value;next.stationBuilds[i].upgrades=[];next.stationBuilds[i].weapons=[];next.stationBuilds[i].drones=[];}
    }
    for(const el of form.querySelectorAll("[data-build-capacity]")){
      const i=Number(el.dataset.buildCapacity);
      next.stationBuilds[i].capacity=stationGrade(next.stationBuilds[i].type,Number(next.level)).slots;
    }
    for(const el of form.querySelectorAll("[data-build-upgrade]")){
      const i=Number(el.dataset.buildUpgrade),j=Number(el.dataset.index);
      const old=next.stationBuilds[i].upgrades[j];
      const choice=CATALOG.find(item=>item.id===el.value);
      const priorGrade=old?.id===el.value ? old.grade : "";
      next.stationBuilds[i].upgrades[j]=el.value==="__custom__"
        ? {id:"custom",custom:true,name:old?.name??"",cost:old?.cost??1}
        : {id:el.value,grade:choice?.grades?.some(g=>g.grade===priorGrade)?priorGrade:(choice?.grades?.[0]?.grade??"")};
    }
    for(const el of form.querySelectorAll("[data-weapon-select]")){
      const i=Number(el.dataset.weaponSelect);next.stationBuilds[i].weapons=[...el.selectedOptions].map(x=>x.value);
    }
    for(const el of form.querySelectorAll("[data-drone-select]")){
      const i=Number(el.dataset.droneSelect);next.stationBuilds[i].drones=[...el.selectedOptions].map(x=>x.value);
    }
    for(const el of form.querySelectorAll("[data-build-grade]")){
      const i=Number(el.dataset.buildGrade),j=Number(el.dataset.index);
      if(next.stationBuilds[i].upgrades[j]) {
        const choice=next.stationBuilds[i].upgrades[j];
        const item=CATALOG.find(x=>x.id===choice.id);
        if(item?.grades?.some(g=>g.grade===el.value))choice.grade=el.value;
      }
    }
    for(const el of form.querySelectorAll("[data-custom-name]")){
      const i=Number(el.dataset.customName),j=Number(el.dataset.index);
      if(next.stationBuilds[i]?.upgrades[j]?.custom)next.stationBuilds[i].upgrades[j].name=el.value;
    }
    for(const el of form.querySelectorAll("[data-custom-cost]")){
      const i=Number(el.dataset.customCost),j=Number(el.dataset.index);
      if(next.stationBuilds[i]?.upgrades[j]?.custom)next.stationBuilds[i].upgrades[j].cost=Math.max(0,Number(el.value)||0);
    }
    for(const build of next.stationBuilds)build.upgrades=build.upgrades.filter(x=>x?.id);
    for(const build of next.stationBuilds)build.capacity=stationGrade(build.type,Number(next.level)).slots;
    return next;
  }
  static refreshBuilder(event,target){
    if(!game.user.isGM)return;
    const form=this.element.querySelector("form");
    if(form)this._pending=this._collect(form);
    this.render({force:true});
  }
  static async applyFrame(event,target){
    if(!game.user.isGM)return ui.notifications.warn("Only a GM can change starship construction.");
    const form=this.element.querySelector("form");
    const data=this._collect(form);
    const previousFrame=dataFor(this.actor).frame;
    if(data.frame!==previousFrame)data.stationBuilds=defaultBuilds(data.frame,data.level);
    const stats=FRAME_STATS[data.frame]?.[String(data.level)];
    if(!stats)return ui.notifications.warn("Select a supported frame and level (1–20).");
    Object.assign(data,applyFrameStats(data,stats,SENSOR_BASE[data.frame]));
    this._pending=data;this.render({force:true});
    ui.notifications.info("Frame statistics recalculated. Review any upgrades, then Save changes.");
  }
  static async save(event,target){
    if(!this.actor.isOwner) return ui.notifications.warn("Owner permission is required to edit this starship.");
    const form=this.element.querySelector("form");
    const data=this._collect(form);
    const prior=dataFor(this.actor);
    if(data.hp < 0 || data.hp > data.hpMax || data.sp < 0 || data.sp > data.spMax) return ui.notifications.warn("Hull and shield points must be between zero and their maximum values.");
    if(!game.user.isGM){
      // Non-GM owners may operate the ship but may not modify its construction.
      for(const field of ['frame','level','crewQuarters','passengerQuarters','escapePod','baySlots','stationBuilds','gmOverride','overrideReason'])
        data[field]=foundry.utils.deepClone(prior[field]);
    }
    // A player cannot authorise new exceptions. Existing GM-approved exceptions
    // remain usable only while the construction remains unchanged.
    const check=validateOverride(validateConstruction(data),data,game.user.isGM || (prior.gmOverride && !!prior.overrideReason));
    if(!check.ok)return ui.notifications.warn(check.reason);
    
    const nameInput=form.querySelector("[data-actor-name]");
    if(game.user.isGM && nameInput?.value?.trim() && nameInput.value.trim()!==this.actor.name)await this.actor.update({name:nameInput.value.trim()});
    await this.actor.setFlag(MODULE_ID,"starship",data);
    this._pending=null;
    this.render({force:true});
    ui.notifications.info(`${this.actor.name} saved.`);
  }
  static exportShip(event,target){
    const form=this.element.querySelector("form");
    const data=form?this._collect(form):dataFor(this.actor);
    foundry.utils.saveDataToFile(JSON.stringify({format:"sf2e-techcore-starship",version:1,name:this.actor.name,ship:data},null,2),"application/json",`${this.actor.name.replace(/[^a-z0-9-_]/gi,"-")}-starship.json`);
  }
  static async importShip(event,target){
    if(!game.user.isGM)return ui.notifications.warn("Only a GM can import a starship build.");
    const input=document.createElement("input");input.type="file";input.accept=".json,application/json";
    input.onchange=async()=>{
      try{
        const file=input.files?.[0];if(!file)return;
        const parsed=JSON.parse(await file.text());
        if(parsed.format!=="sf2e-techcore-starship"||!parsed.ship||typeof parsed.ship!=="object")throw Error("Not a Tech Core starship export.");
        const incoming=foundry.utils.mergeObject(foundry.utils.deepClone(BASE),parsed.ship,{inplace:false});
        if(!FRAME_STATS[incoming.frame]?.[String(incoming.level)])throw Error("Unsupported frame or level.");
        this._pending=incoming;this.render({force:true});
        ui.notifications.info("Imported into the sheet. Review and Save changes to commit.");
      }catch(e){ui.notifications.error(`Import failed: ${e.message}`)}
    };input.click();
  }
  static async roll(event,target){
    let formula=target.dataset.formula;
    if(!formula) return;
    // Save rolls use the current values on the sheet, not the last render.
    const label=target.dataset.label;
    const saveKey={"Fortitude save":"fort","Reflex save":"ref","Will save":"will"}[label];
    if(saveKey){
      const form=this.element.querySelector("form");
      const current=form?this._collect(form):dataFor(this.actor);
      const modifier=Number(current[saveKey]);
      if(!Number.isFinite(modifier))return ui.notifications.error("Invalid save modifier.");
      formula=`1d20${modifier>=0?"+":""}${modifier}`;
    }
    try{
      const roll=await new Roll(formula).evaluate();
      await roll.toMessage({speaker:ChatMessage.getSpeaker({actor:this.actor}),flavor:`${this.actor.name}: ${target.dataset.label||"Starship roll"}`});
    }catch(err){console.error(err);ui.notifications.error(`Roll failed: ${err.message}`)}
  }
  static async damage(event,target){
    if(!this.actor.isOwner)return;
    const amount=Number(this.element.querySelector("[name='quickAmount']")?.value)||0;
    if(amount<=0)return;
    const data=this._collect(this.element.querySelector("form"));
    Object.assign(data,applyIncomingDamage(data,amount));
    await this.actor.setFlag(MODULE_ID,"starship",data);
    this._pending=null;
    this.render({force:true});
  }
  static async repair(event,target){
    if(!this.actor.isOwner)return;
    const amount=Number(this.element.querySelector("[name='quickAmount']")?.value)||0;
    if(amount<=0)return;
    const data=this._collect(this.element.querySelector("form"));
    const stat=target.dataset.stat;
    if(!["sp","hp"].includes(stat))return;
    data[stat]=Math.min(data[stat+"Max"],data[stat]+amount);
    await this.actor.setFlag(MODULE_ID,"starship",data);
    this._pending=null;
    this.render({force:true});
  }
}
Hooks.once("init",()=>{
  if(game.system.id!=="sf2e")return;
  DocumentSheetConfig.registerSheet(Actor,MODULE_ID,TechCoreStarshipSheet,{
    types:["npc"],makeDefault:false,label:"Tech Core Starship Sheet"
  });
});
Hooks.once("ready",()=>{
  if(game.system.id!=="sf2e")return;
  game.modules.get(MODULE_ID).api={
    Sheet:TechCoreStarshipSheet,
    async createStarship(name="New Starship",frame="Explorer",level=1){
      if(!game.user.isGM)throw new Error("Only a GM can create a starship.");
      if(!FRAME_STATS[frame]?.[String(level)])throw new Error("Unsupported frame or level.");
      const data=foundry.utils.deepClone(BASE);
      data.frame=frame;data.level=level;Object.assign(data,FRAME_STATS[frame][String(level)]);
      data.hp=data.hpMax;data.sp=data.spMax;data.sensors=SENSOR_BASE[frame];
      data.stations=STATIONS.map(s=>({id:s.id,operator:"",notes:"",gear:"",deck:"",upgrade:"Commercial"}));
      data.stationBuilds=defaultBuilds(frame,level);
      const actor=await Actor.create({name,type:"npc",img:"icons/svg/ship.svg"});
      await actor.setFlag(MODULE_ID,"starship",data);
      await actor.setFlag("core","sheetClass",`${MODULE_ID}.TechCoreStarshipSheet`);
      new TechCoreStarshipSheet({document:actor}).render({force:true});
      return actor;
    },
    async openStarship(actor){
      if(!actor?.getFlag(MODULE_ID,"starship"))throw Error("This actor has no Tech Core starship data.");
      return new TechCoreStarshipSheet({document:actor}).render({force:true});
    },
    async createSunriseMaiden(){
      if(!game.user.isGM)throw new Error("Only a GM can create the starter ship.");
      let actor=game.actors.find(a=>a.name==="Sunrise Maiden"&&a.getFlag(MODULE_ID,"starship"));
      if(!actor){
        actor=await Actor.create({name:"Sunrise Maiden",type:"npc",img:"icons/svg/ship.svg"});
        const preset=foundry.utils.deepClone(BASE);
        preset.stationBuilds[0].upgrades=[{id:"thasteron-afterburner",grade:"advanced"},{id:"nova-prow",grade:"commercial"}];
        preset.stationBuilds[1].upgrades=[{id:"pulse-shield",grade:"tactical"},{id:"solar-generator",grade:""}];
        preset.stationBuilds[2].weapons=["Light laser cannon","Fragment launcher"];
        preset.stationBuilds[2].upgrades=[{id:"secondary-armaments",grade:""},{id:"starship-weapon-crystal",grade:"advanced"}];
        preset.stationBuilds[3].upgrades=[{id:"communications-overlay",grade:""},{id:"security-relay",grade:"tactical"}];
        preset.stationBuilds[4].upgrades=[{id:"witchwarper-module",grade:""},{id:"tangle-ward",grade:"tactical"}];
        preset.stationBuilds[5].upgrades=[{id:"rotational-thrusters",grade:""},{id:"solar-thrusters",grade:""}];
        preset.sensors=8; preset.sensorBase=6;
        await actor.setFlag(MODULE_ID,"starship",preset);
        await actor.setFlag("core","sheetClass",`${MODULE_ID}.TechCoreStarshipSheet`);
      }
      const sheet=new TechCoreStarshipSheet({document:actor});
      sheet.render({force:true});
      return actor;
    }
  };
  Hooks.on("updateActor",(actor,changes)=>{
    if(!foundry.utils.getProperty(changes,`flags.${MODULE_ID}.starship`))return;
    for(const app of Object.values(ui.windows??{})){
      if(app instanceof TechCoreStarshipSheet && app.actor?.id===actor.id && !app._pending)app.render({force:true});
    }
  });
});
