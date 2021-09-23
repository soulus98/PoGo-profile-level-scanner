const fs = require('fs');
//broken need to add path
const { createWorker , PSM } = require('tesseract.js');
const imgPath = "screens/Manual/cropped";


fs.readdir(imgPath, async function load(err, files){
  if (err){
    console.log(`An error occured. Err: ${err}`);
  }
  for (const file of files){
    console.log(`Recognising ${file}`);
    const image = `${imgPath}/${file}`;
    await recog(image);
  }
});


async function recog(image){
  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  await worker.setParameters({
    tessedit_pageseg_mode: PSM.AUTO,
  });
  const { data: { text } } = await worker.recognize(image);
  console.log(text);
  await worker.terminate();
  try{
    level = text.match(/(\d\d)/)[0];
    console.log(`Level: ${level}`);
    imageName = image.split(".");
    imageName.pop();
    fs.writeFile(`${imageName}.txt`,level,(err) =>{
      if (err){
        console.log(`An error occured while writing. Err: ${err}`);
      }
      console.log(`Written ${imageName}.txt`);
    });
  } catch (err){
    console.log(`Could not find a two digit number in ${text}`);
  }
}
