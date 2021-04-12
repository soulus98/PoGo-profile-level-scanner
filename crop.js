const fs = require("fs");
const gm = require("gm");
img = gm("image0.png");
img
.size((err,size) => {
  if (err){
    console.log(`An error occured: ${err}`);
    return;
  }
  ratio = size.height/size.width;
  cropSize = rect(ratio, size);
  crop(cropSize);
});
function rect(ratio, size){
  cropSize = {};
  if (ratio > 2 && ratio < 2.2){
    cropSize = {
      "wid":size.width/7,
      "hei":size.height/5,
      "x":size.width/43,
      "y":size.height/1.9
    };
  }
  return cropSize;
}
function crop(cropSize){
  img
  .blackThreshold("57000")
  .whiteThreshold("57001")
  .crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
  .write("result.png", (err) => {
    if (err){
      console.log(`An error occured: ${err}`);
      return;
    }
    console.log("Success");
  });
}
