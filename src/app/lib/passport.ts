import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import config from "../config/index.js";
import { prisma } from "./prisma.js";
import { AuthProvider, Role } from "../../../generated/prisma/enums.js";



//& GOOGLE STRATEGY CONFIGURATION
passport.use(
  new GoogleStrategy(
    {
      clientID: config.google_client_id!,
      clientSecret: config.google_client_secret!,
      callbackURL: config.google_callback_uri!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();

        if (!email) {
          return done(null, false, {
            message: "email not found from google.",
          });
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          if (user.isDeleted || user.status === "DELETED") {
            return done(null, false, {
              message: "user deleted",
            });
          }
          if (user.status === "BLOCKED") {
            return done(null, false, {
              message: "user temporary blocked. please contact administration",
            });
          }

          if (user.googleId && user.googleId !== profile.id) {
            return done(null, false, {
              message: "this email is linked to another Google account",
            });
          }

          user = await prisma.user.update({
            where: { email },
            data: {
              googleId: profile.id,
              emailVerified: true,
            },
          });
        } else if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              emailVerified: true,
              authProvider: AuthProvider.GOOGLE,
              googleId: profile.id,
              role: Role.USER,
            },
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

