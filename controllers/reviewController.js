const passport = require('passport');
const crypto= require('crypto');

const mongoose =require('mongoose');
const Review= mongoose.model('Review');
const User= mongoose.model('User');
const promisify = require('es6-promisify');



exports.addReview = async (req,res) => {
    req.body.author = req.user._id; // from header user
    req.body.store = req.params.id; // from url
    //res.json(req.body);
    const newReview = new Review(req.body);
    await newReview.save();
    req.flash('success', 'Review saved!');
    res.redirect('back');
}