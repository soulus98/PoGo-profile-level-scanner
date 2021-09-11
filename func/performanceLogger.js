module.exports = {
	performanceLogger(status, first){
		console.log(status, (Date.now() - first) / 1000, "s");
	},
}
