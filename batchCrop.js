const path = require("path"),
      fs = require("fs"),
      gm = require("gm"),
      { crop } = require("./func/crop.js"),
      { recog } = require("./func/recog.js"),
      ops = require("./ops.json"),
      count = { fails: 0, successes: 0 };

const argvs = process.argv.slice(2);
const folderPath = path.resolve(argvs[0]);
let cantProInc = 0;

fs.readdir(folderPath, (err, files) => {
  if (err) return console.error(err);
  if (ops.write) {
    processImg(files, 0);
  } else {
    for (const file of files) {
      console.log(`Loading: ${file}`);
      processImg(files, files.indexOf(file));
    }
  }
});

function processImg(files, inc) {
  const file = files[inc];
  if (file == undefined) return console.log(`Completed. Processed ${inc + 1} and failed ${cantProInc} files.\nStats:`, count);
  try {
    const fileType = file.split(".").pop().toLowerCase();
    const acceptedFileTypes = ["png", "jpg", "jpeg", "jfif", "tiff", "bmp"];
    if (!acceptedFileTypes.includes(fileType)) throw "Cannot process:" + file + "\n\n";
    const filePath = path.resolve(folderPath, file);
    gm(filePath)
    .size((e, size) => {
      if (e) throw e;
      crop(filePath, size).then((imgBuff) => {
        recog(imgBuff).then(([level, failed, text]) => {
          const fileName = file.split(".");
          fileName.pop();
          const newName = fileName.join(".") + "res" + level + "." + fileType;
          if (level == "Fail") count.fails = count.fails + 1;
          else count.successes = count.successes + 1;
          count[level] = count[level] + 1;
          if (ops.write) {
            fs.writeFile(path.resolve(folderPath, newName), imgBuff, (err) => {
              if (err){
                console.error(`Error writing ${newName}`);
                return;
              } else {
                setTimeout(() => { // eslint-disable-line max-nested-callbacks
                  console.log(`File: ${file}\n\nLevel: ${level}\nFailed:${failed}\nText:${text}\n\n`);
                  processImg(files, inc + 1);
                }, 10);
              }
            });
          } else {
            console.log(`File: ${file}\n\nLevel: ${level}\nFailed:${failed}\nText:${text}\n\n`);
          }
        });
      });
    });
  } catch (e) {
    console.error(e);
    cantProInc++;
    processImg(files, inc + 1);
  }
}
