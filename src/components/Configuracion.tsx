import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Search, Lock, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import type { Usuario, Rol } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from './Tooltip';
import { supabase } from '@/lib/supabase';
import logo from '../assets/image.png';

export default function Configuracion() {
    const { usuario: currentUser, isAdmin } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authPassword, setAuthPassword] = useState('');
    const [showAuthPassword, setShowAuthPassword] = useState(false);
    const [authError, setAuthError] = useState('');
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        rol: 'usuario' as Rol,
    });

    useEffect(() => {
        if (isAdmin && isAuthenticated) {
            fetchUsuarios();
        }
    }, [isAdmin, isAuthenticated]);

    const handleAuthenticate = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');

        try {
            // Importar bcrypt dinámicamente
            const bcrypt = await import('bcryptjs');

            // Verificar la contraseña del usuario actual
            const { data, error } = await supabase
                .from('usuarios')
                .select('password')
                .eq('id_usuario', currentUser?.id_usuario)
                .single();

            if (error || !data) {
                setAuthError('Error al verificar la contraseña');
                return;
            }

            // Validar contraseña (soporta bcrypt y texto plano)
            let isValidPassword = false;
            
            if (data.password.startsWith('$2a$') || data.password.startsWith('$2b$')) {
                // Contraseña hasheada con bcrypt
                isValidPassword = await bcrypt.compare(authPassword, data.password);
            } else {
                // Contraseña en texto plano (para compatibilidad)
                isValidPassword = data.password === authPassword;
            }

            if (isValidPassword) {
                setIsAuthenticated(true);
                setAuthPassword('');
            } else {
                setAuthError('Contraseña incorrecta');
            }
        } catch (error) {
            console.error('Error al autenticar:', error);
            setAuthError('Error al verificar la contraseña');
        }
    };

    useEffect(() => {
        const filtered = usuarios.filter((user) =>
            user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsuarios(filtered);
    }, [searchTerm, usuarios]);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const response: any = await apiClient.getUsuarios();
            const data = response.data || response || [];
            setUsuarios(data);
            setFilteredUsuarios(data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setModalMode('create');
        setFormData({
            nombre: '',
            email: '',
            password: '',
            rol: 'usuario',
        });
        setShowModal(true);
    };

    const handleEdit = (user: Usuario) => {
        setModalMode('edit');
        setSelectedUsuario(user);
        setFormData({
            nombre: user.nombre,
            email: user.email,
            password: '',
            rol: user.rol,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (id === currentUser?.id_usuario) {
            alert('No puedes eliminar tu propio usuario');
            return;
        }

        if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            return;
        }

        try {
            await apiClient.deleteUsuario(id);
            await fetchUsuarios();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            alert('Error al eliminar el usuario');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'create') {
                await apiClient.createUsuario({
                    nombre: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    rol: formData.rol,
                });
            } else if (selectedUsuario) {
                // Actualizar datos básicos
                await apiClient.updateUsuario(selectedUsuario.id_usuario, {
                    nombre: formData.nombre,
                    email: formData.email,
                    rol: formData.rol,
                });

                // Si se proporcionó una nueva contraseña, actualizarla
                if (formData.password) {
                    await apiClient.updatePassword(selectedUsuario.id_usuario, formData.password);
                }
            }

            setShowModal(false);
            await fetchUsuarios();
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            alert('Error al guardar el usuario');
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800 font-medium">
                        No tienes permisos para acceder a esta sección
                    </p>
                </div>
            </div>
        );
    }

    // Pantalla de autenticación
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://www.mazdausa.com/siteassets/vehicles/2026/mazda3-sedan/01_vlp/001_hero/desktop/2026-m3-sedan-hero-desktop.jpg?w=1800"
                        alt="Mazda Showroom"
                        className="w-full h-full object-cover opacity-86"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
                </div>

                {/* Logo Mazda Japón en la parte superior izquierda */}
                <div className="absolute top-8 left-8 z-20">
                    <div className="flex items-center gap-4">
                        <img
                            src={logo}
                            alt="Mazda Logo"
                            className="w-20 h-20 object-contain filter brightness-110"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <h1 className="text-4xl md:text-5xl font-horizondrift text-white" style={{ letterSpacing: '0.2em' }}>
                            Mazda Japon
                        </h1>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8 w-full max-w-md relative z-10">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verificación de Seguridad</h2>
                        <p className="text-gray-600 text-center text-sm">
                            Por favor, ingresa tu contraseña para acceder a la configuración del sistema
                        </p>
                    </div>

                    <form onSubmit={handleAuthenticate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showAuthPassword ? 'text' : 'password'}
                                    value={authPassword}
                                    onChange={(e) => {
                                        setAuthPassword(e.target.value);
                                        setAuthError('');
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    placeholder="Ingresa tu contraseña"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showAuthPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {authError && (
                                <p className="mt-2 text-sm text-red-600">{authError}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
                        >
                            Verificar y Continuar
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Esta verificación adicional protege la información sensible del sistema
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src="https://www.mazdausa.com/siteassets/vehicles/2026/mazda3-sedan/01_vlp/001_hero/desktop/2026-m3-sedan-hero-desktop.jpg?w=1800"
                    alt="Mazda Showroom"
                    className="w-full h-full object-cover opacity-30"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95"></div>
            </div>

            <div className="p-8 relative z-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración</h1>
                    <p className="text-gray-600">Gestiona los usuarios del sistema</p>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-gray-700" />
                    <h2 className="text-xl font-bold text-gray-900">Gestión de Usuarios</h2>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Usuario
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-600">
                        Cargando usuarios...
                    </div>
                ) : filteredUsuarios.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                        No se encontraron usuarios
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                        Nombre
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                        Email
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                        Rol
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                        Fecha de Creación
                                    </th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsuarios.map((user) => (
                                    <tr
                                        key={user.id_usuario}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                    >
                                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                            {user.nombre}
                                            {user.id_usuario === currentUser?.id_usuario && (
                                                <span className="ml-2 text-xs text-gray-500">(Tú)</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700">
                                            {user.email}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${user.rol === 'administrador'
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-200 text-gray-700'
                                                    }`}
                                            >
                                                {user.rol === 'administrador' && 'Administrador'}
                                                {user.rol === 'usuario' && 'Usuario'}
                                                {user.rol === 'gestion_ingresos' && 'Gestión Ingresos'}
                                                {user.rol === 'gestion_egresos' && 'Gestión Egresos'}
                                                {user.rol === 'gestion_inventario' && 'Gestión Inventario'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-700">
                                            {user.fecha_creacion
                                                ? new Date(user.fecha_creacion).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                    title="Editar usuario"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id_usuario)}
                                                    disabled={user.id_usuario === currentUser?.id_usuario}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={
                                                        user.id_usuario === currentUser?.id_usuario
                                                            ? 'No puedes eliminar tu propio usuario'
                                                            : 'Eliminar usuario'
                                                    }
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
                >
                    <div
                        className="bg-white rounded-lg shadow-xl w-full max-w-md"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        Nombre Completo *
                                        <Tooltip content="Nombre completo del usuario" />
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        Email *
                                        <Tooltip content="Correo electrónico del usuario" />
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Ej: usuario@ejemplo.com"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        Contraseña {modalMode === 'edit' && '(dejar vacío para no cambiar)'}
                                        <Tooltip content={modalMode === 'create' ? 'Contraseña del usuario' : 'Nueva contraseña (opcional)'} />
                                    </label>
                                    <input
                                        type="password"
                                        required={modalMode === 'create'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        Rol *
                                        <Tooltip content="Nivel de acceso del usuario" />
                                    </label>
                                    <select
                                        required
                                        value={formData.rol}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rol: e.target.value as Rol })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                                    >
                                        <option value="usuario">Usuario</option>
                                        <option value="administrador">Administrador</option>
                                        <option value="gestion_ingresos">Gestión de Ingresos</option>
                                        <option value="gestion_egresos">Gestión de Egresos</option>
                                        <option value="gestion_inventario">Gestión de Inventario</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition font-medium"
                                >
                                    {modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
