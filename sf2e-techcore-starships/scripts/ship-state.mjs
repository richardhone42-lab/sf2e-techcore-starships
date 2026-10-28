/** Pure state transformations, testable without Foundry. */
export function applyFrameStats(ship, stats, sensorBase, {preserveSensorBonus=true}={}) {
  const oldHPMax=Number(ship.hpMax)||0, oldSPMax=Number(ship.spMax)||0;
  const hpLost=Math.max(0,oldHPMax-(Number(ship.hp)||0));
  const spLost=Math.max(0,oldSPMax-(Number(ship.sp)||0));
  const sensorBonus=preserveSensorBonus ? Math.max(0,(Number(ship.sensors)||0)-(Number(ship.sensorBase)||Number(sensorBase))) : 0;
  const result={...ship,...stats,sensorBase, sensors:Number(sensorBase)+sensorBonus};
  result.hp=Math.max(0,result.hpMax-hpLost);
  result.sp=Math.max(0,result.spMax-spLost);
  return result;
}
export function applyIncomingDamage(ship, amount){
  const damage=Number(amount);
  if(!Number.isFinite(damage)||damage<0)throw new RangeError('Damage must be non-negative.');
  const absorbed=Math.min(Math.max(0,Number(ship.sp)||0),damage);
  return {...ship,sp:Math.max(0,ship.sp-absorbed),hp:Math.max(0,ship.hp-(damage-absorbed))};
}
export function validateOverride(warnings, {gmOverride,overrideReason}, isGM){
  const actionable=warnings.filter(w=>w.code!=='CAPACITY_UNVERIFIED');
  if(!actionable.length)return {ok:true,warnings:actionable};
  if(!gmOverride)return {ok:false,reason:'Construction warnings require a GM override.',warnings:actionable};
  if(!isGM)return {ok:false,reason:'Only the GM may approve a construction override.',warnings:actionable};
  if(!String(overrideReason??'').trim())return {ok:false,reason:'A GM override requires a reason.',warnings:actionable};
  return {ok:true,warnings:actionable};
}
