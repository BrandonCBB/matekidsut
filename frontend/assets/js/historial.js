const API_HISTORIAL =
    "http://localhost:3000/api/alumno/historial";

const estadoCarga =
    document.getElementById("estadoCarga");

const estadoVacio =
    document.getElementById("estadoVacio");

const estadoError =
    document.getElementById("estadoError");

const mensajeError =
    document.getElementById("mensajeError");

const contenidoHistorial =
    document.getElementById("contenidoHistorial");

const resumenHistorial =
    document.getElementById("resumenHistorial");

const listaHistorial =
    document.getElementById("listaHistorial");

const totalIntentos =
    document.getElementById("totalIntentos");

const promedioGeneral =
    document.getElementById("promedioGeneral");

const mejorCalificacion =
    document.getElementById("mejorCalificacion");

const btnReintentar =
    document.getElementById("btnReintentar");

document.addEventListener(
    "DOMContentLoaded",
    iniciarPagina
);

btnReintentar.addEventListener(
    "click",
    cargarHistorial
);

document.addEventListener(
    "click",
    manejarBotonesHistorial
);

async function iniciarPagina() {
    try {
        await protegerPagina([3]);
        await cargarHistorial();
    } catch (error) {
        console.error(
            "Error al iniciar la página:",
            error
        );

        mostrarError(
            "No se pudo iniciar la página."
        );
    }
}

async function cargarHistorial() {
    mostrarCarga();

    try {
        const respuesta = await fetch(
            API_HISTORIAL,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo obtener el historial."
            );
        }

        const historial =
            Array.isArray(resultado.historial)
                ? resultado.historial
                : [];

        if (historial.length === 0) {
            mostrarVacio();
            return;
        }

        mostrarResumen(historial);
        renderizarHistorial(historial);
        mostrarContenido();
    } catch (error) {
        console.error(
            "Error al cargar el historial:",
            error
        );

        mostrarError(error.message);
    }
}

function mostrarResumen(historial) {
    const calificaciones = historial.map(
        (intento) =>
            Number(intento.calificacion || 0)
    );

    const sumaCalificaciones =
        calificaciones.reduce(
            (acumulador, calificacion) =>
                acumulador + calificacion,
            0
        );

    const promedio =
        sumaCalificaciones /
        calificaciones.length;

    const mejor =
        Math.max(...calificaciones);

    totalIntentos.textContent =
        historial.length;

    promedioGeneral.textContent =
        promedio.toFixed(1);

    mejorCalificacion.textContent =
        mejor.toFixed(1);
}

function renderizarHistorial(historial) {
    listaHistorial.innerHTML = "";

    historial.forEach((intento) => {
        const tarjeta =
            crearTarjetaHistorial(intento);

        listaHistorial.appendChild(tarjeta);
    });
}

function crearTarjetaHistorial(intento) {
    const articulo =
        document.createElement("article");

    const porcentaje =
        Number(intento.porcentaje || 0);

    const calificacion =
        Number(intento.calificacion || 0);

    articulo.className =
        `history-card ${obtenerClaseResultado(porcentaje)}`;

    articulo.innerHTML = `
        <div class="history-card__header">

            <div class="history-card__title">

                <span class="history-category">
                    ${escaparHTML(intento.categoria)}
                </span>

                <h3>
                    ${escaparHTML(intento.titulo)}
                </h3>

                <p>
                    ${escaparHTML(
                        intento.descripcion ||
                        "Ejercicio realizado"
                    )}
                </p>

            </div>

            <div class="history-grade">
                <span>
                    ${calificacion.toFixed(1)}
                </span>

                <small>/ 10</small>
            </div>

        </div>

        <div class="history-card__meta">

            <span>
                <i class="fa-solid fa-chalkboard-user"></i>
                ${escaparHTML(intento.docente)}
            </span>

            <span>
                <i class="fa-regular fa-calendar"></i>
                ${formatearFecha(intento.fecha_intento)}
            </span>

            <span>
                <i class="fa-regular fa-clock"></i>
                ${formatearHora(intento.fecha_intento)}
            </span>

        </div>

        <div class="history-card__results">

            <div class="history-result success">
                <i class="fa-solid fa-check"></i>

                <div>
                    <span>
                        ${Number(intento.aciertos || 0)}
                    </span>

                    <p>Aciertos</p>
                </div>
            </div>

            <div class="history-result error">
                <i class="fa-solid fa-xmark"></i>

                <div>
                    <span>
                        ${Number(intento.errores || 0)}
                    </span>

                    <p>Errores</p>
                </div>
            </div>

            <div class="history-result total">
                <i class="fa-regular fa-circle-question"></i>

                <div>
                    <span>
                        ${Number(
                            intento.total_preguntas || 0
                        )}
                    </span>

                    <p>Preguntas</p>
                </div>
            </div>

            <div class="history-result percentage">
                <i class="fa-solid fa-chart-simple"></i>

                <div>
                    <span>
                        ${porcentaje.toFixed(0)}%
                    </span>

                    <p>Porcentaje</p>
                </div>
            </div>
                    
        </div>

        <div class="history-card__actions">

            <button
                type="button"
                class="history-detail-btn"
                data-id="${intento.id_intento}"
            >
                <i class="fa-solid fa-eye"></i>
                Ver detalle
            </button>

        </div>
    `;

    return articulo;
}

function obtenerClaseResultado(porcentaje) {
    const valor = Number(porcentaje || 0);

    if (valor >= 80) {
        return "excellent";
    }

    if (valor >= 60) {
        return "regular";
    }

    return "needs-practice";
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Fecha no disponible";
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
        return "Fecha no disponible";
    }

    return fechaObjeto.toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );
}

function formatearHora(fecha) {
    if (!fecha) {
        return "Hora no disponible";
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
        return "Hora no disponible";
    }

    return fechaObjeto.toLocaleTimeString(
        "es-MX",
        {
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

function manejarBotonesHistorial(evento) {
    const boton =
        evento.target.closest(
            ".history-detail-btn"
        );

    if (!boton) {
        return;
    }

    const idIntento =
        boton.dataset.id;

    window.location.href =
        `detalle-intento.html?id=${idIntento}`;
}

function mostrarCarga() {
    estadoCarga.classList.remove("hidden");
    estadoVacio.classList.add("hidden");
    estadoError.classList.add("hidden");
    contenidoHistorial.classList.add("hidden");
    resumenHistorial.classList.add("hidden");
}

function mostrarVacio() {
    estadoCarga.classList.add("hidden");
    estadoError.classList.add("hidden");
    contenidoHistorial.classList.add("hidden");
    resumenHistorial.classList.add("hidden");
    estadoVacio.classList.remove("hidden");
}

function mostrarContenido() {
    estadoCarga.classList.add("hidden");
    estadoVacio.classList.add("hidden");
    estadoError.classList.add("hidden");
    contenidoHistorial.classList.remove("hidden");
    resumenHistorial.classList.remove("hidden");
}

function mostrarError(mensaje) {
    estadoCarga.classList.add("hidden");
    estadoVacio.classList.add("hidden");
    contenidoHistorial.classList.add("hidden");
    resumenHistorial.classList.add("hidden");
    estadoError.classList.remove("hidden");

    mensajeError.textContent =
        mensaje ||
        "Ocurrió un problema inesperado.";
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}