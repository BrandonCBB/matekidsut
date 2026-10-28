const cards = document.querySelectorAll(".card");

function abrirTema(card) {
    const tema = card.dataset.tema;

    if (!tema) {
        console.error("La tarjeta no tiene definido el tema.");
        return;
    }

    window.location.href = `ejercicios/${tema}/menu.html`;
}

cards.forEach((card) => {
    card.addEventListener("click", () => {
        abrirTema(card);
    });

    card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            abrirTema(card);
        }
    });
});