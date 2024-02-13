const {default: mongoose} = require("mongoose");
const logger = require('../utils/logger');

const dbConnect = () =>{
    try{
        const conn = mongoose.connect(process.env.MONGOODB_URL);
        logger.info("Database Connect Successfylly");
    }catch (error){
        logger.error(`Database error ${error}`);
        process.exit(1);
    }
}

module.exports = dbConnect;