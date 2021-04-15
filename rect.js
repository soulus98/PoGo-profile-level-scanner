module.exports = {
  rect(ratio, size){
    cropSize = {};
    if (ratio > 3){
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/5,
        "x":size.width/43,
        "y":size.height/1.9
      };
    } else if (ratio > 2.3){
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/5,
        "x":size.width/43,
        "y":size.height/1.9
      };
    } else if (ratio > 1.9){ //done
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/5,
        "x":size.width/43,
        "y":size.height/1.9
      };
    } else if (ratio > 1.7) { //done
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/5,
        "x":size.width/35,
        "y":size.height/1.7
      }
    } else if (ratio > 1.5) { //done
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/3.5,
        "x":size.width/35,
        "y":size.height/1.8
      }
    } else if (ratio > 1.3) { //done
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/4.5,
        "x":size.width/35,
        "y":size.height/1.3
      }
    } else {
      cropSize = {
        "wid":size.width/7,
        "hei":size.height/4.5,
        "x":size.width/35,
        "y":size.height/1.3
      }
    }
    return cropSize;
  }
}
