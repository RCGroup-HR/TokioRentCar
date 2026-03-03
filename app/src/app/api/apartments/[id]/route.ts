import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const apartment = await prisma.apartment.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!apartment) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(apartment)
  } catch (error) {
    console.error("Error fetching apartment:", error)
    return NextResponse.json(
      { error: "Error al obtener departamento" },
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

    if (!session || !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params
    const data = await request.json()

    const apartment = await prisma.apartment.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        country: data.country,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        maxGuests: data.maxGuests,
        floor: data.floor ? parseInt(data.floor) : null,
        category: data.category,
        amenities: data.amenities,
        pricePerNight: parseFloat(data.pricePerNight),
        pricePerWeek: data.pricePerWeek ? parseFloat(data.pricePerWeek) : null,
        pricePerMonth: data.pricePerMonth ? parseFloat(data.pricePerMonth) : null,
        depositAmount: data.depositAmount ? parseFloat(data.depositAmount) : 0,
        commissionAmount: data.commissionAmount ? parseFloat(data.commissionAmount) : null,
        status: data.status,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json(apartment)
  } catch (error) {
    console.error("Error updating apartment:", error)
    return NextResponse.json(
      { error: "Error al actualizar departamento" },
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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { id } = await params

    await prisma.apartment.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Departamento eliminado" })
  } catch (error) {
    console.error("Error deleting apartment:", error)
    return NextResponse.json(
      { error: "Error al eliminar departamento" },
      { status: 500 }
    )
  }
}
