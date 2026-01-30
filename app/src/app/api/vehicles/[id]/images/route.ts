import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Get all images for a vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const images = await prisma.vehicleImage.findMany({
      where: { vehicleId: id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error("Error fetching vehicle images:", error)
    return NextResponse.json(
      { error: "Error al obtener imágenes" },
      { status: 500 }
    )
  }
}

// POST - Add a new image to a vehicle
export async function POST(
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

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    })

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      )
    }

    // Get the current highest order
    const lastImage = await prisma.vehicleImage.findFirst({
      where: { vehicleId: id },
      orderBy: { order: "desc" },
    })
    const nextOrder = (lastImage?.order || 0) + 1

    // If this is the first image or marked as primary, set it as primary
    const isFirstImage = nextOrder === 1
    const isPrimary = data.isPrimary || isFirstImage

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.vehicleImage.updateMany({
        where: { vehicleId: id },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.vehicleImage.create({
      data: {
        vehicleId: id,
        url: data.url,
        alt: data.alt || `${vehicle.brand} ${vehicle.model}`,
        isPrimary,
        order: nextOrder,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error("Error adding vehicle image:", error)
    return NextResponse.json(
      { error: "Error al agregar imagen" },
      { status: 500 }
    )
  }
}

// DELETE - Delete an image
export async function DELETE(
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

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json(
        { error: "Se requiere imageId" },
        { status: 400 }
      )
    }

    const { id } = await params

    // Verify the image belongs to this vehicle
    const image = await prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId: id },
    })

    if (!image) {
      return NextResponse.json(
        { error: "Imagen no encontrada" },
        { status: 404 }
      )
    }

    await prisma.vehicleImage.delete({
      where: { id: imageId },
    })

    // If deleted image was primary, set next available as primary
    if (image.isPrimary) {
      const nextImage = await prisma.vehicleImage.findFirst({
        where: { vehicleId: id },
        orderBy: { order: "asc" },
      })

      if (nextImage) {
        await prisma.vehicleImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        })
      }
    }

    return NextResponse.json({ message: "Imagen eliminada" })
  } catch (error) {
    console.error("Error deleting vehicle image:", error)
    return NextResponse.json(
      { error: "Error al eliminar imagen" },
      { status: 500 }
    )
  }
}

// PATCH - Update image (set as primary or reorder)
export async function PATCH(
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
    const { imageId, isPrimary, order } = data

    if (!imageId) {
      return NextResponse.json(
        { error: "Se requiere imageId" },
        { status: 400 }
      )
    }

    // Verify the image belongs to this vehicle
    const image = await prisma.vehicleImage.findFirst({
      where: { id: imageId, vehicleId: id },
    })

    if (!image) {
      return NextResponse.json(
        { error: "Imagen no encontrada" },
        { status: 404 }
      )
    }

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await prisma.vehicleImage.updateMany({
        where: { vehicleId: id },
        data: { isPrimary: false },
      })
    }

    const updatedImage = await prisma.vehicleImage.update({
      where: { id: imageId },
      data: {
        ...(isPrimary !== undefined && { isPrimary }),
        ...(order !== undefined && { order }),
      },
    })

    return NextResponse.json(updatedImage)
  } catch (error) {
    console.error("Error updating vehicle image:", error)
    return NextResponse.json(
      { error: "Error al actualizar imagen" },
      { status: 500 }
    )
  }
}
