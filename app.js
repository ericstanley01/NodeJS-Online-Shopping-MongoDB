const express = require('express');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
// const cloudinary = require('./util/file');

const errorsController = require('./controllers/error');
const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { db } = require('./models/user');

const fileHelper = require('./util/file');

// const MONGODB_URI = 'mongodb+srv://' + process.env.MONGODB_USERNAME +
//     ':' + process.env.MONGODB_PASSWORD +
//     '@' + process.env.MONGODB_CLUSTER + '/' +
//     process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

const MONGODB_URI = 'mongodb://' + process.env.MONGODB_USERNAME +
    ':' + process.env.MONGODB_PASSWORD +
    '@' + process.env.MONGODB_CLUSTER + '/' +
    process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

dotenv.config();

const csrfProtection = csrf();
// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'images');
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + '-' + file.originalname);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// }

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(multer({ storage: fileHelper.fileStorage, fileFilter: fileHelper.fileFilter }).single('image'));
app.use(fileHelper.upload.single('image'));
// app.use(fileHelper.multerUpload);
app.use(fileHelper.imageStore.uploadToCloud);
// app.use(fileHelper.cloudinaryImageStore);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false,
  store: store
}));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken();
  res.locals.username = undefined;
  next();
});

app.use((req, res, next) => {
  if(!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
  .then(user => {
    if(!user) {
      return next();
    }
    req.user = user;
    res.locals.username = req.user.name;
    next();
  })
  .catch(err => {
    next(new Error(err));
  });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorsController.get500);

app.use(errorsController.get404);

app.use((err, req, res, next) => {
  // res.redirect('/500');
  res.status(500).render('500', {
    title: 'Error occurred',
    path: '/500',
    isAuthenticated: req.session.isLoggedIn
   });
})

mongoose
  .connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(result => {
    app.listen(process.env.PORT);
    console.log(`App started listening to port ${process.env.PORT}`)
  })
  .catch(err => console.log(err));
