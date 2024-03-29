const express = require("express");
const { 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    getCategory, 
    getallCategory 
} = require("../controller/productcategoryController");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/fileUpload");

router.post("/",upload.single('categoryFile'), authMiddleware, isAdmin, createCategory);
router.put("/:id", authMiddleware, isAdmin, updateCategory);
router.delete("/:id", authMiddleware, isAdmin, deleteCategory);
router.get("/:id", getCategory);
router.get("/", getallCategory);

module.exports = router;
