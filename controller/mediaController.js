const Media = require("../models/mediaModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const uplopoadMedia = async(req,res) => {
    try{
        const {_id} = req.user;
        //console.log(_id);
        let imageUrlArray = [];
      	Promise.all(req.files.map(async(file)=>{
          const url = req.protocol + '://' + req.get('host');
          const imageUrl = url + '/public/images/' + file.filename;
          let imgData = {"url":imageUrl};
          imageUrlArray.push(imgData);
      	}));
      
      	if(req.body){
        	req.body.user = _id;
        	req.body.images = imageUrlArray;    
      	}
        const newMedia = await Media.create(req.body);
        res.json(newMedia);
    }catch(error){
        console.log(error);
    }
} 

const getMedia = async(req,res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try{
        const media = await Media.find({ user: _id });        
        res.json(media);
    }catch(error){
        console.log(error);
    }
} 

module.exports = {
    uplopoadMedia,
    getMedia,
}