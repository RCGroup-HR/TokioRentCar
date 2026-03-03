import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export const ActivityActions = {
  RENTAL_CREATED: "RENTAL_CREATED",
  SIGNED_PRESENTIAL: "SIGNED_PRESENTIAL",
  SIGNED_REMOTE: "SIGNED_REMOTE",
  LINK_GENERATED: "LINK_GENERATED",
  LINK_REVOKED: "LINK_REVOKED",
  STATUS_CHANGED: "STATUS_CHANGED",
} as const

export type ActivityAction = (typeof ActivityActions)[keyof typeof ActivityActions]

export async function logActivity(
  rentalId: string,
  action: ActivityAction,
  description: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        rentalId,
        action,
        description,
        metadata: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch (error) {
    // El log nunca debe romper el flujo principal
    console.error("[ActivityLog] Error logging activity:", error)
  }
}
