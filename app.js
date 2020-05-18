const express = require('express');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const path = require('path');
const dotenv = require('dotenv');

const errorsController = require('./controllers/error');
const mongoConnect = require('./util/database');
// const User = require('./models/user');

// const adminRoutes = require('./routes/admin');
// const shopRoutes = require('./routes/shop');

const app = express();

dotenv.config();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  //  User.findByPk(1)
  //   .then(user => {
  //    req.user = user;
  //    next();
  //   })
  //   .catch(err => console.log(err));
});

// app.use('/admin', adminRoutes);
// app.use(shopRoutes);

app.use(errorsController.get404);

mongoConnect((client) => {
  console.log(client);
  app.listen(process.env.PORT);
})