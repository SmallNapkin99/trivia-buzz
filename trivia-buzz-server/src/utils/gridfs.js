import mongoose from "mongoose";
import dotenv from "dotenv";
import busboy from "busboy";

dotenv.config();

let gridfsBucket;

const initGridFSBucket = () => {
  if (!mongoose.connection.readyState) {
    throw new Error("MongoDB connection is not established yet.");
  }
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "images",
  });
  console.log("✅ GridFSBucket initialized");
};

const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error(
      "GridFSBucket has not been initialized. Call initGridFSBucket() first."
    );
  }
  return gridfsBucket;
};

/**
 * Uploads an image file to GridFS from an incoming request.
 * @param {Request} req - Express request object
 * @returns {Promise} Resolves with file details or rejects with an error
 */
const uploadFile = (req) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let fileName, fileType, fileId;

    bb.on("file", (fieldname, file, filename, encoding, mimetype) => {
      fileName = filename;
      fileType = mimetype;

      // Use getGridFSBucket() to retrieve the initialized gridfsBucket
      const uploadStream = getGridFSBucket().openUploadStream(fileName, {
        contentType: fileType,
      });

      file.pipe(uploadStream);

      uploadStream.on("finish", () => {
        fileId = uploadStream.id;
        resolve({ message: "File uploaded successfully", fileName, fileId });
      });

      uploadStream.on("error", (err) => {
        reject(err);
      });
    });

    bb.on("finish", () => {
      if (!fileName) {
        resolve({ message: "No file uploaded", fileName: null, fileId: null });
      }
    });

    bb.on("error", (err) => {
      reject(err);
    });

    req.pipe(bb);
  });
};

export { uploadFile, initGridFSBucket, getGridFSBucket };
