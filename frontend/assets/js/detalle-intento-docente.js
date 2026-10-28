const EXERCISES_API_URL =
    "http://localhost:3000/api/ejercicios";

/* ========================================
   ELEMENTOS
======================================== */

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const detailContent =
    document.getElementById("detailContent");

const studentName =
    document.getElementById("studentName");

const exerciseTitle =
    document.getElementById("exerciseTitle");

const gradeValue =
    document.getElementById("gradeValue");

const attemptDate =
    document.getElementById("attemptDate");

const percentageValue =
    document.getElementById("percentageValue");

const correctAnswers =
    document.getElementById("correctAnswers");

const wrongAnswers =
    document.getElementById("wrongAnswers");

const exerciseName =
    document.getElementById("exerciseName");

const exerciseDescription =
    document.getElementById("exerciseDescription");

const questionTotal =
    document.getElementById("questionTotal");

const answersList =
    document.getElementById("answersList");

const backButton =
    document.getElementById("backButton");

/* ========================================
   OBTENER ID DEL INTENTO
======================================== */

function obtenerIdIntento() {
    const parametros =
        new URLSearchParams(window.location.search);

    return Number(parametros.get("id"));
}

/* ========================================
   FORMATEAR FECHA
======================================== */

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    return new Date(fecha).toLocaleString(
        "es-MX",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* ========================================
   ESCAPAR TEXTO
======================================== */

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ========================================
   MOSTRAR ERROR
======================================== */

function mostrarError(mensaje) {
    loadingState.hidden = true;
    detailContent.hidden = true;

    errorMessage.textContent = mensaje;
    errorState.hidden = false;
}

/* ========================================
   MOSTRAR DATOS GENERALES
======================================== */

function mostrarDetalle(detalle, totalPreguntas) {
    studentName.textContent =
        detalle.alumno || "Alumno";

    exerciseTitle.textContent =
        detalle.titulo || "Ejercicio";

    gradeValue.textContent =
        Number(detalle.calificacion || 0).toFixed(1);

    attemptDate.textContent =
        formatearFecha(detalle.fecha_intento);

    percentageValue.textContent =
        `${Number(detalle.porcentaje || 0).toFixed(0)}%`;

    correctAnswers.textContent =
        detalle.aciertos ?? 0;

    wrongAnswers.textContent =
        detalle.errores ?? 0;

    exerciseName.textContent =
        detalle.titulo || "Ejercicio";

    exerciseDescription.textContent =
        detalle.descripcion || "Sin descripción.";

    questionTotal.textContent =
        `${totalPreguntas} ${
            totalPreguntas === 1
                ? "pregunta"
                : "preguntas"
        }`;

    backButton.href =
        `historial-alumno.html?id=${detalle.id_usuario}`;
}

/* ========================================
   MOSTRAR PREGUNTAS
======================================== */

function mostrarPreguntas(preguntas) {
    answersList.innerHTML = "";

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
        answersList.innerHTML = `
            <div class="error-state">
                <i class="fa-solid fa-circle-info"></i>

                <h2>
                    Sin respuestas
                </h2>

                <p>
                    Este intento no tiene respuestas registradas.
                </p>
            </div>
        `;

        return;
    }

    preguntas.forEach((item, indice) => {
        const esCorrecta =
            Number(item.es_correcta) === 1;

        const tarjeta =
            document.createElement("article");

        tarjeta.className =
            `answer-card ${
                esCorrecta ? "" : "incorrect"
            }`;

        tarjeta.innerHTML = `
            <div class="answer-header">

                <div>

                    <p class="question-number">
                        Pregunta ${indice + 1}
                    </p>

                    <h3>
                        ${escaparHTML(item.pregunta)}
                    </h3>

                </div>

                <span class="answer-status">

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

                </span>

            </div>

            <div class="answer-data">

                <div class="answer-box">

                    <span>
                        Respuesta del alumno
                    </span>

                    <strong>
                        ${escaparHTML(
                            item.respuesta_alumno
                        )}
                    </strong>

                </div>

                <div class="answer-box">

                    <span>
                        Respuesta correcta
                    </span>

                    <strong>
                        ${escaparHTML(
                            item.respuesta_correcta
                        )}
                    </strong>

                </div>

            </div>
        `;

        answersList.appendChild(tarjeta);
    });
}

/* ========================================
   CARGAR DETALLE
======================================== */

async function cargarDetalleIntento() {
    const usuario =
        await protegerPagina([2]);

    if (!usuario) {
        return;
    }

    document.body.classList.add("auth-ready");

    const idIntento = obtenerIdIntento();

    if (!Number.isInteger(idIntento) || idIntento <= 0) {
        mostrarError(
            "El identificador del intento no es válido."
        );

        return;
    }

    try {
        const respuesta = await fetch(
            `${EXERCISES_API_URL}/intentos/${idIntento}/detalle-docente`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.error ||
                "No se pudo cargar el detalle."
            );
        }

        mostrarDetalle(
            datos.detalle,
            datos.total_preguntas
        );

        mostrarPreguntas(datos.preguntas);

        loadingState.hidden = true;
        errorState.hidden = true;
        detailContent.hidden = false;

    } catch (error) {
        console.error(
            "Error al obtener el detalle:",
            error
        );

        mostrarError(error.message);
    }
}

/* ========================================
   INICIAR
======================================== */

document.addEventListener(
    "DOMContentLoaded",
    cargarDetalleIntento
);