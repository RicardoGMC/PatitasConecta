const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Endpoint de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor Node.js funcionando correctamente' });
});

// Obtener estadísticas para el dashboard
app.get('/api/stats', async (req, res) => {
    try {
        // Simularemos algunos conteos hasta que haya datos reales en las tablas
        const { count: animalesCount } = await supabase.from('animales').select('*', { count: 'exact', head: true });
        const { count: adopcionesCount } = await supabase.from('adopciones').select('*', { count: 'exact', head: true });

        res.json({
            animales: animalesCount || 124, // Valores por defecto si está vacío para la UI
            adopciones: adopcionesCount || 38,
            esperaMedia: 42, // Días
            capacidad: 85 // Porcentaje
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para Login (Prototipo sin encriptación de contraseña)
app.post('/api/login', async (req, res) => {
    const { email } = req.body;
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Login exitoso', usuario: data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { GoogleGenAI } = require('@google/genai');

// Endpoint para el Simulador de Compatibilidad (Adopción)
app.post('/api/simulate-match', async (req, res) => {
    const { mascota, escenario } = req.body;
    
    // Preparar el prompt con los datos de la mascota y el escenario del adoptante
    const promptTexto = `
    Actúa como un experto evaluador de adopciones de mascotas. 
    Evalúa la compatibilidad entre esta mascota y el escenario de vida del potencial adoptante.

    DATOS DE LA MASCOTA:
    - Especie/Raza: ${mascota.especie} - ${mascota.raza}
    - Tamaño y Peso: ${mascota.tamano} (${mascota.peso_kg} kg)
    - Edad: ${mascota.edad_estimada_meses} meses
    - Nivel de Energía: ${mascota.nivel_energia}
    - Personalidad: ${mascota.personalidad}
    - Condiciones Médicas: ${mascota.condiciones_medicas || 'Ninguna'}
    - Requisitos Específicos: ${mascota.requisitos_adopcion || 'Ninguno'}
    - Convive con: Niños (${mascota.convive_ninos ? 'Sí' : 'No'}), Perros (${mascota.convive_perros ? 'Sí' : 'No'}), Gatos (${mascota.convive_gatos ? 'Sí' : 'No'})

    ESCENARIO DEL ADOPTANTE:
    - Tipo de Vivienda: ${escenario.vivienda}
    - Espacio al aire libre: ${escenario.espacio_exterior}
    - Tiempo libre diario para la mascota: ${escenario.tiempo_libre} horas
    - Presupuesto mensual para la mascota: ${escenario.presupuesto} Bs.
    - Experiencia previa con mascotas: ${escenario.experiencia}
    - ¿Hay niños en casa?: ${escenario.ninos_casa}
    - ¿Hay otras mascotas en casa?: ${escenario.otras_mascotas}

    Debes devolver ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin formato Markdown adicional ni texto antes o después):
    {
      "porcentaje_compatibilidad": (número del 0 al 100),
      "veredicto": ("Altamente Recomendable", "Posible con Ajustes", o "No Recomendable"),
      "analisis_positivo": (array de 2 a 3 razones breves por las que es un buen match),
      "riesgos_retos": (array de 2 a 3 retos que enfrentaría esta adopción),
      "recomendaciones": (texto con consejo para que funcione)
    }
    `;

    try {
        if (process.env.GEMINI_API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: promptTexto,
                config: { responseMimeType: "application/json" }
            });
            const resultadoJson = JSON.parse(response.text);
            return res.json(resultadoJson);
        } else {
            // Fallback inteligente si no hay API key de Gemini configurada
            let score = 80;
            const positivos = ["Tienen buena disposición para adoptar."];
            const retos = [];
            
            if (mascota.tamano === 'Grande' || mascota.tamano === 'Gigante') {
                if (escenario.vivienda === 'Departamento' || escenario.espacio_exterior === 'No tiene') {
                    score -= 30;
                    retos.push(`Un perro ${mascota.tamano} necesita más espacio que un ${escenario.vivienda} sin patio.`);
                } else {
                    positivos.push(`El espacio exterior es ideal para un perro ${mascota.tamano}.`);
                }
            }
            if (mascota.nivel_energia === 'Alto' && parseInt(escenario.tiempo_libre) < 2) {
                score -= 25;
                retos.push("La mascota tiene mucha energía y requerirá más tiempo del que el adoptante tiene disponible.");
            }
            if (!mascota.convive_ninos && escenario.ninos_casa === 'Sí') {
                score -= 40;
                retos.push("La mascota no es compatible con niños, lo cual representa un riesgo en este hogar.");
            }
            
            score = Math.max(0, Math.min(100, score));
            let veredicto = score > 75 ? "Altamente Recomendable" : (score > 40 ? "Posible con Ajustes" : "No Recomendable");

            res.json({
                porcentaje_compatibilidad: score,
                veredicto: veredicto,
                analisis_positivo: positivos,
                riesgos_retos: retos.length > 0 ? retos : ["No se encontraron retos significativos."],
                recomendaciones: "Proveer una buena dieta y chequeos veterinarios regulares."
            });
        }
    } catch (error) {
        console.error("Error en simulación:", error);
        res.status(500).json({ error: 'Error al simular el escenario' });
    }
});

// Rutas para Refugios
app.get('/api/refugios', async (req, res) => {
    try {
        const { data, error } = await supabase.from('refugios').select('*').order('fecha_registro', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/refugios', async (req, res) => {
    try {
        const { nombre, ciudad, direccion, capacidad_maxima, contacto_telefono, latitud, longitud, logo_url, admin_id } = req.body;
        
        // Insertar refugio
        const { data: refugio, error: refError } = await supabase
            .from('refugios')
            .insert([{ nombre, ciudad, direccion, capacidad_maxima, contacto_telefono, latitud, longitud, logo_url }])
            .select()
            .single();

        if (refError) throw refError;

        // Asignar admin si se proporcionó
        if (admin_id) {
            await supabase.from('usuarios').update({ refugio_id: refugio.id }).eq('id', admin_id);
        }

        res.json(refugio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/refugios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { admin_id, ...refugioUpdates } = updates;

        const { data, error } = await supabase
            .from('refugios')
            .update(refugioUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (admin_id) {
             await supabase.from('usuarios').update({ refugio_id: data.id }).eq('id', admin_id);
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/refugios/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const { data, error } = await supabase
            .from('refugios')
            .update({ estado })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener usuarios que pueden ser admin de refugio
app.get('/api/usuarios/admin-refugio', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nombre, email')
            .eq('rol', 'admin_refugio');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener usuarios adoptantes
app.get('/api/usuarios/adoptantes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('rol', 'adoptante');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas para Usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const { refugio_id } = req.query;
        let query = supabase.from('usuarios').select(`
            *,
            refugios ( nombre )
        `).order('fecha_registro', { ascending: false });
        
        if (refugio_id) {
            query = query.eq('refugio_id', refugio_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/usuarios', async (req, res) => {
    try {
        const { nombre, ci, email, telefono, password, rol, refugio_id } = req.body;
        
        const { data, error } = await supabase
            .from('usuarios')
            .insert([{ nombre, ci, email, telefono, password, rol, refugio_id, estado: 'activo' }])
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ci, email, telefono, password, rol, refugio_id } = req.body;
        
        const { data, error } = await supabase
            .from('usuarios')
            .update({ nombre, ci, email, telefono, password, rol, refugio_id })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/usuarios/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'activo' o 'inactivo'
        
        const { data, error } = await supabase
            .from('usuarios')
            .update({ estado })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas para Animales
app.get('/api/animales', async (req, res) => {
    try {
        const { refugio_id } = req.query;
        let query = supabase.from('animales').select(`
            *,
            refugios ( nombre, ciudad ),
            adoptante:adoptante_id ( nombre, email, telefono, ci )
        `).order('fecha_ingreso', { ascending: false });
        
        if (refugio_id) {
            query = query.eq('refugio_id', refugio_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/animales', async (req, res) => {
    try {
        const { error } = await supabase.from('animales').insert([req.body]);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/animales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('animales').update(req.body).eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/animales/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('animales').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de PatitasConecta corriendo en http://localhost:${PORT}`);
});
