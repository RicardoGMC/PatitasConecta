import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          localStorage.setItem('usuario', JSON.stringify(data.usuario));
          Swal.fire({
            title: `¡Bienvenido, ${data.usuario.nombre}!`,
            text: `Iniciando sesión como ${data.usuario.rol}...`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true,
            backdrop: `rgba(13, 148, 136, 0.4)`
          }).then(() => {
            navigate('/dashboard');
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de acceso',
            text: data.error || 'Credenciales incorrectas',
            confirmButtonColor: '#0d9488'
          });
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo conectar al servidor', 'error');
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Campos vacíos',
        text: 'Por favor completa todos los campos',
        confirmButtonColor: '#0d9488'
      });
    }
  };

  return (
    <div className="bg-gray-50 flex items-center justify-center min-h-screen relative overflow-hidden font-sans">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <div className="relative w-full max-w-md bg-white shadow-2xl rounded-3xl overflow-hidden z-10 border border-gray-100 p-8 sm:p-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">PatitasConecta</h1>
          <p className="text-sm text-gray-500 mt-2">Uniendo corazones y patitas en La Paz y El Alto</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:ring-brand-500 focus:border-brand-500 block w-full px-4 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50 text-gray-900 outline-none" 
                placeholder="tu@correo.com" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:ring-brand-500 focus:border-brand-500 block w-full px-4 sm:text-sm border-gray-300 rounded-lg py-3 bg-gray-50 text-gray-900 outline-none" 
                placeholder="••••••••" 
                required 
              />
            </div>
          </div>

          <div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors">
              Iniciar Sesión
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600">
           <a href="/" className="font-medium text-gray-500 hover:text-brand-500">← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
