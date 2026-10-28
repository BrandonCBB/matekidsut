const API_ALUMNO =
    "http://localhost:3000/api/alumno";

const listaEjercicios =
    document.getElementById("listaEjercicios");

const estadoCarga =
    document.getElementById("estadoCarga");

const estadoVacio =
    document.getElementById("estadoVacio");

const tituloTema =
    document.getElementById("tituloTema");

document.addEventListener(
    "DOMContentLoaded",
    iniciarPagina
);

async function iniciarPagina() {
    try {
        await protegerPagina([3]);

        const tema = document.body.dataset.tema;

        if (!tema) {
            mostrarError(
                "No se pudo identificar el tema."
            );
            return;
        }

        tituloTema.textContent =
            `Ejercicios de ${tema}`;

        await cargarEjercicios(tema);
    } catch (error) {
        console.error(
            "Error al iniciar la página:",
            error
        );

        mostrarError(
            "No se pudo cargar la página."
        );
    }
}

async function cargarEjercicios(tema) {
    mostrarCarga();

    try {
        const respuesta = await fetch(
            `${API_ALUMNO}/ejercicios/${encodeURIComponent(tema)}`,
            {
                credentials: "include",
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudieron cargar los ejercicios."
            );
        }

        renderizarEjercicios(
            resultado.ejercicios || []
        );
    } catch (error) {
        console.error(
            "Error al cargar ejercicios:",
            error
        );

        mostrarError(error.message);
    }
}

function renderizarEjercicios(ejercicios) {
    listaEjercicios.innerHTML = "";

    estadoCarga.classList.add("hidden");

    if (ejercicios.length === 0) {
        estadoVacio.classList.remove("hidden");
        listaEjercicios.classList.add("hidden");
        return;
    }

    estadoVacio.classList.add("hidden");
    listaEjercicios.classList.remove("hidden");

    ejercicios.forEach((ejercicio) => {
        const tarjeta =
            crearTarjetaEjercicio(ejercicio);

        listaEjercicios.appendChild(tarjeta);
    });
}

function crearTarjetaEjercicio(ejercicio) {
    const articulo =
        document.createElement("article");

    articulo.className = "exercise-card";

    articulo.innerHTML = `
        <div class="exercise-card__top">
            <span class="exercise-category">
                ${escaparHTML(ejercicio.categoria)}
            </span>

            <span class="question-count">
                <i class="fa-regular fa-circle-question"></i>
                ${ejercicio.total_preguntas}
                ${
                    Number(ejercicio.total_preguntas) === 1
                        ? "pregunta"
                        : "preguntas"
                }
            </span>
        </div>

        <div class="exercise-card__content">
            <h2>
                ${escaparHTML(ejercicio.titulo)}
            </h2>

            <p>
                ${escaparHTML(ejercicio.descripcion)}
            </p>
        </div>

        <div class="exercise-card__meta">
            <span>
                <i class="fa-solid fa-chalkboard-user"></i>
                ${escaparHTML(ejercicio.docente)}
            </span>

            <span>
                <i class="fa-regular fa-calendar"></i>
                ${formatearFecha(ejercicio.fecha_creacion)}
            </span>
        </div>

        <button
            type="button"
            class="start-button"
        >
            Comenzar ejercicio
            <i class="fa-solid fa-arrow-right"></i>
        </button>
    `;

    const boton =
        articulo.querySelector(".start-button");

    boton.addEventListener("click", () => {
        abrirEjercicio(ejercicio.id_ejercicio);
    });

    return articulo;
}

function abrirEjercicio(idEjercicio) {
    window.location.href =
        `resolver.html?id=${idEjercicio}`;
}

function mostrarCarga() {
    estadoCarga.classList.remove("hidden");
    estadoVacio.classList.add("hidden");
    listaEjercicios.classList.add("hidden");
}

function mostrarError(mensaje) {
    estadoCarga.classList.remove("hidden");
    estadoVacio.classList.add("hidden");
    listaEjercicios.classList.add("hidden");

    estadoCarga.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h2>Ocurrió un problema</h2>
        <p>${escaparHTML(mensaje)}</p>
    `;
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Fecha no disponible";
    }

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
        return "Fecha no disponible";
    }

    return fechaObjeto.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
}   

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}