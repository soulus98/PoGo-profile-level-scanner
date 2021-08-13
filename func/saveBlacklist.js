// Saves the under-30 blacklist to file
const fs = require('fs');

function saveBlacklist() {
	fs.writeFile("./server/blacklist.json",JSON.stringify(Array.from(blacklist)),()=>{
		//let x = blacklist.size;
		//console.log(`[${dateToTime(new Date())}]: Updated blacklist. There ${(x!=1)?"are":"is"} now ${x} user${(x!=1)?"s":""} blacklisted.`); //testo Not neccesary???
	});
}
module.exports = {saveBlacklist};
