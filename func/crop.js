const https = require("https");
const gm = require("gm");
const { rect } = require("../func/rect.js");

function crop(message){
	const image = message.attachments.first();
  return new Promise ((bigResolve, reject) => {
    new Promise ((resolve) => {
			const size = { };
			size.width = image.width;
			size.height = image.height;
			rect(size).then((cropSize) => {
				resolve(cropSize);
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
					bigResolve(imgBuff);
				});
			});
		});
  });
}
module.exports = { crop };
