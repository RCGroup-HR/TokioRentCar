/**
 * Auth Guard - Middleware de autenticación y autorización centralizado
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { rateLimiter, RATE_LIMITS, getClientIdentifier } from "@/lib/rate-limit"

// Tipos de roles
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "AGENT" | "CUSTOMER"

// Tipo para la sesión autenticada
export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    role: UserRole
    image?: string
  }
}

// Tipo para el handler autenticado
type AuthenticatedHandler = (
  request: NextRequest,
  session: AuthSession,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

// Opciones de configuración
interface AuthGuardOptions {
  allowedRoles?: UserRole[]
  rateLimit?: keyof typeof RATE_LIMITS | false
  requireVerifiedEmail?: boolean
}

/**
 * Respuesta de error estándar
 */
function errorResponse(message: string, status: number, details?: Record<string, any>) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  )
}

/**
 * Middleware de autenticación y autorización
 * Protege endpoints API con validación de sesión, roles y rate limiting
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: AuthGuardOptions = {}
) {
  const {
    allowedRoles,
    rateLimit = "API_GENERAL",
    requireVerifiedEmail = false,
  } = options

  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    try {
      // 1. Rate Limiting
      if (rateLimit !== false) {
        const clientId = getClientIdentifier(request)
        const endpoint = new URL(request.url).pathname
        const rateLimitKey = `${endpoint}:${clientId}`
        const limitConfig = RATE_LIMITS[rateLimit]

        const { limited, remaining, resetIn } = rateLimiter.isLimited(
          rateLimitKey,
          limitConfig
        )

        if (limited) {
          return NextResponse.json(
            {
              error: "Demasiadas solicitudes. Intente más tarde.",
              retryAfter: Math.ceil(resetIn / 1000),
            },
            {
              status: 429,
              headers: {
                "Retry-After": String(Math.ceil(resetIn / 1000)),
                "X-RateLimit-Limit": String(limitConfig.maxRequests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": String(Date.now() + resetIn),
              },
            }
          )
        }
      }

      // 2. Autenticación
      const session = await auth()

      if (!session || !session.user) {
        return errorResponse("No autorizado. Inicie sesión.", 401)
      }

      // 3. Verificación de email (si se requiere)
      if (requireVerifiedEmail && !(session.user as any).emailVerified) {
        return errorResponse("Debe verificar su email primero.", 403)
      }

      // 4. Autorización por roles
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (session.user as any).role as UserRole

        if (!userRole || !allowedRoles.includes(userRole)) {
          return errorResponse(
            "No tiene permisos para realizar esta acción.",
            403,
            { requiredRoles: allowedRoles, currentRole: userRole }
          )
        }
      }

      // 5. Ejecutar handler con sesión verificada
      const authSession: AuthSession = {
        user: {
          id: session.user.id!,
          email: session.user.email!,
          name: session.user.name!,
          role: (session.user as any).role as UserRole,
          image: session.user.image || undefined,
        },
      }

      return handler(request, authSession, context)
    } catch (error) {
      console.error("Auth guard error:", error)
      return errorResponse("Error interno de autenticación.", 500)
    }
  }
}

/**
 * Guard solo para rate limiting (sin autenticación)
 * Útil para endpoints públicos como login
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  rateLimitType: keyof typeof RATE_LIMITS = "API_GENERAL"
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const clientId = getClientIdentifier(request)
    const endpoint = new URL(request.url).pathname
    const rateLimitKey = `${endpoint}:${clientId}`
    const limitConfig = RATE_LIMITS[rateLimitType]

    const { limited, remaining, resetIn } = rateLimiter.isLimited(
      rateLimitKey,
      limitConfig
    )

    if (limited) {
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes. Intente más tarde.",
          retryAfter: Math.ceil(resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetIn / 1000)),
            "X-RateLimit-Limit": String(limitConfig.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + resetIn),
          },
        }
      )
    }

    return handler(request, context)
  }
}

// Atajos convenientes para roles comunes
export const withAdminAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, { allowedRoles: ["SUPER_ADMIN", "ADMIN"] })

export const withStaffAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, { allowedRoles: ["SUPER_ADMIN", "ADMIN", "AGENT"] })

export const withSuperAdminAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, { allowedRoles: ["SUPER_ADMIN"] })
