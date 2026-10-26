document.addEventListener('DOMContentLoaded', function() {
    const formulario_inicio_sesion = document.getElementById('formulario-inicio-sesion');
    
    const campo_correo = document.getElementById('correo-electronico');
    const campo_contrasena = document.getElementById('contrasena');
    
    const error_correo = document.getElementById('error-correo');
    const error_contrasena = document.getElementById('error-contrasena');
    const mensaje_error_general = document.getElementById('mensaje-error');

    formulario_inicio_sesion.addEventListener('submit', function(evento) {
        evento.preventDefault(); 

        error_correo.innerText = '';
        error_contrasena.innerText = '';
        mensaje_error_general.style.display = 'none';
        mensaje_error_general.innerText = '';

        const correo_ingresado = campo_correo.value.trim().toLowerCase();
        const contrasena_ingresada = campo_contrasena.value.trim();

        // 1. CONTROL DE ACCESO PARA EL ADMINISTRADOR MAESTRO
        const correo_administrador = "admin@uleam.edu.ec";
        const contrasena_administrador = localStorage.getItem('adminContrasena') || "admin1234";

        if (correo_ingresado === correo_administrador) {
            if (contrasena_ingresada === contrasena_administrador) {
                localStorage.setItem('adminLogueado', 'true');
                alert('¡Acceso autorizado como Administrador!');
                window.location.replace('admin/admin_facultades.html'); 
                return;
            } else {
                error_contrasena.innerText = 'Contraseña de administrador incorrecta.';
                return;
            }
        }

        // 2. CONTROL DE ACCESO PARA USUARIOS REGISTRADOS POR EL ADMIN
        let base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];

        const usuario_encontrado = base_datos_usuarios.find(usuario =>
            usuario.correo && usuario.correo.toLowerCase() === correo_ingresado
        );

        if (!usuario_encontrado) {
            error_correo.innerText = 'El correo electrónico no se encuentra registrado.';
            return;
        }

        // Validar contraseña (Temporal con Cédula o Personalizada)
        const contrasena_correcta = usuario_encontrado.passwordPersonalizada || usuario_encontrado.ci;

        if (contrasena_ingresada !== contrasena_correcta) {
            error_contrasena.innerText = 'Contraseña incorrecta.';
            return;
        }

        // Intercepción del Primer Ingreso para cambiar la clave temporal
        if (!usuario_encontrado.passwordPersonalizada) {
            const nueva_contrasena = prompt('Por seguridad institucional, configure una nueva contraseña privada (Mínimo 8 caracteres):');
            
            if (!nueva_contrasena || nueva_contrasena.trim().length < 8) {
                mensaje_error_general.innerText = 'Acceso denegado: Debe establecer una contraseña válida de mínimo 8 caracteres.';
                mensaje_error_general.style.display = 'block';
                return;
            }

            usuario_encontrado.passwordPersonalizada = nueva_contrasena.trim();
            const indice_usuario = base_datos_usuarios.findIndex(usuario => usuario.id === usuario_encontrado.id);
            base_datos_usuarios[indice_usuario] = usuario_encontrado;
            localStorage.setItem('adminUsuarios', JSON.stringify(base_datos_usuarios));
            
            alert('¡Contraseña actualizada exitosamente! Procesando tu ingreso seguro...');
        }

        // ========================================================
        // 3. ENRUTAMIENTO DINÁMICO CORREGIDO SEGÚN TUS CARPETAS
        // ========================================================
        const rol_limpio = (usuario_encontrado.rol || '').toLowerCase().trim();

        if (rol_limpio.includes('docente')) {
            localStorage.setItem('docenteLogueado', JSON.stringify(usuario_encontrado));
            alert('¡Bienvenido/a Docente: ' + usuario_encontrado.nombre + '!');
            
            // 🚀 RUTA REAL: Entra a la carpeta docente/ y busca asistencia.html
            window.location.replace('docente/docente.html'); 
            return;
        } 

        if (rol_limpio.includes('secretari')) {
            localStorage.setItem('secretarioLogueado', JSON.stringify(usuario_encontrado));
            alert('¡Bienvenido/a al Módulo de Secretaría: ' + usuario_encontrado.nombre + '!');
            
            window.location.replace('secretaria/asistencia.html'); 
            return;
        }


        mensaje_error_general.innerText = 'Error interno: Tu rol (' + usuario_encontrado.rol + ') no tiene una pantalla asignada.';
        mensaje_error_general.style.display = 'block';
    });
      // ========================================================
    // LÓGICA COMPLEMENTARIA: INTERRUPTOR PARA VER CONTRASEÑA
    // ========================================================
    const boton_mostrar_contrasena = document.getElementById('btn-mostrar-clave');
    
    if (boton_mostrar_contrasena) {
        boton_mostrar_contrasena.addEventListener('click', function () {
            // Cambiamos el tipo de atributo dinámicamente
            if (campo_contrasena.type === 'password') {
                campo_contrasena.type = 'text';
                this.innerText = '🙈'; // Cambia el icono a un monito tapándose los ojos
            } else {
                campo_contrasena.type = 'password';
                this.innerText = '👁️'; // Regresa al ojito normal
            }
        });
    }
});
