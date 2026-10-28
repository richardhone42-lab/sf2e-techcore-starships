/** Starfinder Tech Core pp. 191–193. Base damage at commercial grade. */
export const WEAPONS=Object.freeze([
 ['Acid capsule launcher','1d8','acid',4,'simple'],['Asteroid breacher','1d6','piercing',3,'simple'],['Coilgun','1d6','piercing',3,'simple'],
 ['Fragment launcher','1d8','piercing',2,'simple'],['Light laser cannon','1d8','fire',5,'simple'],['Pulsecaster cannon','1d6','electricity',3,'simple'],['Starballista','1d10','piercing',6,'simple'],
 ['Chain repeater','1d8','piercing',2,'martial'],['Disruptor rifle','1d10','electricity',8,'martial'],['Farseeker missiles','1d8','piercing',6,'martial'],
 ['Hypervelocity macron accelerator','1d10','electricity',2,'martial'],['Polarizing beam','1d8','electricity',2,'martial'],['Pulse beam cannon','1d8','electricity',3,'martial'],
 ['Aeon cannon','1d6','fire',4,'advanced'],['Artillery cannon','1d10','fire',6,'advanced'],['Gravity cannon','1d10','bludgeoning',5,'advanced'],['Magnetar rail','1d12','piercing',6,'advanced']
].map(([name,damage,type,range,proficiency])=>Object.freeze({name,damage,type,range,proficiency})));
export const DRONES=Object.freeze(['Pyrotechnics Drone','Repair Drone','Scramble Drone']);
export const ESCAPE_PODS=Object.freeze([
 {name:'Standard',minLevel:1},{name:'Executive Escape Pod',minLevel:1},{name:'Explorer Survival Pod',minLevel:1},
 {name:'Interplanar Pod',minLevel:15},{name:'Magnepod',minLevel:3},{name:'Telepod',minLevel:13}
]);
export function validateEquipment(ship){
 const warnings=[];
 if(ship.escapePod&&!ESCAPE_PODS.some(p=>p.name===ship.escapePod))warnings.push({code:'ESCAPE_POD',message:'Unknown escape pod type.'});
 const pod=ESCAPE_PODS.find(p=>p.name===ship.escapePod);
 if(pod&&Number(ship.level)<pod.minLevel)warnings.push({code:'ESCAPE_POD_LEVEL',message:`${pod.name} requires level ${pod.minLevel}.`});
 for(const [i,station] of (ship.stationBuilds??[]).entries()){
  if(station.type==='Gunnery')for(const w of station.weapons??[]){
   if(!WEAPONS.some(x=>x.name===w))warnings.push({code:'WEAPON',message:`Station ${i+1}: unknown weapon ${w}.`});
  }
  if(station.type!=='Gunnery'&&(station.weapons??[]).length)warnings.push({code:'WEAPON_STATION',message:`Station ${i+1}: weapons require Gunnery.`});
  if(station.type==='Drone Console')for(const d of station.drones??[]){
   if(!DRONES.includes(d))warnings.push({code:'DRONE',message:`Station ${i+1}: unknown drone ${d}.`});
  }
  if(station.type!=='Drone Console'&&(station.drones??[]).length)warnings.push({code:'DRONE_STATION',message:`Station ${i+1}: drones require a Drone Console.`});
 }
 return warnings;
}
