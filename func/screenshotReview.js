const { EmbedBuilder } = require("discord.js");

function reviewMarker(userId) {
	return `Screenshot review user ID: ${userId}`;
}

async function postScreenshotReview(message, image, scannedText) {
	const channel = message.client.channels.cache.get(ops.screenshotChannel);
	if (!channel) throw new Error("The configured screenshot channel is unavailable.");
	const safeText = String(scannedText || "No text detected").replace(/```/g, "'''").slice(0, 900);
	const embed = new EmbedBuilder()
		.setColor("#F1C40F")
		.setTitle("Screenshot needs staff review")
		.setDescription("The OCR scan could not determine a valid level. Confirm or reject this submission manually.")
		.addFields(
			{ name: "Member", value: `${message.author} (\`${message.author.id}\`)` },
			{ name: "OCR output", value: `\`\`\`\n${safeText}\n\`\`\`` },
			{ name: "Staff action", value: `Use \`/screenshot confirm\` with this member and the visible level, or \`@Bot c ${message.author.id} <level>\`.` },
		)
		.setFooter({ text: reviewMarker(message.author.id) })
		.setTimestamp(message.createdAt);
	const roleMention = ops.modRole && ops.modRole != "0" ? `<@&${ops.modRole}> ` : "";
	return channel.send({
		content: `${roleMention}Manual screenshot review requested for ${message.author}.`,
		embeds: [embed],
		files: [image],
		allowedMentions: {
			roles: roleMention ? [ops.modRole] : [],
			users: [],
		},
	});
}

async function deleteScreenshotReviews(client, userId) {
	const channel = client.channels.cache.get(ops.screenshotChannel);
	if (!channel) return 0;
	const messages = await channel.messages.fetch({ limit: 100 });
	const marker = reviewMarker(userId);
	const matches = messages.filter(message =>
		message.author.id == client.user.id
		&& !message.pinned
		&& message.embeds.some(embed => embed.footer?.text == marker),
	);
	const results = await Promise.allSettled(matches.map(message => message.delete()));
	return results.filter(result => result.status == "fulfilled").length;
}

module.exports = { deleteScreenshotReviews, postScreenshotReview, reviewMarker };
