import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
        reservations: {
          where: {
            status: { in: ["PENDING", "CONFIRMED"] },
            endDate: { gte: new Date() },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("Error fetching vehicle:", error)
    return NextResponse.json(
      { error: "Error al obtener vehículo" },
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

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        brand: data.brand,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        vin: data.vin,
        color: data.color,
        category: data.category,
        transmission: data.transmission,
        fuelType: data.fuelType,
        seats: data.seats,
        doors: data.doors,
        airConditioning: data.airConditioning,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate,
        monthlyRate: data.monthlyRate,
        depositAmount: data.depositAmount,
        status: data.status,
        mileage: data.mileage,
        description: data.description,
        features: data.features,
        currentLocation: data.currentLocation,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : null,
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : null,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
      include: {
        images: true,
      },
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("Error updating vehicle:", error)
    return NextResponse.json(
      { error: "Error al actualizar vehículo" },
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

    // Soft delete - just deactivate
    await prisma.vehicle.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Vehículo eliminado" })
  } catch (error) {
    console.error("Error deleting vehicle:", error)
    return NextResponse.json(
      { error: "Error al eliminar vehículo" },
      { status: 500 }
    )
  }
}
