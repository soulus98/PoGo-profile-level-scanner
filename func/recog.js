const { createWorker, PSM } = require("tesseract.js");
const { shortCrop } = require("../func/crop.js");
const { ChannelType } = require("discord.js");

async function recognizeText(imgBuff, parameters = {}) {
	let worker;
	try {
		worker = await createWorker("eng");
		await worker.setParameters({
			tessedit_pageseg_mode: PSM.AUTO,
			...parameters,
		});
		const { data: { text } } = await worker.recognize(imgBuff);
		return text;
	} finally {
		if (worker) await worker.terminate().catch(() => null);
	}
}

async function recog(imgBuff, message, failInc = 1) {
	const dm = message.channel.type == ChannelType.DM;
	const text = await recognizeText(imgBuff);
	let levelnum = text.match(/(\d\d)/);
	if (levelnum != null) return [levelnum[0], false, text];

	// Newer Tesseract cores can identify the small LEVEL label while ignoring
	// the isolated large digits in the same narrow crop. A sparse, digit-only
	// pass preserves the existing crop while making that layout deterministic.
	const numericText = await recognizeText(imgBuff, {
		tessedit_pageseg_mode: PSM.SPARSE_TEXT,
		tessedit_char_whitelist: "0123456789",
	});
	levelnum = numericText.match(/(\d\d)/);
	if (levelnum != null) return [levelnum[0], false, `${text.trim()}\nNumeric pass: ${numericText.trim()}`];

	const levelTextArray = ["LEVEL", "LLLLL", "NNNNN", "NIVEL", "HIVEL", "NIVEAL", "LRI", "TEVEL", "NIV", "VEL", "YPOBEI"];
	const foundLevelLabel = levelTextArray.some(value => text.toLowerCase().includes(value.toLowerCase()));
	if (failInc < 4 && foundLevelLabel) {
		const imgBuffTwo = await shortCrop(imgBuff);
		if (ops.testMode && !dm) {
			await message.reply({
				content: `Test mode. Scanned text:\n${text}\n\nThis is attempt #${failInc + 1}:`,
				files: [imgBuffTwo],
			});
		}
		return recog(imgBuffTwo, message, failInc + 1);
	}

	return ["Fail", true, text];
}

module.exports = { recog };
