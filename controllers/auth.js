const User = require('../models/user');
const dotenv = require('dotenv');

dotenv.config();

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1].trim();
    console.log(req.session.isLoggedIn);
    res.render('auth/login', {
        title: 'Login',
        path: '/login',
        isAuthenticated: false
    });
}

exports.postLogin = (req, res, next) => {
    User.findById(process.env.DEFAULT_USERID)
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
                console.log(err);
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}
