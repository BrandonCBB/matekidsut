const botonesTema =
    document.querySelectorAll(".option-button");

botonesTema.forEach((boton) => {
    boton.addEventListener("click", async () => {
        const accion = boton.dataset.action;
        const tema = boton.dataset.tema;

        if (!accion || !tema) {
            console.error("Faltan datos en el botón.");
            return;
        }

        let destinoActual;
        let destinoLogin;

        if (accion === "practicar") {
            destinoActual =
                `../../practicar.html?categoria=${tema}`;

            destinoLogin =
                `practicar.html?categoria=${tema}`;

        } else if (accion === "maestro") {
            destinoActual = "maestro.html";

            destinoLogin =
                `ejercicios/${tema}/maestro.html`;

        } else {
            console.error(
                `Acción no reconocida: ${accion}`
            );

            return;
        }

        const sesion = await obtenerSesion();

        if (!sesion.autenticado) {
            const redirect =
                encodeURIComponent(destinoLogin);

            window.location.href =
                `../../login.html?redirect=${redirect}`;

            return;
        }

        window.location.href = destinoActual;
    });
});