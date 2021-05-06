const tesseract = require('tesseract.js');
const https = require('https');
const gm = require('gm');
imageURL = "https://cdn.discordapp.com/attachments/740670778516963339/834622053977686016/image0.png";
https.get(imageURL, function(response){
  img = gm(response);
  img
  .monochrome()
  .write("converted.png", err =>{
    if (err) return console.log("it broke" + err);
    console.log("success");
  });
});
