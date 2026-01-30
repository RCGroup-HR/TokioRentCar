"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { useLanguageStore } from "@/stores/languageStore"
import { useCurrency } from "@/hooks/useCurrency"
import { Card, CardContent, Badge } from "@/components/ui"
import {
  Car,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react"
import { formatDateShort, getStatusLabel, getStatusColor } from "@/lib/utils"

interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  activeRentals: number
  pendingReservations: number
  monthlyRevenue: number
  monthlyExpenses: number
}

interface RecentActivity {
  id: string
  type: "reservation" | "rental" | "expense"
  description: string
  amount?: number
  status?: string
  createdAt: string
}

export default function AdminDashboardPage() {
  const { settings } = useSettingsStore()
  const { language, t } = useLanguageStore()
  const { formatDual } = useCurrency()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [recentRentals, setRecentRentals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch vehicles stats
      const vehiclesRes = await fetch("/api/vehicles?limit=100")
      const vehiclesData = await vehiclesRes.json()

      const totalVehicles = vehiclesData.pagination?.total || 0
      const availableVehicles = vehiclesData.vehicles?.filter(
        (v: any) => v.status === "AVAILABLE"
      ).length || 0

      // Fetch reservations
      const reservationsRes = await fetch("/api/reservations?limit=5")
      const reservationsData = await reservationsRes.json()
      const pendingReservations = reservationsData.reservations?.filter(
        (r: any) => r.status === "PENDING"
      ).length || 0

      // Fetch rentals
      const rentalsRes = await fetch("/api/rentals?limit=5")
      const rentalsData = await rentalsRes.json()
      const activeRentals = rentalsData.rentals?.filter(
        (r: any) => r.status === "ACTIVE"
      ).length || 0

      // Calculate monthly revenue from completed rentals
      const monthlyRevenue = rentalsData.rentals
        ?.filter((r: any) => r.status === "COMPLETED")
        .reduce((sum: number, r: any) => sum + r.totalAmount, 0) || 0

      // Fetch expenses
      const expensesRes = await fetch("/api/expenses?limit=10")
      const expensesData = await expensesRes.json()
      const monthlyExpenses = expensesData.totalAmount || 0

      setStats({
        totalVehicles,
        availableVehicles,
        activeRentals,
        pendingReservations,
        monthlyRevenue,
        monthlyExpenses,
      })

      setRecentReservations(reservationsData.reservations || [])
      setRecentRentals(rentalsData.rentals || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loader" />
      </div>
    )
  }

  const statCards = [
    {
      title: language === "en" ? "Total Vehicles" : "Vehículos Totales",
      value: stats?.totalVehicles || 0,
      subtext: `${stats?.availableVehicles || 0} ${language === "en" ? "available" : "disponibles"}`,
      icon: Car,
      color: settings.primaryColor,
      href: "/admin/vehiculos",
    },
    {
      title: language === "en" ? "Pending Reservations" : "Reservaciones Pendientes",
      value: stats?.pendingReservations || 0,
      subtext: language === "en" ? "Require attention" : "Requieren atención",
      icon: Calendar,
      color: "#F59E0B",
      href: "/admin/reservaciones",
    },
    {
      title: language === "en" ? "Active Rentals" : "Rentas Activas",
      value: stats?.activeRentals || 0,
      subtext: language === "en" ? "In progress" : "En curso",
      icon: FileText,
      color: "#3B82F6",
      href: "/admin/rentas",
    },
    {
      title: language === "en" ? "Monthly Revenue" : "Ingresos del Mes",
      value: formatDual(stats?.monthlyRevenue || 0),
      subtext: `${language === "en" ? "Expenses" : "Gastos"}: ${formatDual(stats?.monthlyExpenses || 0)}`,
      icon: DollarSign,
      color: "#10B981",
      href: "/admin/reportes",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {language === "en" ? "Business overview" : "Resumen general del negocio"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="hover:shadow-md transition cursor-pointer h-full dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.subtext}</p>
                  </div>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card className="dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">
                {language === "en" ? "Recent Reservations" : "Reservaciones Recientes"}
              </h2>
              <Link
                href="/admin/reservaciones"
                className="text-sm hover:underline"
                style={{ color: settings.primaryColor }}
              >
                {language === "en" ? "View all" : "Ver todas"}
              </Link>
            </div>

            {recentReservations.length > 0 ? (
              <div className="space-y-4">
                {recentReservations.slice(0, 5).map((reservation: any) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${settings.primaryColor}20` }}
                      >
                        <Calendar className="h-5 w-5" style={{ color: settings.primaryColor }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {reservation.vehicle?.brand} {reservation.vehicle?.model}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {reservation.customer?.firstName} {reservation.customer?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(reservation.status)}>
                        {getStatusLabel(reservation.status)}
                      </Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDateShort(reservation.startDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>{language === "en" ? "No recent reservations" : "No hay reservaciones recientes"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Rentals */}
        <Card className="dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold dark:text-white">
                {language === "en" ? "Active Rentals" : "Rentas Activas"}
              </h2>
              <Link
                href="/admin/rentas"
                className="text-sm hover:underline"
                style={{ color: settings.primaryColor }}
              >
                {language === "en" ? "View all" : "Ver todas"}
              </Link>
            </div>

            {recentRentals.length > 0 ? (
              <div className="space-y-4">
                {recentRentals.slice(0, 5).map((rental: any) => (
                  <div
                    key={rental.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "#3B82F620" }}
                      >
                        <FileText className="h-5 w-5" style={{ color: "#3B82F6" }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rental.vehicle?.brand} {rental.vehicle?.model}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {rental.customer?.firstName} {rental.customer?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(rental.status)}>
                        {getStatusLabel(rental.status)}
                      </Badge>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDual(rental.totalAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>{language === "en" ? "No active rentals" : "No hay rentas activas"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-gray-800">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            {t("dashboard.quickActions")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/vehiculos/nuevo"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Car className="h-6 w-6" style={{ color: settings.primaryColor }} />
              <span className="text-sm font-medium dark:text-white">
                {language === "en" ? "New Vehicle" : "Nuevo Vehículo"}
              </span>
            </Link>
            <Link
              href="/admin/reservaciones"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Calendar className="h-6 w-6" style={{ color: settings.primaryColor }} />
              <span className="text-sm font-medium dark:text-white">
                {language === "en" ? "View Reservations" : "Ver Reservaciones"}
              </span>
            </Link>
            <Link
              href="/admin/gastos"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <DollarSign className="h-6 w-6" style={{ color: settings.primaryColor }} />
              <span className="text-sm font-medium dark:text-white">
                {language === "en" ? "Register Expense" : "Registrar Gasto"}
              </span>
            </Link>
            <Link
              href="/admin/reportes"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <TrendingUp className="h-6 w-6" style={{ color: settings.primaryColor }} />
              <span className="text-sm font-medium dark:text-white">
                {language === "en" ? "View Reports" : "Ver Reportes"}
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
