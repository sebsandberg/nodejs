// config/passsport.js

// load all the things we need
var LocalStrategy       = require('passport-local').Strategy;
var FacebookStrategy    = require('passport-facebook').Strategy;
var TwitterStrategy     = require('passport-twitter').Strategy;
var SpotifyStrategy     = require('passport-spotify').Strategy;

//========TEST===========
// load spotifyWebApi
var SpotifyWebApi = require('spotify-web-api-node');
//==========END TEST=====

//load up the user model
var User                = require('../app/models/user');

// load the auth variables
var configAuth          = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {
    
    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session
    
    //used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    
    //used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });
    
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('local-signup', new LocalStrategy({
        //by default, local strategy uses username and password, we will override with email
        usernameField   : 'email',
        passwordField   : 'password',
        passReqToCallback   : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'local.email' : email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);
                
                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken'));
                } else {
                    
                    //if there is no user with that email
                    // create the user
                    var newUser                 = new User();
                    
                    // set the user's local credentials
                    newUser.local.email         = email;
                    newUser.local.password      = newUser.generateHash(password);
                    
                    //save the user
                    newUser.save(function(err) {
                        if(err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
    
    
    
    // =======================================================================
    // LOCAL LOGIN ===========================================================
    // ======================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField   : 'email',
        passwordField   : 'password',
        passReqToCallback : true //allos us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
        
        //find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' : email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);
            
            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found')); // req.flash is the way to set flashdata using connect-flash
                
            // if user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
                
            // all is well, return successful user
            return done(null, user);
        });
    }));
    
    // =======================================================================
    // SPOTIFY ==============================================================
    // ======================================================================
    passport.use(new SpotifyStrategy({
        clientID        : configAuth.spotifyAuth.clientID,
        clientSecret    : configAuth.spotifyAuth.clientSecret,
        callbackURL     : configAuth.spotifyAuth.callbackURL
    },
 
 
    function(accessToken, refreshToken, profile, done) {
      
      // asynchronous
      process.nextTick(function() {
          
          var spotifyApi = new SpotifyWebApi({
            clientID        : configAuth.spotifyAuth.clientID,
            clientSecret    : configAuth.spotifyAuth.clientSecret,
            callbackURL     : configAuth.spotifyAuth.callbackURL
          });

          //=============TEMP ADD OF ACCESSTOKEN=============
        

          
          spotifyApi.setAccessToken(accessToken);
          console.log(spotifyApi);
                     spotifyApi.getMySavedTracks({
    limit : 2,
    offset: 1 
  })
  .then(function(data) {
    console.log(data);
  }, function(err) {
    return done(null, err);
  });
            // TEST ======================
                
                //=== END OF TEST=======
          
          //find the user in the database based on their spotify id
          User.findOne( { 'spotify.id' : profile.id }, function(err, user) {
              
              //if there is an error, stop everything
              if (err)
                return done(err);
                
            // if the user is found, then log them in
            if (user){
                
                return done(null, user); // user found, return user
            } else {
                var newUser             = new User();
                    
                      spotifyApi.setAccessToken(accessToken);
                      spotifyApi.getMe()
                      .then(function(data) {
                          console.log(data['display_name']);
                          newUser.spotify.name   = data['display_name'];
                          //newUser.spotify.pictureURL = data['']
                      })
                    // set all of the spotify information in our user model
                    newUser.spotify.id     = profile.id; // set the users spotify  id
                    newUser.spotify.token  = accessToken; // we will save the token that spotify provides to the user
                   // newUser.spotify.name   = profile.display_name; // look at the passport user profle to see how names are returned
                   // newUser.spotify.email  = profile.email  // facebook can return multiple emails so w'll take the first
                    
                    // save the user to the database
                    newUser.save(function(err) {
                        if (err)
                            return done(err);
                        
                        //if successful, return the new user
                        return done(null, newUser);
                    });
            }
          })
      })
  }));
    
    
    
    
    // ========================================================================
    // FACEBOOK ==============================================================
    // ========================================================================
    passport.use(new FacebookStrategy({
        
        // pull in our app id and secret from our ath.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL
        
    },
    
    //facebook will send back the token and profile
    function(token, refreshToken, profile, done) {
        
        // asynchronous
        process.nextTick(function() {
            
            //find the user in the database based on their facebook id
            User.findOne( {  'facebook.id' : profile.id }, function(err, user) {
                
                // if there is an error, stop everything and that 
                // ie an error connecting to the database
                if (err)
                    return done(err);
                
                // if the user is found, then log htem in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser             = new User();
                    
                    
                    // set all of the facebook information in our user model
                    newUser.facebook.id     = profile.id; // set the users facebook id
                    newUser.facebook.token  = token; // we will save the token that facebook provides to the user
                    newUser.facebook.name   = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profle to see how names are returned
                    newUser.facebook.email  = profile.emails[0].value;  // facebook can return multiple emails so w'll take the first
                    
                    // save the user to the database
                    newUser.save(function(err) {
                        if (err)
                            return done(err);
                        
                        //if successful, return the new user
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
    
    
    // ===========================================
    // TWITTER ==================================
    // ===========================================
    passport.use(new TwitterStrategy({
        
        consumerKey         : configAuth.twitterAuth.consumerKey,
        consumerSecret      : configAuth.twitterAuth.consumerSecret,
        callbackURL         : configAuth.twitterAuth.callbackURL
    },
    function(token, tokenSecret, profile, done) {
        
        //make the code asynchronous
        //User.findOne won't fire until we have all our data back from Twitter
        process.nextTick(function() {
            
            User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                
                //if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);
                
                //if the user is foudm then log them in
                if (user){
                    return done(null, user); //user found, return that user
                } else {
                    //if there is no user, create them
                    var newUser                 = new User();
                    
                    //set allof the user data that we need
                    newUser.twitter.id          = profile.id;
                    newUser.twitter.token       = token;
                    newUser.twitter.username    = profile.username;
                    newUser.twitter.displayName = profile.displayName;
                    
                    
                    // save our user into the databse
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                    
                }
            })
        })
    }))
};