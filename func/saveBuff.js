const fs = require("fs");

function saveBuff(image, imgBuff){
	return new Promise(function(resolve, reject) {
		const imageName = image.id + "crop." + image.url.split(".").pop();
		const screensFolder = `./screens/Auto/${new Date().toDateString()}`;
		fs.writeFile(`${screensFolder}/${imageName}`, imgBuff, (err) => {
			if (err){
				reject(`Error while writing an image to file. image: ${image}\nimgBuff: ${imgBuff}\nErr: ${err}`);
				return;
			} else {
				resolve();
			}
		});
	});
}
module.exports = { saveBuff };
