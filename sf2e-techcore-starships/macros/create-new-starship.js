// GM macro: create a new Tech Core starship (change name/frame/level below).
const api=game.modules.get("sf2e-techcore-starships")?.api;
if(!api) ui.notifications.error("Enable SF2E Tech Core Starship Sheets first.");
else await api.createStarship("New Starship", "Explorer", 1);
