const passport = require("passport"),
  TwitterStrategy = require("passport-twitter").Strategy,
  ctrl = require("../../controllers/auth.controller");

module.exports = function () {
  passport.use(
    new TwitterStrategy(
      {
        includeEmail: true,
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: "http://127.0.0.1:3500/auth/twitter/callback",
      },
      ctrl.verifyTwitterLogin,
    ),
  );
};
