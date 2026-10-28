// GM-only setup macro: run once after enabling SF2E Tech Core Starship Sheets.
const module = game.modules.get("sf2e-techcore-starships");
if (!module?.active || !module.api) {
  ui.notifications.error("Enable SF2E Tech Core Starship Sheets and reload Foundry first.");
} else {
  try {
    const actor = await module.api.createSunriseMaiden();
    ui.notifications.info(`${actor.name} created/opened. Find it in the Actors directory.`);
  } catch (error) {
    console.error(error);
    ui.notifications.error(error.message);
  }
}
