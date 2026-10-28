const QUESTIONS_API_URL =
    "http://localhost:3000/api/preguntas";

let ejercicioActual = null;
let preguntasEjercicio = [];

/* ========================================
   INICIAR PÁGINA
======================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina([2]);

    if (!usuario) {
        return;
    }

    const idEjercicio = obtenerIdEjercicio();

    if (!idEjercicio) {
        window.location.replace("maestro.html");
        return;
    }

    document.body.classList.add("auth-ready");

    configurarBotones();
    await cargarEjercicio(idEjercicio);
});

/* ========================================
   ID DESDE LA URL
======================================== */

function obtenerIdEjercicio() {
    const parametros =
        new URLSearchParams(window.location.search);

    const idEjercicio =
        Number(parametros.get("id"));

    if (
        !Number.isInteger(idEjercicio) ||
        idEjercicio <= 0
    ) {
        mostrarToast(
            "El ejercicio seleccionado no es válido.",
            "error"
        );

        return null;
    }

    return idEjercicio;
}

/* ========================================
   CARGAR EJERCICIO Y PREGUNTAS
======================================== */

async function cargarEjercicio(idEjercicio) {
    try {
        const respuesta = await fetch(
            `${QUESTIONS_API_URL}/ejercicio/${idEjercicio}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo cargar el ejercicio.",
                "error"
            );

            setTimeout(() => {
                window.location.replace("maestro.html");
            }, 1300);

            return;
        }

        ejercicioActual = resultado.ejercicio;
        preguntasEjercicio = resultado.preguntas || [];

        mostrarDatosEjercicio();
        renderizarPreguntas();

    } catch (error) {
        console.error(
            "Error al cargar el ejercicio:",
            error
        );

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );
    }
}

/* ========================================
   MOSTRAR DATOS DEL EJERCICIO
======================================== */

function mostrarDatosEjercicio() {
    if (!ejercicioActual) {
        return;
    }

    colocarTexto(
        "exerciseTitle",
        ejercicioActual.titulo
    );

    colocarTexto(
        "exerciseDescription",
        ejercicioActual.descripcion
    );

    colocarTexto(
        "exerciseCategory",
        ejercicioActual.categoria
    );

    colocarTexto(
        "exerciseDate",
        formatearFecha(ejercicioActual.fecha_creacion)
    );

    actualizarConteoPreguntas();
    actualizarIconoCategoria();
}

function actualizarConteoPreguntas() {
    const total = preguntasEjercicio.length;

    colocarTexto(
        "questionCount",
        `${total} ${total === 1 ? "pregunta" : "preguntas"}`
    );
}

function actualizarIconoCategoria() {
    const icono =
        document.querySelector("#exerciseCategoryIcon i");

    if (!icono || !ejercicioActual) {
        return;
    }

    const iconos = {
        suma: "fa-plus",
        resta: "fa-minus",
        multiplicación: "fa-xmark",
        multiplicacion: "fa-xmark",
        división: "fa-divide",
        division: "fa-divide"
    };

    const categoria =
        ejercicioActual.categoria
            ?.trim()
            .toLowerCase();

    icono.className = `fa-solid ${
        iconos[categoria] || "fa-clipboard-list"
    }`;
}

function colocarTexto(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = texto ?? "—";
    }
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "—";
    }

    return new Date(fecha).toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

/* ========================================
   CONFIGURAR BOTONES
======================================== */

function configurarBotones() {
    const botones = [
        document.getElementById("addQuestionButton"),
        document.getElementById("secondaryAddQuestionButton"),
        document.getElementById("emptyAddQuestionButton")
    ];

    botones
        .filter(Boolean)
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                abrirModalCrearPregunta
            );
        });
}

/* ========================================
   FORMULARIO
======================================== */

function crearFormularioPregunta(pregunta = null) {
    return `
        <form id="questionForm" class="modal-form">

            <div class="modal-field">
                <label for="questionText">
                    Pregunta
                </label>

                <textarea
                    id="questionText"
                    name="pregunta"
                    placeholder="Ejemplo: ¿Cuánto es 8 + 7?"
                    minlength="3"
                    maxlength="255"
                    required
                >${escaparHTML(
                    pregunta?.pregunta || ""
                )}</textarea>
            </div>

            <div class="modal-field">
                <label for="correctAnswer">
                    Respuesta correcta
                </label>

                <input
                    type="text"
                    id="correctAnswer"
                    name="respuesta_correcta"
                    value="${escaparHTML(
                        pregunta?.respuesta_correcta || ""
                    )}"
                    placeholder="Ejemplo: 15"
                    maxlength="255"
                    required
                >
            </div>

        </form>
    `;
}

/* ========================================
   CREAR PREGUNTA
======================================== */

function abrirModalCrearPregunta() {
    if (!ejercicioActual) {
        mostrarToast(
            "Primero debe cargarse el ejercicio.",
            "warning"
        );

        return;
    }

    abrirModal({
        titulo: "Agregar pregunta",
        icono: "fa-circle-question",
        textoConfirmar: "Guardar pregunta",
        textoCancelar: "Cancelar",
        contenido: crearFormularioPregunta(),
        onConfirm: guardarPregunta
    });

    setTimeout(() => {
        document.getElementById("questionText")?.focus();
    }, 100);
}

async function guardarPregunta() {
    const formulario =
        document.getElementById("questionForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosPregunta(formulario);

    datos.id_ejercicio =
        ejercicioActual.id_ejercicio;

    try {
        const respuesta = await fetch(
            QUESTIONS_API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo crear la pregunta.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicio(
            ejercicioActual.id_ejercicio
        );

        return true;

    } catch (error) {
        console.error(
            "Error al crear la pregunta:",
            error
        );

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   RENDERIZAR PREGUNTAS
======================================== */

function renderizarPreguntas() {
    const estadoVacio =
        document.getElementById("questionsEmpty");

    const lista =
        document.getElementById("questionsList");

    if (!estadoVacio || !lista) {
        return;
    }

    actualizarConteoPreguntas();

    if (preguntasEjercicio.length === 0) {
        estadoVacio.classList.remove("hidden");
        lista.classList.add("hidden");
        lista.innerHTML = "";

        return;
    }

    estadoVacio.classList.add("hidden");
    lista.classList.remove("hidden");

    lista.innerHTML = preguntasEjercicio
        .map((pregunta, indice) =>
            crearTarjetaPregunta(pregunta, indice)
        )
        .join("");
}

function crearTarjetaPregunta(pregunta, indice) {
    return `
        <article class="question-card">

            <div class="question-number">
                ${indice + 1}
            </div>

            <div class="question-content">

                <h3>
                    ${escaparHTML(pregunta.pregunta)}
                </h3>

                <div class="correct-answer">
                    <i class="fa-solid fa-circle-check"></i>

                    <span>
                        <strong>Respuesta correcta:</strong>
                        ${escaparHTML(
                            pregunta.respuesta_correcta || "Sin respuesta"
                        )}
                    </span>
                </div>

            </div>

            <div class="question-actions">

                <button
                    type="button"
                    class="edit-question-button"
                    onclick="abrirModalEditarPregunta(
                        ${pregunta.id_pregunta}
                    )"
                >
                    <i class="fa-solid fa-pen"></i>
                    Editar
                </button>

                <button
                    type="button"
                    class="delete-question-button"
                    onclick="confirmarEliminarPregunta(
                        ${pregunta.id_pregunta}
                    )"
                >
                    <i class="fa-solid fa-trash"></i>
                    Eliminar
                </button>

            </div>

        </article>
    `;
}

/* ========================================
   EDITAR PREGUNTA
======================================== */

function abrirModalEditarPregunta(idPregunta) {
    const pregunta = buscarPregunta(idPregunta);

    if (!pregunta) {
        mostrarToast(
            "No se encontró la pregunta.",
            "error"
        );

        return;
    }

    abrirModal({
        titulo: "Editar pregunta",
        icono: "fa-pen",
        textoConfirmar: "Guardar cambios",
        textoCancelar: "Cancelar",
        contenido: crearFormularioPregunta(pregunta),
        onConfirm: () =>
            actualizarPregunta(idPregunta)
    });
}

async function actualizarPregunta(idPregunta) {
    const formulario =
        document.getElementById("questionForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosPregunta(formulario);

    try {
        const respuesta = await fetch(
            `${QUESTIONS_API_URL}/${idPregunta}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo actualizar la pregunta.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicio(
            ejercicioActual.id_ejercicio
        );

        return true;

    } catch (error) {
        console.error(
            "Error al actualizar la pregunta:",
            error
        );

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   ELIMINAR PREGUNTA
======================================== */

function confirmarEliminarPregunta(idPregunta) {
    const pregunta = buscarPregunta(idPregunta);

    if (!pregunta) {
        return;
    }

    abrirModal({
        titulo: "Eliminar pregunta",
        icono: "fa-trash",
        textoConfirmar: "Eliminar",
        textoCancelar: "Cancelar",
        peligro: true,

        contenido: `
            <p>
                ¿Seguro que deseas eliminar esta pregunta?
            </p>

            <p>
                <strong>
                    ${escaparHTML(pregunta.pregunta)}
                </strong>
            </p>

            <p>
                Esta acción también eliminará las respuestas
                relacionadas y no se puede deshacer.
            </p>
        `,

        onConfirm: () =>
            eliminarPregunta(idPregunta)
    });
}

async function eliminarPregunta(idPregunta) {
    try {
        const respuesta = await fetch(
            `${QUESTIONS_API_URL}/${idPregunta}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo eliminar la pregunta.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicio(
            ejercicioActual.id_ejercicio
        );

        return true;

    } catch (error) {
        console.error(
            "Error al eliminar la pregunta:",
            error
        );

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   UTILIDADES
======================================== */

function buscarPregunta(idPregunta) {
    return preguntasEjercicio.find(
        (pregunta) =>
            Number(pregunta.id_pregunta) ===
            Number(idPregunta)
    );
}

function validarFormulario(formulario) {
    if (!formulario) {
        mostrarToast(
            "No se encontró el formulario.",
            "error"
        );

        return false;
    }

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return false;
    }

    return true;
}

function obtenerDatosPregunta(formulario) {
    const datos = new FormData(formulario);

    return {
        pregunta: datos.get("pregunta").trim(),
        respuesta_correcta:
            datos.get("respuesta_correcta").trim()
    };
}

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}