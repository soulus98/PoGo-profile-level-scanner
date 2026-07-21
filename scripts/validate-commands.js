const { commandData } = require("../interactions/definitions.js");

const names = commandData.map(command => command.name);
if (new Set(names).size != names.length) throw new Error("Duplicate top-level application command names found.");
for (const command of commandData) {
	if (!command.name || !command.description) throw new Error("Every slash command needs a name and description.");
}
console.log(`Validated ${commandData.length} application command definitions: ${names.join(", ")}`);
