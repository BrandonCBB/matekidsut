async function cargarToastContainer() {
    const contenedorExistente =
        document.getElementById("toastContainer");

    if (contenedorExistente) {
        return;
    }

    try {
        const respuesta = await fetch(
            obtenerRutaFrontend("assets/components/toast.html")
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar toast.html");
        }

        const html = await respuesta.text();

        document.body.insertAdjacentHTML("beforeend", html);

    } catch (error) {
        console.error("Error al cargar los toasts:", error);
    }
}

function mostrarToast(mensaje, tipo = "info", duracion = 3500) {
    const container = document.getElementById("toastContainer");

    if (!container) {
        console.error("El contenedor de toasts todavía no está cargado.");
        return;
    }

    const iconos = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;

    const icono = iconos[tipo] || iconos.info;

    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${icono}"></i>
        </div>

        <p class="toast-message"></p>
    `;

    toast.querySelector(".toast-message").textContent = mensaje;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("removing");

        toast.addEventListener(
            "animationend",
            () => toast.remove(),
            { once: true }
        );
    }, duracion);
}

document.addEventListener("DOMContentLoaded", cargarToastContainer);