import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET - Obtiene los datos del contrato usando el token (sin autenticación)
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

    // Si ya está firmado, retornar estado pero sin datos de firma
    if (rental.signedAt) {
      return NextResponse.json({
        alreadySigned: true,
        signedAt: rental.signedAt,
        contractNumber: rental.contractNumber,
      })
    }

    return NextResponse.json({
      alreadySigned: false,
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

// POST - Guarda la firma del cliente usando el token (sin autenticación)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { customerSignature } = await request.json()

    if (!customerSignature) {
      return NextResponse.json({ error: "La firma del cliente es requerida" }, { status: 400 })
    }

    if (!customerSignature.startsWith("data:image/")) {
      return NextResponse.json({ error: "Formato de firma inválido" }, { status: 400 })
    }

    // Buscar la renta por token
    const rental = await prisma.rental.findUnique({
      where: { signToken: token },
      select: { id: true, signedAt: true, agentSignature: true },
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

    // Determinar si se completa el proceso de firma
    const willBeSigned = !!rental.agentSignature || true // Siempre marcar como firmado al recibir firma del cliente

    await prisma.rental.update({
      where: { id: rental.id },
      data: {
        customerSignature,
        signedAt: new Date(),
        signToken: null, // Invalida el token después de firmar
      },
    })

    return NextResponse.json({
      message: "Contrato firmado exitosamente",
      signedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error saving signature via token:", error)
    return NextResponse.json({ error: "Error al guardar la firma" }, { status: 500 })
  }
}
