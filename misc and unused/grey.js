const Canvas = require("canvas");
const fs = require("fs");
//broken need to add path
const img = Canvas.loadImage("image.jpg");
img.then((img) => {
  const imgCanv = Canvas.createCanvas(img.width,img.height);
  const ctx = imgCanv.getContext("2d");
  ctx.drawImage(img,0,0,img.width,img.height);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  newData = grey(imgData);
  ctx.putImageData(newData,0,0);
  var out = fs.createWriteStream("imagefix.jpg")
  var stream = imgCanv.pngStream();
  stream.on("data", function(chunk){
    out.write(chunk);
  });
  stream.on("end", function(){
    console.log("Success");
  });
});
function grey(imgData){
  for (i = 0; i < imgData.data.length; i += 4) {
    let count = imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2];
    let colour = 0;
    if (count > 680) colour = 255;
    imgData.data[i] = colour;
    imgData.data[i + 1] = colour;
    imgData.data[i + 2] = colour;
    imgData.data[i + 3] = 255;
  }
  return imgData;
}
