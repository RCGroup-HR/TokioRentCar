import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH - Actualiza las fotos de documentos del cliente en la renta
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { idPhotoUrl, licensePhotoUrl } = await request.json()

    const rental = await prisma.rental.findUnique({ where: { id }, select: { id: true } })
    if (!rental) {
      return NextResponse.json({ error: "Renta no encontrada" }, { status: 404 })
    }

    const updated = await prisma.rental.update({
      where: { id },
      data: {
        ...(idPhotoUrl !== undefined && { idPhotoUrl }),
        ...(licensePhotoUrl !== undefined && { licensePhotoUrl }),
      },
      select: { id: true, idPhotoUrl: true, licensePhotoUrl: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating document photos:", error)
    return NextResponse.json({ error: "Error al actualizar documentos" }, { status: 500 })
  }
}
