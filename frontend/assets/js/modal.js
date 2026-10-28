let modalConfirmCallback = null;

async function cargarModal() {
    const modalExistente = document.getElementById("modalOverlay");

    if (modalExistente) {
        configurarEventosModal();
        return;
    }

    try {
        const respuesta = await fetch(
            obtenerRutaFrontend("assets/components/modal.html")
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar modal.html");
        }

        const html = await respuesta.text();

        document.body.insertAdjacentHTML("beforeend", html);

        configurarEventosModal();

    } catch (error) {
        console.error("Error al cargar el modal:", error);
    }
}

function configurarEventosModal() {
    const overlay = document.getElementById("modalOverlay");
    const closeButton = document.getElementById("modalCloseButton");
    const cancelButton = document.getElementById("modalCancelButton");
    const confirmButton = document.getElementById("modalConfirmButton");

    if (!overlay || !closeButton || !cancelButton || !confirmButton) {
        return;
    }

    closeButton.addEventListener("click", cerrarModal);
    cancelButton.addEventListener("click", cerrarModal);

    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) {
            cerrarModal();
        }
    });

    confirmButton.addEventListener("click", async () => {
    if (typeof modalConfirmCallback !== "function") {
        cerrarModal();
        return;
    }

    const resultado = await modalConfirmCallback();

    if (resultado !== false && resultado !== null) {
        cerrarModal();
    }
});

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !overlay.classList.contains("hidden")) {
            cerrarModal();
        }
    });
}

function abrirModal({
    titulo,
    contenido = "",
    textoConfirmar = "Confirmar",
    textoCancelar = "Cancelar",
    icono = "fa-circle-info",
    peligro = false,
    mostrarCancelar = true,
    onConfirm = null
}) {
    const overlay = document.getElementById("modalOverlay");
    const title = document.getElementById("modalTitle");
    const content = document.getElementById("modalContent");
    const icon = document.querySelector("#modalIcon i");
    const confirmButton = document.getElementById("modalConfirmButton");
    const cancelButton = document.getElementById("modalCancelButton");

    if (
        !overlay ||
        !title ||
        !content ||
        !icon ||
        !confirmButton ||
        !cancelButton
    ) {
        console.error("El modal todavía no está cargado.");
        return;
    }

    title.textContent = titulo;
    content.innerHTML = contenido;
    icon.className = `fa-solid ${icono}`;

    confirmButton.textContent = textoConfirmar;
    cancelButton.textContent = textoCancelar;

    confirmButton.classList.toggle("danger", peligro);
    cancelButton.classList.toggle("hidden", !mostrarCancelar);

    modalConfirmCallback = onConfirm;

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    const overlay = document.getElementById("modalOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.add("hidden");
    document.body.style.overflow = "";
    modalConfirmCallback = null;
}

document.addEventListener("DOMContentLoaded", cargarModal);