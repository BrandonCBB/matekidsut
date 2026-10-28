const API_ALUMNO = "http://localhost:3000/api/alumno";

const estadoCarga = document.getElementById("estadoCarga");
const estadoError = document.getElementById("estadoError");
const mensajeError = document.getElementById("mensajeError");
const contenidoEjercicio = document.getElementById("contenidoEjercicio");

const categoriaEjercicio = document.getElementById("categoriaEjercicio");
const tituloEjercicio = document.getElementById("tituloEjercicio");
const descripcionEjercicio = document.getElementById("descripcionEjercicio");
const docenteEjercicio = document.getElementById("docenteEjercicio");
const totalPreguntas = document.getElementById("totalPreguntas");

const formulario = document.getElementById("formResolver");
const listaPreguntas = document.getElementById("listaPreguntas");
const btnFinalizar = document.getElementById("btnFinalizar");

let ejercicioActual = null;
let preguntasActuales = [];

document.addEventListener("DOMContentLoaded", iniciarPagina);

async function iniciarPagina() {
    try {
        await protegerPagina([3]);

        const parametros = new URLSearchParams(window.location.search);
        const idEjercicio = Number(parametros.get("id"));

        if (!Number.isInteger(idEjercicio) || idEjercicio <= 0) {
            mostrarError("El ejercicio seleccionado no es válido.");
            return;
        }

        configurarFormulario();
        await cargarEjercicio(idEjercicio);
    } catch (error) {
        console.error("Error al iniciar la página:", error);
        mostrarError("No se pudo iniciar la página.");
    }
}

async function cargarEjercicio(idEjercicio) {
    mostrarCarga();

    try {
        const respuesta = await fetch(
            `${API_ALUMNO}/ejercicio/${idEjercicio}`,
            {
                method: "GET",
                credentials: "include",
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo cargar el ejercicio."
            );
        }

        ejercicioActual = resultado.ejercicio;
        preguntasActuales = resultado.preguntas || [];

        if (preguntasActuales.length === 0) {
            throw new Error(
                "Este ejercicio todavía no tiene preguntas."
            );
        }

        mostrarDatosEjercicio();
        renderizarPreguntas();
        mostrarContenido();
    } catch (error) {
        console.error("Error al cargar el ejercicio:", error);
        mostrarError(error.message);
    }
}

function mostrarDatosEjercicio() {
    categoriaEjercicio.textContent =
        ejercicioActual.categoria || "Tema";

    tituloEjercicio.textContent =
        ejercicioActual.titulo || "Ejercicio";

    descripcionEjercicio.textContent =
        ejercicioActual.descripcion ||
        "Resuelve las siguientes preguntas.";

    docenteEjercicio.textContent =
        ejercicioActual.docente || "Docente";

    const cantidad = preguntasActuales.length;

    totalPreguntas.textContent =
        `${cantidad} ${cantidad === 1 ? "pregunta" : "preguntas"}`;

    document.title =
        `MateKids UT | ${ejercicioActual.titulo}`;

    marcarTemaActivo(ejercicioActual.categoria);
}

function renderizarPreguntas() {
    listaPreguntas.innerHTML = "";

    preguntasActuales.forEach((pregunta, indice) => {
        const tarjeta = crearTarjetaPregunta(
            pregunta,
            indice
        );

        listaPreguntas.appendChild(tarjeta);
    });
}

function crearTarjetaPregunta(pregunta, indice) {
    const articulo = document.createElement("article");

    articulo.className = "question-card";

    articulo.innerHTML = `
        <div class="question-number">
            Pregunta ${indice + 1}
        </div>

        <label for="respuesta-${pregunta.id_pregunta}">
            ${escaparHTML(pregunta.pregunta)}
        </label>

        <div class="answer-field">
            <i class="fa-solid fa-pencil"></i>

            <input
                type="text"
                id="respuesta-${pregunta.id_pregunta}"
                class="answer-input"
                data-id-pregunta="${pregunta.id_pregunta}"
                placeholder="Escribe tu respuesta"
                autocomplete="off"
                required
            >
        </div>

        <p class="question-error hidden">
            Escribe una respuesta antes de continuar.
        </p>
    `;

    const input = articulo.querySelector(".answer-input");

    input.addEventListener("input", () => {
        limpiarErrorPregunta(articulo);
    });

    return articulo;
}

function configurarFormulario() {
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault();

        const respuestas = obtenerRespuestas();

        if (!respuestas) {
            enfocarPrimeraPreguntaIncompleta();
            return;
        }

        await enviarRespuestas(respuestas);
    });
}

function obtenerRespuestas() {
    const inputs = document.querySelectorAll(".answer-input");

    const respuestas = [];
    let formularioValido = true;

    inputs.forEach((input) => {
        const tarjeta = input.closest(".question-card");
        const respuesta = input.value.trim();

        if (!respuesta) {
            mostrarErrorPregunta(tarjeta);
            formularioValido = false;
            return;
        }

        respuestas.push({
            id_pregunta: Number(input.dataset.idPregunta),
            respuesta,
        });
    });

    if (!formularioValido) {
        return null;
    }

    return respuestas;
}

async function enviarRespuestas(respuestas) {
    cambiarEstadoBoton(true);

    try {
        const respuesta = await fetch(
            `${API_ALUMNO}/respuestas`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    id_ejercicio: ejercicioActual.id_ejercicio,
                    respuestas,
                }),
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudieron enviar las respuestas."
            );
        }

        guardarResultado(resultado);

        window.location.href =
            `resultado.html?id=${ejercicioActual.id_ejercicio}`;
    } catch (error) {
        console.error("Error al enviar respuestas:", error);

        alert(
            error.message ||
            "No se pudieron calificar las respuestas."
        );

        cambiarEstadoBoton(false);
    }
}

function guardarResultado(resultado) {
    const datosResultado = {
        ejercicio: {
            id_ejercicio: ejercicioActual.id_ejercicio,
            titulo: ejercicioActual.titulo,
            descripcion: ejercicioActual.descripcion,
            categoria: ejercicioActual.categoria,
            docente: ejercicioActual.docente,
        },
        resultado: resultado.resultado,
        respuestas: resultado.respuestas,
    };

    sessionStorage.setItem(
        "resultadoEjercicio",
        JSON.stringify(datosResultado)
    );
}

function cambiarEstadoBoton(cargando) {
    btnFinalizar.disabled = cargando;

    if (cargando) {
        btnFinalizar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Calificando...
        `;
    } else {
        btnFinalizar.innerHTML = `
            Finalizar ejercicio
            <i class="fa-solid fa-check"></i>
        `;
    }
}

function mostrarErrorPregunta(tarjeta) {
    const input = tarjeta.querySelector(".answer-input");
    const mensaje = tarjeta.querySelector(".question-error");

    input.classList.add("input-error");
    mensaje.classList.remove("hidden");
}

function limpiarErrorPregunta(tarjeta) {
    const input = tarjeta.querySelector(".answer-input");
    const mensaje = tarjeta.querySelector(".question-error");

    input.classList.remove("input-error");
    mensaje.classList.add("hidden");
}

function enfocarPrimeraPreguntaIncompleta() {
    const primerInputVacio = Array.from(
        document.querySelectorAll(".answer-input")
    ).find((input) => !input.value.trim());

    if (primerInputVacio) {
        primerInputVacio.focus();

        primerInputVacio.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }
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

function mostrarCarga() {
    estadoCarga.classList.remove("hidden");
    estadoError.classList.add("hidden");
    contenidoEjercicio.classList.add("hidden");
}

function mostrarContenido() {
    estadoCarga.classList.add("hidden");
    estadoError.classList.add("hidden");
    contenidoEjercicio.classList.remove("hidden");
}

function mostrarError(mensaje) {
    estadoCarga.classList.add("hidden");
    contenidoEjercicio.classList.add("hidden");
    estadoError.classList.remove("hidden");

    mensajeError.textContent =
        mensaje || "Ocurrió un problema inesperado.";
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