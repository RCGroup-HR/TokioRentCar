import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { logActivity, ActivityActions } from "@/lib/activityLog"

// GET - Obtiene datos del contrato por token (sin autenticación)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const rental = await prisma.rental.findUnique({
      where: { signToken: token },
      select: {
        id: true,
        contractNumber: true,
        startDate: true,
        expectedEndDate: true,
        totalDays: true,
        totalAmount: true,
        dailyRate: true,
        depositAmount: true,
        pickupLocation: true,
        signedAt: true,
        signTokenExpiresAt: true,
        vehicle: {
          select: {
            brand: true,
            model: true,
            year: true,
            licensePlate: true,
            color: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        rentalCustomers: {
          take: 1,
          select: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                idNumber: true,
              },
            },
          },
        },
        agent: {
          select: {
            firstName: true,
            lastName: true,
            signature: true,
          },
        },
      },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Este enlace de firma no es válido o ha expirado." },
        { status: 404 }
      )
    }

    // Verificar si el contrato ya fue firmado
    if (rental.signedAt) {
      return NextResponse.json({
        alreadySigned: true,
        signedAt: rental.signedAt,
        contractNumber: rental.contractNumber,
      })
    }

    // Verificar si el token expiró
    if (rental.signTokenExpiresAt && new Date() > new Date(rental.signTokenExpiresAt)) {
      return NextResponse.json(
        { error: "Este enlace de firma ha expirado. Solicita un nuevo enlace a la empresa.", expired: true },
        { status: 410 }
      )
    }

    return NextResponse.json({
      alreadySigned: false,
      expiresAt: rental.signTokenExpiresAt,
      rental: {
        id: rental.id,
        contractNumber: rental.contractNumber,
        startDate: rental.startDate,
        expectedEndDate: rental.expectedEndDate,
        totalDays: rental.totalDays,
        totalAmount: rental.totalAmount,
        dailyRate: rental.dailyRate,
        depositAmount: rental.depositAmount,
        pickupLocation: rental.pickupLocation,
        vehicle: rental.vehicle,
        customerName: rental.rentalCustomers[0]
          ? `${rental.rentalCustomers[0].customer.firstName} ${rental.rentalCustomers[0].customer.lastName}`
          : "Cliente",
        agentName: rental.agent
          ? `${rental.agent.firstName} ${rental.agent.lastName}`
          : "",
        agentSignature: rental.agent?.signature || null,
      },
    })
  } catch (error) {
    console.error("Error fetching sign data:", error)
    return NextResponse.json({ error: "Error al obtener el contrato" }, { status: 500 })
  }
}

// POST - Guarda la firma del cliente (+ foto de documento opcional) y anula el token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { customerSignature, documentPhotoUrl, documentType } = await request.json()

    if (!customerSignature) {
      return NextResponse.json({ error: "La firma del cliente es requerida" }, { status: 400 })
    }

    if (!customerSignature.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato de firma inválido" }, { status: 400 })
    }

    // Validar foto de documento si se envió
    if (documentPhotoUrl && !documentPhotoUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato de imagen de documento inválido" }, { status: 400 })
    }

    const rental = await prisma.rental.findUnique({
      where: { signToken: token },
      select: { id: true, signedAt: true, signTokenExpiresAt: true, contractNumber: true },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Este enlace de firma no es válido o ha expirado." },
        { status: 404 }
      )
    }

    if (rental.signedAt) {
      return NextResponse.json(
        { error: "Este contrato ya fue firmado anteriormente." },
        { status: 400 }
      )
    }

    if (rental.signTokenExpiresAt && new Date() > new Date(rental.signTokenExpiresAt)) {
      return NextResponse.json(
        { error: "Este enlace ha expirado. Solicita un nuevo enlace a la empresa.", expired: true },
        { status: 410 }
      )
    }

    const signedAt = new Date()
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "desconocida"

    // Determinar en qué campo guardar la foto del documento
    const docField = documentPhotoUrl
      ? documentType === "licencia"
        ? { licensePhotoUrl: documentPhotoUrl }
        : { idPhotoUrl: documentPhotoUrl }
      : {}

    await prisma.rental.update({
      where: { id: rental.id },
      data: {
        customerSignature,
        signedAt,
        signToken: null,           // Invalida el token tras firmar
        signTokenExpiresAt: null,
        ...docField,               // Foto de cédula/pasaporte o licencia (si se proporcionó)
      },
    })

    const docNote = documentPhotoUrl
      ? ` Se adjuntó foto de ${documentType === "licencia" ? "licencia de conducir" : "cédula/pasaporte"}.`
      : ""

    await logActivity(
      rental.id,
      ActivityActions.SIGNED_REMOTE,
      `Contrato #${rental.contractNumber} firmado por el cliente de forma remota (link de un solo uso).${docNote}`,
      { ip, signedAt: signedAt.toISOString(), hasDocument: !!documentPhotoUrl, documentType: documentType ?? null }
    )

    return NextResponse.json({
      message: "Contrato firmado exitosamente",
      signedAt: signedAt.toISOString(),
    })
  } catch (error) {
    console.error("Error saving signature via token:", error)
    return NextResponse.json({ error: "Error al guardar la firma" }, { status: 500 })
  }
}
