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

const errorsController = require('./controllers/error');
const shopController = require('./controllers/shop');
const isAuth = require('./middleware/is-auth');
const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const { db } = require('./models/user');

const fileHelper = require('./util/file');

const MONGODB_URI = 'mongodb+srv://' + process.env.MONGODB_USERNAME +
    ':' + process.env.MONGODB_PASSWORD +
    '@' + process.env.MONGODB_CLUSTER + '/' +
    process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

// const MONGODB_URI = 'mongodb://' + process.env.MONGODB_USERNAME +
//     ':' + process.env.MONGODB_PASSWORD +
//     '@' + process.env.MONGODB_CLUSTER + '/' +
//     process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

dotenv.config();

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(fileHelper.upload.single('image'));
app.use(fileHelper.imageStore.uploadToCloud);

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({ 
  secret: process.env.SESSION_SECRET, 
  resave: false, 
  saveUninitialized: false,
  store: store
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
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

app.post('/create-order', isAuth, shopController.postOrder);

app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorsController.get500);

app.use(errorsController.get404);

app.use((err, req, res, next) => {
  console.log(err);
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
