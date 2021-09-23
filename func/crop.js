const https = require("https");
const gm = require("gm");
const { rect } = require("../func/rect.js");

function crop(message){
	const image = message.attachments.first();
  return new Promise ((resolve, reject) => {
    new Promise ((res) => {
			const size = { };
			size.width = image.width;
			size.height = image.height;
			rect(size).then((cropSize) => {
				res(cropSize);
			});
    }).then((cropSize) => {
			https.get(image.url, function(response){
				const img = gm(response);
				img
				.blackThreshold(ops.threshold)
				.whiteThreshold(ops.threshold + 1)
				.crop(cropSize.wid, cropSize.hei, cropSize.x, cropSize.y)
				.flatten()
				.toBuffer((err, imgBuff) => {
					if (err){
						setTimeout(() => {
							console.error("imgBuff: ");
							console.error(imgBuff); 			// testo
							console.error("imgTwo: ");
							console.error(img); 			// testo
						}, 250);
						reject("crash");
						return;
					}
					resolve(imgBuff);
				});
			});
		});
  });
}

function shortCrop(input){
	return new Promise((resolve) => {
		const img = gm(input);
		img.shave(0, 50)
		.toBuffer((err, output) => {
			if (err){
				console.error(err);
				console.error("imgBuff: ");
				console.error(input); 			// testo
				console.error("imgTwo: ");
				console.error(output); 			// testo
				return;
			}
			resolve(output);
		});
	});
}
module.exports = { crop, shortCrop };
