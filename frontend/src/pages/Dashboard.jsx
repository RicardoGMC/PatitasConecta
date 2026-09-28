import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import RefugiosModule from '../components/RefugiosModule';
import UsuariosModule from '../components/UsuariosModule';
import AnimalesModule from '../components/AnimalesModule';
import SimuladorModule from '../components/SimuladorModule';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [stats, setStats] = useState({
    animales: '...',
    adopciones: '...',
    esperaMedia: '...',
    capacidad: '...'
  });

  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      setUsuario(JSON.parse(storedUser));
    } else {
      navigate('/');
    }

    fetch('http://localhost:5000/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats({
          animales: data.animales,
          adopciones: data.adopciones,
          esperaMedia: data.esperaMedia + ' días',
          capacidad: data.capacidad + '%'
        });
      })
      .catch(err => console.error("Error fetching stats:", err));
  }, [navigate]);

  const data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Adopciones',
        data: [15, 19, 25, 22, 30, 28, 38],
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Rescates',
        data: [25, 22, 20, 35, 40, 30, 32],
        borderColor: '#f59e0b',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const options = { responsive: true, maintainAspectRatio: false };

  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Saldrás de tu cuenta de PatitasConecta",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('usuario');
        navigate('/');
      }
    });
  };

  const showModuleAlert = (moduleName) => {
    Swal.fire({
      title: moduleName,
      text: `El ${moduleName.toLowerCase()} está en desarrollo`,
      icon: 'info',
      confirmButtonColor: '#0d9488'
    });
  };

  return (
    <div className="bg-gray-50 flex h-screen overflow-hidden text-gray-800 font-sans">
      <aside className="w-64 bg-white shadow-lg flex-col hidden md:flex h-full z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-xl">
            P
          </div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">PatitasConecta</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveModule('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeModule === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'}`}>
            Dashboard
          </button>
          
          {(usuario?.rol === 'administrador' || usuario?.rol === 'admin_refugio') && (
            <button onClick={() => setActiveModule('usuarios')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeModule === 'usuarios' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'}`}>
              Gestión de Usuarios
            </button>
          )}

          <button onClick={() => setActiveModule('animales')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeModule === 'animales' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'}`}>
            Animales Disponibles
          </button>

          <button onClick={() => setActiveModule('simulador')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeModule === 'simulador' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'}`}>
            Simulador de Escenarios
          </button>
          
          {usuario?.rol === 'administrador' && (
            <button onClick={() => setActiveModule('refugios')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeModule === 'refugios' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-brand-600'}`}>
              Gestión de Refugios
            </button>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-medium">
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white shadow-sm z-10 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {activeModule === 'dashboard' ? 'Panel de Control' : (
              activeModule === 'usuarios' ? 'Gestión de Usuarios' : (
                activeModule === 'animales' ? 'Mascotas Disponibles' : (
                  activeModule === 'simulador' ? 'Simulador de Adopción (IA)' : 'Gestión de Refugios'
                )
              )
            )}
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-700">{usuario?.nombre || 'Usuario'}</p>
                <p className="text-xs text-gray-500 capitalize">{usuario?.rol ? usuario.rol.replace('_', ' ') : 'Rol desconocido'}</p>
              </div>
            </div>
          </div>
        </header>

        {activeModule === 'dashboard' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Animales', val: stats.animales, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { title: 'Adopciones', val: stats.adopciones, color: 'text-green-500', bg: 'bg-green-50' },
                  { title: 'Espera Media', val: stats.esperaMedia, color: 'text-orange-500', bg: 'bg-orange-50' },
                  { title: 'Capacidad', val: stats.capacidad, color: 'text-purple-500', bg: 'bg-purple-50' }
                ].map((kpi, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full ${kpi.bg} ${kpi.color} flex items-center justify-center text-xl font-bold`}>
                      #
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{kpi.title}</p>
                      <h3 className="text-2xl font-bold text-gray-800">{kpi.val}</h3>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Adopciones vs Rescates</h3>
                  <div className="relative h-72 w-full">
                    <Line data={data} options={options} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Simulador de Compatibilidad</h3>
                    <p className="text-sm text-gray-600 mb-6">Utiliza IA para evaluar si una mascota específica es compatible con las condiciones de vida de un potencial adoptante.</p>
                  </div>
                  <button onClick={() => setActiveModule('simulador')} className="w-full py-3 px-4 bg-brand-50 text-brand-700 rounded-lg font-bold border border-brand-100 hover:bg-brand-100 transition-colors">
                    Abrir Simulador
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeModule === 'refugios' && (
          <div className="flex-1 overflow-hidden">
            <RefugiosModule />
          </div>
        )}

        {activeModule === 'usuarios' && (
          <div className="flex-1 overflow-hidden">
            <UsuariosModule currentUser={usuario} />
          </div>
        )}

        {activeModule === 'animales' && (
          <div className="flex-1 overflow-hidden">
            <AnimalesModule currentUser={usuario} />
          </div>
        )}

        {activeModule === 'simulador' && (
          <div className="flex-1 overflow-hidden">
            <SimuladorModule currentUser={usuario} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
