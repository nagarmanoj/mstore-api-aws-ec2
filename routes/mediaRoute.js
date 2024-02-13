const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/fileUpload");
const { uplopoadMedia, getMedia } = require("../controller/mediaController");

router.post("/",upload.array('media',10),authMiddleware,uplopoadMedia);
router.get("/",authMiddleware,getMedia);
module.exports = router;