const fs = require("fs");
const gm = require("gm");
const {rect} = require("./rect.js");
img = gm("image.jpg");
img
.size((err,size) => {
  if (err){
    console.log(`An error occured: ${err}`);
    return;
  }
  ratio = size.height/size.width;
  console.log(ratio);
  cropSize = rect(ratio, size);
  crop(cropSize);
});
function crop(cropSize){
  img
  .blackThreshold("57000")
  .whiteThreshold("57001")
  .crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
  .write("result.jpg", (err) => {
    if (err){
      console.log(`An error occured: ${err}`);
      return;
    }
    console.log("Success");
  });
}
