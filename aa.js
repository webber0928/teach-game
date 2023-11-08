var txtomp3 = require("text-to-mp3");

txtomp3.getMp3("apple", function(err, binaryStream){
  if(err){
    console.log(err);
    return;
  }
  var file = require('fs').createWriteStream("FileName.mp3"); // write it down the file
  file.write(binaryStream);
  file.end();
});