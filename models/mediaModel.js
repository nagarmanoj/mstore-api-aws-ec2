const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var modelSchema = new mongoose.Schema(
  {
    user:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      require:true,
    },    
    images:[],
    
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Media", modelSchema);
