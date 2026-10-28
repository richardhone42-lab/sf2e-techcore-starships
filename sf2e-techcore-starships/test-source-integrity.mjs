import fs from 'node:fs';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('./scripts/starship-sheet.mjs',import.meta.url),'utf8');
const template=fs.readFileSync(new URL('./templates/starship.hbs',import.meta.url),'utf8');
const actions=[...template.matchAll(/data-action="([^"]+)"/g)].map(m=>m[1]);
for(const action of new Set(actions)) assert.match(src,new RegExp(`static (?:async )?${action}\\(`),`Missing action ${action}`);
for(const action of ['damage','repair']) {
 const start=src.indexOf(`static async ${action}(`);
 const end=src.indexOf('\n  static ',start+10);
 const segment=src.slice(start,end<0?src.length:end);
 assert.doesNotMatch(segment,/form\.querySelector/,`${action} references undeclared form`);
}
assert.match(src,/DocumentSheetConfig\.registerSheet/);
assert.match(src,/actor\.setFlag\(MODULE_ID,"starship"/);
console.log('Template action wiring and quick-adjustment source checks passed.');
