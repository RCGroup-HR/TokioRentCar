import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const images = await prisma.apartmentImage.findMany({
      where: { apartmentId: id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(images)
  } catch (error) {
    console.error("Error fetching apartment images:", error)
    return NextResponse.json(
      { error: "Error al obtener imágenes" },
      { status: 500 }
    )
  }
}

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

    const apartment = await prisma.apartment.findUnique({
      where: { id },
    })

    if (!apartment) {
      return NextResponse.json(
        { error: "Departamento no encontrado" },
        { status: 404 }
      )
    }

    const lastImage = await prisma.apartmentImage.findFirst({
      where: { apartmentId: id },
      orderBy: { order: "desc" },
    })
    const nextOrder = (lastImage?.order || 0) + 1

    const isFirstImage = nextOrder === 1
    const isPrimary = data.isPrimary || isFirstImage

    if (isPrimary) {
      await prisma.apartmentImage.updateMany({
        where: { apartmentId: id },
        data: { isPrimary: false },
      })
    }

    const image = await prisma.apartmentImage.create({
      data: {
        apartmentId: id,
        url: data.url,
        alt: data.alt || apartment.name,
        isPrimary,
        order: nextOrder,
      },
    })

    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error("Error adding apartment image:", error)
    return NextResponse.json(
      { error: "Error al agregar imagen" },
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

    const image = await prisma.apartmentImage.findFirst({
      where: { id: imageId, apartmentId: id },
    })

    if (!image) {
      return NextResponse.json(
        { error: "Imagen no encontrada" },
        { status: 404 }
      )
    }

    await prisma.apartmentImage.delete({
      where: { id: imageId },
    })

    if (image.isPrimary) {
      const nextImage = await prisma.apartmentImage.findFirst({
        where: { apartmentId: id },
        orderBy: { order: "asc" },
      })

      if (nextImage) {
        await prisma.apartmentImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        })
      }
    }

    return NextResponse.json({ message: "Imagen eliminada" })
  } catch (error) {
    console.error("Error deleting apartment image:", error)
    return NextResponse.json(
      { error: "Error al eliminar imagen" },
      { status: 500 }
    )
  }
}
