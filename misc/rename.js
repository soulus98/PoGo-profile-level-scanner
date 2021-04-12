canvas = require("canvas");
fs = require("fs");
const jpgFiles = fs.readdirSync("./screens/Manual/Under 1mb").filter(file => file.endsWith(".jpg"));
for (const file of jpgFiles) {
  const oldP = "./screens/Manual/Under 1mb/" + file;
  const img = canvas.loadImage(oldP);
  img.then((img) => {
    const ratio = img.height/img.width;
    console.log(ratio);
    const short = file.slice(file.length-7,file.length);
    const newP = "./screens/Manual/Under 1mb/" + ratio + short;
    fs.rename(oldP,newP,(err) => {
      if (err){
        console.log(`An error: ${err}`);
      } else {
        console.log(`Renamed ${oldP} to ${newP}`);
      }
    });
  });
}
