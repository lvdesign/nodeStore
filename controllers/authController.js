const passport = require('passport');
const crypto= require('crypto');

const mongoose =require('mongoose');
const User= mongoose.model('User');
const promisify = require('es6-promisify');

// liaison avec mail
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed login',
    successRedirect: '/',
    successMessage: 'You are logged in!'
});

exports.logout = (req, res) => {
req.logout();
req.flash('success', 'You are log out !');
res.redirect('/');
};

//
exports.isLoggedIn = (req,res, next) => {
    // user auth
    if (req.isAuthenticated()){
        next(); //ok
        return;
    }
    req.flash('error', 'Ooops, you must be logged!');
    res.redirect('/login');
}

// PSW Forgot
exports.forgot = async (req,res) => {
// user exist?
const user = await User.findOne({email: req.body.email});
if(!user){
    req.flash('error', 'No account with this email!');
    return res.redirect('/login');
}
// 2 - reset token
user.resetPasswordToken=crypto.randomBytes(20).toString('hex');
user.resetPasswordExpires = Date.now() + 3600000; // 
await user.save();
// 3 - send Email with token
const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
await mail.send({
    user:user,
    subject: 'Password RESET',
    resetURL: resetURL,
    filename: 'password-reset'
})

// without mailer req.flash('success',`We have been emailed a psw reset link :  ${resetURL}`);
req.flash('success',`We have been emailed a psw reset link in your mail.`);
// redirect login
res.redirect('/login');

};

exports.reset= async(req,res)=> {
    // token ?
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });
    if(!user){
        req.flash('error', 'Password reset is invalidor expired!');
        return res.redirect('/login');
    }
    // if ok 
    res.render('reset', { title: 'Reset your password'});

}


exports.confirmedPasswords = (req, res, next) => {
if(req.body.password === req.body['password-confirm']){
    next(); 
    return ;
}
req.flash('error', 'Password do not match!!');
res.redirect('back');
}

exports.update = async(req, res) => {
    //
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user){
        req.flash('error', 'Password reset is invalid now!');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', ' Your Psw is reset!');
    res.redirect('/');

    
}