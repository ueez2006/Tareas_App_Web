document.addEventListener('DOMContentLoaded', function () {
    let facultades_registradas = JSON.parse(localStorage.getItem('adminFacultades')) || [];
    let usuarios_registrados = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
    let carreras_de_facultad_actual = [];

    const tabla_facultades = document.getElementById('tabla-facultades-admin');
    const tabla_docentes = document.getElementById('tabla-docentes-admin');
    const tabla_secretarios = document.getElementById('tabla-secretarios-admin');
    const formulario_facultad = document.getElementById('form-crear-facultad');
    const formulario_usuario = document.getElementById('form-crear-usuario');
    const campo_facultad = document.getElementById('usr-facultad');
    const selector_edificio = document.getElementById('usr-edificio');
    const campo_nombre_carrera = document.getElementById('input-carrera-temporal');
    const lista_carreras_temporales = document.getElementById('lista-carreras-temporales');

    window.abrirModal = function (identificador_modal) {
        document.getElementById(identificador_modal).style.display = 'flex';
    };

    window.cerrarModal = function (identificador_modal) {
        document.getElementById(identificador_modal).style.display = 'none';
        const formulario_modal = document.getElementById(identificador_modal).querySelector('form');
        if (formulario_modal) formulario_modal.reset();
        carreras_de_facultad_actual = [];
        if (lista_carreras_temporales) lista_carreras_temporales.innerHTML = '';
    };

    window.abrirModalUsuario = function () {
        if (!campo_facultad || !selector_edificio) return;
        campo_facultad.value = '';
        selector_edificio.innerHTML = '<option value="" disabled selected>Seleccione Edificio...</option>';
        facultades_registradas.forEach((facultad, indice_facultad) => {
            const opcion_edificio = document.createElement('option');
            opcion_edificio.value = String(indice_facultad);
            opcion_edificio.textContent = facultad.edificio;
            selector_edificio.appendChild(opcion_edificio);
        });
        window.abrirModal('modal-usuario');
    };

    if (selector_edificio) {
        selector_edificio.addEventListener('change', function () {
            const facultad_seleccionada = facultades_registradas[Number(selector_edificio.value)];
            campo_facultad.value = facultad_seleccionada ? facultad_seleccionada.nombre : '';
        });
    }

    window.agregarCarreraALista = function () {
        if (!campo_nombre_carrera) return;
        const nombre_carrera = campo_nombre_carrera.value.trim();
        if (!nombre_carrera) return;
        carreras_de_facultad_actual.push(nombre_carrera);
        const elemento_carrera = document.createElement('li');
        elemento_carrera.innerText = nombre_carrera;
        if (lista_carreras_temporales) lista_carreras_temporales.appendChild(elemento_carrera);
        campo_nombre_carrera.value = '';
    };

    if (formulario_facultad) {
        formulario_facultad.addEventListener('submit', function (evento) {
            evento.preventDefault();
            if (carreras_de_facultad_actual.length === 0) {
                alert('Debes añadir al menos una carrera a la facultad antes de guardarla.');
                return;
            }
            facultades_registradas.push({
                id: Date.now().toString(),
                nombre: document.getElementById('facultad-nombre').value.trim(),
                edificio: document.getElementById('facultad-edificio').value.trim(),
                carreras: [...carreras_de_facultad_actual]
            });
            localStorage.setItem('adminFacultades', JSON.stringify(facultades_registradas));
            window.cerrarModal('modal-facultad');
            redibujar_facultades();
        });
    }

    if (formulario_usuario) {
        formulario_usuario.addEventListener('submit', function (evento) {
            evento.preventDefault();
            const cedula_ingresada = document.getElementById('usr-ci').value.trim();
            const correo_ingresado = document.getElementById('usr-correo').value.trim();
            const cedula_ya_registrada = usuarios_registrados.some(usuario =>
                usuario.ci && usuario.ci.trim() === cedula_ingresada
            );
            const correo_ya_registrado = usuarios_registrados.some(usuario =>
                usuario.correo && usuario.correo.trim().toLowerCase() === correo_ingresado.toLowerCase()
            );

            if (cedula_ya_registrada) {
                alert('Ya existe un usuario registrado con esa cédula.');
                return;
            }

            if (correo_ya_registrado) {
                alert('Ya existe un usuario registrado con ese correo electrónico.');
                return;
            }

            const facultad_seleccionada = facultades_registradas[Number(selector_edificio.value)];
            if (!facultad_seleccionada) {
                alert('Debes seleccionar un edificio válido.');
                return;
            }

            usuarios_registrados.push({
                id: Date.now().toString(),
                nombre: document.getElementById('usr-nombre').value.trim(),
                ci: cedula_ingresada,
                correo: correo_ingresado,
                rol: document.getElementById('usr-rol').value,
                facultad: facultad_seleccionada.nombre,
                edificio: facultad_seleccionada.edificio
            });
            localStorage.setItem('adminUsuarios', JSON.stringify(usuarios_registrados));
            window.cerrarModal('modal-usuario');
            redibujar_tablas_usuarios();
        });
    }

    function redibujar_facultades() {
        if (!tabla_facultades) return;
        tabla_facultades.innerHTML = '';
        facultades_registradas.forEach((facultad, indice_facultad) => {
            const fila_facultad = document.createElement('tr');
            fila_facultad.innerHTML = `
                <td><strong>${facultad.nombre}</strong></td>
                <td>${facultad.edificio}</td>
                <td>${facultad.carreras.join(', ')}</td>
                <td><button class="boton-eliminar" onclick="removerFacultad(${indice_facultad})">❌</button></td>
            `;
            tabla_facultades.appendChild(fila_facultad);
        });
    }

    function redibujar_tablas_usuarios() {
        if (!tabla_docentes || !tabla_secretarios) return;
        tabla_docentes.innerHTML = '';
        tabla_secretarios.innerHTML = '';
        usuarios_registrados.forEach((usuario, indice_usuario) => {
            const fila_usuario = document.createElement('tr');
            fila_usuario.innerHTML = `
                <td>${usuario.nombre}</td>
                <td>${usuario.ci}</td>
                <td>${usuario.facultad || 'Sin facultad asignada'}</td>
                <td>🏢 <strong>${usuario.edificio}</strong></td>
                <td><button class="boton-eliminar" onclick="removerUsuario(${indice_usuario})">❌</button></td>
            `;
            if (usuario.rol === 'Docente') tabla_docentes.appendChild(fila_usuario);
            if (usuario.rol === 'Secretario/a') tabla_secretarios.appendChild(fila_usuario);
        });
    }

    window.removerFacultad = function (indice_facultad) {
        facultades_registradas.splice(indice_facultad, 1);
        localStorage.setItem('adminFacultades', JSON.stringify(facultades_registradas));
        redibujar_facultades();
    };

    window.removerUsuario = function (indice_usuario) {
        usuarios_registrados.splice(indice_usuario, 1);
        localStorage.setItem('adminUsuarios', JSON.stringify(usuarios_registrados));
        redibujar_tablas_usuarios();
    };

    // Lógica de cierre de sesión y cambio de clave para el administrador
    window.cerrarSesion = function () {
    if (confirm('¿Está seguro de que desea salir del sistema?')) {
        localStorage.removeItem('adminLogueado');
        window.location.replace('../login.html');
    }
    };

    window.abrirModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'flex';
    };

    window.cerrarModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'none';
        const formulario_clave = document.getElementById('form-cambiar-contrasena');
        if (formulario_clave) formulario_clave.reset();
    };

    const formulario_cambio_clave_admin = document.getElementById('form-cambiar-contrasena');
    if (formulario_cambio_clave_admin) {
        formulario_cambio_clave_admin.addEventListener('submit', function (evento) {
            evento.preventDefault();
            const clave_actual_ingresada = document.getElementById('contrasena-actual').value;
            const clave_nueva_ingresada = document.getElementById('contrasena-nueva').value.trim();
            const clave_administrador_registrada = localStorage.getItem('adminContrasena') || 'admin1234';
            if (clave_nueva_ingresada.length < 8) {
                alert('La nueva contraseña debe tener un mínimo de 8 caracteres.');
                return;
            }
            if (clave_actual_ingresada !== clave_administrador_registrada) {
                alert('La contraseña actual es incorrecta.');
                return;
            }
            localStorage.setItem('adminContrasena', clave_nueva_ingresada);
            alert('¡Contraseña de administrador actualizada exitosamente!');
            window.cerrarModalPassword();
        });
    }

    redibujar_facultades();
    redibujar_tablas_usuarios();
});