const { GatewayIntentBits } = require("discord.js");
const { gatewayIntents } = require("../func/discordGateway.js");

const privilegedIntents = [
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildPresences,
	GatewayIntentBits.MessageContent,
];
const configured = new Set(gatewayIntents);
const enabledPrivileged = privilegedIntents.filter(intent => configured.has(intent));

if (enabledPrivileged.length) throw new Error(`Privileged Gateway intent enabled: ${enabledPrivileged.join(", ")}`);
console.log(`Validated ${gatewayIntents.length} standard Gateway intents; no privileged intents enabled.`);
