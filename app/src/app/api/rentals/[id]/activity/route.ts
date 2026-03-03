import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const logs = await prisma.activityLog.findMany({
      where: { rentalId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Error al obtener logs" }, { status: 500 })
  }
}
