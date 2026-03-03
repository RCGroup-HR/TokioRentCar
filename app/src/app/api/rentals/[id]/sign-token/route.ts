import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"
import { logActivity, ActivityActions } from "@/lib/activityLog"

const TOKEN_EXPIRY_HOURS = 48

// POST - Genera un token único de firma con expiración de 48h
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

    const signToken = randomUUID()
    const signTokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    const updated = await prisma.rental.update({
      where: { id },
      data: { signToken, signTokenExpiresAt },
      select: { signToken: true, signTokenExpiresAt: true, contractNumber: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get("host")}`
    const signUrl = `${baseUrl}/firmar/${updated.signToken}`

    await logActivity(id, ActivityActions.LINK_GENERATED, `Link de firma generado por ${session.user.name || session.user.email}. Expira en ${TOKEN_EXPIRY_HOURS}h.`, {
      generatedBy: session.user.email,
      expiresAt: signTokenExpiresAt.toISOString(),
    })

    return NextResponse.json({
      signToken: updated.signToken,
      signTokenExpiresAt: updated.signTokenExpiresAt,
      signUrl,
      expiresInHours: TOKEN_EXPIRY_HOURS,
      message: "Link de firma generado exitosamente",
    })
  } catch (error) {
    console.error("Error generating sign token:", error)
    return NextResponse.json({ error: "Error al generar el link" }, { status: 500 })
  }
}

// DELETE - Revoca el token de firma
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
      data: { signToken: null, signTokenExpiresAt: null },
    })

    await logActivity(id, ActivityActions.LINK_REVOKED, `Link de firma revocado por ${session.user.name || session.user.email}.`, {
      revokedBy: session.user.email,
    })

    return NextResponse.json({ message: "Link de firma revocado exitosamente" })
  } catch (error) {
    console.error("Error revoking sign token:", error)
    return NextResponse.json({ error: "Error al revocar el link" }, { status: 500 })
  }
}
