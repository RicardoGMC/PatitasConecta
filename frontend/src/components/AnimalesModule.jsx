import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import imageCompression from 'browser-image-compression';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://fgozmmqhxqxiufvqpllm.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnb3ptbXFoeHF4aXVmdnFwbGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NTQ0NjYsImV4cCI6MjEwNjEzMDQ2Nn0.KaVZUUdeQZjmrirNMCHivkHZK4tKSYIYgW3jJBPMoQw'
);

const AnimalesModule = ({ currentUser }) => {
  const [animales, setAnimales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentTab, setCurrentTab] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [refugios, setRefugios] = useState([]);
  const [adoptantes, setAdoptantes] = useState([]);
  
  const isSystemAdmin = currentUser?.rol === 'administrador';
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    refugio_id: currentUser?.refugio_id || '',
    nombre: '', especie: 'Perro', raza: 'Mestizo / Criollo', sexo: 'Macho', edad_estimada_meses: 12,
    tamano: 'Mediano', peso_kg: '', color: '', identificador: '',
    esterilizado: 'No', vacunacion: 'No vacunado', desparasitacion: '',
    condiciones_medicas: '', dieta: '',
    nivel_energia: 'Moderado', convive_ninos: false, convive_perros: false,
    convive_gatos: false, habitos_necesidades: false, sabe_correa: false,
    apto_departamento: false, personalidad: '',
    descripcion: '', origen_rescate: 'Rescate de la calle', ubicacion_actual: 'En refugio',
    estado: 'Disponible', requisitos_adopcion: '', cuota_adopcion: 0,
    foto_url: '', video_url: '', adoptante_id: ''
  });

  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  useEffect(() => {
    fetchAnimales();
    fetchAdoptantes();
    if (isSystemAdmin) fetchRefugios();
  }, [currentUser]);

  const fetchAnimales = async () => {
    try {
      let url = 'http://localhost:5000/api/animales';
      if (currentUser?.refugio_id && !isSystemAdmin) {
        url += `?refugio_id=${currentUser.refugio_id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setAnimales(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRefugios = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/refugios');
      const data = await res.json();
      setRefugios(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdoptantes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/usuarios/adoptantes');
      const data = await res.json();
      setAdoptantes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      try {
        const compressed = await imageCompression(file, options);
        setFotoFile(compressed);
        setFotoPreview(URL.createObjectURL(compressed));
      } catch (error) {
        console.error('Error compressing', error);
      }
    }
  };

  const uploadFoto = async (file) => {
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('logos').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.refugio_id) {
      Swal.fire('Error', 'El nombre y el refugio son obligatorios', 'error');
      return;
    }

    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      let finalFotoUrl = formData.foto_url;
      if (fotoFile) {
        finalFotoUrl = await uploadFoto(fotoFile);
      }

      // Evitar enviar campos relacionales que causan error en Supabase
      const { id, refugios, adoptante, fecha_ingreso, ...cleanData } = formData;
      const payload = { 
        ...cleanData, 
        foto_url: finalFotoUrl,
        adoptante_id: cleanData.estado === 'Adoptado' ? cleanData.adoptante_id : null
      };

      const url = editingId ? `http://localhost:5000/api/animales/${editingId}` : 'http://localhost:5000/api/animales';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al guardar');
      }

      await fetchAnimales();
      closeModal();
      Swal.fire('Guardado', 'Mascota guardada correctamente', 'success');
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const openModal = (animal = null) => {
    if (animal) {
      setEditingId(animal.id);
      setFormData({ ...animal, adoptante_id: animal.adoptante_id || '' });
      setFotoPreview(animal.foto_url);
    } else {
      setEditingId(null);
      setFormData({
        refugio_id: currentUser?.refugio_id || '',
        nombre: '', especie: 'Perro', raza: 'Mestizo / Criollo', sexo: 'Macho', edad_estimada_meses: 12,
        tamano: 'Mediano', peso_kg: '', color: '', identificador: '',
        esterilizado: 'No', vacunacion: 'No vacunado', desparasitacion: '',
        condiciones_medicas: '', dieta: '',
        nivel_energia: 'Moderado', convive_ninos: false, convive_perros: false,
        convive_gatos: false, habitos_necesidades: false, sabe_correa: false,
        apto_departamento: false, personalidad: '',
        descripcion: '', origen_rescate: 'Rescate de la calle', ubicacion_actual: 'En refugio',
        estado: 'Disponible', requisitos_adopcion: '', cuota_adopcion: 0,
        foto_url: '', video_url: '', adoptante_id: ''
      });
      setFotoPreview(null);
    }
    setFotoFile(null);
    setCurrentTab(1);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const deleteAnimal = async (id) => {
    const res = await Swal.fire({
      title: '¿Eliminar mascota?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#ef4444'
    });
    if (res.isConfirmed) {
      try {
        await fetch(`http://localhost:5000/api/animales/${id}`, { method: 'DELETE' });
        fetchAnimales();
        Swal.fire('Eliminado', '', 'success');
      } catch (err) {
        Swal.fire('Error', '', 'error');
      }
    }
  };

  const verAdoptante = () => {
    const user = adoptantes.find(a => a.id === formData.adoptante_id);
    if (!user) return;
    Swal.fire({
      title: 'Información del Adoptante',
      html: `
        <div class="text-left">
          <p><strong>Nombre:</strong> ${user.nombre}</p>
          <p><strong>C.I.:</strong> ${user.ci || 'No registrado'}</p>
          <p><strong>Teléfono:</strong> ${user.telefono || 'No registrado'}</p>
          <p><strong>Correo:</strong> ${user.email}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#0d9488'
    });
  };

  const filteredAnimales = animales.filter(a => String(a.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white p-4 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Mascotas Disponibles</h2>
        <div className="flex items-center gap-4">
          <input 
            type="text" placeholder="Buscar por nombre..." 
            className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-brand-500 w-64"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={() => openModal()} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium">
            + Añadir Mascota
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start">
        {filteredAnimales.map(animal => (
          <div key={animal.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-all" onClick={() => openModal(animal)}>
            <div className="h-48 bg-gray-200 relative">
              {animal.foto_url ? (
                <img src={animal.foto_url} alt={animal.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">Sin Foto</div>
              )}
              <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold rounded-full ${animal.estado === 'Disponible' ? 'bg-green-100 text-green-700' : (animal.estado === 'Adoptado' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}`}>
                {animal.estado}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{animal.nombre}</h3>
                <p className="text-sm text-gray-500">{animal.especie} • {animal.raza}</p>
                <p className="text-sm text-gray-500">{animal.sexo} • {animal.edad_estimada_meses} meses</p>
                {animal.adoptante && (
                  <p className="text-xs text-blue-600 font-medium mt-1"><i className="fa-solid fa-house-chimney mr-1"></i> Adoptado por: {animal.adoptante.nombre}</p>
                )}
              </div>
              <div className="mt-3 flex justify-between items-center border-t border-gray-50 pt-3">
                <span className="text-xs text-gray-500">{animal.refugios?.nombre}</span>
                {isSystemAdmin && (
                  <button onClick={(e) => { e.stopPropagation(); deleteAnimal(animal.id); }} className="text-red-500 hover:text-red-700">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Mascota' : 'Añadir Nueva Mascota'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <div className="flex border-b border-gray-200">
              {['1. Datos Básicos', '2. Salud', '3. Comportamiento', '4. Historia y Adopción'].map((tab, idx) => (
                <button 
                  key={idx} 
                  className={`flex-1 py-3 text-sm font-medium border-b-2 ${currentTab === idx + 1 ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setCurrentTab(idx + 1)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {currentTab === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {isSystemAdmin && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Refugio *</label>
                        <select name="refugio_id" required value={formData.refugio_id} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                          <option value="">Seleccionar Refugio</option>
                          {refugios.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" name="nombre" required value={formData.nombre} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Especie</label>
                        <select name="especie" value={formData.especie} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                          <option>Perro</option><option>Gato</option><option>Conejo</option><option>Ave</option><option>Otro</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Raza/Mezcla</label><input type="text" name="raza" value={formData.raza} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Sexo</label>
                        <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                          <option>Macho</option><option>Hembra</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Edad (Meses)</label><input type="number" name="edad_estimada_meses" value={formData.edad_estimada_meses} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tamaño</label>
                        <select name="tamano" value={formData.tamano} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                          <option>Pequeño</option><option>Mediano</option><option>Grande</option><option>Gigante</option>
                        </select>
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Peso (kg)</label><input type="number" step="0.1" name="peso_kg" value={formData.peso_kg} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-1">Color / Marcas</label><input type="text" name="color" value={formData.color} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium mb-1">Identificador (Microchip)</label><input type="text" name="identificador" value={formData.identificador} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Foto de Portada</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 h-64 flex flex-col items-center justify-center" onClick={() => fileInputRef.current.click()}>
                      {fotoPreview ? <img src={fotoPreview} className="h-full object-contain" /> : <div className="text-gray-400">Haz clic para subir foto</div>}
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    </div>
                    <div className="mt-4"><label className="block text-sm font-medium mb-1">URL Video (Youtube/Tiktok)</label><input type="text" name="video_url" value={formData.video_url} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                </div>
              )}

              {currentTab === 2 && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Esterilizado/Castrado</label>
                      <select name="esterilizado" value={formData.esterilizado} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                        <option>Sí</option><option>No</option><option>En proceso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Vacunación</label>
                      <select name="vacunacion" value={formData.vacunacion} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                        <option>Al día</option><option>Incompleto</option><option>No vacunado</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Última Desparasitación</label><input type="text" placeholder="Ej. 12/Oct/2023" name="desparasitacion" value={formData.desparasitacion} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">Condiciones Médicas Especiales</label><textarea name="condiciones_medicas" value={formData.condiciones_medicas} onChange={handleInputChange} rows="3" className="w-full border rounded-lg px-3 py-2"></textarea></div>
                  <div><label className="block text-sm font-medium mb-1">Necesidades de Dieta</label><textarea name="dieta" value={formData.dieta} onChange={handleInputChange} rows="2" className="w-full border rounded-lg px-3 py-2"></textarea></div>
                </div>
              )}

              {currentTab === 3 && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nivel de Energía</label>
                    <select name="nivel_energia" value={formData.nivel_energia} onChange={handleInputChange} className="w-48 border rounded-lg px-3 py-2">
                      <option>Bajo</option><option>Moderado</option><option>Alto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3">Apto para convivir con:</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2"><input type="checkbox" name="convive_ninos" checked={formData.convive_ninos} onChange={handleInputChange} className="w-4 h-4 text-brand-600 rounded" /> Niños</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="convive_perros" checked={formData.convive_perros} onChange={handleInputChange} className="w-4 h-4 text-brand-600 rounded" /> Perros</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="convive_gatos" checked={formData.convive_gatos} onChange={handleInputChange} className="w-4 h-4 text-brand-600 rounded" /> Gatos</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3">Hábitos y Adiestramiento:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-2"><input type="checkbox" name="habitos_necesidades" checked={formData.habitos_necesidades} onChange={handleInputChange} className="w-4 h-4 rounded" /> Sabe hacer sus necesidades fuera</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="sabe_correa" checked={formData.sabe_correa} onChange={handleInputChange} className="w-4 h-4 rounded" /> Sabe caminar con correa</label>
                      <label className="flex items-center gap-2"><input type="checkbox" name="apto_departamento" checked={formData.apto_departamento} onChange={handleInputChange} className="w-4 h-4 rounded" /> Apto para departamento cerrado</label>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Etiquetas de Personalidad (Separadas por comas)</label><input type="text" name="personalidad" placeholder="Ej. Sociable, Tímido, Juguetón" value={formData.personalidad} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                </div>
              )}

              {currentTab === 4 && (
                <div className="space-y-4 max-w-3xl">
                  <div><label className="block text-sm font-medium mb-1">Biografía / Historia de Rescate</label><textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows="4" className="w-full border rounded-lg px-3 py-2" placeholder="Escribe un texto emotivo..."></textarea></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Origen del rescate</label>
                      <select name="origen_rescate" value={formData.origen_rescate} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                        <option>Rescate de la calle</option><option>Abandono</option><option>Decomiso</option><option>Entrega Voluntaria</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ubicación Actual</label>
                      <select name="ubicacion_actual" value={formData.ubicacion_actual} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                        <option>En refugio</option><option>Hogar Temporal</option><option>Clínica Veterinaria</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-brand-600">Estado de Adopción *</label>
                      <select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2 font-bold text-brand-700 bg-brand-50 border-brand-200">
                        <option>Disponible</option><option>En proceso / Reservado</option><option>Adoptado</option><option>Atención Médica</option><option>Hogar temporal buscado</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">Cuota de Adopción (Bs.)</label><input type="number" name="cuota_adopcion" value={formData.cuota_adopcion} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>

                  {formData.estado === 'Adoptado' && (
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-end gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1 text-blue-800">Seleccionar Adoptante (Usuario) *</label>
                        <select name="adoptante_id" required={formData.estado === 'Adoptado'} value={formData.adoptante_id} onChange={handleInputChange} className="w-full border rounded-lg px-3 py-2">
                          <option value="">-- Seleccione el usuario --</option>
                          {adoptantes.map(a => (
                            <option key={a.id} value={a.id}>{a.nombre} - {a.email}</option>
                          ))}
                        </select>
                      </div>
                      {formData.adoptante_id && (
                        <button type="button" onClick={verAdoptante} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                          Ver Info
                        </button>
                      )}
                    </div>
                  )}

                  <div><label className="block text-sm font-medium mb-1">Requisitos Específicos para Adopción</label><textarea name="requisitos_adopcion" value={formData.requisitos_adopcion} onChange={handleInputChange} rows="2" className="w-full border rounded-lg px-3 py-2" placeholder="Ej. Patio con barda alta, dueño experimentado..."></textarea></div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
              <div>
                {currentTab > 1 && <button onClick={() => setCurrentTab(t => t - 1)} className="px-4 py-2 border rounded-lg bg-white font-medium">Atrás</button>}
              </div>
              <div className="flex gap-3">
                {currentTab < 4 ? (
                  <button onClick={() => setCurrentTab(t => t + 1)} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-medium">Siguiente Paso</button>
                ) : (
                  <button onClick={handleSave} className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium shadow-md hover:bg-brand-700">Finalizar y Guardar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalesModule;
