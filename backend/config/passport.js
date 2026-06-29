const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.SERVER_URL || 'https://etelehealth.onrender.com'}/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    return done(new Error('No email returned from Google'), null);
                }

                // Check if user already exists
                let user = await User.findOne({ email });

                if (user) {
                    // Update googleId if not set
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        await user.save({ validateBeforeSave: false });
                    }
                    return done(null, user);
                }

                // Create new user from Google profile
                user = await User.create({
                    name: profile.displayName || email.split('@')[0],
                    email,
                    googleId: profile.id,
                    avatar: {
                        public_id: 'google_avatar',
                        url: profile.photos?.[0]?.value || '',
                    },
                    role: 'patient',
                    isEmailVerified: true, // Google accounts are pre-verified
                    password: undefined,
                });

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Minimal serialization (not used for sessions, but passport requires it)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
