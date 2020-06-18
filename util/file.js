const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');
const Datauri = require('datauri');
const { promisify } = require('util')
const unlinkAsync = promisify(fs.unlink);

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// const cloudinaryStorage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     // folder: process.env.CLOUDINARY_IMAGE_FOLDER_NAME,
//     allowedFormats: ['jpg', 'png', 'jpeg'],
//     // params: {
//     //     folder: process.env.CLOUDINARY_IMAGE_FOLDER_NAME,
//     //     format: async (req, file) => ['jpg', 'png', 'jpeg'], // supports promises as well
//     //     // public_id: (req, file) => 'computed-filename-using-request',
//     // },
//     params: async (req, file) => {
//         req.file = file
//         return next();
//         }
//     });

// const cloudinaryImageStore = multer({ storage: cloudinaryStorage }).single('image');

// const memoryStorage = multer.memoryStorage();
// const multerUpload = multer({ memoryStorage }).single('image');

// const dUri = new Datauri();
// const dataUri = req => dUri.format(path.extname(req.file.originalname).toString(), req.file.buffer);

const imageStore = {
    uploadToCloud(req, res, next) {
    
    if(!req.file ) {
        return next();
    }
    
    const { path } = req.file;
    cloudinary.uploader.upload(path, {
        tags: '',
        width: 150,
        height: 150,
        folder: process.env.CLOUDINARY_IMAGE_FOLDER_NAME,
        allowed_formats: ['jpg', 'jpeg', 'png']
    })
    .then((image) => {
        req.image = image;
    })
    .then((result) => {
        return unlinkAsync(req.file.path);
    })
    .then(result => {
        return next();
    })
    .catch(err => {
        console.log(err);
    });
    }
};

const removeFromCloud = (public_id) => {
    cloudinary.uploader.destroy(public_id)
    .then((result) => {
        console.log('Image deleted from cloud')
    })
    .catch(err => {
        console.log('Error while deleting image from cloud');
        return next();
    });
}

// var invoiceStorage = cloudinaryStorage({
//     cloudinary: cloudinary,
//     folder: process.env.CLOUDINARY_INVOICE_FOLDER_NAME,
//     allowedFormats: ['pdf'],
// });

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'images');
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            throw (err);
        }
    })
}

const upload = multer({ storage: fileStorage,  limits: { fileSize: 1024 * 1024 * 5 }, fileFilter });

module.exports = {
    // deleteFile: deleteFile,
    upload: upload,
    imageStore: imageStore,
    removeFromCloud: removeFromCloud,
    // multerUpload: multerUpload,
    // dataUri: dataUri,
    // cloudinaryImageStore: cloudinaryImageStore
}
