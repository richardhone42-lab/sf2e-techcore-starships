import {validateEquipment} from "./equipment-data.mjs";
import {validateStations} from "./station-rules.mjs";
/** Tech Core pp. 194–196: expansion bay and frame construction checks.
 * Rules are warnings, not blockers: a GM can record an exception and save.
 */
export const BAY_CATALOG = Object.freeze([
  {id:'Unassigned',label:'Unassigned',detail:'Unused expansion bay slot.'},
  {id:'Data Center',label:'Data Center',detail:'Access an infosphere within the star system; downtime access from anywhere aboard, provided scanners function.'},
  {id:'Fabrication Lab',label:'Fabrication Lab',detail:'Craft and Repair aboard without setup; includes commercial creator capsules and basic level-0 formulas.'},
  {id:'Holo Den',label:'Holo Den',detail:'Retrain during downtime without a mentor; view recorded visual data.'},
  {id:'Medical Bay',label:'Medical Bay',detail:'Functions as a tactical medkit (+1 item to Medicine checks inside); improves long-term rest healing.'},
  {id:'Passenger Quarters — Prison',label:'Passenger Quarters — Prison',detail:'Secure holding cells; only one passenger-quarters type can be installed.'},
  {id:'Passenger Quarters — Luxury',label:'Passenger Quarters — Luxury',detail:'VIP suites; only one passenger-quarters type can be installed.'},
  {id:'Science Lab',label:'Science Lab',detail:'+1 item to specified identification and research checks during downtime.'}
]);
export const CREW_QUARTERS = ['Bunks','Budget','Comfortable','Extravagant'];
export const PASSENGER_QUARTERS = ['Basic','Prison','Luxury'];
export function validateConstruction(ship) {
  const warnings=[];
  const bays=Array.isArray(ship.baySlots)?ship.baySlots:[];
  const capacity=4+(ship.crewQuarters==='Comfortable'?1:0);
  const occupied=bays.filter(x=>x && x!=='Unassigned');
  if (bays.slice(capacity).some(x=>x && x!=='Unassigned')) warnings.push({code:'BAY_CAPACITY',message:`${capacity} expansion bays available; an occupied bay lies beyond the limit.`});
  if (occupied.length>capacity) warnings.push({code:'BAY_COUNT',message:`${occupied.length} expansion bays selected, but capacity is ${capacity}.`});
  for (const choice of occupied) if(!BAY_CATALOG.some(x=>x.id===choice)) warnings.push({code:'UNKNOWN_BAY',message:`Unknown expansion bay: ${choice}.`});
  const passenger=occupied.filter(x=>x.startsWith('Passenger Quarters — '));
  if(passenger.length>1) warnings.push({code:'PASSENGER_DUPLICATE',message:'Only one passenger quarters installation/type is permitted.'});
  if(passenger.length && ship.passengerQuarters==='Basic') warnings.push({code:'PASSENGER_MISMATCH',message:'A Prison/Luxury passenger bay is installed, but the universal passenger setting is Basic.'});
  if(ship.passengerQuarters==='Prison' && !passenger.includes('Passenger Quarters — Prison')) warnings.push({code:'PASSENGER_MISSING',message:'Prison passenger quarters require a Prison expansion bay.'});
  if(ship.passengerQuarters==='Luxury' && !passenger.includes('Passenger Quarters — Luxury')) warnings.push({code:'PASSENGER_MISSING',message:'Luxury passenger quarters require a Luxury expansion bay.'});
  if(ship.passengerQuarters==='Prison' && passenger.includes('Passenger Quarters — Luxury') || ship.passengerQuarters==='Luxury' && passenger.includes('Passenger Quarters — Prison')) warnings.push({code:'PASSENGER_MISMATCH',message:'Passenger quarters type does not match the installed bay.'});
  if(!CREW_QUARTERS.includes(ship.crewQuarters)) warnings.push({code:'CREW_QUARTERS',message:'Choose an official crew quarters type.'});
  if (Array.isArray(ship.stationBuilds)) warnings.push(...validateStations(ship));
  warnings.push(...validateEquipment(ship));
  return warnings;
}
