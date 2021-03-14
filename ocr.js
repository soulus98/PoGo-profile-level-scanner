const { prefix } = require("./config.json");

module.exports = {
	name: "ocr",
	execute(message, imageURL) {
    console.log(imageURL);
	},
};
