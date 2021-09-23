const fs = require("fs"),
			https = require("https"),
			delay = 75,
			path = require("path");

function saveFile(input) {
	const screensFolder = path.resolve(__dirname, `../screens/Auto/${new Date().toDateString()}`);
	return new Promise(function(resolve, reject) {
		if (input[1]){
			const image = input[0],
						imgBuff = input[1];
			const imageName = image.id + "crop." + image.url.split(".").pop();
			fs.writeFile(path.join(screensFolder, imageName), imgBuff, (err) => {
				if (err){
					reject(`Error while writing a cropped(?) image to file. image: ${image}\nimgBuff: ${imgBuff}\nError: ${err}`);
					return;
				} else {
					setTimeout(() => {
						resolve();
					}, delay);
				}
			});
		} else {
			const image = input;
			const imageName = image.id + "." + image.url.split(".").pop().toLowerCase();
			try {
				const imageDL = fs.createWriteStream(path.join(screensFolder, imageName));
				https.get(image.url, (response) => {
					response.pipe(imageDL);
					response.on("end", () => {
						setTimeout(() => {
							resolve();
						}, delay);
					});
				}).on("error", (err) => {
					reject(`Error while writing an image to file. image: ${image}\nError: ${err}`);
				});
			} catch (err) {
				reject(`Error while writing an image to file. image: ${image}\nError: ${err}`);
			}
		}
	});
}

module.exports = { saveFile };
