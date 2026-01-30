"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSettingsStore } from "@/stores/settingsStore"
import { Button, Input, Select } from "@/components/ui"
import { Calendar, MapPin, Search } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
}

export function SearchForm() {
  const router = useRouter()
  const { settings } = useSettingsStore()
  const [locations, setLocations] = useState<Location[]>([])

  const [pickupLocation, setPickupLocation] = useState("")
  const [dropoffLocation, setDropoffLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sameLocation, setSameLocation] = useState(true)

  useEffect(() => {
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch(console.error)
  }, [])

  // Set minimum dates
  const today = new Date().toISOString().split("T")[0]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (pickupLocation) params.set("pickup", pickupLocation)
    if (!sameLocation && dropoffLocation) params.set("dropoff", dropoffLocation)
    if (startDate) params.set("start", startDate)
    if (endDate) params.set("end", endDate)

    router.push(`/vehiculos?${params.toString()}`)
  }

  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: `${loc.name} - ${loc.address}`,
  }))

  return (
    <form
      onSubmit={handleSearch}
      className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pickup Location */}
        <div>
          <Select
            label="Lugar de Recogida"
            options={locationOptions}
            value={pickupLocation}
            onChange={setPickupLocation}
            placeholder="Seleccionar ubicación"
          />
        </div>

        {/* Dropoff Location */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Lugar de Devolución
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={sameLocation}
                onChange={(e) => setSameLocation(e.target.checked)}
                className="rounded"
              />
              Mismo lugar
            </label>
          </div>
          <Select
            options={locationOptions}
            value={sameLocation ? pickupLocation : dropoffLocation}
            onChange={setDropoffLocation}
            placeholder="Seleccionar ubicación"
            disabled={sameLocation}
          />
        </div>

        {/* Start Date */}
        <div>
          <Input
            type="date"
            label="Fecha de Recogida"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (endDate && e.target.value > endDate) {
                setEndDate(e.target.value)
              }
            }}
            min={today}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        </div>

        {/* End Date */}
        <div>
          <Input
            type="date"
            label="Fecha de Devolución"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || today}
            leftIcon={<Calendar className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Search Button */}
      <div className="mt-6 flex justify-center">
        <Button
          type="submit"
          size="lg"
          leftIcon={<Search className="h-5 w-5" />}
          className="w-full md:w-auto md:min-w-[200px]"
        >
          Buscar Vehículos
        </Button>
      </div>
    </form>
  )
}
