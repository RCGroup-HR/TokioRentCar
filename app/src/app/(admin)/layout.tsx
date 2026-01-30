"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { useThemeStore } from "@/stores/themeStore"
import { useLanguageStore } from "@/stores/languageStore"
import { Button } from "@/components/ui"
import {
  LayoutDashboard,
  Car,
  Calendar,
  FileText,
  Users,
  DollarSign,
  Settings,
  MapPin,
  BarChart3,
  Menu,
  X,
  LogOut,
  Bell,
  Sun,
  Moon,
  Monitor,
  Globe,
  UserCircle,
  History,
} from "lucide-react"
import { signOut } from "next-auth/react"

const menuItems = [
  {
    title: "Dashboard",
    titleEn: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Vehículos",
    titleEn: "Vehicles",
    href: "/admin/vehiculos",
    icon: Car,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Clientes",
    titleEn: "Customers",
    href: "/admin/clientes",
    icon: UserCircle,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Reservaciones",
    titleEn: "Reservations",
    href: "/admin/reservaciones",
    icon: Calendar,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Rentas",
    titleEn: "Rentals",
    href: "/admin/rentas",
    icon: FileText,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Historial Rentas",
    titleEn: "Rental History",
    href: "/admin/historial-rentas",
    icon: History,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Gastos",
    titleEn: "Expenses",
    href: "/admin/gastos",
    icon: DollarSign,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Comisiones",
    titleEn: "Commissions",
    href: "/admin/comisiones",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "ADMIN", "AGENT"],
  },
  {
    title: "Usuarios",
    titleEn: "Users",
    href: "/admin/usuarios",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Ubicaciones",
    titleEn: "Locations",
    href: "/admin/ubicaciones",
    icon: MapPin,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Reportes",
    titleEn: "Reports",
    href: "/admin/reportes",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    title: "Configuración",
    titleEn: "Settings",
    href: "/admin/configuracion",
    icon: Settings,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { settings } = useSettingsStore()
  const { theme, setTheme, resolvedTheme } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme-storage")
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        if (parsed.state?.theme) {
          setTheme(parsed.state.theme)
        }
      } catch (e) {
        // Use default
      }
    }
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/admin")
    } else if (
      status === "authenticated" &&
      !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session?.user?.role || "")
    ) {
      router.push("/")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="loader" />
      </div>
    )
  }

  if (
    status === "unauthenticated" ||
    !["SUPER_ADMIN", "ADMIN", "AGENT"].includes(session?.user?.role || "")
  ) {
    return null
  }

  const userRole = session?.user?.role || ""

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  )

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark")
    else if (theme === "dark") setTheme("system")
    else setTheme("light")
  }

  const toggleLanguage = () => {
    setLanguage(language === "es" ? "en" : "es")
  }

  const getTitle = (item: typeof menuItems[0]) => {
    return language === "en" ? item.titleEn : item.title
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4"
        style={{ backgroundColor: settings.secondaryColor }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <span className="text-white font-semibold">{settings.companyName}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2 text-white/70 hover:text-white"
            title={language === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <span className="text-xs font-bold">{language.toUpperCase()}</span>
          </button>
          <button
            onClick={cycleTheme}
            className="p-2 text-white/70 hover:text-white"
          >
            {theme === "light" ? (
              <Sun className="h-5 w-5" />
            ) : theme === "dark" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-40 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: settings.secondaryColor }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <span
              className="text-xl font-bold"
              style={{ color: settings.primaryColor }}
            >
              {settings.companyName}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={isActive ? { backgroundColor: settings.primaryColor } : {}}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{getTitle(item)}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-white mb-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full text-gray-400 hover:text-white justify-start"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            {language === "en" ? "Logout" : "Cerrar Sesión"}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 transition-colors">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === "en" ? "Admin Panel" : "Panel de Administración"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              title={language === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">{language === "es" ? "ES" : "EN"}</span>
            </button>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {theme === "light" ? (
                  <Sun className="h-4 w-4" />
                ) : theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={() => {
                      setTheme("light")
                      setShowThemeMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === "light" ? "text-amber-600" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    {language === "en" ? "Light" : "Claro"}
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark")
                      setShowThemeMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === "dark" ? "text-amber-600" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    {language === "en" ? "Dark" : "Oscuro"}
                  </button>
                  <button
                    onClick={() => {
                      setTheme("system")
                      setShowThemeMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === "system" ? "text-amber-600" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    {language === "en" ? "System" : "Sistema"}
                  </button>
                </div>
              )}
            </div>

            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                {language === "en" ? "View Site" : "Ver Sitio"}
              </Button>
            </Link>
            <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">{children}</div>
      </main>

      {/* Click outside to close theme menu */}
      {showThemeMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowThemeMenu(false)}
        />
      )}
    </div>
  )
}
