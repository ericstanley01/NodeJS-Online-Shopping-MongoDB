const express = require('express');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const errorsController = require('./controllers/error');
const User = require('./models/user');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const app = express();

dotenv.config();

let connnectionString = 'mongodb+srv://' + process.env.MONGODB_USERNAME +
    ':' + process.env.MONGODB_PASSWORD +
    '@' + process.env.MONGODB_CLUSTER + '-rej5u.mongodb.net/' +
    process.env.MONGODB_DATABASE + '?retryWrites=true&w=majority';

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
   User.findById(process.env.DEFAULT_USERID)
    .then(user => {
     req.user = user;
     next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorsController.get404);

mongoose
  .connect(connnectionString, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(result => {
    User
      .findOne()
      .then(user => {
        if (!user) {
          const user = new User({
            name: 'eric',
            email: 'eric@test.com',
            cart: {
              items: []
            }
          });
          user.save();
        }
      })
      .catch(err => console.log(err));

    app.listen(process.env.PORT);
    console.log(`App started listening to port ${process.env.PORT}`)
  })
  .catch(err => console.log(err));
