import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://fgozmmqhxqxiufvqpllm.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb3ptbXFoeHF4aXVmdnFwbGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NTQ0NjYsImV4cCI6MjEwNjEzMDQ2Nn0.KaVZUUdeQZjmrirNMCHivkHZK4tKSYIYgW3jJBPMoQw'
);

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const RefugiosModule = () => {
  const [refugios, setRefugios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('La Paz');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [capacidad, setCapacidad] = useState(50);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [position, setPosition] = useState({ lat: -16.5, lng: -68.15 }); // La Paz default
  const [adminId, setAdminId] = useState('');
  const [adminsDisponibles, setAdminsDisponibles] = useState([]);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRefugios();
    fetchAdmins();
  }, []);

  const fetchRefugios = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/refugios');
      const data = await res.json();
      setRefugios(data);
    } catch (err) {
      console.error('Error fetching refugios:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/usuarios/admin-refugio');
      const data = await res.json();
      setAdminsDisponibles(data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Compress Image
      const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 800,
        useWebWorker: true
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setLogoFile(compressedFile);
        setLogoPreview(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error('Error compressing image:', error);
      }
    }
  };

  const uploadLogo = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('logos').upload(fileName, file);
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
      let finalLogoUrl = logoPreview; // Use existing if editing and no new file

      if (logoFile) {
        finalLogoUrl = await uploadLogo(logoFile);
      }

      const payload = {
        nombre,
        ciudad,
        direccion,
        capacidad_maxima: parseInt(capacidad),
        contacto_telefono: contacto,
        latitud: position?.lat,
        longitud: position?.lng,
        logo_url: finalLogoUrl,
        admin_id: adminId || null
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `http://localhost:5000/api/refugios/${editingId}` : 'http://localhost:5000/api/refugios';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error al guardar');

      await fetchRefugios();
      closeModal();
      Swal.fire('Guardado', 'El refugio se guardó correctamente', 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar el refugio', 'error');
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = (!estadoActual || estadoActual === 'activo') ? 'inactivo' : 'activo';
    try {
      const res = await fetch(`http://localhost:5000/api/refugios/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      fetchRefugios();
      Swal.fire('Actualizado', `Refugio marcado como ${nuevoEstado}`, 'success');
    } catch (err) {
      Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
  };

  const openModal = (refugio = null) => {
    if (refugio) {
      setEditingId(refugio.id);
      setNombre(refugio.nombre);
      setCiudad(refugio.ciudad);
      setDireccion(refugio.direccion || '');
      setContacto(refugio.contacto_telefono || '');
      setCapacidad(refugio.capacidad_maxima);
      setLogoPreview(refugio.logo_url);
      setLogoFile(null);
      setPosition(refugio.latitud && refugio.longitud ? { lat: parseFloat(refugio.latitud), lng: parseFloat(refugio.longitud) } : { lat: -16.5, lng: -68.15 });
      setAdminId(''); // Ideally we would fetch the current admin from the DB
    } else {
      setEditingId(null);
      setNombre('');
      setCiudad('La Paz');
      setDireccion('');
      setContacto('');
      setCapacidad(50);
      setLogoPreview(null);
      setLogoFile(null);
      setPosition({ lat: -16.5, lng: -68.15 });
      setAdminId('');
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const filteredRefugios = refugios.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Navigation & Search */}
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">Gestión de Refugios</h2>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input 
              type="text" 
              placeholder="Buscar refugios..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button onClick={() => openModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors">
            + Añadir Refugio
          </button>
        </div>
      </div>

      {/* Grid of Refugios (Like Uber Eats / Food Delivery Style) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredRefugios.map(refugio => (
            <div 
              key={refugio.id} 
              onClick={() => openModal(refugio)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer overflow-hidden transition-all hover:-translate-y-1 flex flex-col"
            >
              <div className="h-40 bg-gray-200 relative">
                {refugio.logo_url ? (
                  <img src={refugio.logo_url} alt={refugio.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl uppercase tracking-widest bg-gray-100">
                    {refugio.nombre.substring(0, 3)}
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 truncate">{refugio.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-1"><i className="fa-solid fa-location-dot mr-1"></i>{refugio.ciudad}</p>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Cap. {refugio.capacidad_maxima}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleEstado(refugio.id, refugio.estado); }} 
                    className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${(!refugio.estado || refugio.estado === 'activo') ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {(!refugio.estado || refugio.estado === 'activo') ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredRefugios.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No se encontraron refugios.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Refugio' : 'Añadir Nuevo Refugio'}</h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Info & Admin */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Refugio *</label>
                    <input type="text" required value={nombre} onChange={e=>setNombre(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                      <select value={ciudad} onChange={e=>setCiudad(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-brand-500 outline-none">
                        <option value="La Paz">La Paz</option>
                        <option value="El Alto">El Alto</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Max *</label>
                      <input type="number" required value={capacidad} onChange={e=>setCapacidad(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto (Teléfono)</label>
                    <input type="text" value={contacto} onChange={e=>setContacto(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asignar Administrador de Refugio</label>
                    <select value={adminId} onChange={e=>setAdminId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm">
                      <option value="">-- Seleccionar Usuario --</option>
                      {adminsDisponibles.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre} ({a.email})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Solo muestra usuarios con rol 'admin_refugio'.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo / Imagen Principal</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current.click()}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="h-32 mx-auto object-contain" />
                      ) : (
                        <div className="py-4 text-gray-500">
                          <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          Haz clic para subir una imagen
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">La imagen será comprimida automáticamente.</p>
                  </div>
                </div>

                {/* Right Col: Map */}
                <div className="flex flex-col h-full min-h-[400px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación Geográfica (Haz clic en el mapa)</label>
                  <div className="flex-1 rounded-xl overflow-hidden border border-gray-300">
                    <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      <LocationMarker position={position} setPosition={setPosition} />
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm">
                  {editingId ? 'Guardar Cambios' : 'Crear Refugio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefugiosModule;
