// app/routes.js
module.exports = function(app, passport){
    
    // ===================================
    // HOME PAGE (with login links) ======
    // ===================================
    app.get('/', function(req, res){
        res.render('index.ejs'); // load the index.ejs file
    });
    
    // ===================================
    // LOGIN =============================
    // ===================================
    //show the login form
    app.get('/login', function(req, res) {
        
        //render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });
    
    //process the login form.
     app.post('/login', passport.authenticate('local-login', {
         successRedirect : '/profile', // redirect to the secure profile section
         failureRedirect : '/login', // redirect back to the signup page if there is an error
         failureFlash : true // allow flash messages
     }));
    
    
    // ===================================
    // SIGNUP ============================
    // ===================================
    // show the signup form
    app.get('/signup', function(req,res){
        
        //render the page and pass in any flash data if it exists
        res.render('signup.ejs', {message: req.flash('signupMessage') });
    });
    
    //process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', //redirect to  the secure profile section
        failureRedirect : '/signup', // redirect bacl tp tje sogmiå åage of tjere os am errpr
        failureFlash : true // allow flash maessages
    }));
    
    // ===================================
    // PROFILE SECTION ===================
    // ===================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req,res) {
        res.render('profile.ejs', {
            user : req.user //get the user out of session and pass to template
        });
    });
    
    // ===================================
    // SPOTIFY ===========================
    // ===================================
    // route for spotify authenticate and login
    app.get('/auth/spotify', passport.authenticate('spotify', {scope: ['user-library-read', 'user-read-email', 'user-read-private'] }), function(req, res){
        // The request will be redirected to spotify for authentication, so this
        // function will not be called.
    });

    app.get('/auth/spotify/callback', 
        passport.authenticate('spotify', { 
            failureRedirect: '/login' }),
            function(req, res) {
                // Successful authentication, redirect home.
                res.redirect('/profile');
    });
    
    // ===================================
    // FACEBOOK ==========================
    // ===================================
    //route for facebook authenticate and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
    
    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));
        
        
        
        
    // ===================================
    // PLAYLIST ==========================
    // ===================================
    // route for spotify playlist
    //app.get('/spotify/playlist', passport.)
    
    // ====================================
    // LOGOUT =============================
    // ====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
    
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
        
    // if the aren't redirect them to the home page
    res.redirect('/');
}
