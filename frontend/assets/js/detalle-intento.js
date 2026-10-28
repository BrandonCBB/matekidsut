const API_DETALLE_INTENTO =
    "http://localhost:3000/api/alumno/historial";

const estadoCarga =
    document.getElementById("estadoCarga");

const estadoError =
    document.getElementById("estadoError");

const mensajeError =
    document.getElementById("mensajeError");

const contenidoDetalle =
    document.getElementById("contenidoDetalle");

const btnReintentar =
    document.getElementById("btnReintentar");

const listaRespuestas =
    document.getElementById("listaRespuestas");

let idIntentoActual = null;

document.addEventListener(
    "DOMContentLoaded",
    iniciarPagina
);

btnReintentar?.addEventListener(
    "click",
    cargarDetalleIntento
);

async function iniciarPagina() {
    try {
        await protegerPagina([3]);

        idIntentoActual =
            obtenerIdIntentoURL();

        if (!idIntentoActual) {
            mostrarError(
                "No se recibió un intento válido."
            );

            return;
        }

        await cargarDetalleIntento();
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

function obtenerIdIntentoURL() {
    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        Number(parametros.get("id"));

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

async function cargarDetalleIntento() {
    mostrarCarga();

    try {
        const respuesta = await fetch(
            `${API_DETALLE_INTENTO}/${idIntentoActual}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const resultado =
            await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo obtener el detalle."
            );
        }

        const intento =
            resultado.intento;

        const respuestas =
            Array.isArray(resultado.respuestas)
                ? resultado.respuestas
                : [];

        if (!intento) {
            throw new Error(
                "No se encontró la información del intento."
            );
        }

        mostrarInformacionIntento(
            intento
        );

        renderizarRespuestas(
            respuestas
        );

        mostrarContenido();
    } catch (error) {
        console.error(
            "Error al cargar el detalle:",
            error
        );

        mostrarError(
            error.message
        );
    }
}

function mostrarInformacionIntento(
    intento
) {
    colocarTexto(
        "categoriaIntento",
        intento.categoria ||
        "Sin categoría"
    );

    colocarTexto(
        "tituloIntento",
        intento.titulo ||
        "Ejercicio"
    );

    colocarTexto(
        "descripcionIntento",
        intento.descripcion ||
        "Ejercicio realizado"
    );

    colocarTexto(
        "docenteIntento",
        intento.docente ||
        "No disponible"
    );

    colocarTexto(
        "fechaIntento",
        formatearFecha(
            intento.fecha_intento
        )
    );

    colocarTexto(
        "horaIntento",
        formatearHora(
            intento.fecha_intento
        )
    );

    colocarTexto(
        "calificacionIntento",
        Number(
            intento.calificacion || 0
        ).toFixed(1)
    );

    colocarTexto(
        "aciertosIntento",
        Number(
            intento.aciertos || 0
        )
    );

    colocarTexto(
        "erroresIntento",
        Number(
            intento.errores || 0
        )
    );

    colocarTexto(
        "totalPreguntasIntento",
        Number(
            intento.total_preguntas || 0
        )
    );

    colocarTexto(
        "porcentajeIntento",
        `${Number(
            intento.porcentaje || 0
        ).toFixed(0)}%`
    );
}

function renderizarRespuestas(
    respuestas
) {
    listaRespuestas.innerHTML = "";

    if (respuestas.length === 0) {
        listaRespuestas.innerHTML = `
            <article class="attempt-status">
                <i class="fa-regular fa-circle-question"></i>

                <h2>
                    No hay respuestas guardadas
                </h2>

                <p>
                    Este intento no tiene respuestas
                    disponibles para mostrar.
                </p>
            </article>
        `;

        return;
    }

    respuestas.forEach(
        (respuesta, indice) => {
            const tarjeta =
                crearTarjetaRespuesta(
                    respuesta,
                    indice
                );

            listaRespuestas.appendChild(
                tarjeta
            );
        }
    );
}

function crearTarjetaRespuesta(
    respuesta,
    indice
) {
    const articulo =
        document.createElement("article");

    const esCorrecta =
        Number(respuesta.es_correcta) === 1 ||
        respuesta.es_correcta === true;

    articulo.className =
        `answer-card ${
            esCorrecta
                ? "correct"
                : "incorrect"
        }`;

    articulo.innerHTML = `
        <div class="answer-card__header">

            <div class="answer-card__number">
                <span>
                    ${indice + 1}
                </span>

                Pregunta ${indice + 1}
            </div>

            <div class="answer-status">

                <i class="fa-solid ${
                    esCorrecta
                        ? "fa-check"
                        : "fa-xmark"
                }"></i>

                ${
                    esCorrecta
                        ? "Correcta"
                        : "Incorrecta"
                }

            </div>

        </div>

        <div class="answer-question">
            ${escaparHTML(
                respuesta.pregunta ||
                "Pregunta no disponible"
            )}
        </div>

        <div class="answer-comparison">

            <div class="answer-box student-answer">

                <small>
                    <i class="fa-solid ${
                        esCorrecta
                            ? "fa-check"
                            : "fa-xmark"
                    }"></i>

                    Tu respuesta
                </small>

                <strong>
                    ${escaparHTML(
                        respuesta.respuesta_alumno ??
                        "Sin respuesta"
                    )}
                </strong>

            </div>

            <div class="answer-box correct-answer">

                <small>
                    <i class="fa-solid fa-lightbulb"></i>

                    Respuesta correcta
                </small>

                <strong>
                    ${escaparHTML(
                        respuesta.respuesta_correcta ??
                        "No disponible"
                    )}
                </strong>

            </div>

        </div>
    `;

    return articulo;
}

function mostrarCarga() {
    estadoCarga.classList.remove(
        "hidden"
    );

    estadoError.classList.add(
        "hidden"
    );

    contenidoDetalle.classList.add(
        "hidden"
    );
}

function mostrarContenido() {
    estadoCarga.classList.add(
        "hidden"
    );

    estadoError.classList.add(
        "hidden"
    );

    contenidoDetalle.classList.remove(
        "hidden"
    );
}

function mostrarError(mensaje) {
    estadoCarga.classList.add(
        "hidden"
    );

    contenidoDetalle.classList.add(
        "hidden"
    );

    estadoError.classList.remove(
        "hidden"
    );

    mensajeError.textContent =
        mensaje ||
        "Ocurrió un problema inesperado.";
}

function colocarTexto(
    idElemento,
    texto
) {
    const elemento =
        document.getElementById(
            idElemento
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;
}

function formatearFecha(fecha) {
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

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {
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

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}