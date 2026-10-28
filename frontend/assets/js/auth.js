const AUTH_API_URL = "http://localhost:3000/api/auth";

/* ========================================
   CALCULAR RUTAS DEL FRONTEND
======================================== */

function obtenerRutaFrontend(archivo = "") {
    const rutaActual = window.location.pathname;
    const marcador = "/frontend/";
    const posicionFrontend = rutaActual.indexOf(marcador);

    if (posicionFrontend === -1) {
        console.error("No se encontró la carpeta frontend en la URL.");
        return archivo;
    }

    const raizFrontend = rutaActual.substring(
        0,
        posicionFrontend + marcador.length
    );

    return `${raizFrontend}${archivo}`;
}

/* ========================================
   CONSULTAR SESIÓN
======================================== */

async function consultarSesion() {
    try {
        const respuesta = await fetch(`${AUTH_API_URL}/session`, {
            method: "GET",
            credentials: "include"
        });

        if (!respuesta.ok) {
            return {
                autenticado: false,
                usuario: null
            };
        }

        return await respuesta.json();

    } catch (error) {
        console.error("Error al verificar la sesión:", error);

        return {
            autenticado: false,
            usuario: null
        };
    }
}

/* ========================================
   PROTEGER PÁGINAS
======================================== */

async function protegerPagina(rolesPermitidos = []) {
    const sesion = await consultarSesion();

    if (!sesion.autenticado || !sesion.usuario) {
        const paginaActual =
            window.location.pathname + window.location.search;

        const redirect = encodeURIComponent(paginaActual);

        const loginUrl = obtenerRutaFrontend(
            `login.html?redirect=${redirect}`
        );

        window.location.replace(loginUrl);
        return null;
    }

    const idRol = Number(sesion.usuario.id_rol);

    if (
        rolesPermitidos.length > 0 &&
        !rolesPermitidos.includes(idRol)
    ) {
        redirigirSegunRol(idRol);
        return null;
    }

    configurarEnlacesRol(idRol);

    return sesion.usuario;
}

/* ========================================
   REDIRIGIR SEGÚN ROL
======================================== */

function redirigirSegunRol(idRol) {
    let paginaDestino = "login.html";

    switch (Number(idRol)) {
        case 1:
            paginaDestino = "admin.html";
            break;

        case 2:
            paginaDestino = "maestro.html";
            break;

        case 3:
            paginaDestino = "alumno.html";
            break;
    }

    window.location.replace(
        obtenerRutaFrontend(paginaDestino)
    );
}

/* ========================================
   CONFIGURAR ENLACES SEGÚN ROL
======================================== */

function configurarEnlacesRol(idRol) {
    let paginaInicio = "index.html";

    switch (Number(idRol)) {
        case 1:
            paginaInicio = "admin.html";
            break;

        case 2:
            paginaInicio = "maestro.html";
            break;

        case 3:
            paginaInicio = "alumno.html";
            break;
    }

    document
        .querySelectorAll(".role-home-link")
        .forEach((enlace) => {
            enlace.href = obtenerRutaFrontend(paginaInicio);
        });
}