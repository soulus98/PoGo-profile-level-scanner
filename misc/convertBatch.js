const tesseract = require('tesseract.js');
const gm = require('gm');
const fs = require('fs');

path = "screens/Manual/pngs";
fs.readdir(path, (err, files) => {
  if (err) {
    console.log(`An error occured: ${err}`);
    return;
  }
  for (const file of files){
    console.log(`Converting ${file}`);
    const fileName = file.split(".");
    fileName.pop();
    const name = fileName.join("");
    const img = gm(`${path}/${file}`);
    img.write(`${path}/jpgs/${name}.jpg`, err => {
      if (err) return console.log("Something bronk");
      console.log(`Wrote ${name}.jpg`);
    });
  }
});
