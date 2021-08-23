module.exports = {
  rect(size){
		return new Promise(function(resolve) {
			const ratio = size.height / size.width;
			if (ratio > 3){
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 5,
					"x":size.width / 43,
					"y":size.height / 1.9,
				});
			} else if (ratio > 2.3){
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 5,
					"x":size.width / 43,
					"y":size.height / 1.9,
				});
			} else if (ratio > 1.9){ // from 1.9 to 2.3
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 3.5,
					"x":size.width / 43,
					"y":size.height / 2.235,
				});
			} else if (ratio > 1.7) {
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 5,
					"x":size.width / 35,
					"y":size.height / 1.7,
				});
			} else if (ratio > 1.5) {
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 3.5,
					"x":size.width / 35,
					"y":size.height / 1.8,
				});
			} else if (ratio > 1.3) {
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 4.5,
					"x":size.width / 35,
					"y":size.height / 1.3,
				});
			} else {
				resolve({
					"wid":size.width / 7,
					"hei":size.height / 4.5,
					"x":size.width / 35,
					"y":size.height / 1.3,
				});
		}
		});
	},
};
