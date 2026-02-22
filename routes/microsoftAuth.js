const express = require("express");
const passport = require("passport");
const { OIDCStrategy } = require("passport-azure-ad");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// passport.use(
//   new OIDCStrategy(
//     {
//       identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
//       clientID: process.env.AZURE_CLIENT_ID,
//       redirectUrl: process.env.AZURE_REDIRECT_URI,
//       allowHttpForRedirectUrl: true,
//       passReqToCallback: false,
//       scope: ["profile", "email", "openid"],
//     },
//     async (iss, sub, profile, accessToken, refreshToken, done) => {
//       try {
//         console.log(" Profile received from Microsoft:", profile);

//         const email = profile._json.preferred_username;
//         let user = await User.findOne({ email });

//         if (!user) {
//           user = await User.create({
//             name: profile.displayName,
//   )
// );

passport.use(
  new OIDCStrategy(
    {
      identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      responseType: "code",
      responseMode: "query",
      redirectUrl: process.env.AZURE_REDIRECT_URI,
      allowHttpForRedirectUrl: true,
      passReqToCallback: false,
      scope: ["profile", "email", "openid"],
    },
    async (iss, sub, profile, accessToken, refreshToken, done) => {
      try {
        const email = profile._json.preferred_username;
        const name = profile._json.name;

        if (!email) {
          return done(new Error("No email found in Microsoft profile"));
        }

        let user = await User.findOne({ email });

        const adminEmails = [
          "lukman-uthmanaarsg2022@futa.edu.ng",
          // "sec.gen@futa.edu.ng",
          // "admin1@futa.edu.ng"
        ];

        const role = adminEmails.includes(email.toLowerCase()) ? "admin" : "student";

        if (!user) {
          user = await User.create({
            name,
            email,
            role
          });
        } else if (!user.role) {
          user.role = role;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Error in strategy:", err);
        return done(err, null);
      }
    }
  )
);



router.get("/microsoft", passport.authenticate("azuread-openidconnect"));

router.get("/microsoft/callback", (req, res, next) => {
  passport.authenticate("azuread-openidconnect", async (err, user, info) => {
    if (err) {
      console.error("❌ Passport Error:", err);
      return res.redirect("/auth/error");
    }

    if (!user) {
      console.error("❌ No user returned. Info:", info);
      return res.redirect("/auth/error");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("❌ Login error:", err);
        return res.redirect("/auth/error");
      }

      // ✅ Generate JWT
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.redirect("http://localhost:5173/dashboard");
    });
  })(req, res, next);
});

router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

router.get("/error", (req, res) => {
  res.send("❌ Authentication failed. Check your terminal logs for details.");
});

module.exports = router;
