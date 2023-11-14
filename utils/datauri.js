const path = require('path')
const DataUriParser = require('datauri/parser')

const getDataUri = (file) => {
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).toString()
    console.log(file);  

    return parser.format(extName, file.buffer);
}

module.exports = getDataUri