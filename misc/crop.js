const fs = require("fs");
const gm = require("gm");
const {rect} = require("./rect.js");
images = ["image.jfif"];
imageresults = ["result.jfif"];
//images = ["blue1.jpg","blue2.jpg","blue3.jpg","red1.jpg","red2.jpg","red3.jpg","yellow1.jpg","yellow2.jpg","yellow3.jpg"]
//imageresults = ["croppedblue1.jpg","croppedblue2.jpg","croppedblue3.jpg","croppedred1.jpg","croppedred2.jpg","croppedred3.jpg","croppedyellow1.jpg","croppedyellow2.jpg","croppedyellow3.jpg"]
//"For training/oneofeach/"

for (image in images) {
  const writeName = imageresults[image];
  const img = gm(images[image]);
  img
  .size((err,size) => {
    if (err){
      console.log(`An error occured while sizing: ${err}`);
      return;
    }
    const cropSize = rect(size);
    crop(cropSize,writeName);
  });
  function crop(cropSize, writeName){
    img
    .blackThreshold("57000")
    .whiteThreshold("57001")
    .crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
    .flatten()
    .write(writeName, (err) => {
      if (err){
        console.log(`An error occured while writing: ${err}`);
        return;
      }
      console.log(`cropped ${writeName}`);
    });
  }
}
