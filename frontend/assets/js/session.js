const API_URL = "http://localhost:3000";

async function obtenerSesion() {
    try {
        const respuesta = await fetch(`${API_URL}/api/auth/session`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo consultar la sesión");
        }

        return await respuesta.json();

    } catch (error) {
        console.error("Error al consultar la sesión:", error);

        return {
            autenticado: false,
            usuario: null
        };
    }
}

async function actualizarHeaderSesion() {
    const guestActions = document.getElementById("guestActions");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");

    if (!userMenu || !userName) {
        return;
    }

    const sesion = await obtenerSesion();

    if (sesion.autenticado && sesion.usuario) {
        if (guestActions) {
            guestActions.classList.add("hidden");
        }

        userMenu.classList.remove("hidden");
        userName.textContent = sesion.usuario.nombre || "Usuario";

    } else {
        if (guestActions) {
            guestActions.classList.remove("hidden");
        }

        userMenu.classList.add("hidden");
    }
}

function configurarMenuUsuario() {
    const userButton = document.getElementById("userButton");
    const userDropdown = document.getElementById("userDropdown");
    const logoutButton = document.getElementById("logoutButton");

    if (!userButton || !userDropdown) {
        return;
    }

    userButton.addEventListener("click", (event) => {
        event.stopPropagation();

        userDropdown.classList.toggle("hidden");
        userButton.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        if (!userDropdown.contains(event.target)) {
            userDropdown.classList.add("hidden");
            userButton.classList.remove("open");
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener("click", cerrarSesion);
    }
}

async function cerrarSesion() {
    try {
        const respuesta = await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.message || "No se pudo cerrar la sesión");
        }

        window.location.href = obtenerRutaInicio();

    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión");
    }
}

function obtenerRutaInicio() {
    const rutaActual = window.location.pathname;

    if (rutaActual.includes("/ejercicios/")) {
        return "../../alumno.html";
    }

    return "alumno.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await actualizarHeaderSesion();
    configurarMenuUsuario();
});