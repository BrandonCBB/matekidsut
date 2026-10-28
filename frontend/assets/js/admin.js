const ADMIN_API_URL = "http://localhost:3000/api/admin";

let alumnos = [];
let docentes = [];
let ejercicios = [];

/* ========================================
   INICIAR PANEL
======================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina([1]);

    if (!usuario) {
        return;
    }

    document.body.classList.add("auth-ready");

    mostrarAdministrador(usuario);
    configurarBotones();
    configurarBuscadores();

    await cargarPanelAdministrador();
});

async function cargarPanelAdministrador() {
    await Promise.all([
        cargarUsuarios(),
        cargarEstadisticas(),
        cargarEjercicios(),
    ]);
}

/* ========================================
   MOSTRAR ADMINISTRADOR
======================================== */

function mostrarAdministrador(usuario) {
    const adminName = document.getElementById("adminName");

    if (adminName) {
        adminName.textContent =
            usuario.nombre || "administrador";
    }
}

/* ========================================
   CARGAR USUARIOS
======================================== */

async function cargarUsuarios() {
    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/usuarios`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudieron cargar los usuarios.",
                "error"
            );

            return;
        }

        alumnos = resultado.alumnos || [];
        docentes = resultado.docentes || [];

        renderizarAlumnos(alumnos);
        renderizarDocentes(docentes);
        actualizarTotalesListas();

    } catch (error) {
        console.error("Error al cargar usuarios:", error);

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
            `${ADMIN_API_URL}/ejercicios`,
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

        ejercicios = resultado.ejercicios || [];

        renderizarEjercicios(ejercicios);

    } catch (error) {
        console.error(
            "Error al cargar ejercicios:",
            error
        );

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );
    }
}

/* ========================================
   ESTADÍSTICAS
======================================== */

async function cargarEstadisticas() {
    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/estadisticas`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudieron cargar las estadísticas.",
                "error"
            );

            return;
        }

        colocarTexto(
            "studentCount",
            resultado.alumnos
        );

        colocarTexto(
            "teacherCount",
            resultado.docentes_activos
        );

        colocarTexto(
            "exerciseCount",
            resultado.ejercicios
        );

        colocarTexto(
            "inactiveCount",
            resultado.usuarios_inactivos
        );

    } catch (error) {
        console.error(
            "Error al cargar estadísticas:",
            error
        );
    }
}

function colocarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = Number(valor) || 0;
    }
}

/* ========================================
   RENDERIZAR ALUMNOS
======================================== */

function renderizarAlumnos(lista) {
    const studentList =
        document.getElementById("studentList");

    if (!studentList) {
        return;
    }

    if (lista.length === 0) {
        studentList.innerHTML = crearEstadoVacio(
            "fa-user-graduate",
            "No hay alumnos para mostrar."
        );

        return;
    }

    studentList.innerHTML = lista
        .map((usuario) => crearTarjetaUsuario(usuario))
        .join("");
}

/* ========================================
   RENDERIZAR DOCENTES
======================================== */

function renderizarDocentes(lista) {
    const teacherList =
        document.getElementById("teacherList");

    if (!teacherList) {
        return;
    }

    if (lista.length === 0) {
        teacherList.innerHTML = crearEstadoVacio(
            "fa-chalkboard-user",
            "No hay docentes para mostrar."
        );

        return;
    }

    teacherList.innerHTML = lista
        .map((usuario) => crearTarjetaUsuario(usuario))
        .join("");
}

/* ========================================
   TARJETA DE USUARIO
======================================== */

function crearTarjetaUsuario(usuario) {
    const nombreCompleto = [
        usuario.nombre,
        usuario.ap_paterno,
        usuario.ap_materno
    ]
        .filter(Boolean)
        .join(" ");

    const iniciales = obtenerIniciales(
        usuario.nombre,
        usuario.ap_paterno
    );

    const estaActivo = Number(usuario.estado) === 1;

    return `
        <article
            class="management-item"
            data-user-id="${usuario.id_usuario}"
        >
            <div class="item-main">

                <div class="item-avatar">
                    ${escaparHTML(iniciales)}
                </div>

                <div class="item-info">
                    <h3>
                        ${escaparHTML(nombreCompleto)}
                    </h3>

                    <p>
                        ${escaparHTML(usuario.correo)}
                    </p>

                    <span class="item-status ${
                        estaActivo ? "" : "inactive"
                    }">
                        ${estaActivo ? "Activo" : "Inactivo"}
                    </span>
                </div>

            </div>

            <div class="item-menu">

                <button
                    type="button"
                    class="item-menu-button"
                    aria-label="Opciones de usuario"
                    onclick="alternarMenuUsuario(
                        ${usuario.id_usuario},
                        event
                    )"
                >
                    <i class="fa-solid fa-gear"></i>
                </button>

                <div
                    class="item-dropdown hidden"
                    id="userMenu-${usuario.id_usuario}"
                >
                    <button
                        type="button"
                        onclick="abrirModalEditarUsuario(
                            ${usuario.id_usuario}
                        )"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Editar
                    </button>

                    <button
                        type="button"
                        onclick="confirmarCambioEstado(
                            ${usuario.id_usuario}
                        )"
                    >
                        <i class="fa-solid ${
                            estaActivo
                                ? "fa-user-slash"
                                : "fa-user-check"
                        }"></i>

                        ${
                            estaActivo
                                ? "Desactivar"
                                : "Activar"
                        }
                    </button>

                    <button
                        type="button"
                        class="danger-action"
                        onclick="confirmarEliminarUsuario(
                            ${usuario.id_usuario}
                        )"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Eliminar
                    </button>
                </div>

            </div>
        </article>
    `;
}

function crearEstadoVacio(icono, mensaje) {
    return `
        <div class="empty-list">
            <i class="fa-solid ${icono}"></i>
            <p>${mensaje}</p>
        </div>
    `;
}

function obtenerIniciales(nombre, apellido) {
    const inicialNombre =
        nombre?.trim().charAt(0) || "";

    const inicialApellido =
        apellido?.trim().charAt(0) || "";

    return `${inicialNombre}${inicialApellido}`
        .toUpperCase();
}

/* ========================================
   TOTALES DE LAS LISTAS
======================================== */

function actualizarTotalesListas() {
    colocarTexto("studentTotal", `(${alumnos.length})`);
    colocarTexto("teacherTotal", `(${docentes.length})`);
}

/* ========================================
   BOTONES NUEVO USUARIO
======================================== */

function configurarBotones() {
    const addUserButton =
        document.getElementById("addUserButton");

    const panelAddUserButton =
        document.getElementById("panelAddUserButton");

    [addUserButton, panelAddUserButton]
        .filter(Boolean)
        .forEach((boton) => {
            boton.addEventListener(
                "click",
                abrirModalAgregarUsuario
            );
        });
}

/* ========================================
   MODAL AGREGAR USUARIO
======================================== */

function abrirModalAgregarUsuario() {
    abrirModal({
        titulo: "Agregar usuario",
        icono: "fa-user-plus",
        textoConfirmar: "Guardar usuario",
        textoCancelar: "Cancelar",

        contenido: crearFormularioUsuario(),

        onConfirm: guardarUsuario
    });

    setTimeout(() => {
        document.getElementById("newUserName")?.focus();
    }, 100);
}

function crearFormularioUsuario(usuario = null) {
    const editando = Boolean(usuario);

    return `
        <form
            id="${editando ? "editUserForm" : "userForm"}"
            class="modal-form"
        >
            <div class="modal-field">
                <label for="newUserName">Nombre</label>

                <input
                    type="text"
                    id="newUserName"
                    name="nombre"
                    value="${escaparHTML(usuario?.nombre || "")}"
                    minlength="2"
                    required
                >
            </div>

            <div class="modal-field">
                <label for="newUserLastName">
                    Apellido paterno
                </label>

                <input
                    type="text"
                    id="newUserLastName"
                    name="ap_paterno"
                    value="${escaparHTML(
                        usuario?.ap_paterno || ""
                    )}"
                    minlength="2"
                    required
                >
            </div>

            <div class="modal-field">
                <label for="newUserSecondLastName">
                    Apellido materno
                </label>

                <input
                    type="text"
                    id="newUserSecondLastName"
                    name="ap_materno"
                    value="${escaparHTML(
                        usuario?.ap_materno || ""
                    )}"
                    minlength="2"
                    required
                >
            </div>

            <div class="modal-field">
                <label for="newUserEmail">
                    Correo electrónico
                </label>

                <input
                    type="email"
                    id="newUserEmail"
                    name="correo"
                    value="${escaparHTML(usuario?.correo || "")}"
                    required
                >
            </div>

            ${
                editando
                    ? ""
                    : `
                        <div class="modal-field">
                            <label for="newUserPassword">
                                Contraseña temporal
                            </label>

                            <input
                                type="password"
                                id="newUserPassword"
                                name="password"
                                minlength="8"
                                required
                            >
                        </div>
                    `
            }

            <div class="modal-field">
                <label for="newUserRole">Rol</label>

                <select
                    id="newUserRole"
                    name="id_rol"
                    required
                >
                    <option value="">
                        Selecciona un rol
                    </option>

                    <option
                        value="3"
                        ${
                            Number(usuario?.id_rol) === 3
                                ? "selected"
                                : ""
                        }
                    >
                        Alumno
                    </option>

                    <option
                        value="2"
                        ${
                            Number(usuario?.id_rol) === 2
                                ? "selected"
                                : ""
                        }
                    >
                        Docente
                    </option>
                </select>
            </div>
        </form>
    `;
}

/* ========================================
   GUARDAR NUEVO USUARIO
======================================== */

async function guardarUsuario() {
    const formulario =
        document.getElementById("userForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosFormulario(
        formulario,
        true
    );

    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/usuarios`,
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
                "No se pudo crear el usuario.",
                "error"
            );

            return false;
        }

        mostrarToast(resultado.message, "success");

        await cargarPanelAdministrador();

        return true;

    } catch (error) {
        console.error("Error al crear usuario:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   EDITAR USUARIO
======================================== */

function abrirModalEditarUsuario(idUsuario) {
    const usuario = buscarUsuario(idUsuario);

    if (!usuario) {
        mostrarToast(
            "No se encontró el usuario.",
            "error"
        );

        return;
    }

    cerrarMenusUsuarios();

    abrirModal({
        titulo: "Editar usuario",
        icono: "fa-user-pen",
        textoConfirmar: "Guardar cambios",
        contenido: crearFormularioUsuario(usuario),

        onConfirm: () => actualizarUsuario(idUsuario)
    });
}

async function actualizarUsuario(idUsuario) {
    const formulario =
        document.getElementById("editUserForm");

    if (!validarFormulario(formulario)) {
        return false;
    }

    const datos = obtenerDatosFormulario(
        formulario,
        false
    );

    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/usuarios/${idUsuario}`,
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
                "No se pudo actualizar el usuario.",
                "error"
            );

            return false;
        }

        mostrarToast(resultado.message, "success");

        await cargarPanelAdministrador();

        return true;

    } catch (error) {
        console.error(
            "Error al actualizar usuario:",
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
   ACTIVAR O DESACTIVAR
======================================== */

function confirmarCambioEstado(idUsuario) {
    const usuario = buscarUsuario(idUsuario);

    if (!usuario) {
        return;
    }

    cerrarMenusUsuarios();

    const estaActivo = Number(usuario.estado) === 1;
    const nuevoEstado = estaActivo ? 0 : 1;

    abrirModal({
        titulo: estaActivo
            ? "Desactivar usuario"
            : "Activar usuario",

        icono: estaActivo
            ? "fa-user-slash"
            : "fa-user-check",

        textoConfirmar: estaActivo
            ? "Desactivar"
            : "Activar",

        peligro: estaActivo,

        contenido: `
            <p>
                ¿Deseas
                ${estaActivo ? "desactivar" : "activar"}
                a
                <strong>
                    ${escaparHTML(usuario.nombre)}
                    ${escaparHTML(usuario.ap_paterno)}
                </strong>?
            </p>
        `,

        onConfirm: () =>
            cambiarEstadoUsuario(
                idUsuario,
                nuevoEstado
            )
    });
}

async function cambiarEstadoUsuario(
    idUsuario,
    estado
) {
    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/usuarios/${idUsuario}/estado`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ estado })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo cambiar el estado.",
                "error"
            );

            return false;
        }

        mostrarToast(resultado.message, "success");

        await cargarPanelAdministrador();

        return true;

    } catch (error) {
        console.error(
            "Error al cambiar el estado:",
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
   ELIMINAR USUARIO
======================================== */

function confirmarEliminarUsuario(idUsuario) {
    const usuario = buscarUsuario(idUsuario);

    if (!usuario) {
        return;
    }

    cerrarMenusUsuarios();

    abrirModal({
        titulo: "Eliminar usuario",
        icono: "fa-trash",
        textoConfirmar: "Eliminar",
        peligro: true,

        contenido: `
            <p>
                ¿Seguro que deseas eliminar a
                <strong>
                    ${escaparHTML(usuario.nombre)}
                    ${escaparHTML(usuario.ap_paterno)}
                </strong>?
            </p>

            <p>
                Esta acción no se puede deshacer.
            </p>
        `,

        onConfirm: () =>
            eliminarUsuario(idUsuario)
    });
}

async function eliminarUsuario(idUsuario) {
    try {
        const respuesta = await fetch(
            `${ADMIN_API_URL}/usuarios/${idUsuario}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo eliminar el usuario.",
                "error"
            );

            return false;
        }

        mostrarToast(resultado.message, "success");

        await cargarPanelAdministrador();

        return true;

    } catch (error) {
        console.error("Error al eliminar usuario:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return false;
    }
}

/* ========================================
   MENÚ DE OPCIONES
======================================== */

function alternarMenuUsuario(idUsuario, event) {
    event.stopPropagation();

    const menu =
        document.getElementById(`userMenu-${idUsuario}`);

    if (!menu) {
        return;
    }

    document
        .querySelectorAll(".item-dropdown")
        .forEach((otroMenu) => {
            if (otroMenu !== menu) {
                otroMenu.classList.add("hidden");
            }
        });

    menu.classList.toggle("hidden");
}

function cerrarMenusUsuarios() {
    document
        .querySelectorAll(".item-dropdown")
        .forEach((menu) => {
            menu.classList.add("hidden");
        });
}

document.addEventListener("click", cerrarMenusUsuarios);

/* ========================================
   RENDERIZAR EJERCICIOS
======================================== */

function renderizarEjercicios(lista) {
    const exerciseList =
        document.getElementById("exerciseList");

    if (!exerciseList) {
        return;
    }

    if (lista.length === 0) {
        exerciseList.innerHTML = crearEstadoVacio(
            "fa-clipboard-list",
            "No hay ejercicios para mostrar."
        );

        return;
    }

    exerciseList.innerHTML = lista
        .map(crearTarjetaEjercicio)
        .join("");
}

function crearTarjetaEjercicio(ejercicio) {
    const totalPreguntas =
        Number(ejercicio.total_preguntas) || 0;

    return `
        <article class="management-item">

            <div class="item-main">

                <div class="item-avatar">
                    <i class="fa-solid fa-clipboard-list"></i>
                </div>

                <div class="item-info">

                    <h3>
                        ${escaparHTML(ejercicio.titulo)}
                    </h3>

                    <p>
                        ${escaparHTML(ejercicio.descripcion)}
                    </p>

                    <p>
                        <strong>Categoría:</strong>
                        ${escaparHTML(ejercicio.categoria)}
                    </p>

                    <p>
                        <strong>Docente:</strong>
                        ${escaparHTML(ejercicio.docente)}
                    </p>

                    <span class="item-status">
                        ${totalPreguntas}
                        ${
                            totalPreguntas === 1
                                ? "pregunta"
                                : "preguntas"
                        }
                        ·
                        ${formatearFecha(
                            ejercicio.fecha_creacion
                        )}
                    </span>

                </div>

            </div>

        </article>
    `;
}

/* ========================================
   BUSCADORES
======================================== */

function configurarBuscadores() {
    const studentSearch =
        document.getElementById("studentSearch");

    const teacherSearch =
        document.getElementById("teacherSearch");

    const exerciseSearch =
        document.getElementById("exerciseSearch");

    studentSearch?.addEventListener("input", () => {
        filtrarUsuarios(
            studentSearch.value,
            alumnos,
            renderizarAlumnos
        );
    });

    teacherSearch?.addEventListener("input", () => {
        filtrarUsuarios(
            teacherSearch.value,
            docentes,
            renderizarDocentes
        );
    });

    exerciseSearch?.addEventListener("input", () => {
        filtrarEjercicios(exerciseSearch.value);
    });
}

function filtrarUsuarios(
    texto,
    listaOriginal,
    renderizar
) {
    const busqueda = texto.trim().toLowerCase();

    if (!busqueda) {
        renderizar(listaOriginal);
        return;
    }

    const filtrados = listaOriginal.filter((usuario) => {
        const contenido = `
            ${usuario.nombre}
            ${usuario.ap_paterno}
            ${usuario.ap_materno}
            ${usuario.correo}
        `.toLowerCase();

        return contenido.includes(busqueda);
    });

    renderizar(filtrados);
}

function filtrarEjercicios(texto) {
    const busqueda =
        texto.trim().toLowerCase();

    if (!busqueda) {
        renderizarEjercicios(ejercicios);
        return;
    }

    const filtrados = ejercicios.filter(
        (ejercicio) => {
            const contenido = `
                ${ejercicio.titulo}
                ${ejercicio.descripcion}
                ${ejercicio.categoria}
                ${ejercicio.docente}
            `.toLowerCase();

            return contenido.includes(busqueda);
        }
    );

    renderizarEjercicios(filtrados);
}

/* ========================================
   UTILIDADES
======================================== */

function buscarUsuario(idUsuario) {
    return [...alumnos, ...docentes].find(
        (usuario) =>
            Number(usuario.id_usuario) ===
            Number(idUsuario)
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

function obtenerDatosFormulario(
    formulario,
    incluirPassword
) {
    const formData = new FormData(formulario);

    const datos = {
        nombre: formData.get("nombre").trim(),
        ap_paterno:
            formData.get("ap_paterno").trim(),
        ap_materno:
            formData.get("ap_materno").trim(),
        correo: formData.get("correo").trim(),
        id_rol: Number(formData.get("id_rol"))
    };

    if (incluirPassword) {
        datos.password = formData.get("password");
    }

    return datos;
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "Sin fecha";
    }

    const fechaLocal = new Date(fecha);

    if (Number.isNaN(fechaLocal.getTime())) {
        return "Sin fecha";
    }

    return fechaLocal.toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
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