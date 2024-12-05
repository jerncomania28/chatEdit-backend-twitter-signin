var passport = require('passport'),
    mongoose = require('mongoose');

module.exports = function() {
    var User = mongoose.model('User');

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser(function(id, done) {
        User.findOne({
            _id: id
        }).select('-password -salt').then(user => {
            done(null, user);
        }).catch(err => done(err));
    });
    
    require('./strategies/local.js')();
    require('./strategies/jwt.js')();
    // require('./strategies/google.js');
    // require('./strategies/twitter.js'); 
};