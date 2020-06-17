const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    // folder: process.env.CLOUDINARY_IMAGE_FOLDER_NAME,
    // allowedFormats: ['jpg', 'png', 'jpeg'],
    params: {
        folder: process.env.CLOUDINARY_IMAGE_FOLDER_NAME,
        format: async (req, file) => ['jpg', 'png', 'jpeg'], // supports promises as well
        // public_id: (req, file) => 'computed-filename-using-request',
    },
});

// var invoiceStorage = cloudinaryStorage({
//     cloudinary: cloudinary,
//     folder: process.env.CLOUDINARY_INVOICE_FOLDER_NAME,
//     allowedFormats: ['pdf'],
// });

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    })
}

module.exports = {
    deleteFile: deleteFile,
    imageStorage: multer({
        storage: imageStorage
    })
}

// exports.deleteFile = deleteFile;

// exports.imageStorage = multer({
//     storage: imageStorage
//   });
// exports.invoiceStorage = multer({
//     storage: invoiceStorage
//   }).single('pdf');