import { uploadFile } from "../utils/gridfs.js";
import { ObjectId } from "mongodb";
import express from "express";
import { getGridFSBucket } from "../utils/gridfs.js";

const router = express.Router();

//get image by ID
router.get("/:id", async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);

    // Find file metadata
    const file = await bucket.find({ _id: fileId }).toArray();

    if (!file || file.length === 0) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Set the correct content type from filename.mimeType
    const contentType = file[0].filename.mimeType || "application/octet-stream";
    res.set("Content-Type", contentType);

    // Stream the image to the response
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//upload image
router.post("/upload", async (req, res) => {
  try {
    const result = await uploadFile(req);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//delete image by id
router.delete("/delete/:id", async (req, res) => {
  try {
    const bucket = getGridFSBucket();
    const fileId = new ObjectId(req.params.id);
    const db = bucket.s.db;

    // Delete chunks
    await db.collection("images.chunks").deleteMany({ files_id: fileId });

    // Delete file document
    await db.collection("images.files").deleteOne({ _id: fileId });

    res.json({
      message: `Image with ID ${fileId} deleted successfully.`,
      imageId: fileId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
