SF2E TECH CORE STARSHIP BUILDER — v1.0.0
========================================

A general-purpose starship Actor sheet and builder for the Starfinder 2E system in Foundry V14.

INSTALLATION (WHEN READY TO TEST)
1. Copy the enclosed sf2e-techcore-starships folder to your Foundry User Data/Data/modules directory.
2. Restart Foundry V14, enter an SF2E world and enable the module.
3. Create a Script Macro and paste macros/create-new-starship.js, or use macros/create-sunrise-maiden.js.
4. Run as GM. A new NPC-backed starship actor will be created in the Actors directory.
5. Double-click the actor. If the regular NPC sheet appears, use Configure Sheet > Tech Core Starship Sheet.
6. Configure Ownership of the actor to permit players to open it (Observer) or operate it (Owner).

FEATURES
- Bulwark, Explorer and Skirmisher frames at levels 1–20, with derived frame statistics.
- Six selectable battle stations, grade progression, upgrade selections and station action reference lists.
- Starship weapons, drone loadouts, escape pod choices, expansion bays and quarters.
- Advisory construction warnings with GM-only overrides and required reason.
- Editable HP/SP, damage calculator, saves, station operators, 1D zone/heading and notes.
- Actor flags for persistence, JSON import/export and starter Sunrise Maiden preset.

LIMITATIONS AND ACCURACY
- Not live-tested in Foundry V14: a real installation test is necessary before calling it verified.
- No automated movement, attack resolution, target DCs or rules effects; crew rolls and some damage
  and upgrades are adjudicated by the GM. Weapon damage buttons are labelled BASE damage.
- The Sunrise Maiden preset has a Solar Generator Crystal / Ramming Prow prerequisite warning.
  GM may override it with a reason or alter the construction.
- The builder does not claim every printed prerequisite and item interaction has been independently
  verified. The rulebook remains authoritative where an action requires adjudication.
- This is a custom module, not an official Paizo or SF2E system release.

SOURCE
User-supplied Starfinder Tech Core, tactical starship rules pp. 178–199.

DEVELOPER CHECKS
node test-builder.mjs
node test-source-integrity.mjs
node test-foundry-smoke.mjs
