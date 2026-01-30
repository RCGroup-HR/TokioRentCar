import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Optimización de imágenes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Formatos modernos para mejor compresión
    formats: ["image/avif", "image/webp"],
    // Tamaños de dispositivo para responsive
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Tamaños de imagen
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimizar uso de memoria
    minimumCacheTTL: 60 * 60 * 24, // 24 horas de caché
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  // Optimizaciones de producción
  poweredByHeader: false, // Remover header X-Powered-By por seguridad
  compress: true, // Habilitar compresión gzip

  // Optimización de build
  reactStrictMode: true,

  // Headers de seguridad completos
  async headers() {
    return [
      // Headers para archivos estáticos (uploads)
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // Headers para rutas de administración y API (sin caché)
      {
        source: "/(admin|api)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      // Headers de seguridad globales
      {
        source: "/:path*",
        headers: [
          // Prevenir sniffing de MIME type
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevenir clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Protección XSS (legacy, pero aún útil)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Política de referrer
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Política de permisos (restricciones de features del navegador)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          // HSTS - Forzar HTTPS (activar solo en producción con HTTPS)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requiere unsafe-eval en dev
              "style-src 'self' 'unsafe-inline'", // Tailwind usa estilos inline
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "media-src 'self'",
              "object-src 'none'",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // Prevenir DNS prefetching
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Indicar que el contenido puede ser descargado
          {
            key: "X-Download-Options",
            value: "noopen",
          },
          // Prevenir que IE ejecute downloads en el contexto del sitio
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
    ];
  },

  // Redirects de seguridad
  async redirects() {
    return [
      // Redirigir .env y archivos sensibles
      {
        source: "/.env",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/.env.local",
        destination: "/404",
        permanent: false,
      },
      {
        source: "/prisma/:path*",
        destination: "/404",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
