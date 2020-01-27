const mongoose =require('mongoose');
const Store= mongoose.model('Store');
const User= mongoose.model('User');

// Image middleware
const multer = require('multer');
const jimp =require('jimp');
const uuid = require('uuid');

const multerOptions= {
    storage: multer.memoryStorage(),
    fileFilter(req,file,next){
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto){
            next(null, true); // ok is photo
        }else{
            next({ message:'That filetype not allowed!'}, false);
        }
    }
};

exports.homePage = (req,res) => {
    res.render('index');
};


// Get to page editer un store
exports.addStore = (req,res) =>{
    res.render('editStore', {
        title:'add Store'
    })
}

// Image method
exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) =>{
    // New file?
    if(!req.file){
        next();
        return;
    }
    //console.log(req.file);
    const extension = req.file.mimetype.split('/')[1]; // jepg
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize
    const photo = await jimp.read(req.file.buffer); // transforme la photo ds le buffer
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // save ref to DB
    next();
}



// CREATE  with function catchErrors() ds index.js pour gerer les errors
exports.createStore = async(req,res) =>{
    req.body.author = req.user._id;
    // res.json(req.body)
    const store = await(new Store(req.body)).save();
    //await store.save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    console.log('Ok it\'s fine');
    //res.redirect('/');
    res.redirect(`/store/${store.slug}`);

}

// GET ALL and Reviews
exports.getStores = async (req,res)=>{
    // pagination
    const page = req.params.page || 1;
    const limit= 4;
    const skip = (page * limit) - limit;

// double promise
    const storesPromise = Store
    .find()
    .skip( skip)
    .limit(limit)
    .sort({created: 'desc'})
    ;
    const countPromise = Store.count();

    const [stores, count] = await Promise.all([ storesPromise, countPromise ]);

    // La fonction Math.ceil() retourne le plus petit entier supérieur ou égal au nombre donné.
    const pages = Math.ceil(count / limit);
    if(!stores.length && skip){
        req.flash('info', `Hey, you asked for page ${page}. But that doesn't exixt. Got to page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    //.populate('reviews'); // async->await  all
    // console.log(stores);   + count
    res.render('stores', { title:'Stores', stores, page, pages, count });
}


// GET Detail by slug
// associ Review model for reviews
exports.getStoreBySlug = async (req,res, next) => {
    //res.send('It works');
    const store = await Store.findOne({ slug: req.params.slug})
    .populate('author reviews');
    if(!store) return next();
    //res.json(store);
    res.render('store', { title: `${store.name}`, store});
}

// EDIT post
// verifie si le user est l'auteur
const confirmOwner = (store, user ) => {
    if(!store.author.equals(user._id)){
        throw Error('You musts own a store in Order to edit it!');
    }
};
exports.editStore = async (req,res)=>{
    // find the id
    const store = await Store.findOne({ _id: req.params.id})
    //res.json(store);
    // confirm Owner
    confirmOwner(store, req.user);
    // Render 
    res.render('editStore', { title: `Edit ${store.name}`, store})
    // ok owner
    // form update
}

// UPDATE put
exports.updateStore = async (req,res)=>{
    // set Location as a Point for Update
    req.body.location.type= 'Point';
    // id
    const store = await Store.findOneAndUpdate({ _id: req.params.id},
        req.body, {
            new: true,
            runValidators:true
        }).exec();
    req.flash('success', `Successfully Updated ${store.name}. <a href="/stores/${store.slug}">View Store -> </a>`);
    //res.json(store);
    res.redirect(`/stores/${store._id}/edit`);    
}


// TAG get 
exports.getStoreByTag = async (req,res) =>{
    //res.send('It work');
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true }

    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery  });

    //const result= await Promise.all([tagsPromise, storesPromise])
    const [tags, stores ]= await Promise.all([tagsPromise, storesPromise])
    //res.json(tags);
    res.render('tags', { tags, title: 'Tags', tag, stores });
}

// Search

exports.searchStores = async (req,res) => {
    // http://localhost:7777/api/search?q=beer -> {"q":"beer"}
    //res.json(req.query);

    const stores = await Store
    // find store
    .find({
        $text:{
            $search: req.query.q
        }
    },{
        score: { $meta: 'textScore' }
    })
    // sort it
    .sort({
        score: { $meta: 'textScore' }
    })
    // limit it
    .limit(5);
    res.json(stores);
};


//map store
exports.mapStores = async (req,res) => {
    //res.json({ it: 'word'});
     //res.json(req.query);
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
 const q={
     location:{
         $near:{
            $geometry:{
                type: 'Point',
                coordinates: coordinates
            },
            $maxDistance: 10000 //10 km
         }
     }
 };

 const stores = await Store.find(q).select('slug name description location photo').limit(10);
 res.json(stores);
};

// Mappage
exports.mapPage =  async (req,res) => {
    res.render('map', { title: 'Map'});
}

// Heart
exports.heartStore = async (req,res) => {
    const hearts = req.user.hearts.map(obj => obj.toString()); // array of Object to oject  to string
    // permet d'envoyer et de controler ce qu'il y a sur Mongo
    // $pull -> remove 
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user._id,
            { [operator]: { hearts: req.params.id}},
            { new: true}
        );

    //console.log(hearts);
    res.json(user);
}


// Hearts page
exports.getHearts = async (req,res) => {

    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    });
//res.json(stores);
    // retrouve les stores favoris en cliquant sur hearts
    res.render('stores', { title: 'Hearted Stores', stores: stores});
}

// Top

exports.getTopStores = async(req,res) => {

    const stores = await Store.getTopStores(); // in model 
//res.json(stores)
    res.render('topStores', { title: 'Top stores! ', stores});
}