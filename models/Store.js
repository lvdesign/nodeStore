const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');


const storeSchema = new mongoose.Schema({

    name: {
        type: String,
        trim: true,
        required: 'Please enter a store Name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags:[String],
    created:{
        type:Date,
        default: Date.now
    },
    location:{
        type: {
            type: String,
            default:"Point"
        },
        coordinates:[{ type: Number }],
        address:{
            type: String,
            required: 'Please you must supply adress!'
        }
    },
    photo:String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required: 'Please you must supply an author!'
    }

},{
    toJSON:{ virtuals: true },
    toObject: {virtuals:true},
});

// Define Indexes for Search
storeSchema.index({
    name: 'text',
    description: 'text'
});

storeSchema.index({ location: '2dsphere' });

// function interne
storeSchema.pre('save', async function(next){
    if(!this.isModified('name')){
        next();
        return;
    }
    this.slug = slug(this.name);
    // creer slug si deja toto -> toto-1, toto-2, etc
    const slugRegEx= new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx});
    if(storesWithSlug.length){
        this.slug = `${this.slug}-${storesWithSlug.length +1}`;
    }

    next();
});

// function Tag
// select par tag et compter en order decroissant
storeSchema.statics.getTagsList = function(){
    return this.aggregate([
        { $unwind: '$tags'},
        { $group: { _id: '$tags', count:{ $sum:1 } }},
        { $sort: { count: -1 }}
    ]);
};

// Top Store methode
storeSchema.statics.getTopStores = function(){
    return this.aggregate([
        // looking Stores and populate
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' }},

        //filter only Items with 2 or + review
        { $match: { 'reviews.1':{$exists: true} } },
        // add average field $project -> mongoDB 3.2,   $addFields -> mongoDB 4.2
        // $set plus complet
        { $project: {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.reviews',
            slug: '$$ROOT.slug',
            averageRating: {$avg: '$reviews.rating'}
        }},
        // sort Desc
        { $sort: { averageRating: -1}}, 
        // limit at 10
        { $limit:10 }
    ]);
};



/**
 *   JOIN as SQL
 * ref: 'Review', // Model to Link
    localField: '_id', // fieldin Store
    foreignField: 'store' // field on Review
 */
storeSchema.virtual('reviews', {
    ref: 'Review', 
    localField: '_id', 
    foreignField: 'store'
});

function autopopulate(next){
    this.populate('reviews');
    next();
}

// populate
storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports =mongoose.model('Store', storeSchema);