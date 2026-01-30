/**
 * Rate Limiter - Protección contra ataques de fuerza bruta y abuso
 * Implementación simple con Map para desarrollo/producción pequeña
 * Para producción a escala, usar Redis (Upstash) o similar
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxRequests: number    // Número máximo de requests
  windowMs: number       // Ventana de tiempo en milisegundos
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>()

  // Limpiar registros expirados cada 5 minutos
  constructor() {
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Verifica si una clave está limitada
   * @returns true si está limitada (bloqueado), false si puede continuar
   */
  isLimited(key: string, config: RateLimitConfig): { limited: boolean; remaining: number; resetIn: number } {
    const now = Date.now()
    const record = this.store.get(key)

    // Si no hay registro o la ventana expiró, crear nuevo
    if (!record || now > record.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return {
        limited: false,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs
      }
    }

    // Si excede el límite
    if (record.count >= config.maxRequests) {
      return {
        limited: true,
        remaining: 0,
        resetIn: record.resetTime - now
      }
    }

    // Incrementar contador
    record.count++
    return {
      limited: false,
      remaining: config.maxRequests - record.count,
      resetIn: record.resetTime - now
    }
  }

  /**
   * Resetea el contador para una clave específica
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Limpia registros expirados
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Instancia singleton
export const rateLimiter = new RateLimiter()

// Configuraciones predefinidas
export const RATE_LIMITS = {
  // Login: 5 intentos cada 15 minutos
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000
  },
  // API general: 100 requests por minuto
  API_GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000
  },
  // Creación de recursos: 20 por minuto
  API_CREATE: {
    maxRequests: 20,
    windowMs: 60 * 1000
  },
  // Upload de archivos: 10 por minuto
  UPLOAD: {
    maxRequests: 10,
    windowMs: 60 * 1000
  },
  // Búsquedas: 30 por minuto
  SEARCH: {
    maxRequests: 30,
    windowMs: 60 * 1000
  }
} as const

/**
 * Obtiene el identificador del cliente (IP)
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return "unknown"
}
