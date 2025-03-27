import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import prisma from '@/lib/prisma'
import { validatePassword } from '@/utils/hash'

export const authOptions = {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        },
        httpOptions: {
          timeout: 10000 // Set timeout to 10 seconds
        }
      }),
      GithubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      }),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials) throw new Error('Invalid credentials')
            const user = await prisma.user.findUnique({ where: { email: credentials.email } })
            console.log("Authorization User:", user)
            if (!user) throw new Error('Invalid credentials')
    
            const valid = await validatePassword(credentials.password, user?.password as string)
            if (!valid) throw new Error('Invalid credentials')
            return user
        },
        
      })
    ],
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    pages: {
      signIn: '/dashboard',
    },
    callbacks: {
      async signIn({ user, account, profile, email, credentials }) {
        console.log("Sign callback calling:")
        console.log("User info", user, account, profile)
        return true
      },
      async jwt({ token, user, account, profile }) {
        console.log("JWT callback Calling")
        console.log("Token:", token)
        console.log("User:", user)
        console.log("Account:", account)
        console.log("Profile:", profile)
        return { ...token, ...user };
      },
      async session({ session, user, token }) {
        // console.log("Session Callback", session, token)
        // const email = user?.email || token?.email as string
        // session.user = await prisma.user.findUnique({ where: { email } })
        return session
      },
    },
  };
  