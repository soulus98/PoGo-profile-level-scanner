const tesseract = require('tesseract.js');
const https = require('https');
const gm = require('gm');
image = "converted.jpg";
img = gm(image);
img
.identify((err,data) =>{
  if (err) return console.log("it broke" + err);
  console.log(data);
  if (!data.Resolution){
    console.log("No resolution infomation was found");
  } else {
    console.log(`resolution: ${data.Resolution}`);
  }
});
