"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button, SignaturePad } from "@/components/ui"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  User,
  Users as UsersIcon,
  PenTool,
  CheckCircle,
  Key,
} from "lucide-react"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: string
  isActive: boolean
  commissionRate: number | null
  signature: string | null
  createdAt: string
  _count: {
    rentals: number
    managedRentals: number
  }
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrador",
  AGENT: "Agente",
  CUSTOMER: "Cliente",
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  ADMIN: "bg-blue-100 text-blue-800",
  AGENT: "bg-green-100 text-green-800",
  CUSTOMER: "bg-gray-100 text-gray-800",
}

export default function UsuariosPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "CUSTOMER",
    commissionRate: 0,
    signature: null as string | null,
  })
  const [showSignatureSection, setShowSignatureSection] = useState(false)

  // Modal para cambiar contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordUser, setPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // El usuario actual es SUPER_ADMIN?
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (roleFilter) params.append("role", roleFilter)
      params.append("limit", "100")

      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const body = editingUser
        ? { ...formData, password: formData.password || undefined, signature: formData.signature }
        : { ...formData, signature: formData.signature }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingUser(null)
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          role: "CUSTOMER",
          commissionRate: 0,
          signature: null,
        })
        setShowSignatureSection(false)
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || "Error al guardar usuario")
      }
    } catch (error) {
      console.error("Error saving user:", error)
    }
  }

  const toggleUserStatus = async (user: User) => {
    // Solo SUPER_ADMIN puede desactivar cualquier usuario
    if (!isSuperAdmin && ["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
      alert("Solo un Super Admin puede desactivar administradores")
      return
    }

    const action = user.isActive ? "desactivar" : "activar"
    if (!confirm(`¿Está seguro de ${action} a ${user.firstName} ${user.lastName}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (res.ok) {
        fetchUsers()
      } else {
        const error = await res.json()
        alert(error.error || "Error al cambiar estado del usuario")
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
  }

  // Abrir modal para cambiar contraseña
  const openPasswordModal = (user: User) => {
    setPasswordUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordError("")
    setShowPasswordModal(true)
  }

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("La contraseña debe contener al menos una mayúscula")
      return
    }

    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("La contraseña debe contener al menos una minúscula")
      return
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("La contraseña debe contener al menos un número")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    if (!passwordUser) return

    try {
      const res = await fetch(`/api/users/${passwordUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })

      if (res.ok) {
        alert(`Contraseña de ${passwordUser.firstName} ${passwordUser.lastName} actualizada correctamente`)
        setShowPasswordModal(false)
        setPasswordUser(null)
      } else {
        const error = await res.json()
        setPasswordError(error.error || "Error al cambiar contraseña")
      }
    } catch (error) {
      console.error("Error changing password:", error)
      setPasswordError("Error de conexión")
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || "",
      role: user.role,
      commissionRate: user.commissionRate || 0,
      signature: user.signature || null,
    })
    setShowSignatureSection(false)
    setShowModal(true)
  }

  const openNewModal = () => {
    setEditingUser(null)
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      role: "CUSTOMER",
      commissionRate: 0,
      signature: null,
    })
    setShowSignatureSection(false)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestiona los usuarios y sus roles</p>
        </div>
        <Button onClick={openNewModal} leftIcon={<Plus className="h-4 w-4" />}>
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Todos los roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Administrador</option>
          <option value="AGENT">Agente</option>
          <option value="CUSTOMER">Cliente</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => ["SUPER_ADMIN", "ADMIN"].includes(u.role)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <UsersIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Agentes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => u.role === "AGENT").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => u.role === "CUSTOMER").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="loader mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No se encontraron usuarios
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Comisión
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Rentas
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Firma
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          roleColors[user.role]
                        }`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "AGENT" && user.commissionRate ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {user.commissionRate}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {user.role === "AGENT" ? (
                          <span>{user._count.managedRentals} gestionadas</span>
                        ) : user.role === "CUSTOMER" ? (
                          <span>{user._count.rentals} realizadas</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {["AGENT", "ADMIN", "SUPER_ADMIN"].includes(user.role) ? (
                        user.signature ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Registrada
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
                            <PenTool className="h-3 w-3" />
                            Pendiente
                          </span>
                        )
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {/* Botón de cambiar contraseña - Solo SUPER_ADMIN */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="p-1 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                            title="Cambiar Contraseña"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        )}
                        {/* Botón de activar/desactivar - SUPER_ADMIN puede con todos, ADMIN solo con no-admins */}
                        {(isSuperAdmin || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) && (
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-1 ${
                              user.isActive
                                ? "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                : "text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                            }`}
                            title={user.isActive ? "Desactivar" : "Activar"}
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Cambiar Contraseña
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {passwordUser.firstName} {passwordUser.lastName}
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Repita la contraseña"
                  />
                </div>

                {passwordError && (
                  <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {passwordError}
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="font-medium mb-1">Requisitos de contraseña:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Mínimo 8 caracteres</li>
                    <li>Al menos una mayúscula (A-Z)</li>
                    <li>Al menos una minúscula (a-z)</li>
                    <li>Al menos un número (0-9)</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordUser(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Cambiar Contraseña
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {editingUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={editingUser ? "Dejar vacío para mantener" : ""}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="CUSTOMER">Cliente</option>
                    <option value="AGENT">Agente</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {formData.role === "AGENT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tasa de Comisión (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={formData.commissionRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          commissionRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Sección de Firma Digital - Solo para Agentes y Admins */}
                {["AGENT", "ADMIN", "SUPER_ADMIN"].includes(formData.role) && (
                  <div className="border-t dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Firma Digital
                        </span>
                        {formData.signature && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Registrada
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSignatureSection(!showSignatureSection)}
                        className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
                      >
                        {showSignatureSection ? "Ocultar" : formData.signature ? "Cambiar" : "Agregar"}
                      </button>
                    </div>

                    {formData.signature && !showSignatureSection && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <img
                          src={formData.signature}
                          alt="Firma actual"
                          className="h-16 mx-auto"
                        />
                      </div>
                    )}

                    {showSignatureSection && (
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <SignaturePad
                          label="Dibuje su firma"
                          onSave={(sig) => {
                            setFormData({ ...formData, signature: sig })
                            setShowSignatureSection(false)
                          }}
                          onClear={() => setFormData({ ...formData, signature: null })}
                          existingSignature={formData.signature}
                          width={350}
                          height={150}
                        />
                      </div>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Esta firma se usará automáticamente en los contratos de renta.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false)
                      setEditingUser(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingUser ? "Guardar Cambios" : "Crear Usuario"}
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
