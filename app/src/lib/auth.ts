import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "./prisma"
import { rateLimiter, RATE_LIMITS } from "./rate-limit"
import { loginSchema } from "./validations"

// Almacén de intentos fallidos por email (para bloqueo progresivo)
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Limpiar intentos fallidos cada hora
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  for (const [key, value] of failedAttempts.entries()) {
    if (value.lastAttempt < oneHourAgo) {
      failedAttempts.delete(key)
    }
  }
}, 60 * 60 * 1000)

/**
 * Verifica si el usuario está bloqueado por demasiados intentos fallidos
 */
function isUserBlocked(email: string): { blocked: boolean; remainingTime?: number } {
  const attempts = failedAttempts.get(email)
  if (!attempts) return { blocked: false }

  // Bloqueo progresivo:
  // 5 intentos: 5 minutos
  // 10 intentos: 15 minutos
  // 15+ intentos: 1 hora
  let blockDuration = 0
  if (attempts.count >= 15) {
    blockDuration = 60 * 60 * 1000 // 1 hora
  } else if (attempts.count >= 10) {
    blockDuration = 15 * 60 * 1000 // 15 minutos
  } else if (attempts.count >= 5) {
    blockDuration = 5 * 60 * 1000 // 5 minutos
  }

  if (blockDuration > 0) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt
    if (timeSinceLastAttempt < blockDuration) {
      return {
        blocked: true,
        remainingTime: Math.ceil((blockDuration - timeSinceLastAttempt) / 1000 / 60)
      }
    }
  }

  return { blocked: false }
}

/**
 * Registra un intento fallido
 */
function recordFailedAttempt(email: string): void {
  const attempts = failedAttempts.get(email) || { count: 0, lastAttempt: 0 }
  attempts.count++
  attempts.lastAttempt = Date.now()
  failedAttempts.set(email, attempts)
}

/**
 * Limpia los intentos fallidos después de login exitoso
 */
function clearFailedAttempts(email: string): void {
  failedAttempts.delete(email)
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        try {
          // 1. Validar formato de credenciales
          const validation = loginSchema.safeParse(credentials)
          if (!validation.success) {
            throw new Error("Formato de credenciales inválido")
          }

          const { email, password } = validation.data

          // 2. Verificar bloqueo por intentos fallidos
          const blockStatus = isUserBlocked(email)
          if (blockStatus.blocked) {
            throw new Error(`Cuenta bloqueada temporalmente. Intente en ${blockStatus.remainingTime} minutos`)
          }

          // 3. Rate limiting por IP (si está disponible)
          const ip = request?.headers?.get?.("x-forwarded-for") || "unknown"
          const { limited } = rateLimiter.isLimited(`login:${ip}`, RATE_LIMITS.LOGIN)
          if (limited) {
            throw new Error("Demasiados intentos. Intente más tarde")
          }

          // 4. Buscar usuario
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              avatar: true,
              emailVerified: true,
            },
          })

          // 5. Usuario no encontrado (mensaje genérico por seguridad)
          if (!user) {
            recordFailedAttempt(email)
            throw new Error("Credenciales inválidas")
          }

          // 6. Usuario desactivado
          if (!user.isActive) {
            throw new Error("Cuenta desactivada. Contacte al administrador")
          }

          // 7. Verificar contraseña
          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            recordFailedAttempt(email)
            throw new Error("Credenciales inválidas")
          }

          // 8. Login exitoso - limpiar intentos fallidos
          clearFailedAttempts(email)

          // 9. Retornar usuario (sin contraseña)
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.avatar,
          }
        } catch (error) {
          // Re-lanzar errores controlados
          if (error instanceof Error) {
            throw error
          }
          throw new Error("Error de autenticación")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Cuando el usuario inicia sesión
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
        token.email = user.email as string
      }

      // Permitir actualización de sesión
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Configuración de cookies seguras
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
})
