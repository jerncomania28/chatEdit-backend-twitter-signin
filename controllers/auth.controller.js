const passport = require("passport"),
  config = require("../config/config"),
  getToken = require("../config/utils/getToken");

const mongoose = require("mongoose"),
  User = mongoose.model("User");

/**
 * Middleware to protect auth routes
*/
exports.ensureAuthenticated = passport.authenticate("jwt", {
  session: false,
});

exports.verifyMagicLink = async (payload, done) => {
  try {
    const user = await User.findOne({ email: payload.destination });
    // If user doesn't exist, create a new user
    if (!user) {
      User.create({
        logins: 1,
        verify: true,
        name: payload.name || "Guest",
        lastLogin: Date.now(),
        loginType: "magic-link",
        email: payload.destination,
      }).then(async (new_user) => {
        return done(null, new_user);
      });
    } else {
      // If user exists, update the user's logins and lastLogin
      const updatedUser = await User.findOneAndUpdate(
        { email: payload.destination },
        {
          $set: {
            logins: user.logins + 1,
            lastLogin: Date.now(),
            ...(user.verify && { verify: true, loginType: "magic-link" }),
          },
        },
        { new: true },
      );
      return done(null, updatedUser);
    }
  } catch (err) {
    return done(err);
  }
};

exports.verifyGoogleLogin = async (
  accessToken,
  refreshToken,
  profile,
  done,
) => {
  try {
    const { email, name, picture } = profile._json;
    const user = await User.findOne({ email });
    if (!user) {
      User.create({
        name,
        email,
        logins: 1,
        verify: true,
        thumbnail: picture,
        loginType: "google",
        lastLogin: Date.now(),
      }).then(async (new_user) => {
        return done(null, new_user, { accessToken, refreshToken });
      });
    } else {
      // If user exists, update the user's logins and lastLogin
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        {
          $set: {
            logins: user.logins + 1,
            lastLogin: Date.now(),
            ...(user.verify && { verify: true, loginType: "google" }),
          },
        },
        { new: true },
      );
      return done(null, updatedUser, { accessToken, refreshToken });
    }
  } catch (err) {
    return done(err);
  }
};

exports.verifyTwitterLogin = async (token, tokenSecret, profile, done) => {
  try {
    const { id, name, email, profile_image_url_https } = profile._json;
    // Account for twitter accounts without email
    if (!email) return done(new Error("Twitter account must have an email linked."))
    const user = await User.findOne({ email });
    if (!user) {
      User.create({
        name,
        email,
        logins: 1,
        verify: true,
        twitterId: id,
        loginType: "twitter",
        lastLogin: Date.now(),
        thumbnail: profile_image_url_https,
      }).then(async (new_user) => {
        return done(null, new_user, { token, tokenSecret });
      });
    } else {
      // If user exists, update the user's logins and lastLogin
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        {
          $set: {
            logins: user.logins + 1,
            lastLogin: Date.now(),
            ...(user.verify && {
              verify: true,
              loginType: "twitter",
              twitterId: id,
            }),
          },
        },
        { new: true },
      );
      return done(null, updatedUser, { token, tokenSecret });
    }
  } catch (err) {
    return done(err);
  }
};

exports.getTokenAndRedirect = async (req, res) => {
  const token = getToken(req.user);
  return res.redirect(`${config.client_url}/user/confirm?token=${token}`);
};
