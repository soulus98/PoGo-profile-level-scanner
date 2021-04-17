const fs = require("fs");
const canvas = require('canvas');
const pngFiles = fs.readdirSync("./screens/Manual").filter(file => file.endsWith(".png"));
for (const file of pngFiles) {
  const oldP = "./screens/Manual/" + file;
  img = canvas.loadImage(oldP);
  img.then((img) => {
    const ratio = img.height/img.width;
    rand = `(${Math.floor((Math.random()*1000)+1)})`;
    const newP = "./screens/Manual/" + ratio.toFixed(3) + rand + ".png";
    fs.rename(oldP,newP,(err) => {
      if (err){
        console.log(`An error: ${err}`);
      } else {
        console.log(`Renamed ${oldP} to ${newP}`);
      }
    });
  });
}
const jpegFiles = fs.readdirSync("./screens/Manual").filter(file => file.endsWith(".jpeg"));
for (const file of jpegFiles) {
  const oldP = "./screens/Manual/" + file;
  img = canvas.loadImage(oldP);
  img.then((img) => {
    const ratio = img.height/img.width;

    rand = `(${Math.floor((Math.random()*1000)+1)})`;
    const newP = "./screens/Manual/" + ratio.toFixed(3) + rand + ".jpeg";
    fs.rename(oldP,newP,(err) => {
      if (err){
        console.log(`An error: ${err}`);
      } else {
        console.log(`Renamed ${oldP} to ${newP}`);
      }
    }).catch(err => {
      console.log(`An error: ${err}`);;
    });
  });

}
const jfifFiles = fs.readdirSync("./screens/Manual").filter(file => file.endsWith(".jfif"));
for (const file of jfifFiles) {
  const oldP = "./screens/Manual/" + file;
  img = canvas.loadImage(oldP);
  img.then((img) => {
    const ratio = img.height/img.width;
    rand = `(${Math.floor((Math.random()*1000)+1)})`;
    const newP = "./screens/Manual/" + ratio.toFixed(3) + rand + ".jfif";
    fs.rename(oldP,newP,(err) => {
      if (err){
        console.log(`An error: ${err}`);
      } else {
        console.log(`Renamed ${oldP} to ${newP}`);
      }
    });
  }).catch(err => {
    console.log(`An error: ${err}`);
  });
}
const jpgFiles = fs.readdirSync("./screens/Manual").filter(file => file.endsWith(".jpg"));
for (const file of jpgFiles) {
  const oldP = "./screens/Manual/" + file;
  img = canvas.loadImage(oldP);
  img.then((img) => {
    const ratio = img.height/img.width;
    rand = `(${Math.floor((Math.random()*1000)+1)})`;
    const newP = "./screens/Manual/" + ratio.toFixed(3) + rand + ".jpg";
    fs.rename(oldP,newP,(err) => {
      if (err){
        console.log(`An error: ${err}`);
      } else {
        console.log(`Renamed ${oldP} to ${newP}`);
      }
    });
  });
}
