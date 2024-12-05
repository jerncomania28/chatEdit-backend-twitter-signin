const getToken = require("../config/utils/getToken");
const handleError = require("../config/utils/handleError");
const emailjs = require('@emailjs/nodejs');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// const catchAsync = require("../config/utils/catchAsync");

var mongoose = require("mongoose"),
  User = mongoose.model("User"),
  // InvitationCode = mongoose.model("Code"),
  jwt = require("jsonwebtoken"),
  config = require("../config/config");

// exports.checkInvitationCode = async (req, res) => {
//   try {
//     const { code } = req.body;
//     InvitationCode.findOne(({ codeName : code }))
//       .then(async (one) => {
//         if(one) await res.sendStatus(200);
//         else await res.sendStatus(201);
//       })
//   }
//   catch {
//     await res.sendStatus(501);
//   }
// }

//Register Endpoint
exports.register = async (req, res) => {
  try {
    let { email, password } = req.body;
    console.log(email, password);
    User.findOne(({ email: email }))
      .then(async (user) => {

        if (!user) {
          User.create({
            email, password
          }).then(async user => {
            const token = getToken(user);
            const flag = await this.sendVerifyEmail(token, user);
            if (flag) {
              await res.status(200).send({
                user: user,
                token: token
              });
            }
          }).catch(err => handleError(err, res));
        }
        else {
          await res.status(201).send("This user already exists!");
        }
      })
  }
  catch {
    await res.sendStatus(501);
  }
}

//Send Verify Email Function
exports.sendVerifyEmail = async (token, user) => {
  try {
    const st = token.split(".");
    const sendToken = `?firstpart=${st[0]}&secondpart=${st[1]}&thirdpart=${st[2]}`;
    const templateParams = {
      to_name: "dear",
      from_name: "ChatEdith",
      recipient: user.email,
      message: config.server_url + "/user/verify/token" + sendToken
    };
    const serviceID = "service_fm6oh5d";
    const templateID = "template_khaw44j";
    const userID = {
      publicKey: 'B87nKNqTv4CqpQ1Z6',
      privateKey: 'wpMq-jUQ0F7ARW_3208Z9'
    }
    const response = await emailjs.send(serviceID, templateID, templateParams, userID);
    console.log(user.email, 'verify email send success', response.status, response.text);
    return true;
  }
  catch (err) {
    console.log(user.email, 'verify email send failed', err);
    return false;
  }
}

//Send Email Endpoint
exports.sendEmail = async (req, res) => {
  try {
    const { token, user } = req.body;
    // const decryptedUser = JSON.parse(decryptData(user));
    console.log(token, user)
    const flag = await this.sendVerifyEmail(token, user);
    if (flag) await res.status(200).send("ok");
  }
  catch {
    await res.sendStatus(501);
  }
}

//Token Verify Endpoint
exports.tokenVerification = async (req, res) => {
  try {
    let { token } = req.body;
    console.log(token)
    jwt.verify(token, config.secret, async (err, payload) => {
      if (err) await res.status(401).send("Unauthorized.");
      else {
        const objectId = payload._id;
        const updatedUser = await User.findOneAndUpdate(
          { _id: objectId },
          { $set: { verify: true } },
          { new: true, useFindAndModify: false }
        );
        if (!updatedUser) await res.status(201).send("Failed.");
        else {
          await res.status(200).send({ token: getToken(updatedUser), user: updatedUser });
        }
      }
    });
  }
  catch {
    await res.sendStatus(501);
  }
}

//Login Endpoint
exports.login = async (req, res) => {
  try {
    const verify = req.user.verify;
    if (verify) {
      await res.status(200).send({
        token: getToken(req.user),
        user: req.user
      });
    }
    else {
      const token = getToken(req.user);
      // console.log(token)
      const flag = await this.sendVerifyEmail(token, req.user);
      if (flag) {
        await res.status(201).send({
          token: token,
          user: req.user,
        });
      }
    }
  }
  catch {
    await res.sendStatus(501);
  }
}

exports.loginWithEmail = async (req, res) => {
  const { email } = req.body;
  try {
    User.findOne({
      email: email
    }).then(async user => {
      if (!user) {
        await res.status(201).send({ email: email });
      }
      else {
        if (user.verify) {
          if (user.loginType === "manual") {
            await res.status(201).send({ email });
          }
          else {
            const updatedUser = await User.findOneAndUpdate(
              { email: email },
              { logins: user.logins + 1, lastLogin: Date.now() },
              { new: true }
            );
            await res.status(200).send({ user: updatedUser });
          }
        }
        else {
          await res.status(201).send({ email: email });
        }
      }
    }).catch(err => done(err));
  }
  catch {
    await res.sendStatus(501);
  }
}

exports.loginWithToken = async (req, res) => {
  try {
    let { token } = req.body;
    jwt.verify(token, config.secret, async (err, payload) => {
      if (err) return await res.status(401).send("Unauthorized.");
      else {
        User.findById(payload._id).select('-password -salt').then(async user => {
          if (user) {
            return await res.status(200).send({
              token: getToken(user),
              user
            });
          }
          else {
            await res.status(201).send("No User Exist");
          }
        }).catch(err => handleError(err, res));
      }
    });
  }
  catch {
    await res.sendStatus(501);
  }
}

exports.loginWithGoogle = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app
    });
    const payload = ticket.getPayload();
    console.log(payload);
    const email = payload.email;
    const name = payload.name;
    User.findOne(({ email: email }))
      .then(async (user) => {

        if (!user) {
          User.create({
            email: email,
            name: name,
            thumbnail: payload.picture,
            verify: true,
            loginType: "google"
          }).then(async new_user => {
            const token = getToken(new_user);
            await res.status(200).send({
              user: new_user,
              token: token
            });
          }).catch(err => handleError(err, res));
        }
        else {
          if (user.verify) {
            const token = getToken(user);
            await res.status(200).send({
              user: user,
              token: token
            });
          }
          else {
            console.log(user._id)
            const updatedUser = await User.findOneAndUpdate(
              { _id: user._id },
              { $set: { verify: true, loginType: "google" } },
              { new: true }
            );
            console.log(updatedUser)
            const token = getToken(updatedUser);
            await res.status(200).send({
              user: updatedUser,
              token: token
            })
          }
        }
      })
    // You can use the payload information (user details) here
    // Create a new user or log in existing user
  }
  catch {
    await res.sendStatus(501);
  }
}

exports.loginWithTwitter = async (req, res) => {
  console.log(req.body)
}