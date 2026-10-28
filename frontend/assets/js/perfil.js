const PROFILE_API_URL = "http://localhost:3000/api/auth";

document.addEventListener("DOMContentLoaded", async () => {
    const usuarioSesion = await protegerPagina([1, 2, 3]);

    if (!usuarioSesion) {
        return;
    }

    const usuario = await cargarPerfil();

    if (!usuario) {
        return;
    }

    document.body.classList.add("auth-ready");

    mostrarDatosPerfil(usuario);
    configurarBotonEditarPerfil(usuario);
    configurarFormularioPassword();
});

/* ========================================
   CARGAR PERFIL
======================================== */

async function cargarPerfil() {
    try {
        const respuesta = await fetch(`${PROFILE_API_URL}/profile`, {
            method: "GET",
            credentials: "include"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message || "No se pudo cargar el perfil.",
                "error"
            );

            return null;
        }

        return resultado.usuario;

    } catch (error) {
        console.error("Error al cargar el perfil:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return null;
    }
}

/* ========================================
   MOSTRAR DATOS
======================================== */

function mostrarDatosPerfil(usuario) {
    const roles = {
        1: "Administrador",
        2: "Docente",
        3: "Alumno"
    };

    const userName = document.getElementById("userName");
    const profileName = document.getElementById("profileName");
    const profileLastName = document.getElementById("profileLastName");
    const profileSecondLastName =
        document.getElementById("profileSecondLastName");
    const profileEmail = document.getElementById("profileEmail");
    const profileFullName = document.getElementById("profileFullName");
    const profileRole = document.getElementById("profileRole");
    const profileDate = document.getElementById("profileDate");

    if (userName) {
        userName.textContent = usuario.nombre || "Usuario";
    }

    if (profileName) {
        profileName.textContent = usuario.nombre || "—";
    }

    if (profileLastName) {
        profileLastName.textContent = usuario.ap_paterno || "—";
    }

    if (profileSecondLastName) {
        profileSecondLastName.textContent = usuario.ap_materno || "—";
    }

    if (profileEmail) {
        profileEmail.textContent = usuario.correo || "—";
    }

    if (profileFullName) {
        profileFullName.textContent = [
            usuario.nombre,
            usuario.ap_paterno,
            usuario.ap_materno
        ].filter(Boolean).join(" ");
    }

    if (profileRole) {
        profileRole.textContent =
            roles[Number(usuario.id_rol)] || "Usuario";
    }

    if (profileDate) {
        profileDate.textContent =
            formatearFecha(usuario.fecha_registro);
    }
}

function formatearFecha(fecha) {
    if (!fecha) {
        return "—";
    }

    return new Date(fecha).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

/* ========================================
   EDITAR PERFIL
======================================== */

function configurarBotonEditarPerfil(usuario) {
    const editProfileButton =
        document.getElementById("editProfileButton");

    if (!editProfileButton) {
        return;
    }

    editProfileButton.addEventListener("click", () => {
        abrirModalEditarPerfil(usuario);
    });
}

function abrirModalEditarPerfil(usuario) {
    abrirModal({
        titulo: "Editar información",
        icono: "fa-user-pen",
        textoConfirmar: "Guardar cambios",
        textoCancelar: "Cancelar",
        contenido: `
            <form id="editProfileForm" class="modal-form">

                <div class="modal-field">
                    <label for="editName">Nombre</label>

                    <input
                        type="text"
                        id="editName"
                        name="nombre"
                        value="${escaparHTML(usuario.nombre || "")}"
                        minlength="2"
                        required
                    >
                </div>

                <div class="modal-field">
                    <label for="editLastName">
                        Apellido paterno
                    </label>

                    <input
                        type="text"
                        id="editLastName"
                        name="ap_paterno"
                        value="${escaparHTML(usuario.ap_paterno || "")}"
                        minlength="2"
                        required
                    >
                </div>

                <div class="modal-field">
                    <label for="editSecondLastName">
                        Apellido materno
                    </label>

                    <input
                        type="text"
                        id="editSecondLastName"
                        name="ap_materno"
                        value="${escaparHTML(usuario.ap_materno || "")}"
                        minlength="2"
                        required
                    >
                </div>

            </form>
        `,
        onConfirm: async () => {
            const usuarioActualizado = await actualizarPerfil();

            if (!usuarioActualizado) {
                return false;
            }

            Object.assign(usuario, usuarioActualizado);

            mostrarDatosPerfil(usuario);
            configurarBotonEditarPerfilActualizado(usuario);

            return true;
        }
    });
}

async function actualizarPerfil() {
    const formulario =
        document.getElementById("editProfileForm");

    if (!formulario) {
        mostrarToast(
            "No se encontró el formulario.",
            "error"
        );

        return null;
    }

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return null;
    }

    const datosFormulario = new FormData(formulario);

    const datos = {
        nombre: datosFormulario.get("nombre").trim(),
        ap_paterno: datosFormulario.get("ap_paterno").trim(),
        ap_materno: datosFormulario.get("ap_materno").trim()
    };

    try {
        const respuesta = await fetch(`${PROFILE_API_URL}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message || "No se pudo actualizar el perfil.",
                "error"
            );

            return null;
        }

        mostrarToast(
            "Perfil actualizado correctamente.",
            "success"
        );

        return resultado.usuario;

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

        return null;
    }
}

/*
   Vuelve a asignar el usuario actualizado al botón.
   Evita que el modal siga mostrando los datos anteriores.
*/
function configurarBotonEditarPerfilActualizado(usuario) {
    const editProfileButton =
        document.getElementById("editProfileButton");

    if (!editProfileButton) {
        return;
    }

    const nuevoBoton = editProfileButton.cloneNode(true);

    editProfileButton.replaceWith(nuevoBoton);

    nuevoBoton.addEventListener("click", () => {
        abrirModalEditarPerfil(usuario);
    });
}

/* ========================================
   CAMBIO DE CONTRASEÑA
======================================== */

function configurarFormularioPassword() {
    const passwordForm =
        document.getElementById("passwordForm");

    if (!passwordForm) {
        return;
    }

    passwordForm.addEventListener("submit", cambiarPassword);
}

async function cambiarPassword(event) {
    event.preventDefault();

    const formulario = event.currentTarget;

    if (!formulario.checkValidity()) {
        formulario.reportValidity();
        return;
    }

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
        mostrarToast(
            "Las nuevas contraseñas no coinciden.",
            "warning"
        );

        return;
    }

    if (newPassword.length < 8) {
        mostrarToast(
            "La nueva contraseña debe tener al menos 8 caracteres.",
            "warning"
        );

        return;
    }

    try {
        const submitButton =
            formulario.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Actualizando...
            `;
        }

        const respuesta = await fetch(
            `${PROFILE_API_URL}/password`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            mostrarToast(
                resultado.message ||
                "No se pudo actualizar la contraseña.",
                "error"
            );

            return;
        }

        formulario.reset();

        mostrarToast(
            "Contraseña actualizada correctamente.",
            "success"
        );

    } catch (error) {
        console.error("Error al cambiar la contraseña:", error);

        mostrarToast(
            "No se pudo conectar con el servidor.",
            "error"
        );

    } finally {
        const submitButton =
            formulario.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <i class="fa-solid fa-key"></i>
                Cambiar contraseña
            `;
        }
    }
}

/* ========================================
   SEGURIDAD PARA VALORES HTML
======================================== */

function escaparHTML(valor) {
    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}