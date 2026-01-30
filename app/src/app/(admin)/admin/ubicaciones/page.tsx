"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui"
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Star,
  Check,
  X,
} from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  instructions: string | null
  businessHours: string | null
  extraCharge: number
  isDefault: boolean
  isActive: boolean
}

export default function UbicacionesPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    googleMapsUrl: "",
    instructions: "",
    businessHours: "",
    extraCharge: 0,
    isDefault: false,
  })

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations?active=false")
      const data = await res.json()
      setLocations(data || [])
    } catch (error) {
      console.error("Error fetching locations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : "/api/locations"
      const method = editingLocation ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingLocation(null)
        resetForm()
        fetchLocations()
      } else {
        const error = await res.json()
        alert(error.error || "Error al guardar ubicación")
      }
    } catch (error) {
      console.error("Error saving location:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta ubicación?")) return

    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchLocations()
      }
    } catch (error) {
      console.error("Error deleting location:", error)
    }
  }

  const toggleActive = async (location: Location) => {
    try {
      const res = await fetch(`/api/locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !location.isActive }),
      })

      if (res.ok) {
        fetchLocations()
      }
    } catch (error) {
      console.error("Error toggling location:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      latitude: "",
      longitude: "",
      googleMapsUrl: "",
      instructions: "",
      businessHours: "",
      extraCharge: 0,
      isDefault: false,
    })
  }

  const openEditModal = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
      googleMapsUrl: location.googleMapsUrl || "",
      instructions: location.instructions || "",
      businessHours: location.businessHours || "",
      extraCharge: location.extraCharge,
      isDefault: location.isDefault,
    })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ubicaciones</h1>
          <p className="text-gray-600 dark:text-gray-400">Puntos de recogida y entrega</p>
        </div>
        <Button
          onClick={() => {
            setEditingLocation(null)
            resetForm()
            setShowModal(true)
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nueva Ubicación
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No hay ubicaciones configuradas</p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ${
                !location.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold dark:text-white">{location.name}</h3>
                  {location.isDefault && (
                    <span className="text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(location)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(location)}
                    className={`p-1 ${
                      location.isActive
                        ? "text-green-500 hover:text-red-500"
                        : "text-red-500 hover:text-green-500"
                    }`}
                  >
                    {location.isActive ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-300">{location.address}</p>
                <p className="text-gray-500 dark:text-gray-400">{location.city}</p>

                {location.businessHours && (
                  <p className="text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Horario:</span>{" "}
                    {location.businessHours}
                  </p>
                )}

                {location.extraCharge > 0 && (
                  <p className="text-amber-600 dark:text-amber-400 font-medium">
                    Cargo extra: RD$ {location.extraCharge.toLocaleString()}
                  </p>
                )}

                {location.instructions && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {location.instructions}
                  </p>
                )}

                {location.googleMapsUrl && (
                  <a
                    href={location.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-xs"
                  >
                    Ver en Google Maps
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">
                {editingLocation ? "Editar Ubicación" : "Nueva Ubicación"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Oficina Principal"
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Latitud
                    </label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={(e) =>
                        setFormData({ ...formData, latitude: e.target.value })
                      }
                      placeholder="19.4517"
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Longitud
                    </label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={(e) =>
                        setFormData({ ...formData, longitude: e.target.value })
                      }
                      placeholder="-70.6970"
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enlace Google Maps
                  </label>
                  <input
                    type="url"
                    value={formData.googleMapsUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, googleMapsUrl: e.target.value })
                    }
                    placeholder="https://maps.google.com/..."
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Horario de Atención
                  </label>
                  <input
                    type="text"
                    value={formData.businessHours}
                    onChange={(e) =>
                      setFormData({ ...formData, businessHours: e.target.value })
                    }
                    placeholder="Lun-Vie 8:00-18:00, Sab 8:00-14:00"
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cargo Extra (RD$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.extraCharge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        extraCharge: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instrucciones
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    placeholder="Instrucciones para llegar..."
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({ ...formData, isDefault: e.target.checked })
                    }
                    className="rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500 dark:bg-gray-700"
                  />
                  <span className="text-sm dark:text-gray-300">
                    Establecer como ubicación predeterminada
                  </span>
                </label>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false)
                      setEditingLocation(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingLocation ? "Guardar Cambios" : "Crear Ubicación"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
