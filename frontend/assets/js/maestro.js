const EXERCISE_API_URL =
    "http://localhost:3000/api/ejercicios";

let ejerciciosDocente = [];
let categorias = [];

/* ========================================
   INICIAR PANEL
======================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina([2]);

    if (!usuario) {
        return;
    }

    document.body.classList.add("auth-ready");

    mostrarDatosMaestro(usuario);
    configurarBotones();

    await cargarPanelMaestro();
});

/* ========================================
   DATOS DEL MAESTRO
======================================== */

function mostrarDatosMaestro(usuario) {
    const teacherName =
        document.getElementById("teacherName");

    if (teacherName) {
        teacherName.textContent =
            usuario.nombre || "maestro";
    }
}

/* ========================================
   CARGAR PANEL
======================================== */

async function cargarPanelMaestro() {
    await Promise.all([
        cargarCategorias(),
        cargarEjercicios(),
        cargarEstadisticas()
    ]);
}

/* ========================================
   CARGAR CATEGORÍAS
======================================== */

async function cargarCategorias() {
    try {
        const respuesta = await fetch(
            `${EXERCISE_API_URL}/categorias`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudieron cargar las categorías.",
                "error"
            );

            return;
        }

        categorias = resultado.categorias || [];

    } catch (error) {
        console.error("Error al cargar categorías:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );
    }
}

/* ========================================
   CARGAR EJERCICIOS
======================================== */

async function cargarEjercicios() {
    try {
        const respuesta = await fetch(
            `${EXERCISE_API_URL}/mis-ejercicios`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudieron cargar los ejercicios.",
                "error"
            );

            return;
        }

        ejerciciosDocente = resultado.ejercicios || [];

        renderizarEjercicios();

    } catch (error) {
        console.error("Error al cargar ejercicios:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );
    }
}

/* ========================================
   CARGAR ESTADÍSTICAS
======================================== */

async function cargarEstadisticas() {
    try {
        const respuesta = await fetch(
            `${EXERCISE_API_URL}/estadisticas`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.message ||
                "No se pudieron cargar las estadísticas."
            );
        }

        const estadisticas =
            resultado.estadisticas || {};

        colocarTexto(
            "exerciseCount",
            estadisticas.ejercicios
        );

        colocarTexto(
            "studentCount",
            estadisticas.alumnos
        );

        colocarTexto(
            "answerCount",
            estadisticas.respuestas
        );

    } catch (error) {
        console.error(
            "Error al cargar estadísticas:",
            error
        );

        colocarTexto(
            "exerciseCount",
            ejerciciosDocente.length
        );

        colocarTexto("studentCount", 0);
        colocarTexto("answerCount", 0);
    }
}

/* ========================================
   ESTADÍSTICAS
======================================== */

function colocarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = Number(valor) || 0;
    }
}

/* ========================================
   BOTONES PARA CREAR
======================================== */

function configurarBotones() {
    const botonesCrear = [
        document.getElementById("createExerciseButton"),
        document.querySelector(".secondary-create-button"),
        document.querySelector(".empty-button")
    ];

    botonesCrear
        .filter(Boolean)
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                abrirModalCrearEjercicio
            );
        });
}

/* ========================================
   FORMULARIO DE EJERCICIO
======================================== */

function crearFormularioEjercicio(ejercicio = null) {
    const opciones = categorias
        .map((categoria) => {
            const seleccionada =
                Number(ejercicio?.id_categoria) ===
                Number(categoria.id_categoria);

            return `
                <option
                    value="${categoria.id_categoria}"
                    ${seleccionada ? "selected" : ""}
                >
                    ${escaparHTML(categoria.nombre)}
                </option>
            `;
        })
        .join("");

    return `
        <form
            id="exerciseForm"
            class="modal-form"
        >
            <div class="modal-field">
                <label for="exerciseTitle">
                    Título
                </label>

                <input
                    type="text"
                    id="exerciseTitle"
                    name="titulo"
                    value="${escaparHTML(
                        ejercicio?.titulo || ""
                    )}"
                    placeholder="Ejemplo: Sumas básicas"
                    minlength="3"
                    maxlength="255"
                    required
                >
            </div>

            <div class="modal-field">
                <label for="exerciseDescription">
                    Descripción
                </label>

                <textarea
                    id="exerciseDescription"
                    name="descripcion"
                    placeholder="Describe las instrucciones del ejercicio"
                    minlength="5"
                    maxlength="255"
                    required
                >${escaparHTML(
                    ejercicio?.descripcion || ""
                )}</textarea>
            </div>

            <div class="modal-field">
                <label for="exerciseCategory">
                    Categoría
                </label>

                <select
                    id="exerciseCategory"
                    name="id_categoria"
                    required
                >
                    <option value="">
                        Selecciona una categoría
                    </option>

                    ${opciones}
                </select>
            </div>
        </form>
    `;
}

/* ========================================
   CREAR EJERCICIO
======================================== */

function abrirModalCrearEjercicio() {
    if (categorias.length === 0) {
        mostrarToast(
            "No existen categorías disponibles.",
            "warning"
        );

        return;
    }

    abrirModal({
        titulo: "Crear ejercicio",
        icono: "fa-clipboard-list",
        textoConfirmar: "Crear ejercicio",
        textoCancelar: "Cancelar",
        contenido: crearFormularioEjercicio(),
        onConfirm: guardarEjercicio
    });

    setTimeout(() => {
        document
            .getElementById("exerciseTitle")
            ?.focus();
    }, 100);
}

async function guardarEjercicio() {
    const formulario =
        document.getElementById("exerciseForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosEjercicio(formulario);

    try {
        const respuesta = await fetch(
            EXERCISE_API_URL,
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
                "No se pudo crear el ejercicio.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicios();

        return true;

    } catch (error) {
        console.error("Error al crear ejercicio:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   RENDERIZAR EJERCICIOS
======================================== */

function renderizarEjercicios() {
    const emptyState =
        document.getElementById("emptyState");

    const exerciseList =
        document.getElementById("exerciseList");

    if (!emptyState || !exerciseList) {
        return;
    }

    if (ejerciciosDocente.length === 0) {
        emptyState.classList.remove("hidden");
        exerciseList.classList.add("hidden");
        exerciseList.innerHTML = "";

        return;
    }

    emptyState.classList.add("hidden");
    exerciseList.classList.remove("hidden");

    exerciseList.innerHTML = ejerciciosDocente
        .map(crearTarjetaEjercicio)
        .join("");
}

function crearTarjetaEjercicio(ejercicio) {
    const iconos = {
        suma: "fa-plus",
        resta: "fa-minus",
        multiplicación: "fa-xmark",
        multiplicacion: "fa-xmark",
        división: "fa-divide",
        division: "fa-divide"
    };

    const categoriaNormalizada =
        ejercicio.categoria
            ?.trim()
            .toLowerCase();

    const icono =
        iconos[categoriaNormalizada] ||
        "fa-clipboard-list";

    const totalPreguntas =
        Number(ejercicio.total_preguntas) || 0;

    return `
        <article class="exercise-item">

            <div class="exercise-info">

                <div class="exercise-topic-icon">
                    <i class="fa-solid ${icono}"></i>
                </div>

                <div>
                    <h3>
                        ${escaparHTML(ejercicio.titulo)}
                    </h3>

                    <p>
                        ${escaparHTML(ejercicio.categoria)}
                        · ${totalPreguntas}
                        ${
                            totalPreguntas === 1
                                ? "pregunta"
                                : "preguntas"
                        }
                    </p>

                    <p>
                        ${escaparHTML(ejercicio.descripcion)}
                    </p>
                </div>

            </div>

            <div class="exercise-actions">

                <button
                    type="button"
                    class="edit-button"
                    onclick="abrirModalEditarEjercicio(
                        ${ejercicio.id_ejercicio}
                    )"
                >
                    <i class="fa-solid fa-pen"></i>
                    Editar
                </button>

                <button
                    type="button"
                    class="edit-button"
                    onclick="abrirAdministradorPreguntas(
                        ${ejercicio.id_ejercicio}
                    )"
                >
                    <i class="fa-solid fa-list-check"></i>
                    Preguntas
                </button>

                <button
                    type="button"
                    class="delete-button"
                    onclick="confirmarEliminarEjercicio(
                        ${ejercicio.id_ejercicio}
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
   ADMINISTRAR PREGUNTAS
======================================== */

function abrirAdministradorPreguntas(idEjercicio) {
    window.location.href =
        `preguntas.html?id=${idEjercicio}`;
}

/* ========================================
   EDITAR EJERCICIO
======================================== */

function abrirModalEditarEjercicio(idEjercicio) {
    const ejercicio = buscarEjercicio(idEjercicio);

    if (!ejercicio) {
        mostrarToast(
            "No se encontró el ejercicio.",
            "error"
        );

        return;
    }

    abrirModal({
        titulo: "Editar ejercicio",
        icono: "fa-pen",
        textoConfirmar: "Guardar cambios",
        contenido: crearFormularioEjercicio(ejercicio),
        onConfirm: () =>
            actualizarEjercicio(idEjercicio)
    });
}

async function actualizarEjercicio(idEjercicio) {
    const formulario =
        document.getElementById("exerciseForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosEjercicio(formulario);

    try {
        const respuesta = await fetch(
            `${EXERCISE_API_URL}/${idEjercicio}`,
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
                "No se pudo actualizar el ejercicio.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicios();

        return true;

    } catch (error) {
        console.error(
            "Error al actualizar ejercicio:",
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
   ELIMINAR EJERCICIO
======================================== */

function confirmarEliminarEjercicio(idEjercicio) {
    const ejercicio = buscarEjercicio(idEjercicio);

    if (!ejercicio) {
        return;
    }

    abrirModal({
        titulo: "Eliminar ejercicio",
        icono: "fa-trash",
        textoConfirmar: "Eliminar",
        peligro: true,
        contenido: `
            <p>
                ¿Seguro que deseas eliminar
                <strong>
                    ${escaparHTML(ejercicio.titulo)}
                </strong>?
            </p>

            <p>
                Esta acción no se puede deshacer.
            </p>
        `,
        onConfirm: () =>
            eliminarEjercicio(idEjercicio)
    });
}

async function eliminarEjercicio(idEjercicio) {
    try {
        const respuesta = await fetch(
            `${EXERCISE_API_URL}/${idEjercicio}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo eliminar el ejercicio.",
                "error"
            );

            return false;
        }

        mostrarToast(
            resultado.message,
            "success"
        );

        await cargarEjercicios();

        return true;

    } catch (error) {
        console.error(
            "Error al eliminar ejercicio:",
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

function buscarEjercicio(idEjercicio) {
    return ejerciciosDocente.find(
        (ejercicio) =>
            Number(ejercicio.id_ejercicio) ===
            Number(idEjercicio)
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

function obtenerDatosEjercicio(formulario) {
    const formData = new FormData(formulario);

    return {
        titulo: formData.get("titulo").trim(),
        descripcion:
            formData.get("descripcion").trim(),
        id_categoria:
            Number(formData.get("id_categoria"))
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