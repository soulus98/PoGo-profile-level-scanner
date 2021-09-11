const gm = require("gm");
const { rect } = require("../func/rect.js");
const config = require("../server/config.json");
const threshold = config.numbers.threshold;

const images = ["image4-friend.png"];
const imageresults = ["image4-processed.png"];
// images = ["blue1.jpg","blue2.jpg","blue3.jpg","red1.jpg","red2.jpg","red3.jpg","yellow1.jpg","yellow2.jpg","yellow3.jpg"]
// imageresults = ["croppedblue1.jpg","croppedblue2.jpg","croppedblue3.jpg","croppedred1.jpg","croppedred2.jpg","croppedred3.jpg","croppedyellow1.jpg","croppedyellow2.jpg","croppedyellow3.jpg"]
// "For training/oneofeach/"

for (const image in images) {
  const writeName = imageresults[image];
  const img = gm(images[image]);
  img
  .size((err, size) => {
    if (err){
      console.log(`An error occured while sizing: ${err}`);
      return;
    }
    rect(size).then((cropSize) => {
			img
			.blackThreshold(threshold)
			.whiteThreshold(threshold+1)
			.crop(cropSize.wid, cropSize.hei, cropSize.x, cropSize.y)
			.flatten()
			.write(writeName, (err) => {
				if (err){
					console.log(`An error occured while writing: ${err}`);
					return;
				}
				console.log(`cropped ${writeName}`);
			});
		});
  });
}
