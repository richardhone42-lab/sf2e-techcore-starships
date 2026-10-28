/** Source: Starfinder Tech Core pp. 184–193. Printed UPGRADE numbers are item levels, NOT slot costs.
 * This catalogue is limited to entries whose printed upgrade levels
 * and prerequisites have been checked; unlisted entries are not silently accepted.
 */
export const STATION_TYPES = Object.freeze(['Pilot’s Console','Generator','Gunnery','Scanners','Magic Conduit','Drone Console']);
export const UPGRADES = Object.freeze([
 ['drone-shield','Drone Shield Protocol','Drone Console',0,0],
 ['mine-shell','Mine Deployment Shell','Drone Console',0,0],
 ['pet-shell','Pet Drone Shell','Drone Console',3,0],
 ['gravity-toggle','Gravity Toggle','Generator',1,0],
 ['mechanic-module','Mechanic Generator Module','Generator',1,0],
 ['operators-switchboard','Operator’s Switchboard','Generator',3,0],
 ['primal-shielding','Primal Shielding','Generator',5,0],
 ['tractor-beam','Tractor Beam','Generator',4,0],
 ['solar-generator','Solar Generator Crystal','Generator',1,0],
 ['gunnery-turret','Gunnery Turret Mount','Gunnery',0,0],
 ['munitions-deflection','Munitions Deflection Unit','Gunnery',0,0],
 ['ordnance-hinges','Ordnance Hinges','Gunnery',0,0],
 ['secondary-armaments','Secondary Armaments','Gunnery',0,0],
 ['towing-winch','Towing Winch','Gunnery',1,0],
 ['mystic-module','Mystic Magic Module','Magic Conduit',0,0],
 ['witchwarper-module','Witchwarper Magic Module','Magic Conduit',0,0],
 ['rotational-thrusters','Rotational Thrusters','Pilot’s Console',0,0],
 ['solar-thrusters','Solar Thrusters','Pilot’s Console',2,0],
 ['powerful-thrusters','Powerful Thrusters','Pilot’s Console',0,0],
 ['communications-overlay','Communications Overlay','Scanners',0,0],
 ['technomancer-module','Technomancer Magic Module','Magic Conduit',0,0]
].map(([id,name,station,minLevel])=>Object.freeze({id,name,station,cost:1,minLevel})));
export const GRADED_UPGRADES = Object.freeze([
 {id:'pulse-shield',name:'Pulse Shield',station:'Generator',grades:[{grade:'commercial',minLevel:1,cost:1},{grade:'tactical',minLevel:5,cost:1},{grade:'advanced',minLevel:8,cost:1}]},
 {id:'tangle-ward',name:'Tangle Ward',station:'Magic Conduit',grades:[{grade:'commercial',minLevel:0,cost:1},{grade:'tactical',minLevel:5,cost:1},{grade:'advanced',minLevel:11,cost:1},{grade:'superior',minLevel:16,cost:1}]},
 {id:'thasteron-afterburner',name:'Thasteron Afterburner',station:'Pilot’s Console',grades:[{grade:'commercial',minLevel:1,cost:1},{grade:'tactical',minLevel:2,cost:1},{grade:'advanced',minLevel:4,cost:1},{grade:'superior',minLevel:10,cost:1},{grade:'elite',minLevel:12,cost:1},{grade:'ultimate',minLevel:12,cost:1},{grade:'paragon',minLevel:19,cost:1}]},
 {id:'nova-prow',name:'Nova Prow',station:'Pilot’s Console',grades:[{grade:'commercial',minLevel:5,cost:1},{grade:'tactical',minLevel:9,cost:1},{grade:'advanced',minLevel:13,cost:1},{grade:'superior',minLevel:16,cost:1},{grade:'elite',minLevel:19,cost:1}]},
 {id:'security-relay',name:'Security Relay',station:'Scanners',grades:[{grade:'commercial',minLevel:0,cost:1},{grade:'tactical',minLevel:6,cost:1}]},
 {id:'ramming-prow',name:'Ramming Prow',station:'Pilot’s Console',grades:[{grade:'commercial',minLevel:5,cost:1},{grade:'tactical',minLevel:9,cost:1},{grade:'advanced',minLevel:13,cost:1},{grade:'superior',minLevel:16,cost:1},{grade:'elite',minLevel:19,cost:1}]},
 {id:'starship-weapon-crystal',name:'Starship Weapon Crystal',station:'Gunnery',grades:[{grade:'commercial',minLevel:1,cost:1},{grade:'tactical',minLevel:2,cost:1},{grade:'advanced',minLevel:4,cost:1}]},
 {id:'technomancer-module-graded',name:'Technomancer Magic Module (graded)',station:'Magic Conduit',grades:[{grade:'commercial',minLevel:0,cost:1},{grade:'tactical',minLevel:5,cost:1}]},
 {id:'cloaking-unit',name:'Cloaking Unit',station:'Scanners',grades:[{grade:'commercial',minLevel:8,cost:1},{grade:'tactical',minLevel:10,cost:1}]}
]);
export const CATALOG = Object.freeze([...UPGRADES,...GRADED_UPGRADES]);
/** Entries: {type, upgrades:[{id,grade?}], capacity?}. Capacity supplied by the
 * caller from the official station progression table; no guessed capacity. */
export function validateStations(ship){
 const warnings=[];const level=Number(ship.level);
 const stations=Array.isArray(ship.stationBuilds)?ship.stationBuilds:[];
 const mandatory={Explorer:'pulse-shield',Bulwark:'ramming-prow',Skirmisher:'rotational-thrusters'};
 const defaultId=mandatory[ship.frame];
 if(defaultId){
  const requiredStation=defaultId==='pulse-shield'?'Generator':'Pilot’s Console';
  const requiredIndex=requiredStation==='Generator'?1:0;
  const required=stations[requiredIndex];
  if(required?.type!==requiredStation)warnings.push({code:'DEFAULT_STATION',message:`${ship.frame} must retain its default ${requiredStation} at station ${requiredIndex+1}.`});
  if(!required?.upgrades?.some(u=>u.id===defaultId))warnings.push({code:'DEFAULT_EQUIPMENT',message:`${ship.frame} must retain its built-in ${defaultId} upgrade (free slot).`});
 }
 if(!Number.isInteger(level)||level<1||level>20) warnings.push({code:'SHIP_LEVEL',message:'Starship level must be 1–20.'});
 const cutoffsFor=type=>(type==='Gunnery'||type==='Drone Console')?[1,2,4,10,12,16,19]:[1,2,5,8,11,14,18];
 const capacityFor=type=>{let idx=0;cutoffsFor(type).forEach((n,i)=>{if(level>=n)idx=i});return idx>=6?4:idx>=4?3:idx>=2?2:idx>=1?1:0};
 if(stations.length!==6) warnings.push({code:'STATION_COUNT',message:`Expected six battle stations; found ${stations.length}.`});
 for(let i=0;i<stations.length;i++){
  const station=stations[i]??{};const type=station.type;
  if(!STATION_TYPES.includes(type)){warnings.push({code:'STATION_TYPE',message:`Station ${i+1}: unrecognised type ${type}.`});continue;}
  let spent=0;const seen=new Set();
  for(const choice of station.upgrades??[]){
   if(choice.custom){if(!choice.name?.trim())warnings.push({code:'CUSTOM_UPGRADE_NAME',message:`Station ${i+1}: custom upgrade requires a name.`});spent+=Math.max(0,Number(choice.cost)||0);continue;}
   const item=CATALOG.find(x=>x.id===choice.id);
   if(!item){warnings.push({code:'UNKNOWN_UPGRADE',message:`Station ${i+1}: unknown upgrade ${choice.id}.`});continue;}
   if(item.station!==type) warnings.push({code:'WRONG_STATION',message:`${item.name} requires ${item.station}, not ${type}.`});
   if(seen.has(item.id)) warnings.push({code:'DUPLICATE_UPGRADE',message:`Station ${i+1}: duplicate ${item.name}.`});seen.add(item.id);
   const grade=item.grades?.find(x=>x.grade===choice.grade);
   if(item.grades&&!grade){warnings.push({code:'UPGRADE_GRADE',message:`${item.name} needs a valid grade.`});continue;}
   const variant=grade??item;spent+=variant.cost;
   if(i===(ship.frame==='Explorer'?1:0)&&item.id===defaultId)spent-=variant.cost;
   if(!(i===(ship.frame==='Explorer'?1:0)&&item.id===defaultId)&&Number.isFinite(level)&&level<variant.minLevel) warnings.push({code:'UPGRADE_LEVEL',message:`${item.name} (${choice.grade??'standard'}) requires starship level ${variant.minLevel} or higher.`});
  }
  if(type==='Gunnery'){
    const weapons=station.weapons??[];
    const maxWeapons=(station.upgrades??[]).some(x=>x.id==='secondary-armaments')?2:1;
    if(weapons.length>maxWeapons)warnings.push({code:'GUNNERY_WEAPONS',message:`Station ${i+1}: ${weapons.length} weapons installed, maximum ${maxWeapons}.`});
   }
   if(type==='Generator'&&(station.upgrades??[]).some(x=>x.id==='solar-generator') &&
      !(stations.some(st=>(st.upgrades??[]).some(x=>x.id==='ramming-prow'))))
      warnings.push({code:'SOLAR_GENERATOR_PREREQUISITE',message:'Solar Generator Crystal requires a ramming prow on the starship (Tech Core p. 186).'});
   if(spent>capacityFor(type)) warnings.push({code:'UPGRADE_CAPACITY',message:`Station ${i+1} uses ${spent} upgrade slots; capacity is ${capacityFor(type)}.`});

 }
 return warnings;
}
