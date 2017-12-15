const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
        return;
    }
    req.flash('error', 'You must be logged in to do that');
    res.redirect('/login')
}

exports.forgot = async (req, res) =>{
    // 1. Check if user email exists
    // 3. Send an email with the token
    // 4. Redirect to login page
    const user = await User.findOne({email: req.body.email});
    
    if(!user){
        req.flash('error', 'No account with that email exists');
        return res.redirect('/login')
    }
    
    // 2. Set reset tokens and expiry on their account
    
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetURL = `http://${req.headers.host}.account.reset/${user.resetPasswordToken}`;
    req.flash('success', `You have emailed a password resset link ${resetURL}`);
    res.redirect('/login');
}