document.addEventListener('DOMContentLoaded', function () {
    // Estado de sesión del secretario
    const secretario_logueado = JSON.parse(localStorage.getItem('secretarioLogueado'));
    if (!secretario_logueado) {
        window.location.replace('../login.html');
        return;
    }

    let base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
    let docentes_de_mi_edificio = [];

    let solicitudes_de_justificacion = JSON.parse(localStorage.getItem('solicitudesJustificacion')) || [];

    document.getElementById('nombre-secretario').innerText = secretario_logueado.nombre;
    document.getElementById('edificio-secretario').innerText = `🏢 Edificio: ${secretario_logueado.edificio}`;
    document.getElementById('facultad-secretario').innerText = `Facultad: ${secretario_logueado.facultad}`;

    const tabla_cuerpo_docentes = document.getElementById('tabla-docentes-edificio');
    const tabla_buzon_solicitudes = document.getElementById('tabla-buzon-solicitudes');
    const campo_filtro_fecha = document.getElementById('filtro-fecha-dia');

    let filtro_estado_actual = 'todos';
    let id_docente_seleccionado = null;

    // Configurar el input date nativo con la fecha de hoy por defecto
    const fecha_actual = new Date();
    const año_actual = fecha_actual.getFullYear();
    const mes_actual = String(fecha_actual.getMonth() + 1).padStart(2, '0');
    const dia_actual = String(fecha_actual.getDate()).padStart(2, '0');
    if (campo_filtro_fecha) campo_filtro_fecha.value = `${año_actual}-${mes_actual}-${dia_actual}`;

    // Filtrar docentes del mismo edificio del secretario logueado
    docentes_de_mi_edificio = base_datos_usuarios.filter(usuario =>
        usuario.rol &&
        usuario.rol.toLowerCase().trim().includes('docente') &&
        usuario.edificio &&
        usuario.edificio.trim() === secretario_logueado.edificio.trim()
    );

    // Renderizar la tabla principal de control de asistencia
    function redibujarTablaSecretaria() {
        if (!tabla_cuerpo_docentes) return;
        tabla_cuerpo_docentes.innerHTML = '';

        const texto_busqueda = document.getElementById('input-busqueda').value.toLowerCase().trim();
        const fecha_seleccionada = campo_filtro_fecha.value;

        let fecha_visual = "Sin fecha";
        if (fecha_seleccionada) {
            const partes_fecha = fecha_seleccionada.split('-');
            fecha_visual = `${partes_fecha[2]}/${partes_fecha[1]}/${partes_fecha[0]}`;
        }

        docentes_de_mi_edificio.forEach((docente) => {
            if (!docente.historialAsistencias) docente.historialAsistencias = {};
            if (!docente.historialAsistencias[fecha_seleccionada]) {
                docente.historialAsistencias[fecha_seleccionada] = { estado: 'Pendiente', observacion: '' };
            }

            const estado_del_dia = docente.historialAsistencias[fecha_seleccionada].estado;
            const coincide_nombre = docente.nombre.toLowerCase().includes(texto_busqueda);
            const coincide_estado = (filtro_estado_actual === 'todos' || estado_del_dia === filtro_estado_actual);

            if (coincide_nombre && coincide_estado) {
                const fila_tabla = document.createElement('tr');
                let clase_etiqueta_estado = 'etiqueta-pendiente';
                if (estado_del_dia === 'Asistió') clase_etiqueta_estado = 'etiqueta-asistio';
                if (estado_del_dia === 'No asistió') clase_etiqueta_estado = 'etiqueta-falta';
                if (estado_del_dia === 'Justificado') clase_etiqueta_estado = 'etiqueta-justificado';

                fila_tabla.innerHTML = `
                    <td><span class="etiqueta-estado ${clase_etiqueta_estado}">${estado_del_dia}</span></td>
                    <td><strong>${docente.nombre}</strong></td>
                    <td>${docente.ci}</td>
                    <td>📅 ${fecha_visual}</td>
                    <td>
                        <button class="btn-editar" onclick="abrirModalAsistencia('${docente.id}')">✏️ Registrar</button>
                    </td>
                `;
                tabla_cuerpo_docentes.appendChild(fila_tabla);
            }
        });
    }

    // =======================================================================
    // 🛠️ CAMBIO LÓGICO: FUNCIÓN PARA RENDERIZAR E INTERMEDIAR EL BUZÓN FLOTANTE
    // =======================================================================
    function redibujarBuzonSolicitudes() {
        if (!tabla_buzon_solicitudes) return;
        tabla_buzon_solicitudes.innerHTML = '';

        const ids_docentes_del_edificio = docentes_de_mi_edificio.map(docente => docente.id);

        // Filtramos solicitudes pendientes que coincidan con los docentes de este edificio
        const solicitudes_pendientes = solicitudes_de_justificacion.filter(solicitud =>
            ids_docentes_del_edificio.includes(solicitud.idDocente) && solicitud.estadoSol === 'Pendiente'
        );

        // Actualizar el contador visual del botón del header
        const contador_notificaciones = document.getElementById('contador-notificaciones');
        if (contador_notificaciones) {
            contador_notificaciones.innerText = solicitudes_pendientes.length;
            contador_notificaciones.style.display = solicitudes_pendientes.length === 0 ? 'none' : 'inline-block';
        }

        solicitudes_pendientes.forEach((solicitud) => {
            const fila_solicitud = document.createElement('tr');
            const partes_fecha_falta = solicitud.fechaFalta.split('-');
            const fecha_falta_visual = `${partes_fecha_falta[2]}/${partes_fecha_falta[1]}/${partes_fecha_falta[0]}`;

            fila_solicitud.innerHTML = `
                <td><strong>${solicitud.nombreDocente}</strong></td>
                <td>📅 ${fecha_falta_visual}</td>
                <td><p class="texto-motivo" title="${solicitud.motivo}">${solicitud.motivo}</p></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="btn-accion-solicitud btn-aceptar" onclick="procesarSolicitud('${solicitud.idSol}', 'Aceptada')">✔️ Aceptar</button>
                        <button class="btn-accion-solicitud btn-denegar" onclick="procesarSolicitud('${solicitud.idSol}', 'Denegada')">❌ Denegar</button>
                    </div>
                </td>
            `;
            tabla_buzon_solicitudes.appendChild(fila_solicitud);
        });

        if (solicitudes_pendientes.length === 0) {
            tabla_buzon_solicitudes.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#10b981; font-weight:600; padding:20px;">🎉 ¡Buzón limpio! No hay peticiones pendientes.</td></tr>`;
        }
    }
    // =======================================================================

    // =======================================================================
    // 🛠️ CAMBIO LÓGICO: MÓDULOS DE VALIDACIÓN Y CONTROL DE VISUALIZACIÓN DEL MODAL
    // =======================================================================
    window.abrirBuzonFlotante = function () {
        document.getElementById('modal-buzon-flotante').style.display = 'flex';
        redibujarBuzonSolicitudes();
    };

    window.cerrarBuzonFlotante = function () {
        document.getElementById('modal-buzon-flotante').style.display = 'none';
    };

    window.procesarSolicitud = function (id_solicitud, nuevo_estado_solicitud) {
        const solicitud_encontrada = solicitudes_de_justificacion.find(solicitud => solicitud.idSol === id_solicitud);
        if (!solicitud_encontrada) return;

        solicitud_encontrada.estadoSol = nuevo_estado_solicitud;
        localStorage.setItem('solicitudesJustificacion', JSON.stringify(solicitudes_de_justificacion));

        if (nuevo_estado_solicitud === 'Aceptada') {
            const indice_usuario_docente = base_datos_usuarios.findIndex(usuario => usuario.id === solicitud_encontrada.idDocente);
            if (indice_usuario_docente !== -1) {
                if (!base_datos_usuarios[indice_usuario_docente].historialAsistencias) {
                    base_datos_usuarios[indice_usuario_docente].historialAsistencias = {};
                }
                base_datos_usuarios[indice_usuario_docente].historialAsistencias[solicitud_encontrada.fechaFalta] = {
                    estado: 'Justificado',
                    observacion: `Aceptada automáticamente vía buzón: ${solicitud_encontrada.motivo}`
                };
                localStorage.setItem('adminUsuarios', JSON.stringify(base_datos_usuarios));
            }
        }

        // Recargar datos y refrescar paneles
        base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
        docentes_de_mi_edificio = base_datos_usuarios.filter(usuario =>
            usuario.rol &&
            usuario.rol.toLowerCase().trim().includes('docente') &&
            usuario.edificio &&
            usuario.edificio.trim() === secretario_logueado.edificio.trim()
        );

        redibujarTablaSecretaria();
        redibujarBuzonSolicitudes();
    };
    // =======================================================================

    window.cambiarFechaDia = function () { redibujarTablaSecretaria(); };
    window.filtrarDocentes = function () { redibujarTablaSecretaria(); };

    window.abrirModalAsistencia = function (id_docente) {
        const docente_seleccionado = docentes_de_mi_edificio.find(docente => docente.id === id_docente);
        if (!docente_seleccionado) return;
        id_docente_seleccionado = id_docente;
        const fecha_seleccionada = campo_filtro_fecha.value;
        const datos_asistencia_del_dia = docente_seleccionado.historialAsistencias[fecha_seleccionada];
        document.getElementById('modal-docente-nombre').innerText = `Docente: ${docente_seleccionado.nombre}`;
        document.getElementById('select-nuevo-estado').value = datos_asistencia_del_dia.estado === 'Pendiente' ? 'Asistió' : datos_asistencia_del_dia.estado;
        document.getElementById('texto-observacion').value = datos_asistencia_del_dia.observacion;
        document.getElementById('modal-asistencia').style.display = 'flex';
    };

    window.cerrarModalAsistencia = function () { document.getElementById('modal-asistencia').style.display = 'none'; };

    window.guardarEstadoAsistencia = function () {
        if (!id_docente_seleccionado) return;
        const fecha_seleccionada = campo_filtro_fecha.value;
        const indice_usuario_docente = base_datos_usuarios.findIndex(usuario => usuario.id === id_docente_seleccionado);
        if (indice_usuario_docente !== -1) {
            base_datos_usuarios[indice_usuario_docente].historialAsistencias[fecha_seleccionada] = {
                estado: document.getElementById('select-nuevo-estado').value,
                observacion: document.getElementById('texto-observacion').value.trim()
            };
            localStorage.setItem('adminUsuarios', JSON.stringify(base_datos_usuarios));
        }
        docentes_de_mi_edificio = base_datos_usuarios.filter(usuario =>
            usuario.rol &&
            usuario.rol.toLowerCase().trim().includes('docente') &&
            usuario.edificio &&
            usuario.edificio.trim() === secretario_logueado.edificio.trim()
        );
        cerrarModalAsistencia();
        redibujarTablaSecretaria();
    };
    window.cambiarFiltroEstado = function (estado, evento) {
        filtro_estado_actual = estado;
        document.querySelectorAll('.btn-filtro').forEach(boton => boton.classList.remove('activo'));
        if (evento && evento.target) evento.target.classList.add('activo');
        redibujarTablaSecretaria();
    };
    // Lanzamiento coordinado inicial
    redibujarTablaSecretaria();
    redibujarBuzonSolicitudes(); // Calcula el badge numérico de alertas de inmediato al abrir
    // =======================================================================
    // 🛠️ AGREGADO: LÓGICA DE CIERRE DE SESIÓN Y MODAL DE CAMBIO DE CLAVE
    // =======================================================================
    const formulario_cambio_clave = document.getElementById('form-cambiar-contrasena');

    // 1. Destruir sesión y regresar al login de la raíz
    window.cerrarSesion = function () {
        if (confirm('¿Está seguro de que desea salir del sistema?')) {
            localStorage.removeItem('secretarioLogueado');
            window.location.replace('../login.html'); // Sale de la carpeta secretaria/ hacia la raíz
        }
    };

    // 2. Controladores de apertura del modal
    window.abrirModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'flex';
    };

    window.cerrarModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'none';
        if (formulario_cambio_clave) formulario_cambio_clave.reset();
    };

    // 3. Procesar el cambio de contraseña en la base de datos maestra de administración
    if (formulario_cambio_clave) {
        formulario_cambio_clave.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const clave_actual_ingresada = document.getElementById('contrasena-actual').value;
            const clave_nueva_ingresada = document.getElementById('contrasena-nueva').value.trim();

            // Validar longitud mínima de seguridad
            if (clave_nueva_ingresada.length < 8) {
                alert('La nueva contraseña debe tener un mínimo de 8 caracteres.');
                return;
            }

            // Traer la clave que el usuario tiene actualmente (personalizada o su cédula inicial)
            const clave_actual_registrada = secretario_logueado.passwordPersonalizada || secretario_logueado.ci;

            if (clave_actual_ingresada !== clave_actual_registrada) {
                alert('Error: La contraseña actual es incorrecta.');
                return;
            }

            // Actualizar el perfil del secretario en la base de datos general de administración
            const indice_usuario_secretario = base_datos_usuarios.findIndex(usuario => usuario.id === secretario_logueado.id);
            if (indice_usuario_secretario !== -1) {
                base_datos_usuarios[indice_usuario_secretario].passwordPersonalizada = clave_nueva_ingresada;
                localStorage.setItem('adminUsuarios', JSON.stringify(base_datos_usuarios));

                // Sincronizar también el estado de la sesión activa
                secretario_logueado.passwordPersonalizada = clave_nueva_ingresada;
                localStorage.setItem('secretarioLogueado', JSON.stringify(secretario_logueado));

                alert('¡Contraseña actualizada exitosamente!');
                cerrarModalPassword();
            } else {
                alert('Error interno: No se pudo localizar tu registro de usuario.');
            }
        });
    }
    // Alternar visibilidad de clave (Ojito / Monito)
        const boton_mostrar_contrasena = document.getElementById('btn-mostrar-clave1');
        const input_contrasena_actual = document.getElementById('contrasena-actual'); // Seleccionamos el input directamente
    
    if (boton_mostrar_contrasena) {
        boton_mostrar_contrasena.addEventListener('click', function () {
            // Cambiamos el tipo de atributo dinámicamente
            if (input_contrasena_actual.type === 'password') {
                input_contrasena_actual.type = 'text';
                this.innerText = '🙈'; // Cambia el icono a un monito tapándose los ojos
            } else {
                input_contrasena_actual.type = 'password';
                this.innerText = '👁️'; // Regresa al ojito normal
            }
        });
    }

        const boton_mostrar_contrasena2 = document.getElementById('btn-mostrar-clave');
        const input_contrasena_actual2 = document.getElementById('contrasena-nueva'); // Seleccionamos el input directamente
    
    if (boton_mostrar_contrasena2) {
        boton_mostrar_contrasena2.addEventListener('click', function () {
            // Cambiamos el tipo de atributo dinámicamente
            if (input_contrasena_actual2.type === 'password') {
                input_contrasena_actual2.type = 'text';
                this.innerText = '🙈'; // Cambia el icono a un monito tapándose los ojos
            } else {
                input_contrasena_actual2.type = 'password';
                this.innerText = '👁️'; // Regresa al ojito normal
            }
        });
    }


});