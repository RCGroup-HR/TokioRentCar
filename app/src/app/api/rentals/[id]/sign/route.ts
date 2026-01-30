import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const { customerSignature, agentSignature } = data

    // Verify rental exists
    const rental = await prisma.rental.findUnique({
      where: { id },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      )
    }

    // Validate at least one signature is provided
    if (!customerSignature && !agentSignature) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos una firma" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: {
      customerSignature?: string
      agentSignature?: string
      signedAt?: Date
    } = {}

    if (customerSignature) {
      // Validate base64 format
      if (!customerSignature.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Formato de firma del cliente inválido" },
          { status: 400 }
        )
      }
      updateData.customerSignature = customerSignature
    }

    if (agentSignature) {
      // Validate base64 format
      if (!agentSignature.startsWith("data:image/")) {
        return NextResponse.json(
          { error: "Formato de firma del agente inválido" },
          { status: 400 }
        )
      }
      updateData.agentSignature = agentSignature
    }

    // Set signed date if both signatures are present (or will be present after this update)
    const willHaveBothSignatures =
      (customerSignature || rental.customerSignature) &&
      (agentSignature || rental.agentSignature)

    if (willHaveBothSignatures && !rental.signedAt) {
      updateData.signedAt = new Date()
    }

    // Update rental with signatures
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        contractNumber: true,
        customerSignature: true,
        agentSignature: true,
        signedAt: true,
      },
    })

    return NextResponse.json({
      message: "Firma(s) guardada(s) exitosamente",
      rental: updatedRental,
      isSigned: !!updatedRental.signedAt,
    })
  } catch (error) {
    console.error("Error saving signature:", error)
    return NextResponse.json(
      { error: "Error al guardar la firma" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rental = await prisma.rental.findUnique({
      where: { id },
      select: {
        id: true,
        contractNumber: true,
        customerSignature: true,
        agentSignature: true,
        signedAt: true,
      },
    })

    if (!rental) {
      return NextResponse.json(
        { error: "Contrato no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hasCustomerSignature: !!rental.customerSignature,
      hasAgentSignature: !!rental.agentSignature,
      isSigned: !!rental.signedAt,
      signedAt: rental.signedAt,
      // Only return signature data if needed (they can be large)
      customerSignature: rental.customerSignature,
      agentSignature: rental.agentSignature,
    })
  } catch (error) {
    console.error("Error fetching signatures:", error)
    return NextResponse.json(
      { error: "Error al obtener las firmas" },
      { status: 500 }
    )
  }
}
