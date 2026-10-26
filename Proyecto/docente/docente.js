document.addEventListener('DOMContentLoaded', function () {
    // 1. Cargar perfil activo del docente
    let docente_logueado = JSON.parse(localStorage.getItem('docenteLogueado'));
    if (!docente_logueado) {
        window.location.replace('../login.html');
        return;
    }

    let base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
    let solicitudes_de_justificacion = JSON.parse(localStorage.getItem('solicitudesJustificacion')) || [];

    document.getElementById('nombre-docente').innerText = docente_logueado.nombre;
    document.getElementById('edificio-docente').innerText = `🏢 Edificio: ${docente_logueado.edificio}`;
    document.getElementById('facultad-docente').innerText = `Facultad: ${docente_logueado.facultad}`;
    document.getElementById('titulo-bienvenida').innerText = `Bienvenido/a, ${docente_logueado.nombre}`;

    let fecha_actual = new Date();
    let año_actual = fecha_actual.getFullYear();
    let mes_actual = fecha_actual.getMonth();
    let fecha_seleccionada_para_solicitud = null;
    let es_permiso_anticipado = false;

    const nombres_meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const contenedor_grid = document.getElementById('grid-calendario-docente');

    function obtenerDatosDocenteActualizado() {
        base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
        const usuario_encontrado = base_datos_usuarios.find(u => u.id === docente_logueado.id);
        return usuario_encontrado || docente_logueado;
    }

    // Renderizado del calendario mensual
    function renderizarCalendario() {
        if (!contenedor_grid) return;
        contenedor_grid.innerHTML = '';

        document.getElementById('etiqueta-mes-año').innerText = `${nombres_meses[mes_actual]} ${año_actual}`;

        const primer_dia_mes = new Date(año_actual, mes_actual, 1).getDay();
        const total_dias_mes = new Date(año_actual, mes_actual + 1, 0).getDate();

        const docente_info = obtenerDatosDocenteActualizado();
        const historial = docente_info.historialAsistencias || {};

        for (let i = 0; i < primer_dia_mes; i++) {
            const celda_vacia = document.createElement('div');
            celda_vacia.classList.add('dia-celda', 'vacia');
            contenedor_grid.appendChild(celda_vacia);
        }

        for (let dia = 1; dia <= total_dias_mes; dia++) {
            const celda_dia = document.createElement('div');
            celda_dia.classList.add('dia-celda');

            const mes_str = String(mes_actual + 1).padStart(2, '0');
            const dia_str = String(dia).padStart(2, '0');
            const clave_fecha = `${año_actual}-${mes_str}-${dia_str}`;

            const registro_dia = historial[clave_fecha];
            let estado = registro_dia ? registro_dia.estado : 'Sin Registro';

            let icono_estado = '';
            if (estado === 'Asistió') {
                celda_dia.classList.add('estado-asistio');
                icono_estado = '<span class="icono-estado">✔️</span>';
            } else if (estado === 'No asistió') {
                celda_dia.classList.add('estado-falta');
                icono_estado = '<span class="icono-estado">❌</span>';
            } else if (estado === 'Justificado') {
                celda_dia.classList.add('estado-justificado');
                icono_estado = '<span class="icono-estado">≡</span>';
            }

            celda_dia.innerHTML = `
                <span class="numero-dia">${dia}</span>
                ${icono_estado}
            `;

            // Botón para justificar faltas registradas
            if (estado === 'No asistió') {
                const btn_justificar = document.createElement('button');
                btn_justificar.type = 'button';
                btn_justificar.classList.add('btn-solicitar-justificacion');
                btn_justificar.innerText = 'Justificar';
                btn_justificar.onclick = function (e) {
                    e.stopPropagation();
                    abrirModalJustificacion(clave_fecha, false);
                };
                celda_dia.appendChild(btn_justificar);
            }

            contenedor_grid.appendChild(celda_dia);
        }

        actualizarContadorBuzonDocente();
    }

    // Modal para solicitar justificación o permiso
    window.abrirModalJustificacion = function (fecha_formateada, esAnticipado) {
        es_permiso_anticipado = esAnticipado;
        document.getElementById('contenedor-campo-fecha-futura').style.display = esAnticipado ? 'block' : 'none';

        if (esAnticipado) {
            document.getElementById('titulo-modal-solicitud').innerText = 'Solicitar Permiso Anticipado';
            document.getElementById('fecha-solicitud-seleccionada').innerText = 'Fecha: Por seleccionar';
            
            // Establecer fecha mínima desde hoy
            const hoy_str = `${fecha_actual.getFullYear()}-${String(fecha_actual.getMonth() + 1).padStart(2, '0')}-${String(fecha_actual.getDate()).padStart(2, '0')}`;
            const campo_fecha_futura = document.getElementById('fecha-permiso-futuro');
            campo_fecha_futura.value = hoy_str;
            campo_fecha_futura.min = hoy_str;
        } else {
            fecha_seleccionada_para_solicitud = fecha_formateada;
            document.getElementById('titulo-modal-solicitud').innerText = 'Enviar Justificación de Falta';
            const partes = fecha_formateada.split('-');
            document.getElementById('fecha-solicitud-seleccionada').innerText = `Fecha: ${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        document.getElementById('modal-solicitud-justificacion').style.display = 'flex';
    };

    window.abrirModalPermisoAnticipado = function () {
        abrirModalJustificacion(null, true);
    };

    window.cerrarModalJustificacion = function () {
        document.getElementById('modal-solicitud-justificacion').style.display = 'none';
        document.getElementById('form-enviar-justificacion').reset();
    };

    // Procesar formulario de solicitud/justificación
    const form_justificacion = document.getElementById('form-enviar-justificacion');
    if (form_justificacion) {
        form_justificacion.addEventListener('submit', function (e) {
            e.preventDefault();
            const motivo = document.getElementById('motivo-ausencia').value.trim();

            let fecha_final_solicitud = fecha_seleccionada_para_solicitud;
            if (es_permiso_anticipado) {
                fecha_final_solicitud = document.getElementById('fecha-permiso-futuro').value;
            }

            if (!fecha_final_solicitud || !motivo) {
                alert('Por favor complete todos los campos requeridos.');
                return;
            }

            solicitudes_de_justificacion = JSON.parse(localStorage.getItem('solicitudesJustificacion')) || [];
            
            const nueva_solicitud = {
                idSol: 'sol_' + Date.now(),
                idDocente: docente_logueado.id,
                nombreDocente: docente_logueado.nombre,
                fechaFalta: fecha_final_solicitud,
                motivo: (es_permiso_anticipado ? '[PERMISO PREVIO] ' : '') + motivo,
                estadoSol: 'Pendiente'
            };

            solicitudes_de_justificacion.push(nueva_solicitud);
            localStorage.setItem('solicitudesJustificacion', JSON.stringify(solicitudes_de_justificacion));

            alert('¡Solicitud registrada correctamente! Fue enviada a Secretaría para su revisión.');
            cerrarModalJustificacion();
            renderizarCalendario();
        });
    }

    // BUZÓN DE SOLICITUDES ENVIADAS Y ESTADOS DE RESPUESTA
    window.abrirBuzonDocente = function () {
        document.getElementById('modal-buzon-docente').style.display = 'flex';
        redibujarTablaBuzonDocente();
    };

    window.cerrarBuzonDocente = function () {
        document.getElementById('modal-buzon-docente').style.display = 'none';
    };

    function redibujarTablaBuzonDocente() {
        const tabla_cuerpo = document.getElementById('tabla-mis-solicitudes');
        if (!tabla_cuerpo) return;
        tabla_cuerpo.innerHTML = '';

        solicitudes_de_justificacion = JSON.parse(localStorage.getItem('solicitudesJustificacion')) || [];
        const mis_peticiones = solicitudes_de_justificacion.filter(s => s.idDocente === docente_logueado.id);

        if (mis_peticiones.length === 0) {
            tabla_cuerpo.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#6b7280;">No has enviado solicitudes aún.</td></tr>`;
            return;
        }

        mis_peticiones.reverse().forEach(solicitud => {
            const fila = document.createElement('tr');
            const partes_fecha = solicitud.fechaFalta.split('-');
            const fecha_visual = `${partes_fecha[2]}/${partes_fecha[1]}/${partes_fecha[0]}`;

            let clase_badge = 'badge-pendiente';
            if (solicitud.estadoSol === 'Aceptada') clase_badge = 'badge-aceptada';
            if (solicitud.estadoSol === 'Denegada') clase_badge = 'badge-denegada';

            fila.innerHTML = `
                <td>📅 <strong>${fecha_visual}</strong></td>
                <td><p class="texto-motivo" title="${solicitud.motivo}">${solicitud.motivo}</p></td>
                <td><span class="badge-estado-sol ${clase_badge}">${solicitud.estadoSol}</span></td>
            `;
            tabla_cuerpo.appendChild(fila);
        });
    }

    function actualizarContadorBuzonDocente() {
        solicitudes_de_justificacion = JSON.parse(localStorage.getItem('solicitudesJustificacion')) || [];
        const mis_peticiones = solicitudes_de_justificacion.filter(s => s.idDocente === docente_logueado.id);
        const contador = document.getElementById('contador-solicitudes-docente');
        if (contador) {
            contador.innerText = mis_peticiones.length;
        }
    }

    // Funciones de Seguridad y Cierre de Sesión
    window.cambiarMes = function (dir) {
        mes_actual += dir;
        if (mes_actual < 0) { mes_actual = 11; año_actual--; }
        else if (mes_actual > 11) { mes_actual = 0; año_actual++; }
        renderizarCalendario();
    };

    window.cerrarSesion = function () {
        if (confirm('¿Está seguro de que desea salir del sistema?')) {
            localStorage.removeItem('docenteLogueado');
            window.location.replace('../login.html');
        }
    };

    window.abrirModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'flex';
    };

    window.cerrarModalPassword = function () {
        document.getElementById('modal-cambiar-contrasena').style.display = 'none';
        const form = document.getElementById('form-cambiar-contrasena');
        if (form) form.reset();
    };

    const form_clave = document.getElementById('form-cambiar-contrasena');
    if (form_clave) {
        form_clave.addEventListener('submit', function (e) {
            e.preventDefault();
            const clave_actual = document.getElementById('contrasena-actual').value;
            const clave_nueva = document.getElementById('contrasena-nueva').value.trim();

            if (clave_nueva.length < 8) {
                alert('La nueva contraseña debe tener un mínimo de 8 caracteres.');
                return;
            }

            const clave_registrada = docente_logueado.passwordPersonalizada || docente_logueado.ci;
            if (clave_actual !== clave_registrada) {
                alert('La contraseña actual es incorrecta.');
                return;
            }

            base_datos_usuarios = JSON.parse(localStorage.getItem('adminUsuarios')) || [];
            const idx = base_datos_usuarios.findIndex(u => u.id === docente_logueado.id);
            if (idx !== -1) {
                base_datos_usuarios[idx].passwordPersonalizada = clave_nueva;
                localStorage.setItem('adminUsuarios', JSON.stringify(base_datos_usuarios));

                docente_logueado.passwordPersonalizada = clave_nueva;
                localStorage.setItem('docenteLogueado', JSON.stringify(docente_logueado));

                alert('¡Contraseña actualizada con éxito!');
                cerrarModalPassword();
            }
        });
    }

    renderizarCalendario();
});