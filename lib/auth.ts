import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import { validatePassword } from "@/utils/hash";
import axios from "axios";
import { ok } from "assert";
import { userInfo } from "os";
import { error } from "console";
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        /* The errors in this function are redirected to error page if 'redirect' is true, or fale in signIn function
            signIn("credentials", {
              email,
              password,
              redirect: true,
              callbackUrl: "/dashboard",
            }); 
        */
        if (!credentials) throw new Error("Invalid credentials");
        const res = await axios.post(
          "http://localhost:8000/v1/auth/login",
          {
            email: credentials.email,
            password: credentials.password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const { user, tokens } = res.data;
        console.log("==============Authorize function=============", res.data);
        if (res.status && res.data) {
          return { ...user, ...tokens };
        } else throw new Error("Invalid credentials");
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, credentials }) {
      /*
      The errors in this callback are redirect or not according to redirect parameter
      If you set custom error page, it is redirected to custom error page.
      If redirect is false, the error is displayed as params in current page url.
      */
      console.log("==============SignIn callback===========");
      console.log("credentials", credentials);
      console.log("user information", user);
      if (account?.provider === "google" || account?.provider === "github") {
        // check oauth account is in database. if doesn't exist, add that for signup
        console.log("=============OAuth Provider===========");
        try {
          // find user by provider and provider id
          const res = await axios.post(
            "http://localhost:8000/v1/users/getOAuthUser",
            {
              username: user.name,
              provider: account.provider.toLocaleUpperCase(),
              providerAccountID: account.providerAccountId,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!res.data) {
            //register oauth user if user does not exist
            console.log("===========User not found==================");
            const res = await axios.post(
              "http://localhost:8000/v1/auth/oauth-register",
              {
                email: user.email,
                username: user.name,
                provider: account.provider.toLocaleUpperCase(),
                providerAccountID: account.providerAccountId,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            if (res.status === 201) return true;
          }
        } catch (error) {
          throw new Error("Server Error");
        }
      }
      return true;
    },
    async jwt({ token, user, account, session }) {
      /*
      The errors in this callback are displayed as params of current signin page url in case of all login method and redirect true and false
      */
      try {
        console.log("=============JWT callback==============");
        if (user) {
          //first call backend api to login after google auth login
          console.log("=====Initial Login=====");
          console.log("+++provider+++++++++", account?.provider);
          if (account?.provider !== "credentials") {
            const res = await axios.post(
              "http://localhost:8000/v1/auth/oauth-login",
              {
                username: user.name,
                provider: account?.provider.toLocaleUpperCase(),
                providerAccountID: account?.providerAccountId,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            if (res.status === 200 && res.data) {
              const user_info = res.data.user;
              const tokens = res.data.tokens;
              console.log("USER information", user_info);
              return { ...user_info, ...tokens };
            }
          } else {
            return user;
          }
        }
        console.log("=====Second Login=======");
        console.log("User session included access and refresh tokens:", token);
        return token;
      } catch (error) {
        throw new Error("Something went wrong");
      }
    },
    async session({ session, token }) {
      console.log("=============Session Callback============");
      console.log("Token data", token);
      session.user = token;
      return session;
    },
  },
};
