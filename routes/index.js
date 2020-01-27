const express = require('express');
const router = express.Router();

const storeController = require('../controllers/storeControler');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const { catchErrors } = require('../handlers/errorHandlers');


// STORE
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));

router.get('/stores/:slug', catchErrors(storeController.getStoreBySlug));

// STORE add-Store
router.get('/add', authController.isLoggedIn, storeController.addStore); // controle login

router.post('/add', 
    storeController.upload, 
    catchErrors(storeController.resize), 
    catchErrors(storeController.createStore));
router.post('/add/:id',
    storeController.upload, 
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore));

// STORE edit-Store
router.get('/stores/:id/edit', catchErrors(storeController.editStore));


// TOP review + store
router.get('/top', catchErrors(storeController.getTopStores));



// TAG
router.get('/tags/', catchErrors(storeController.getStoreByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoreByTag));



// USER
router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);
router.get('/logout', authController.logout);

router.post('/register', 
  userController.validateRegister,
  userController.register,
  authController.login
);
router.post('/login', authController.login);


// ACCOUNT
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount) );


// Reset PSW
router.post('/account/forgot',catchErrors(authController.forgot) );
router.get('/account/reset/:token', catchErrors(authController.reset) );

router.post('/account/reset/:token', 
  authController.confirmedPasswords,
  catchErrors(authController.update) 
);

// MAP
router.get('/map', storeController.mapPage);
// HEART
router.get('/hearts',  authController.isLoggedIn, catchErrors(storeController.getHearts) );

// REVIEW in Store detail
router.post('/reviews/:id', authController.isLoggedIn, catchErrors(reviewController.addReview) );


// API Search , near, heart:id
router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));
router.post('/api/stores/:id/heart',catchErrors(storeController.heartStore) )





module.exports = router;







// BASE ---- Do work here
/* router.get('/', (req, res) => {
  const toto={ name:'toto', age:3333, cool:true};
  //res.send('Hey! It works!');

  //res.json(toto);
  res.render('mytest', {
    nam: 'bob',
    dog: 'sisisi',
    title: 'TOTO'
  });
   // http://localhost:7777/?name=%22toto%22


}); */

/* router.get('/reverse/:name', (req,res)=>{
  const reverse = [...req.params.name].reverse().join('');
  res.send(reverse);
}) */

