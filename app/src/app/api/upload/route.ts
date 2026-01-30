import { NextRequest, NextResponse } from "next/server"
import { withStaffAuth } from "@/lib/auth-guard"
import { rateLimiter, RATE_LIMITS, getClientIdentifier } from "@/lib/rate-limit"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Configuración de tipos permitidos con magic bytes
const ALLOWED_FILE_TYPES = {
  "image/jpeg": {
    extensions: ["jpg", "jpeg"],
    magicBytes: [0xFF, 0xD8, 0xFF],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  "image/png": {
    extensions: ["png"],
    magicBytes: [0x89, 0x50, 0x4E, 0x47],
    maxSize: 5 * 1024 * 1024,
  },
  "image/webp": {
    extensions: ["webp"],
    magicBytes: [0x52, 0x49, 0x46, 0x46], // RIFF
    maxSize: 5 * 1024 * 1024,
  },
  "image/gif": {
    extensions: ["gif"],
    magicBytes: [0x47, 0x49, 0x46], // GIF
    maxSize: 5 * 1024 * 1024,
  },
} as const

type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES

// Carpetas permitidas para uploads
const ALLOWED_FOLDERS = [
  "general",
  "vehicles",
  "customers",
  "signatures",
  "receipts",
  "documents",
  "company",
]

/**
 * Valida los magic bytes de un archivo
 */
function validateMagicBytes(buffer: Buffer, mimeType: AllowedMimeType): boolean {
  const config = ALLOWED_FILE_TYPES[mimeType]
  if (!config) return false

  const magicBytes = config.magicBytes

  // Verificar que el buffer tenga suficientes bytes
  if (buffer.length < magicBytes.length) {
    return false
  }

  // Comparar magic bytes
  for (let i = 0; i < magicBytes.length; i++) {
    if (buffer[i] !== magicBytes[i]) {
      return false
    }
  }

  // Verificación adicional para WebP (debe tener "WEBP" después de RIFF)
  if (mimeType === "image/webp") {
    if (buffer.length < 12) return false
    const webpSignature = buffer.toString("ascii", 8, 12)
    if (webpSignature !== "WEBP") {
      return false
    }
  }

  return true
}

/**
 * Sanitiza el nombre de la carpeta
 */
function sanitizeFolder(folder: string): string {
  // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
  const sanitized = folder.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase()

  // Verificar que esté en la lista de carpetas permitidas
  if (!ALLOWED_FOLDERS.includes(sanitized)) {
    return "general"
  }

  return sanitized
}

export const POST = withStaffAuth(async (request, session) => {
  try {
    // Rate limiting para uploads
    const clientId = getClientIdentifier(request)
    const { limited } = rateLimiter.isLimited(`upload:${clientId}`, RATE_LIMITS.UPLOAD)

    if (limited) {
      return NextResponse.json(
        { error: "Demasiados uploads. Intente más tarde." },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folderInput = (formData.get("folder") as string) || "general"

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      )
    }

    // 1. Validar tipo MIME
    const mimeType = file.type as AllowedMimeType
    const fileConfig = ALLOWED_FILE_TYPES[mimeType]

    if (!fileConfig) {
      return NextResponse.json(
        {
          error: "Tipo de archivo no permitido",
          allowedTypes: Object.keys(ALLOWED_FILE_TYPES).join(", ")
        },
        { status: 400 }
      )
    }

    // 2. Validar tamaño
    if (file.size > fileConfig.maxSize) {
      return NextResponse.json(
        {
          error: `El archivo excede el tamaño máximo de ${fileConfig.maxSize / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // 3. Leer el buffer y validar magic bytes
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (!validateMagicBytes(buffer, mimeType)) {
      return NextResponse.json(
        { error: "El archivo está corrupto o el tipo no coincide con el contenido" },
        { status: 400 }
      )
    }

    // 4. Validar y obtener extensión
    const originalExtension = file.name.split(".").pop()?.toLowerCase() || ""

    if (!(fileConfig.extensions as readonly string[]).includes(originalExtension)) {
      return NextResponse.json(
        { error: "Extensión de archivo no válida para este tipo" },
        { status: 400 }
      )
    }

    // 5. Sanitizar carpeta
    const folder = sanitizeFolder(folderInput)

    // 6. Generar nombre único (nunca usar el nombre original)
    const filename = `${uuidv4()}.${originalExtension}`

    // 7. Crear directorio si no existe
    const uploadDir = join(process.cwd(), "public", "uploads", folder)
    await mkdir(uploadDir, { recursive: true })

    // 8. Guardar archivo
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // 9. Retornar URL pública
    const url = `/uploads/${folder}/${filename}`

    return NextResponse.json({
      url,
      filename,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error al subir archivo" },
      { status: 500 }
    )
  }
})
