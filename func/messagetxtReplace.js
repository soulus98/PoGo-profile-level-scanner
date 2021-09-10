const { dateToTime } = require("../func/dateToTime.js");

function messagetxtReplace(msg, member, level){
	try {
		msg = msg.replace(/<prefix>/g, ops.prefix).replace(/<targetLevel>/g, ops.targetLevel).replace(/<screenshotChannel>/g, `<#${ops.screenshotChannel}>`).replace(/<profileChannel>/g, `<#${ops.profileChannel}>`).replace(/<logsChannel>/g, `<#${ops.logsChannel}>`).replace(/<targetLevelRole>/g, `<@&${ops.targetLevel}>`).replace(/<level40Role>/g, `<@&${ops.level40Role}>`).replace(/<level50Role>/g, `<@&${ops.level50Role}>`).replace(/<modRole>/g, `<@&${ops.modRole}>`);
	} catch (e) {
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce auto replace text from a custom message. This will send the original message, without auto replaced text.\n\n\nMessage: ${msg}\n\n\nError: ${e}`);
		return msg;
	}
	try {
		if (msg.includes("<member>") && member === undefined) throw "ReferenceError: member was not available";
		msg = msg.replace(/<member>/g, member);
	} catch (e){
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce <member> from the following message:\n\n\n${msg}.\n\n\nError: ${e}`);
		return msg;
	}
	try {
		if (msg.includes("<level>") && level === undefined) throw "ReferenceError: level was not available";
		msg = msg.replace(/<level>/g, level);
	} catch (e){
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce <level> from the following message:\n\n\n${msg}.\n\n\nError: ${e}`);
		return msg;
	}
	return msg;
}

module.exports = { messagetxtReplace };
