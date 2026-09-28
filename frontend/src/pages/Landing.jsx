import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow-sm py-4 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartIcon className="w-8 h-8 text-brand-600" />
          <span className="text-2xl font-bold text-gray-900 tracking-tight">PatitasConecta</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-brand-600 font-medium">Iniciar Sesión</Link>
          <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full font-medium transition-colors">
            Soy Refugio
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 z-10">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
              Encuentra a tu <span className="text-brand-600">mejor amigo</span> en La Paz y El Alto
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              PatitasConecta es la plataforma centralizada que conecta refugios con personas dispuestas a dar amor. Ayudamos a reducir el tiempo de espera y facilitar el proceso de adopción.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/login" className="bg-brand-600 hover:bg-brand-700 text-white text-center px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/30">
                Adoptar ahora
              </Link>
              <button className="bg-white border-2 border-gray-200 hover:border-brand-600 hover:text-brand-600 text-gray-700 text-center px-8 py-4 rounded-xl font-bold text-lg transition-colors">
                Conocer Refugios
              </button>
            </div>
          </div>
          <div className="flex-1 relative z-10">
            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Perro feliz" className="rounded-3xl shadow-2xl" />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <HomeIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Hogares encontrados</p>
                <p className="text-xl font-bold text-gray-900">+1,200</p>
              </div>
            </div>
          </div>
          
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        </div>
      </header>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">¿Cómo funciona PatitasConecta?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <MagnifyingGlassIcon className="w-12 h-12 text-brand-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Busca tu mascota</h3>
              <p className="text-gray-600">Explora la base de datos centralizada de animales en refugios de La Paz y El Alto.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <HeartIcon className="w-12 h-12 text-brand-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Solicita adopción</h3>
              <p className="text-gray-600">Completa el formulario en línea y conecta directamente con el refugio asignado.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <HomeIcon className="w-12 h-12 text-brand-500 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Lleva amor a casa</h3>
              <p className="text-gray-600">Finaliza el proceso y dale una segunda oportunidad a un animal abandonado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 text-center">
        <p className="text-gray-400">© 2026 PatitasConecta. Uniendo corazones y patitas en Bolivia.</p>
      </footer>
    </div>
  );
};

export default Landing;
