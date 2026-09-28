import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import config from "../config/index.js";
import { prisma } from "./prisma.js";
import { AuthProvider, PlanType, Role } from "../../../generated/prisma/enums.js";
import { NotFoundException } from "@nestjs/common";



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
        }
        else if (!user) {
          const transactionRes = await prisma.$transaction(
            async (tx) => {
              user = await tx.user.create({
                data: {
                  name: profile.displayName,
                  email,
                  emailVerified: true,
                  authProvider: AuthProvider.GOOGLE,
                  googleId: profile.id,
                  role: Role.USER,
                },
              });
              const planTemp = await tx.planTemplate.findUnique({
                where: {
                  type: PlanType.FREE,
                  code: 'FREE'
                }
              })

              if (!planTemp) {
                throw new NotFoundException('Free Plan templete not found')
              }

              const totals = await tx.planProviderLimit.aggregate({
                where: {
                  aiProvider: {
                    isEnabled: true
                  }
                },
                _sum: {
                  requestPerMinute: true,
                  requestPerDay: true,
                  tokenPerMinute: true,
                  tokenPerDay: true,
                },
              });

              console.log(totals._sum.requestPerDay);

              await tx.plan.create({
                data: {
                  planTemplateId: planTemp.id,
                  userId: user.id,
                  tokensUsedPerMin: totals._sum.tokenPerMinute ?? 0,
                  tokensUsedPerDay: totals._sum.tokenPerDay ?? 0,
                  requestsUsedPerMin: totals._sum.requestPerMinute ?? 0,
                  requestsUsedPerDay: totals._sum.requestPerDay ?? 0,
                },
              });
              return user
            },
            {
              maxWait: 10000,
              timeout: 15000
            }
          )

          return transactionRes
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

