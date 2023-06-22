const express = require("express"); // Importing Express framework
const routes = require("./routes"); // Importing route handlers
const session = require("express-session"); // Importing Express session middleware
const passport = require("passport"); // Importing Passport authentication framework
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy; // Importing Google OAuth2 strategy from Passport
// lets you authenticate using Google
var userProfile; // Variable to store user profile data

require("dotenv").config(); // Loading environment variables from .env file

const app = express(); // Creating an Express application

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
); // Configuring session middleware with a secret

app.use(passport.initialize()); // Initializing Passport middleware
app.use(passport.session()); // Using Passport session middleware

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID, // Google OAuth client ID
      clientSecret: process.env.CLIENT_SECRET, // Google OAuth client secret
      callbackURL: process.env.CALLBACK_URL, // Callback URL for Google OAuth
    },
    function (accessToken, refreshToken, profile, done) {
      userProfile = profile; // Storing user profile data
      return done(null, userProfile); // Invoking done callback
    }
  )
); // Configuring Google OAuth2 strategy

app.set("view engine", "ejs"); // Setting EJS as the view engine

app.get("/success", (req, res) => {
  res.render("pages/success", { user: userProfile }); // Rendering success page with user profile data
});

app.get("/error", (req, res) => res.send("Error logging in")); // Handling error page

passport.serializeUser(function (user, cb) {
  cb(null, user); // Serializing user object
});
// The user id (you provide as the second argument of the done function) is saved in the session and is later used to 
// retrieve the whole object via the deserializeUser function.
passport.deserializeUser(function (obj, cb) {
  cb(null, obj); // Deserializing user object
});

app.use("/api", routes); // Using API routes

app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT); // Starting the server
});

app.get("/", async (req, res) => {
  res.render("pages/auth"); // Rendering authentication page
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
); // Authenticating with Google using OAuth

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/error" }),
  function (req, res) {
    // Successful authentication, redirect to success page
    res.redirect("/success");
  }
);

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/"); // Logging out and redirecting to home page
  });
});
