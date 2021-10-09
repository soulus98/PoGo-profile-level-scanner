function dateToTime(inDate){
	const time = `${inDate.getFullYear()}-${(inDate.getMonth() + 1 < 10) ? `0${inDate.getMonth() + 1}` : inDate.getMonth() + 1}-${(inDate.getDate() < 10) ? `0${inDate.getDate()}` : inDate.getDate()} ${(inDate.getHours() < 10) ? `0${inDate.getHours()}` : inDate.getHours()}:${(inDate.getMinutes() < 10) ? `0${inDate.getMinutes()}` : inDate.getMinutes()}:${(inDate.getSeconds() < 10) ? `0${inDate.getSeconds()}` : inDate.getSeconds()}`;
	return time;
}

function performanceLogger(status, first){
	console.log(status, (Date.now() - first) / 1000, "s");
}

function replyNoMention(message, content){
	return new Promise((resolve, reject) => {
		message.reply({ content: content, allowedMentions: { repliedUser: false } }).then((msg) => {
			resolve(msg);
		}).catch((err) => {
			reject(err);
		});
	});
}

function errorMessage(time, dm, string){
	console.error(`[${dateToTime(time)}]: ${(dm) ? "DM: " : ""}${string}`);
	return;
}

function messagetxtReplace(msg, member, level){
	try {
		if (msg.includes("<")){
			msg = msg.replace(/<prefix>/g, ops.prefix).replace(/<targetLevel>/g, ops.targetLevel).replace(/<screenshotChannel>/g, `<#${ops.screenshotChannel}>`).replace(/<profileChannel>/g, `<#${ops.profileChannel}>`).replace(/<logsChannel>/g, `<#${ops.logsChannel}>`).replace(/<targetLevelRole>/g, `<@&${ops.targetLevel}>`).replace(/<level40Role>/g, `<@&${ops.level40Role}>`).replace(/<level50Role>/g, `<@&${ops.level50Role}>`).replace(/<modRole>/g, `<@&${ops.modRole}>`);
		}
	} catch (e) {
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce auto replace text from a custom message. This will send the original message, without auto replaced text.\n\n\nMessage: ${msg}\n\n\nError: ${e}`);
		return msg;
	}
	try {
		if (msg.includes("<member>")){
			if (member === undefined) throw "ReferenceError: member was not available";
			msg = msg.replace(/<member>/g, member.toString());
		}
	} catch (e){
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce <member> from the following message:\n\n\n${msg}.\n\n\nError: ${e}`);
		return msg;
	}
	try {
		if (msg.includes("<level>")){
			if (level === undefined) throw "ReferenceError: level was not available";
			msg = msg.replace(/<level>/g, level);
		}
	} catch (e){
		console.error(`[${dateToTime(new Date())}]: Error: Could not coerce <level> from the following message:\n\n\n${msg}.\n\n\nError: ${e}`);
		return msg;
	}
	return msg;
}

module.exports = { dateToTime, performanceLogger, replyNoMention, errorMessage, messagetxtReplace };
