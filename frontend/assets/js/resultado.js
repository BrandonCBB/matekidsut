const estadoError = document.getElementById("estadoError");
const contenidoResultado = document.getElementById("contenidoResultado");

const iconoResultado = document.getElementById("iconoResultado");
const categoriaResultado = document.getElementById("categoriaResultado");
const tituloResultado = document.getElementById("tituloResultado");
const mensajeResultado = document.getElementById("mensajeResultado");

const calificacionResultado = document.getElementById("calificacionResultado");
const porcentajeResultado = document.getElementById("porcentajeResultado");
const aciertosResultado = document.getElementById("aciertosResultado");
const erroresResultado = document.getElementById("erroresResultado");
const totalResultado = document.getElementById("totalResultado");

const listaResultados = document.getElementById("listaResultados");

document.addEventListener("DOMContentLoaded", iniciarPagina);

async function iniciarPagina() {
    try {
        await protegerPagina([3]);

        const datosGuardados = sessionStorage.getItem("resultadoEjercicio");

        if (!datosGuardados) {
            mostrarError();
            return;
        }

        const datos = JSON.parse(datosGuardados);

        if (
            !datos.ejercicio ||
            !datos.resultado ||
            !Array.isArray(datos.respuestas)
        ) {
            mostrarError();
            return;
        }

        mostrarResultado(datos);
    } catch (error) {
        console.error("Error al cargar el resultado:", error);
        mostrarError();
    }
}

function mostrarResultado(datos) {
    const { ejercicio, resultado, respuestas } = datos;

    categoriaResultado.textContent =
        ejercicio.categoria || "Tema";

    tituloResultado.textContent =
        ejercicio.titulo || "Resultado del ejercicio";

    calificacionResultado.textContent =
        Number(resultado.calificacion || 0).toFixed(1);

    porcentajeResultado.textContent =
        `${Number(resultado.porcentaje || 0).toFixed(1)}%`;

    aciertosResultado.textContent =
        resultado.aciertos || 0;

    erroresResultado.textContent =
        resultado.errores || 0;

    totalResultado.textContent =
        resultado.total_preguntas || respuestas.length;

    mensajeResultado.textContent =
        obtenerMensajeResultado(resultado.porcentaje);

    actualizarIconoResultado(resultado.porcentaje);
    marcarTemaActivo(ejercicio.categoria);
    renderizarRespuestas(respuestas);

    document.title =
        `MateKids UT | Resultado de ${ejercicio.titulo}`;

    estadoError.classList.add("hidden");
    contenidoResultado.classList.remove("hidden");
}

function renderizarRespuestas(respuestas) {
    listaResultados.innerHTML = "";

    respuestas.forEach((respuesta, indice) => {
        const tarjeta = crearTarjetaResultado(
            respuesta,
            indice
        );

        listaResultados.appendChild(tarjeta);
    });
}

function crearTarjetaResultado(respuesta, indice) {
    const articulo = document.createElement("article");

    const esCorrecta =
        Boolean(respuesta.es_correcta);

    articulo.className =
        `answer-result-card ${esCorrecta ? "correct" : "incorrect"}`;

    articulo.innerHTML = `
        <div class="answer-result-header">
            <span class="answer-result-number">
                Pregunta ${indice + 1}
            </span>

            <span class="answer-result-state">
                <i class="fa-solid ${esCorrecta ? "fa-check" : "fa-xmark"}"></i>
                ${esCorrecta ? "Correcta" : "Incorrecta"}
            </span>
        </div>

        <h3>
            ${escaparHTML(respuesta.pregunta)}
        </h3>

        <div class="answer-comparison">

            <div>
                <span>Tu respuesta</span>

                <p>
                    ${escaparHTML(respuesta.respuesta_alumno)}
                </p>
            </div>

            ${
                esCorrecta
                    ? ""
                    : `
                        <div>
                            <span>Respuesta correcta</span>

                            <p>
                                ${escaparHTML(respuesta.respuesta_correcta)}
                            </p>
                        </div>
                    `
            }

        </div>
    `;

    return articulo;
}

function actualizarIconoResultado(porcentaje) {
    const valor = Number(porcentaje || 0);

    if (valor >= 80) {
        iconoResultado.className =
            "fa-solid fa-trophy";
        return;
    }

    if (valor >= 60) {
        iconoResultado.className =
            "fa-solid fa-star";
        return;
    }

    iconoResultado.className =
        "fa-solid fa-book-open";
}

function obtenerMensajeResultado(porcentaje) {
    const valor = Number(porcentaje || 0);

    if (valor === 100) {
        return "¡Excelente! Respondiste correctamente todas las preguntas.";
    }

    if (valor >= 80) {
        return "¡Muy buen trabajo! Obtuviste un excelente resultado.";
    }

    if (valor >= 60) {
        return "Buen trabajo. Sigue practicando para mejorar todavía más.";
    }

    return "Sigue practicando. Cada ejercicio te ayuda a aprender y mejorar.";
}

function marcarTemaActivo(tema) {
    if (!tema) {
        return;
    }

    const enlaces = document.querySelectorAll(
        "[data-nav-tema]"
    );

    enlaces.forEach((enlace) => {
        enlace.classList.remove("active");

        if (
            normalizarTexto(enlace.dataset.navTema) ===
            normalizarTexto(tema)
        ) {
            enlace.classList.add("active");
        }
    });
}

function mostrarError() {
    contenidoResultado.classList.add("hidden");
    estadoError.classList.remove("hidden");
}

function normalizarTexto(texto) {
    return String(texto || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}