// Formulario y contenedor principal
const formularioRegistro = document.getElementById('formulario-registro');
const cuerpoTabla = document.getElementById('cuerpo-tabla');

// Campos de entrada (Inputs)
const ci = document.getElementById('ci');
const apellidos = document.getElementById('apellidos');
const nombre = document.getElementById('nombre');
const direccion = document.getElementById('direccion');
const telefono = document.getElementById('telefono');
const correo = document.getElementById('correo');
const facultad = document.getElementById('facultad');
const nivel = document.getElementById('nivel');
const paralelo = document.getElementById('paralelo');

// Arreglo para almacenar la lista de estudiantes
let listaEstudiantes = [];

// Expresiones Regulares para Validaciones (Regex)
const regexCedula = /^\d{10}$/; // Exactamente 10 dígitos numéricos
const regexTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/; // Solo letras y espacios
const regexTelefono = /^\d{9,10}$/; // 9 a 10 dígitos numéricos
const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Formato email válido

// 1. CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', () => {
    const datosGuardados = localStorage.getItem('estudiantes');
    if (datosGuardados) {
        listaEstudiantes = JSON.parse(datosGuardados);
    }
    actualizarTabla();
});

// 2. REGISTRAR ESTUDIANTE (Con validaciones de expresiones regulares)
formularioRegistro.addEventListener('submit', function (evento) {
    evento.preventDefault();

    // Validar Cédula
    if (!regexCedula.test(ci.value.trim())) {
        alert('La cédula debe contener exactamente 10 dígitos numéricos.');
        return;
    }

    // Validar Apellidos
    if (!regexTexto.test(apellidos.value.trim())) {
        alert('Los apellidos solo deben contener letras.');
        return;
    }

    // Validar Nombres
    if (!regexTexto.test(nombre.value.trim())) {
        alert('Los nombres solo deben contener letras.');
        return;
    }

    // Validar Teléfono
    if (!regexTelefono.test(telefono.value.trim())) {
        alert('El teléfono debe tener entre 9 y 10 dígitos numéricos.');
        return;
    }

    // Validar Correo Electrónico
    if (!regexCorreo.test(correo.value.trim())) {
        alert('Por favor, ingrese un correo electrónico válido.');
        return;
    }
    
    // === VALIDACIÓN DE REGISTROS DUPLICADOS ===
    const duplicadoCedula = listaEstudiantes.some(e => e.cedula === ci.value.trim());
    const duplicadoTelefono = listaEstudiantes.some(e => e.telefono === telefono.value.trim());
    const duplicadoCorreo = listaEstudiantes.some(e => e.correo.toLowerCase() === correo.value.trim().toLowerCase());

    if (duplicadoCedula) {
        alert('Error: Ya existe un estudiante registrado con este número de cédula.');
        return;
    }
    if (duplicadoTelefono) {
        alert('Error: Este número de teléfono ya está registrado por otro estudiante.');
        return;
    }
    if (duplicadoCorreo) {
        alert('Error: Este correo electrónico ya está registrado por otro estudiante.');
        return;
    }

    // Crear el objeto del estudiante en formato JSON
    const nuevoEstudiante = {
        cedula: ci.value.trim(),
        apellidos: apellidos.value.trim(),
        nombres: nombre.value.trim(),
        direccion: direccion.value.trim(),
        telefono: telefono.value.trim(),
        correo: correo.value.trim(),
        facultad: facultad.value.trim(),
        nivel: nivel.value.trim(),
        paralelo: paralelo.value.trim().toUpperCase()
    };

    // Agregar al arreglo, guardar en LocalStorage y refrescar
    listaEstudiantes.push(nuevoEstudiante);
    guardarEnLocalStorage();
    actualizarTabla();

    // Limpiar el formulario
    formularioRegistro.reset();
});

// 3. ACTUALIZAR TABLA Y MOSTRAR MENSAJE DE REGISTROS VACÍOS
function actualizarTabla() {
    cuerpoTabla.innerHTML = '';

    // Mostrar el mensaje si la lista está vacía (Abarca 6 columnas sumando 'Acciones')
    if (listaEstudiantes.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #888; font-style: italic; padding: 20px;">
                    No hay estudiantes registrados
                </td>
            </tr>
        `;
        return;
    }

    // Dibujar los registros existentes
    listaEstudiantes.forEach(estudiante => {
        const nuevaFila = document.createElement('tr');
        
        // Celdas de información básica
        nuevaFila.innerHTML = `
            <td>${estudiante.cedula}</td>
            <td>${estudiante.apellidos}</td>
            <td>${estudiante.nombres}</td>
            <td>${estudiante.facultad}</td>
            <td>${estudiante.nivel}</td>
        `;

        // Celda para la acción de eliminar
        const celdaAccion = document.createElement('td');
        const botonEliminar = document.createElement('button');
        
        botonEliminar.textContent = 'Eliminar';
        botonEliminar.className = 'btn-eliminar';
        
        // Manejador de evento directo y seguro para la eliminación
        botonEliminar.addEventListener('click', () => {
            if (confirm(`¿Está seguro de que desea eliminar al estudiante con CI ${estudiante.cedula}?`)) {
                // Filtrar para remover el elemento del array
                listaEstudiantes = listaEstudiantes.filter(e => e.cedula !== estudiante.cedula);
                guardarEnLocalStorage();
                actualizarTabla(); // Refresca automáticamente mostrando el mensaje si queda vacía
            }
        });

        celdaAccion.appendChild(botonEliminar);
        nuevaFila.appendChild(celdaAccion);
        cuerpoTabla.appendChild(nuevaFila);
    });
}

// 4. GUARDAR EN LOCALSTORAGE
function guardarEnLocalStorage() {
    localStorage.setItem('estudiantes', JSON.stringify(listaEstudiantes));
}