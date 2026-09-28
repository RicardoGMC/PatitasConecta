import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const SimuladorModule = ({ currentUser }) => {
  const [animales, setAnimales] = useState([]);
  const [adoptantes, setAdoptantes] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [selectedAdoptante, setSelectedAdoptante] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetchAnimales();
    fetchAdoptantes();
  }, [currentUser]);

  const fetchAnimales = async () => {
    try {
      let url = 'http://localhost:5000/api/animales';
      if (currentUser?.refugio_id && currentUser.rol !== 'administrador') {
        url += `?refugio_id=${currentUser.refugio_id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setAnimales(data);
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

  const handleSimular = async () => {
    if (!selectedAnimal || !selectedAdoptante) {
      Swal.fire('Faltan Datos', 'Debes seleccionar una mascota y un adoptante.', 'warning');
      return;
    }

    setLoading(true);
    setResultado(null);

    const escenario = {
      vivienda: selectedAdoptante.vivienda || 'Desconocido',
      espacio_exterior: selectedAdoptante.espacio_exterior || 'Desconocido',
      tiempo_libre: selectedAdoptante.tiempo_libre || 0,
      presupuesto: selectedAdoptante.presupuesto || 0,
      experiencia: selectedAdoptante.experiencia || 'Desconocida',
      ninos_casa: selectedAdoptante.ninos_casa ? 'Sí' : 'No',
      otras_mascotas: selectedAdoptante.otras_mascotas ? 'Sí' : 'No'
    };

    try {
      const res = await fetch('http://localhost:5000/api/simulate-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mascota: selectedAnimal, escenario })
      });

      const data = await res.json();
      setResultado(data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Hubo un error al ejecutar la simulación de IA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <div className="bg-white p-6 shadow-sm border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Simulador de Adopción (IA)</h2>
        <p className="text-gray-500 mt-1">Evalúa si una mascota es compatible con el perfil y estilo de vida registrado por el adoptante.</p>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Configuración */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-brand-700 mb-4 border-b pb-2"><i className="fa-solid fa-paw mr-2"></i> 1. Mascota a Evaluar</h3>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500"
              onChange={(e) => setSelectedAnimal(animales.find(a => a.id === e.target.value) || null)}
              value={selectedAnimal?.id || ''}
            >
              <option value="">-- Seleccionar Mascota --</option>
              {animales.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} ({a.especie} {a.raza}) - {a.tamano}</option>
              ))}
            </select>
            
            {selectedAnimal && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex gap-4">
                  {selectedAnimal.foto_url ? (
                    <img src={selectedAnimal.foto_url} alt={selectedAnimal.nombre} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-500">Sin foto</div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{selectedAnimal.nombre}</p>
                    <p className="text-xs text-gray-500">{selectedAnimal.tamano} • Energía {selectedAnimal.nivel_energia}</p>
                    <p className="text-xs text-gray-500 mt-1">Convive niños: {selectedAnimal.convive_ninos ? 'Sí' : 'No'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-lg text-blue-700 mb-2 border-b pb-2"><i className="fa-solid fa-house-user mr-2"></i> 2. Perfil del Adoptante</h3>
            
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedAdoptante(adoptantes.find(a => a.id === e.target.value) || null)}
              value={selectedAdoptante?.id || ''}
            >
              <option value="">-- Seleccionar Adoptante --</option>
              {adoptantes.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>

            {selectedAdoptante && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm space-y-2">
                <p><strong>Vivienda:</strong> {selectedAdoptante.vivienda || 'No especificada'} ({selectedAdoptante.espacio_exterior || 'Sin patio'})</p>
                <p><strong>Tiempo libre:</strong> {selectedAdoptante.tiempo_libre ? `${selectedAdoptante.tiempo_libre} hrs/día` : 'No especificado'}</p>
                <p><strong>Niños en casa:</strong> {selectedAdoptante.ninos_casa ? 'Sí' : 'No'}</p>
                <p><strong>Otras mascotas:</strong> {selectedAdoptante.otras_mascotas ? 'Sí' : 'No'}</p>
                <p><strong>Experiencia:</strong> {selectedAdoptante.experiencia || 'Ninguna'}</p>
              </div>
            )}

            <button 
              onClick={handleSimular} 
              disabled={loading}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 active:scale-95'}`}
            >
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Simulando con IA...</> : 'Simular Compatibilidad'}
            </button>
          </div>

        </div>

        {/* Columna Derecha: Resultados */}
        <div className="lg:col-span-2">
          {!resultado && !loading && (
            <div className="h-full w-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-12 text-center text-gray-400 min-h-[400px]">
              <i className="fa-solid fa-wand-magic-sparkles text-6xl mb-4 text-brand-200"></i>
              <h3 className="text-xl font-bold text-gray-500">Esperando Selección</h3>
              <p className="mt-2 text-sm max-w-sm">Selecciona una mascota y un adoptante en el panel izquierdo y haz clic en simular para que la IA evalúe la compatibilidad.</p>
            </div>
          )}

          {loading && (
            <div className="h-full w-full bg-white rounded-2xl shadow-sm border border-brand-100 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
               <div className="animate-pulse flex flex-col items-center">
                  <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-solid fa-robot text-3xl text-brand-600 fa-bounce"></i>
                  </div>
                  <h3 className="text-xl font-bold text-brand-800">Analizando perfiles...</h3>
                  <p className="text-gray-500 mt-2">La IA está evaluando el tamaño, energía y necesidades de {selectedAnimal?.nombre} frente al estilo de vida de {selectedAdoptante?.nombre}.</p>
               </div>
            </div>
          )}

          {resultado && !loading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${resultado.porcentaje_compatibilidad > 75 ? 'bg-brand-50 text-brand-600' : (resultado.porcentaje_compatibilidad > 40 ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>
                    <i className="fa-solid fa-paw"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {resultado.porcentaje_compatibilidad > 75 ? 'Alta Compatibilidad' : (resultado.porcentaje_compatibilidad > 40 ? 'Compatibilidad Moderada' : 'Baja Compatibilidad')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Análisis de perfil de estilo de vida</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-brand-600">{resultado.porcentaje_compatibilidad}%</div>
                  <div className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">Match</div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-plus text-brand-600"></i> Puntos a Favor
                  </h4>
                  <ul className="space-y-3">
                    {resultado.analisis_positivo.map((punto, i) => (
                      <li key={i} className="flex gap-3 text-gray-700 bg-brand-50/50 p-4 rounded-xl border border-brand-100/50">
                        <i className="fa-solid fa-check text-brand-600 mt-1"></i> <span>{punto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-minus text-gray-500"></i> Aspectos a Considerar
                  </h4>
                  <ul className="space-y-3">
                    {resultado.riesgos_retos.map((reto, i) => (
                      <li key={i} className="flex gap-3 text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <i className="fa-solid fa-circle-exclamation text-gray-400 mt-1"></i> <span>{reto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 border-l-4 border-brand-500 p-6 rounded-r-xl">
                  <h4 className="text-gray-800 font-bold mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-lightbulb text-brand-500"></i> Recomendación
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    {resultado.recomendaciones}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SimuladorModule;
