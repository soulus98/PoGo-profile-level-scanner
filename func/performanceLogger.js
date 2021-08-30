module.exports = {
	performanceLogger(status, first, now){
		console.log(status, (now - first) / 1000, "s");
	},
}
