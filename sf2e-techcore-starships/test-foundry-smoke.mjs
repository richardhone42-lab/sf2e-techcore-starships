import assert from 'node:assert/strict';
const hooks={};
class Sheet {constructor(options={}){this.document=options.document;this.actor=options.document;this.element={};} render(){return this;} async _prepareContext(){return {};} _onRender(){} }
const utils={deepClone:structuredClone,mergeObject:(a,b)=>({...a,...structuredClone(b)}),getProperty:(obj,path)=>path.split('.').reduce((o,k)=>o?.[k],obj)};
globalThis.foundry={utils,applications:{api:{HandlebarsApplicationMixin:Base=>Base},sheets:{ActorSheetV2:Sheet},apps:{DocumentSheetConfig:{registerSheet(...args){assert.equal(args[0],Actor);}}}}};
globalThis.Actor=class {
  static async create(data){return new this(data)}
  constructor(data){this.name=data.name;this.id='mock-actor';this.flags={};this.isOwner=true;}
  async setFlag(scope,key,value){(this.flags[scope]??={})[key]=structuredClone(value);}
  getFlag(scope,key){return this.flags[scope]?.[key];}
};
globalThis.Hooks={once:(name,cb)=>{hooks[name]=cb},on:()=>{}};
globalThis.game={actors:{find:()=>null},system:{id:'sf2e'},user:{isGM:true},modules:new Map([['sf2e-techcore-starships',{api:null}]])};
await import('./scripts/starship-sheet.mjs');
assert.equal(typeof hooks.init,'function');
assert.equal(typeof hooks.ready,'function');
hooks.init();hooks.ready();
const api=game.modules.get('sf2e-techcore-starships').api;
assert.equal(typeof api.createStarship,'function');
assert.equal(typeof api.createSunriseMaiden,'function');
assert.equal(typeof api.openStarship,'function');
const newShip=await api.createStarship('Test Ship','Explorer',6);
assert.equal(newShip.getFlag('sf2e-techcore-starships','starship').hpMax,90);
const maiden=await api.createSunriseMaiden();
assert.equal(maiden.getFlag('sf2e-techcore-starships','starship').stationBuilds.length,6);
console.log('Foundry API registration smoke test passed (mock runtime, not live Foundry).');
