"use client"

import Link from "next/link"
import { useSettingsStore } from "@/stores/settingsStore"
import { Car, Bike, Building2 } from "lucide-react"

type TabType = "vehiculos" | "motores" | "departamentos"

interface CatalogTabsProps {
  activeTab: TabType
}

const tabs = [
  {
    id: "vehiculos" as TabType,
    label: "Vehículos",
    href: "/vehiculos",
    icon: Car,
  },
  {
    id: "motores" as TabType,
    label: "Motores",
    href: "/motores",
    icon: Bike,
  },
  {
    id: "departamentos" as TabType,
    label: "Departamentos",
    href: "/departamentos",
    icon: Building2,
  },
]

export function CatalogTabs({ activeTab }: CatalogTabsProps) {
  const { settings } = useSettingsStore()

  return (
    <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-current text-current"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
                style={
                  isActive
                    ? { color: settings.primaryColor, borderColor: settings.primaryColor }
                    : {}
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
