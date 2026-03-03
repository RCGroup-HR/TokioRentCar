import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"

// POST - Genera un token único de firma y retorna la URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const rental = await prisma.rental.findUnique({
      where: { id },
      select: { id: true, signedAt: true, contractNumber: true },
    })

    if (!rental) {
      return NextResponse.json({ error: "Renta no encontrada" }, { status: 404 })
    }

    if (rental.signedAt) {
      return NextResponse.json(
        { error: "El contrato ya fue firmado. No se puede generar un nuevo link." },
        { status: 400 }
      )
    }

    // Generar token único
    const signToken = randomUUID()

    const updated = await prisma.rental.update({
      where: { id },
      data: { signToken },
      select: { signToken: true, contractNumber: true },
    })

    // Construir URL del sitio
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`
    const signUrl = `${baseUrl}/firmar/${updated.signToken}`

    return NextResponse.json({
      signToken: updated.signToken,
      signUrl,
      message: "Link de firma generado exitosamente",
    })
  } catch (error) {
    console.error("Error generating sign token:", error)
    return NextResponse.json({ error: "Error al generar el link" }, { status: 500 })
  }
}

// DELETE - Revoca el token de firma (lo elimina)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const rental = await prisma.rental.findUnique({
      where: { id },
      select: { id: true, signedAt: true },
    })

    if (!rental) {
      return NextResponse.json({ error: "Renta no encontrada" }, { status: 404 })
    }

    await prisma.rental.update({
      where: { id },
      data: { signToken: null },
    })

    return NextResponse.json({ message: "Link de firma revocado exitosamente" })
  } catch (error) {
    console.error("Error revoking sign token:", error)
    return NextResponse.json({ error: "Error al revocar el link" }, { status: 500 })
  }
}
