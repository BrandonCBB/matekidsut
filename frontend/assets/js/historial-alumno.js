const API_HISTORIAL_ALUMNO =
    "http://localhost:3000/api/ejercicios/alumnos";

const nombreAlumno =
    document.getElementById("nombreAlumno");

const correoAlumno =
    document.getElementById("correoAlumno");

const promedioAlumno =
    document.getElementById("promedioAlumno");

const totalIntentos =
    document.getElementById("totalIntentos");

const ejerciciosRealizados =
    document.getElementById("ejerciciosRealizados");

const mejorCalificacion =
    document.getElementById("mejorCalificacion");

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const historyContent =
    document.getElementById("historyContent");

const historialLista =
    document.getElementById("historialLista");

const emptyState =
    document.getElementById("emptyState");

const emptyMessage =
    document.getElementById("emptyMessage");

const buscarIntento =
    document.getElementById("buscarIntento");

let historialCompleto = [];

document.addEventListener(
    "DOMContentLoaded",
    iniciarHistorialAlumno
);

async function iniciarHistorialAlumno() {
    const idAlumno =
        obtenerIdAlumnoURL();

    if (!idAlumno) {
        mostrarError(
            "No se recibió un alumno válido."
        );

        return;
    }

    await cargarHistorialAlumno(
        idAlumno
    );
}

function obtenerIdAlumnoURL() {
    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const idAlumno =
        Number(
            parametros.get("id")
        );

    if (
        !Number.isInteger(idAlumno) ||
        idAlumno <= 0
    ) {
        return null;
    }

    return idAlumno;
}

async function cargarHistorialAlumno(
    idAlumno
) {
    mostrarCarga();

    try {
        const respuesta = await fetch(
            `${API_HISTORIAL_ALUMNO}/${idAlumno}/historial`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                "No se pudo obtener el historial."
            );
        }

        mostrarDatosAlumno(
            datos.alumno,
            datos.estadisticas
        );

        historialCompleto =
            Array.isArray(datos.historial)
                ? datos.historial
                : [];

        renderizarHistorial(
            historialCompleto
        );

        mostrarContenido();
    } catch (error) {
        console.error(
            "Error al cargar el historial:",
            error
        );

        mostrarError(
            error.message
        );
    }
}

function mostrarDatosAlumno(
    alumno,
    estadisticas
) {
    nombreAlumno.textContent =
        alumno.nombre_completo ||
        "Alumno";

    correoAlumno.textContent =
        alumno.correo ||
        "Sin correo registrado";

    promedioAlumno.textContent =
        formatearCalificacion(
            estadisticas.promedio
        );

    totalIntentos.textContent =
        estadisticas.total_intentos ?? 0;

    ejerciciosRealizados.textContent =
        estadisticas.ejercicios_realizados ?? 0;

    mejorCalificacion.textContent =
        formatearCalificacion(
            estadisticas.mejor_calificacion
        );
}

function renderizarHistorial(lista) {
    historialLista.innerHTML = "";

    if (lista.length === 0) {
        mostrarEstadoVacio(
            "Este alumno todavía no ha realizado ejercicios del docente."
        );

        return;
    }

    ocultarEstadoVacio();

    const fragmento =
        document.createDocumentFragment();

    lista.forEach((intento) => {
        const tarjeta =
            crearTarjetaIntento(
                intento
            );

        fragmento.appendChild(
            tarjeta
        );
    });

    historialLista.appendChild(
        fragmento
    );
}

function crearTarjetaIntento(
    intento
) {
    const articulo =
        document.createElement(
            "article"
        );

    articulo.className =
        "attempt-card";

    const categoria =
        intento.categoria ||
        "Sin categoría";

    const ejercicio =
        intento.ejercicio ||
        "Ejercicio";

    const aciertos =
        Number(
            intento.aciertos || 0
        );

    const errores =
        Number(
            intento.errores || 0
        );

    const totalPreguntas =
        Number(
            intento.total_preguntas || 0
        );

    const fecha =
        formatearFecha(
            intento.fecha_intento
        );

    const calificacion =
        formatearCalificacion(
            intento.calificacion
        );

    articulo.innerHTML = `
        <div class="attempt-card__main">

            <span class="attempt-card__category">
                ${escaparHTML(categoria)}
            </span>

            <h3 class="attempt-card__title">
                ${escaparHTML(ejercicio)}
            </h3>

            <span class="attempt-card__date">
                <i class="fa-regular fa-calendar"></i>
                ${escaparHTML(fecha)}
            </span>

        </div>

        <div class="attempt-card__data">

            <span>Aciertos</span>

            <strong>
                ${aciertos}
            </strong>

        </div>

        <div class="attempt-card__data">

            <span>Errores</span>

            <strong>
                ${errores}
            </strong>

        </div>

        <div
            class="
                attempt-card__data
                attempt-card__answers
            "
        >

            <span>Preguntas</span>

            <strong>
                ${totalPreguntas}
            </strong>

        </div>

        <div
            class="
                attempt-card__data
                attempt-card__grade
            "
        >

            <span>Calificación</span>

            <strong>
                ${calificacion}
            </strong>

        </div>

        <button
            type="button"
            class="attempt-detail-btn"
            data-id="${Number(intento.id_intento)}"
        >
            <i class="fa-solid fa-eye"></i>
            Ver detalle
        </button>
    `;

    return articulo;
}

buscarIntento.addEventListener(
    "input",
    filtrarHistorial
);

function filtrarHistorial() {
    const texto =
        normalizarTexto(
            buscarIntento.value
        );

    if (!texto) {
        renderizarHistorial(
            historialCompleto
        );

        return;
    }

    const historialFiltrado =
        historialCompleto.filter(
            (intento) => {
                const ejercicio =
                    normalizarTexto(
                        intento.ejercicio
                    );

                const categoria =
                    normalizarTexto(
                        intento.categoria
                    );

                return (
                    ejercicio.includes(texto) ||
                    categoria.includes(texto)
                );
            }
        );

    renderizarHistorial(
        historialFiltrado
    );

    if (
        historialFiltrado.length === 0
    ) {
        mostrarEstadoVacio(
            "No se encontraron intentos con esa búsqueda."
        );
    }
}

document.addEventListener(
    "click",
    manejarDetalleIntento
);

function manejarDetalleIntento(
    evento
) {
    const boton =
        evento.target.closest(
            ".attempt-detail-btn"
        );

    if (!boton) {
        return;
    }

    const idIntento =
        Number(
            boton.dataset.id
        );

    if (
        !Number.isInteger(idIntento) ||
        idIntento <= 0
    ) {
        return;
    }

    /*
     * Más adelante crearemos el detalle
     * específico para docentes.
     */
    window.location.href =
        `detalle-intento-docente.html?id=${idIntento}`;
}

function mostrarCarga() {
    loadingState.hidden = false;
    errorState.hidden = true;
    historyContent.hidden = true;
}

function mostrarContenido() {
    loadingState.hidden = true;
    errorState.hidden = true;
    historyContent.hidden = false;
}

function mostrarError(mensaje) {
    loadingState.hidden = true;
    historyContent.hidden = true;
    errorState.hidden = false;

    errorMessage.textContent =
        mensaje ||
        "No se pudo cargar el historial.";
}

function mostrarEstadoVacio(
    mensaje
) {
    historialLista.innerHTML = "";

    emptyMessage.textContent =
        mensaje;

    emptyState.hidden = false;
}

function ocultarEstadoVacio() {
    emptyState.hidden = true;
}

function formatearCalificacion(
    valor
) {
    const numero =
        Number(valor);

    if (!Number.isFinite(numero)) {
        return "0";
    }

    return numero.toFixed(1);
}

function formatearFecha(
    fecha
) {
    if (!fecha) {
        return "Fecha no disponible";
    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
        return "Fecha no disponible";
    }

    return fechaObjeto.toLocaleString(
        "es-MX",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function normalizarTexto(
    texto
) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .trim();
}

function escaparHTML(
    texto
) {
    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}