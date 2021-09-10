const fs = require("fs");
const gm = require("gm");
const { rect } = require("../func/rect.js");

const path = "Training/jpgs";
fs.readdir(path, (err, files) => {
  if (err) {
    console.log(`An error occured: ${err}`);
    return;
  }
	process(0, 0);
	function process(imgNo, fileNo){
		const img = gm(`${path}/${files[fileNo]}`);
    img
    .size((err, size) => {
      if (err){
        console.log(`An error occured: ${err}`);
        return;
      }
      rect(size).then(cropSize => {
				img
				.blackThreshold("225")
				.whiteThreshold("226")
				.crop(cropSize.wid, cropSize.hei, cropSize.x, cropSize.y)
				.flatten()
				.write(`Training/cropped/pogo.idk.exp${imgNo}.jpg`, (err) => {
					if (err){
						console.log(`An error occured: ${err}`);
						return;
					}
					console.log(`Cropped file: ${files[fileNo]} imgNo: ${imgNo}`);
					if (fileNo < files.length) {
						process(imgNo + 1, fileNo + 1);
					} else {
						return;
					}
				});
			});
      // crop(cropSize, file, img);
    });
	}
});
