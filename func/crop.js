const https = require("https");
const gm = require("gm");
const { rect } = require("../func/rect.js");

function crop(message){
	const image = message.attachments.first();
  return new Promise ((bigResolve, reject) => {
    new Promise ((resolve) => {
			https.get(image.url, (response) => {
				const img = gm(response);
				img
				.size((err, size) => {
					if (err){ // this error has only ever fired once, not sure why
						reject(`Sizing error: ${err} Image: ${image}`);
						return;
					} else {
						rect(size).then((cropSize) => {
							resolve(cropSize);
						});
					}
				});
			});
    }).then((cropSize) => {
			https.get(image.url, function(response){
				const threshold = config.numbers.threshold;
				const img = gm(response);
				img
				.blackThreshold(threshold)
				.whiteThreshold(threshold + 1)
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
					bigResolve(imgBuff);
				});
			});
		});
  });
}
module.exports = { crop };
