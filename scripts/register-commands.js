const { REST, Routes } = require("discord.js");
const { commandData } = require("../interactions/definitions.js");
const { token, applicationId: configuredApplicationId } = require("../server/keys.json");
const { ids } = require("../server/config.json");

function applicationIdFromToken(botToken) {
	try {
		return Buffer.from(botToken.split(".")[0], "base64url").toString("utf8");
	} catch {
		return null;
	}
}

async function register() {
	const applicationId = configuredApplicationId && configuredApplicationId != "0"
		? configuredApplicationId
		: applicationIdFromToken(token);
	if (!applicationId || !/^\d{17,20}$/.test(applicationId)) throw new Error("Add applicationId to server/keys.json; it could not be derived from the bot token.");
	if (!ids.serverID || ids.serverID == "0") throw new Error("Set ids.serverID in server/config.json before registering commands.");

	const rest = new REST({ version: "10" }).setToken(token);
	console.log(`Registering ${commandData.length} guild commands for guild ${ids.serverID}...`);
	await rest.put(Routes.applicationGuildCommands(applicationId, ids.serverID), { body: commandData });
	console.log("Slash commands registered successfully.");
}

register().catch(error => {
	console.error("Slash command registration failed:", error);
	process.exitCode = 1;
});
