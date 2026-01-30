import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const location = await prisma.pickupLocation.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error fetching location:", error)
    return NextResponse.json(
      { error: "Error al obtener ubicación" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.pickupLocation.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      })
    }

    const location = await prisma.pickupLocation.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        googleMapsUrl: data.googleMapsUrl,
        instructions: data.instructions,
        businessHours: data.businessHours,
        extraCharge: data.extraCharge,
        isDefault: data.isDefault,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Soft delete
    await prisma.pickupLocation.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Ubicación eliminada" })
  } catch (error) {
    console.error("Error deleting location:", error)
    return NextResponse.json(
      { error: "Error al eliminar ubicación" },
      { status: 500 }
    )
  }
}
