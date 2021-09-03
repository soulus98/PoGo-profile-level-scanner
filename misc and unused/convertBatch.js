const gm = require("gm");
const fs = require("fs");

const path = "Training";
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
      if (err) return console.log(`Something bronk writing ${name}. Err: ${err}`);
      console.log(`Wrote ${name}.jpg`);
    });
  }
});
