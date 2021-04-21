const fs = require("fs");
const gm = require("gm");
const {rect} = require("./rect.js");
path = "screens/Manual";
fs.readdir("screens/Manual", (err, files) => {
  if (err) {
    console.log(`An error occured: ${err}`);
    return;
  }
  for (const file of files) {
    const img = gm(`${path}/${file}`);
    img
    .size((err,size) => {
      if (err){
        console.log(`An error occured: ${err}`);
        return;
      }
      cropSize = rect(size);
      crop(cropSize, file, img);
    });
  }
});
function crop(cropSize, file, img){
  img
  .blackThreshold("57000")
  .whiteThreshold("57001")
  .crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
  .flatten()
  .write(`screens/Cropped/${file}`, (err) => {
    if (err){
      console.log(`An error occured: ${err}`);
      return;
    }
    console.log(`Cropped file: ${file}`);
  });
}
