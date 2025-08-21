import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email?: string
    name?: string
    role: string
    store_id?: string | null
    store_name?: string | null
    store_code?: string | null
  }

  interface Session {
    user: {
      id: string
      email?: string
      name?: string
      role: string
      store_id?: string | null
      store_name?: string | null
      store_code?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string
    email?: string
    name?: string
    role?: string
    store_id?: string | null
    store_name?: string | null
    store_code?: string | null
  }
}
