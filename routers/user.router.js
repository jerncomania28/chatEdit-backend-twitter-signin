var passport = require("passport"),
  requireSignin = passport.authenticate("local", { session: false }),
  router = require("express").Router(),
  userCtr = require("../controllers/user.controller");

// router.post("/check-invitation-code", userCtr.checkInvitationCode);
router.post("/register", userCtr.register);
router.post("/login-with-email", userCtr.loginWithEmail);
router.post("/login", requireSignin, userCtr.login);
router.post("/login-with-token", userCtr.loginWithToken);
router.post("/token-verification", userCtr.tokenVerification);
router.post("/send-verify-email", userCtr.sendEmail);
router.post("/google-login", userCtr.loginWithGoogle);
router.post("/twitter-login", userCtr.loginWithTwitter);

module.exports = router;