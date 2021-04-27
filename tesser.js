const fs = require('fs');
const { createWorker , PSM } = require('tesseract.js');
//import { createWorker } from 'tesseract.js';
const image = "image.jpg";
recog(image);
async function recog(image){
  const worker = createWorker({
    logger: m => console.log(m)
  });
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
    console.log(level);
  } catch (err){
    console.log(`Could not find a two digit number in ${text}`);
  }
}
