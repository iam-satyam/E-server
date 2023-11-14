const multer = require("multer") ;
const storage = multer.memoryStorage();

const singleUpload = (req, res, next)=>{

    return multer({ storage }).single("file");
} 

module.exports = singleUpload;
