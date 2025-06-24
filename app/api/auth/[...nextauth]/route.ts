import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
        },
      },
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user ID to session for database queries
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, account, profile }) {
      return token
    }
  },
  pages: {
    signIn: '/', // Redirect to home page for sign in
  }
}

const handler = NextAuth(authOptions)

// Export authOptions for use in other files
export { authOptions }
export { handler as GET, handler as POST }