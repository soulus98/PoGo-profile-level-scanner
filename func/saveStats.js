const fs = require('fs');

function saveStats(level) {
	if(isNaN(level) || level >50 || level <1){
		if(level == "Failure"){
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Fails",stats.get("Fails")+1);
		} else if (level == "black") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Blacklist",stats.get("Declined-Blacklist")+1);
		} else if (level == "all") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-All-Roles",stats.get("Declined-All-Roles")+1);
		} else if (level == "left") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Left-Server",stats.get("Declined-Left-Server")+1);
		} else if (level == "wrong") {
			stats.set("Attempts",stats.get("Attempts")+1);
			stats.set("Declined-Wrong-Type",stats.get("Declined-Wrong-Type")+1||1);
		} else if (level == "missing") {
			stats.set("Manual-Unknown",stats.get("Manual-Unknown")+1||1);
		} else if (level == "revert") {
			stats.set("Manual-Reversions",stats.get("Manual-Reversions")+1||1);
		} else {
			console.error(`[${dateToTime(new Date())}]: Error while saving the stats. Literally impossible to get to this, so if we have, something weird has happened.`);
		}
	} else if (level < 30) {
		stats.set("Attempts",stats.get("Attempts")+1);
		stats.set("Under-30",stats.get("Under-30")+1);
	} else {
		stats.set("Attempts",stats.get("Attempts")+1);
		stats.set(parseFloat(level),stats.get(parseFloat(level))+1);
	}
	fs.writeFile("./server/stats.json",JSON.stringify(Array.from(stats)),(err)=>{
		if (err){
			console.error(`[${dateToTime(new Date())}]: Error: An error occured while saving stats. Err:${err}`);
			return;
		}
	});
}

module.exports={ saveStats }
