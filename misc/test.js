const Canvas = require("canvas");
const fs = require("fs")
const https = require("https");

test();

function test(){
  const imgCanv = Canvas.createCanvas(1284,2778); //the size doesn't matter, it breaks no matter what
  const ctx = imgCanv.getContext("2d");
  const img = Canvas.loadImage("./screens/Test/image.png");
  img.then((img) => {
    ctx.drawImage(img,0,0);
    var out = fs.createWriteStream("./screens/Test/result.png")
    var stream = imgCanv.pngStream();
    stream.on("data", function(chunk){
      out.write(chunk);
    });
    stream.on("end", function(){
      console.log("Success");
    });
  }).catch(err =>{
    console.log("An error occured:" + err);
  })
}


  /*
  const imgCanv = Canvas.createCanvas(image.width,image.height);	//size of canvas
  const ctx = imgCanv.getContext("2d");
  const background = await Canvas.loadImage(image.url);
  ctx.drawImage(background,0,0,imgCanv.width,imgCanv.height);
  imageName = image.id + "." + image.url.split(".").pop();
  var out = fs.createWriteStream("./screens/Test/" + imageName)
  var stream = imgCanv.pngStream();

  stream.on("data", function(chunk){
    out.write(chunk);
  });

  stream.on("end", function(){
    console.log("saved img");
  });

  //const imgAttach = new Discord.MessageAttachment(imgCanv.toBuffer(), "reeeee.jpg");
  //message.channel.send("Reeeeee", imgAttach);
  /*
		function imageWrite(message){
			imageLogCount++;
			lastImageTimestamp = Date.now(); //Setting lastImageTimestamp for the next time it runs
			logString = `User ${message.author.username}${message.author} sent image#${imageLogCount} at ${postedTime.toLocaleString()}`;
			try{
				image = message.attachments.first();
				imageName = image.id + "." + image.url.split(".").pop();
				const imageDL = fs.createWriteStream("./screens/Auto/" + imageName);
				const request = https.get(image.url, function(response) {
					response.pipe(imageDL);
				});
*/
