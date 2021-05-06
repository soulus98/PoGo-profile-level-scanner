const tesseract = require('tesseract.js');
const https = require('https');
const gm = require('gm');
const fs = require('fs');

path = "screens/Manual/jpgs";
fs.readdir(path, (err, files) => {
  if (err) {
    console.log(`An error occured: ${err}`);
    return;
  }
  for (const file of files) {
    const img = gm(`${path}/${file}`);
    img
    .identify((err,data) =>{
      if (err) return console.log("it broke" + err);
      if (!data.Resolution){
        console.log("No resolution infomation was found");
      } else {
        console.log(`resolution: ${data.Resolution}`);
      }
    });
  }
});
