const { createWorker, PSM } = require("tesseract.js"),
			{ shortCrop } = require("../func/crop.js");

async function recog(imgBuff, message, failInc) {
	const dm = (message.channel.type == "DM") ? true : false;
	if (failInc == undefined) failInc = 1;
	return new Promise((resolve) => {
		const worker = createWorker({
			// logger: m => console.log(m)
		});
		(async () => {
			await worker.load();
			// console.log(`Recognising: i#${instance}. iLC: ${imageLogCount}.`); //testo??
			await worker.loadLanguage("eng");
			await worker.initialize("eng");
			await worker.setParameters({
				tessedit_pageseg_mode: PSM.AUTO,
			});
			const { data: { text } } = await worker.recognize(imgBuff);
			await worker.terminate();
			const levelnum = text.match(/(\d\d)/);
			if (levelnum != null) {
				const level = levelnum[0];
				resolve([level, false, text]);
				return;
			} else {
				const levelTextArray = ["LEVEL", "LLLLL", "NNNNN", "NIVEL", "HIVEL", "NIVEAL", "LRI", "TEVEL", "NIV", "VEL"];
				const findTextInArray = (arr, str) => arr.some(e => str.toLowerCase().includes(e.toLowerCase()));
				if (failInc < 4 && findTextInArray(levelTextArray, text)){
					shortCrop(imgBuff).then((imgBuffTwo) => {
						if (ops.testMode && !dm) message.reply({ content:`Test mode. Scanned text:\n${text}\n\n This is attempt #${failInc + 1}:`, files: [imgBuffTwo] });
						recog(imgBuffTwo, message, failInc + 1).then(([level, failed, txt]) => {
							resolve([level, failed, txt]);
						});
					});
				} else {
					resolve(["Failure", true, text]);
					return;
				}
			}
		})();
	});
}

module.exports = { recog };
