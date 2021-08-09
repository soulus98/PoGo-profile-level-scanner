const { createWorker, PSM } = require('tesseract.js');
const { rect } = require("./fun/rect.js");
const configs = require('./server/config.json');
const threshold = configs.numbers.threshold;
const gm = require('gm');
const https = require('https');
const fs = require('fs');

imagePath = "https://cdn.discordapp.com/attachments/816837120219152394/838605695917490186/image0-25.png";

function crop(){
	https.get(imagePath, function(response){
		img = gm(response);
		img
		.size((err,size) => {
			if (err){
				console.log(`An error occured while sizing "img": ${err}`);
				return;
			}
			cropSize = rect(size);
			cropper(cropSize);
		});
	});
	function cropper(cropSize) {
		https.get(imagePath, async function(response){
			imageName = imagePath.split("/").pop();
			imgTwo = gm(response);
			await imgTwo
			.blackThreshold(threshold)
			.whiteThreshold(threshold+1)
			.crop(cropSize.wid,cropSize.hei,cropSize.x,cropSize.y)
			.flatten()
			.toBuffer((err, imgBuff) => {
				if (err){
						console.log(`An error occured while buffering "imgTwo": ${err}`);
						return;
					}
					//This is for seeing the cropped version
					write(imgBuff);

				});
					console.log(`cropped & wrote: ${imageName}`);
			// .write(imageName, (err) => {
			// 	if (err){
			// 		console.log(`An error occured while writing: ${err}`);
			// 		return;
			// 	}
			// 	//setTimeout(recog,2000,imageName);
			// 	console.log("Written");
			// 	recog(imageName);
			// });

		});
	}
}

function write(image) {
	fs.writeFile(`${imageName}`,image, (err) =>{
		if (err){
			console.log(`An error occured while writing image: ${err}`);
			return;
		}
		console.log("Test 1");
		setTimeout(recog,500,imageName);
	});
}
async function recog(image){
	const worker = createWorker({
		logger: m => console.log(m)
	});

	(async () => {
		try{
			await worker.load();
			try{
				await worker.loadLanguage('eng');
			} catch (err){
				console.log(`An error occured while recognising. Error: ${err}
Stack: ${err.stack}`);
			}
			await worker.initialize('eng');
			await worker.setParameters({
				tessedit_pageseg_mode: PSM.AUTO,
			});
			const { data: { text } } = await worker.recognize(image);
			console.log("Image recognised. Result:");
			console.log(text);
			await worker.terminate();
			try{
				level = text.match(/(\d\d)/)[0];
			} catch (err){
				console.log(`Could not find a two digit number in ${text}`);
				level = "Failure";
			}
			if (isNaN(level) || level >50){
				console.log(`There was an issue scanning this image. This image might: not be a Pokemon Go profile screenshot, have an obstruction near the level number, be too low quality, have an odd aspect ratio, or there may be an internal bot issue.`);
			} else {
				console.log("Test. Your level was scanned at " + level);
			}
		}
		catch (err){
			console.log(`An error occured while recognising. Error: ${err}
Stack: ${err.stack}`);
		}
	})();
}
console.log("Loading...");
crop();
