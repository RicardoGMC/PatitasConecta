import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const UsuariosModule = ({ currentUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [refugios, setRefugios] = useState([]);

  // Form state
  const [nombre, setNombre] = useState('');
  const [ci, setCi] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('');
  const [refugioId, setRefugioId] = useState('');

  const isSystemAdmin = currentUser?.rol === 'administrador';
  const isRefugeAdmin = currentUser?.rol === 'admin_refugio';

  useEffect(() => {
    fetchUsuarios();
    if (isSystemAdmin) {
      fetchRefugios();
    }
  }, [currentUser]);

  const [editingUserId, setEditingUserId] = useState(null);

  const fetchUsuarios = async () => {
    try {
      let url = 'http://localhost:5000/api/usuarios';
      if (isRefugeAdmin && currentUser?.refugio_id) {
        url += `?refugio_id=${currentUser.refugio_id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error('Error fetching usuarios:', err);
    }
  };

  const fetchRefugios = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/refugios');
      const data = await res.json();
      setRefugios(data);
    } catch (err) {
      console.error('Error fetching refugios:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const payload = {
        nombre,
        ci,
        telefono,
        email,
        password,
        rol,
        refugio_id: isRefugeAdmin ? currentUser.refugio_id : (refugioId || null)
      };

      const method = editingUserId ? 'PUT' : 'POST';
      const url = editingUserId ? `http://localhost:5000/api/usuarios/${editingUserId}` : 'http://localhost:5000/api/usuarios';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      await fetchUsuarios();
      closeModal();
      Swal.fire('Guardado', editingUserId ? 'Usuario actualizado correctamente' : 'El usuario se creó correctamente', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el usuario. ' + err.message, 'error');
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    try {
      const res = await fetch(`http://localhost:5000/api/usuarios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      fetchUsuarios();
      Swal.fire('Actualizado', `Usuario marcado como ${nuevoEstado}`, 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  };

  const deleteUsuario = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará permanentemente al usuario.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/api/usuarios/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error al eliminar');
        fetchUsuarios();
        Swal.fire('Eliminado', 'El usuario ha sido eliminado', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
      }
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUserId(user.id);
      setNombre(user.nombre);
      setCi(user.ci || '');
      setTelefono(user.telefono || '');
      setEmail(user.email);
      setPassword(user.password || '');
      setRol(user.rol);
      setRefugioId(user.refugio_id || '');
    } else {
      setEditingUserId(null);
      setNombre('');
      setCi('');
      setTelefono('');
      setEmail('');
      setPassword('');
      setRol(isRefugeAdmin ? 'encargado_animales' : 'admin_refugio');
      setRefugioId('');
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const filteredUsuarios = usuarios.filter(u => 
    String(u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(u.ci || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h2>
          {isRefugeAdmin && <p className="text-sm text-gray-500">Administrando personal de tu refugio</p>}
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nombre, CI o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button onClick={() => openModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors">
            + Crear Usuario
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
                <th className="p-4">Usuario</th>
                <th className="p-4">CI / Teléfono</th>
                <th className="p-4">Rol</th>
                {isSystemAdmin && <th className="p-4">Refugio</th>}
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-gray-800">{u.nombre}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-800">{u.ci || '-'}</p>
                    <p className="text-sm text-gray-500">{u.telefono || '-'}</p>
                  </td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium capitalize">
                      {u.rol.replace('_', ' ')}
                    </span>
                  </td>
                  {isSystemAdmin && (
                    <td className="p-4 text-sm text-gray-600">
                      {u.refugios ? u.refugios.nombre : '-'}
                    </td>
                  )}
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${u.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => openModal(u)} 
                      className="text-gray-500 hover:text-blue-600 p-2 transition-colors"
                      title="Editar usuario"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button 
                      onClick={() => toggleEstado(u.id, u.estado)} 
                      className="text-gray-500 hover:text-brand-600 p-2 transition-colors"
                      title={u.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    >
                      <i className={`fa-solid ${u.estado === 'activo' ? 'fa-ban' : 'fa-check'}`}></i>
                    </button>

                    {isSystemAdmin && (
                      <button 
                        onClick={() => deleteUsuario(u.id)} 
                        className="text-gray-500 hover:text-red-600 p-2 transition-colors"
                        title="Eliminar permanentemente"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan={isSystemAdmin ? 6 : 5} className="p-8 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input type="text" required value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">C.I. *</label>
                  <input type="text" required value={ci} onChange={e=>setCi(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" value={telefono} onChange={e=>setTelefono(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select required value={rol} onChange={e=>setRol(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500 capitalize">
                  <option value="">-- Seleccionar Rol --</option>
                  {isSystemAdmin && <option value="administrador">Administrador Global</option>}
                  {isSystemAdmin && <option value="admin_refugio">Admin de Refugio</option>}
                  <option value="encargado_animales">Encargado de Animales</option>
                  <option value="gestor_adopciones">Gestor de Adopciones</option>
                  <option value="adoptante">Adoptante</option>
                </select>
              </div>

              {isSystemAdmin && (rol !== 'administrador' && rol !== 'adoptante' && rol !== '') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a Refugio</label>
                  <select value={refugioId} onChange={e=>setRefugioId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-500">
                    <option value="">-- Ninguno --</option>
                    {refugios.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm">
                  {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosModule;
