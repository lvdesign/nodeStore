const mongoose =require('mongoose');
const User= mongoose.model('User');
const promisify= require('es6-promisify')

exports.loginForm = (req,res) => {
    res.render('login', { title: 'login Form'} )
}


exports.registerForm = (req,res) => {
    res.render('register', { title:'Register' })
}

// Validate
exports.validateRegister = (req, res, next) => {
    req.sanitizeBody('name');
    req.checkBody('name', 'you must supply a name').notEmpty();
    req.checkBody('email', 'Email is not valid!').isEmail();
    req.sanitizeBody('email').normalizeEmail({ 
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    })
    req.checkBody('password', 'you must supply a password').notEmpty();
    req.checkBody('password-confirm', 'you must supply a password').notEmpty();
    req.checkBody('password-confirm', 'Ooops! your confirm password !').equals(req.body.password);

    const errors = req.validationErrors();
    if(errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return; // if errors
    }
    next();
};

exports.register = async (req,res,next) => {
    const user =  new User({email: req.body.email, name: req.body.name});
    const register = promisify(User.register, User);
    await register(user, req.body.password);
    //res.send('it works');
    next();
}


// ACCOUNT
exports.account = (req,res) =>{
    res.render('account', { title: 'Edit your account'});
}

exports.updateAccount = async(req,res) =>{
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user= await User.findOneAndUpdate(
        { _id: req.user._id},
        { $set: updates },
        { new: true, runValidators:true, context: 'query'}
    );
    //res.json(user)
    //res.redirect('/account');
    req.flash('success', 'Your account is updated!!')
    res.redirect('back');
}