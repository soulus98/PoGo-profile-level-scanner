const gm = require("gm");
const { rect } = require("../func/rect.js"),
      ops = require("../ops.json");

function crop(filePath, size){
  return new Promise ((resolve) => {
    rect(size).then((cropSize) => {
      const img = gm(filePath);
      img
      .blackThreshold(ops.threshold)
      .whiteThreshold(ops.threshold + 1)
      .crop(cropSize.wid, cropSize.hei, cropSize.x, cropSize.y)
      .flatten()
      .toBuffer((err, imgBuff) => {
        if (err){
          throw (err);
        }
        resolve(imgBuff);
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
