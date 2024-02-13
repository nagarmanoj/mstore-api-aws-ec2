const mongoose = require('mongoose'); // Erase if already required

var productSchema = new mongoose.Schema(
    {
        title:{
            type:String,
            required:true,
            trim:true,
        },
        slug:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
        },
        description:{
            type:String,
            required:true,
        },
        price:{
            type:Number,
            required:true,
        },
        category:{
            type:String,
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
        },
        brand:{
            type:String,
            required:true,
        },
        sold:{
            type:Number,
            default:0,
        },
        size:{
            type:Array,
        },
        thumbnail:{
            type:String,
        },
        images:{
            type:Array,
        },
        color:[{type:mongoose.Schema.Types.ObjectId,ref:"Color"}],
        tags:[],
        ratings:[
            {
                star: Number,
                comment: String,
                postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

            },
        ],
        totalrating: {
            type: String,
            default: 0,
        },
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            require:true,
        }
    },
    { timestamps: true }
);

//Export the model
module.exports = mongoose.model("Product", productSchema);