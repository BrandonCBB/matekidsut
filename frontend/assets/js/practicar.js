const TOTAL_PREGUNTAS = 5;

let categoriaActual = "suma";
let preguntas = [];
let indicePregunta = 0;
let aciertos = 0;
let respuestaProcesada = false;

document.addEventListener("DOMContentLoaded", async () => {
    const usuario = await protegerPagina([3]);

    if (!usuario) {
        return;
    }

    document.body.classList.add("auth-ready");

    categoriaActual = obtenerCategoriaURL();

    configurarPagina();
    configurarEventos();
    iniciarPractica();
});

/* ========================================
   OBTENER CATEGORÍA
======================================== */

function obtenerCategoriaURL() {
    const parametros = new URLSearchParams(
        window.location.search
    );

    const categoria =
        parametros.get("categoria")?.toLowerCase();

    const categoriasValidas = [
        "suma",
        "resta",
        "multiplicacion",
        "division"
    ];

    if (!categoriasValidas.includes(categoria)) {
        return "suma";
    }

    return categoria;
}

/* ========================================
   LINEA DEL HEADER
======================================== */

function marcarTemaActivo() {
    const enlaces =
        document.querySelectorAll(
            "nav [data-categoria]"
        );

    enlaces.forEach((enlace) => {
        enlace.classList.remove("active");

        if (
            enlace.dataset.categoria ===
            categoriaActual
        ) {
            enlace.classList.add("active");
        }
    });
}

/* ========================================
   CONFIGURAR PÁGINA
======================================== */

function configurarPagina() {
    const nombres = {
        suma: "Suma",
        resta: "Resta",
        multiplicacion: "Multiplicación",
        division: "División"
    };

    const nombre = nombres[categoriaActual];

    colocarTexto(
        "practiceTitle",
        `Practicar ${nombre}`
    );

    colocarTexto("categoryName", nombre);

    document.title =
        `MateKids UT | Practicar ${nombre}`;

    marcarTemaActivo();
}

function configurarEventos() {
    const formulario =
        document.getElementById("practiceForm");

    const practiceAgainButton =
        document.getElementById(
            "practiceAgainButton"
        );

    formulario?.addEventListener(
        "submit",
        comprobarRespuesta
    );

    practiceAgainButton?.addEventListener(
        "click",
        iniciarPractica
    );
}

/* ========================================
   INICIAR PRÁCTICA
======================================== */

function iniciarPractica() {
    preguntas = generarPreguntas();
    indicePregunta = 0;
    aciertos = 0;
    respuestaProcesada = false;

    document
        .getElementById("practiceSection")
        ?.classList.remove("hidden");

    document
        .getElementById("resultSection")
        ?.classList.add("hidden");

    mostrarPregunta();
}

/* ========================================
   GENERAR PREGUNTAS
======================================== */

function generarPreguntas() {
    const nuevasPreguntas = [];

    for (let i = 0; i < TOTAL_PREGUNTAS; i++) {
        nuevasPreguntas.push(
            generarPregunta(categoriaActual)
        );
    }

    return nuevasPreguntas;
}

function generarPregunta(categoria) {
    switch (categoria) {
        case "resta":
            return generarResta();

        case "multiplicacion":
            return generarMultiplicacion();

        case "division":
            return generarDivision();

        case "suma":
        default:
            return generarSuma();
    }
}

function generarSuma() {
    const numero1 = aleatorio(1, 50);
    const numero2 = aleatorio(1, 50);

    return {
        numero1,
        numero2,
        simbolo: "+",
        respuestaCorrecta: numero1 + numero2
    };
}

function generarResta() {
    let numero1 = aleatorio(1, 50);
    let numero2 = aleatorio(1, 50);

    if (numero2 > numero1) {
        [numero1, numero2] = [numero2, numero1];
    }

    return {
        numero1,
        numero2,
        simbolo: "−",
        respuestaCorrecta: numero1 - numero2
    };
}

function generarMultiplicacion() {
    const numero1 = aleatorio(1, 10);
    const numero2 = aleatorio(1, 10);

    return {
        numero1,
        numero2,
        simbolo: "×",
        respuestaCorrecta: numero1 * numero2
    };
}

function generarDivision() {
    const divisor = aleatorio(1, 10);
    const resultado = aleatorio(1, 10);
    const dividendo = divisor * resultado;

    return {
        numero1: dividendo,
        numero2: divisor,
        simbolo: "÷",
        respuestaCorrecta: resultado
    };
}

function aleatorio(minimo, maximo) {
    return Math.floor(
        Math.random() * (maximo - minimo + 1)
    ) + minimo;
}

function mostrarOperacion(pregunta) {
    const contenedor =
        document.getElementById("operationText");

    if (!contenedor) {
        return;
    }

    if (categoriaActual === "division") {
        contenedor.className =
            "horizontal-division";

        contenedor.innerHTML = `
            <span>${pregunta.numero1}</span>
            <span class="division-symbol">÷</span>
            <span>${pregunta.numero2}</span>
            <span>=</span>
            <span class="answer-space">?</span>
        `;

        return;
    }

    contenedor.className =
        "vertical-operation";

    contenedor.innerHTML = `
        <span class="operation-top">
            ${pregunta.numero1}
        </span>

        <div class="operation-bottom">
            <span class="operation-symbol">
                ${pregunta.simbolo}
            </span>

            <span class="operation-number">
                ${pregunta.numero2}
            </span>
        </div>

        <div class="operation-line"></div>
    `;
}

/* ========================================
   MOSTRAR PREGUNTA
======================================== */

function mostrarPregunta() {
    const pregunta = preguntas[indicePregunta];

    respuestaProcesada = false;

    colocarTexto(
        "questionCounter",
        `Pregunta ${indicePregunta + 1} de ${TOTAL_PREGUNTAS}`
    );

    mostrarOperacion(pregunta);

    actualizarProgreso();

    const input =
        document.getElementById("studentAnswer");

    if (input) {
        input.value = "";
        input.disabled = false;
        input.focus();
    }

    const boton =
        document.querySelector(
            "#practiceForm button[type='submit']"
        );

    if (boton) {
        boton.disabled = false;
        boton.innerHTML = "Comprobar respuesta";
    }

    ocultarRetroalimentacion();
}

function actualizarProgreso() {
    const progressValue =
        document.getElementById("progressValue");

    const porcentaje =
        ((indicePregunta + 1) / TOTAL_PREGUNTAS) * 100;

    if (progressValue) {
        progressValue.style.width = `${porcentaje}%`;
    }
}

/* ========================================
   COMPROBAR RESPUESTA
======================================== */

function comprobarRespuesta(event) {
    event.preventDefault();

    if (respuestaProcesada) {
        avanzarPregunta();
        return;
    }

    const input =
        document.getElementById("studentAnswer");

    if (!input || input.value.trim() === "") {
        mostrarToast(
            "Escribe una respuesta.",
            "warning"
        );

        return;
    }

    const respuestaAlumno = Number(input.value);
    const pregunta = preguntas[indicePregunta];

    const esCorrecta =
        respuestaAlumno ===
        Number(pregunta.respuestaCorrecta);

    respuestaProcesada = true;

    if (esCorrecta) {
        aciertos++;

        mostrarRetroalimentacion(
            "¡Respuesta correcta!",
            "correct"
        );
    } else {
        mostrarRetroalimentacion(
            `Respuesta incorrecta. La respuesta correcta es ${pregunta.respuestaCorrecta}.`,
            "incorrect"
        );
    }

    input.disabled = true;

    const boton =
        document.querySelector(
            "#practiceForm button[type='submit']"
        );

    if (boton) {
        boton.innerHTML =
            indicePregunta === TOTAL_PREGUNTAS - 1
                ? "Ver resultado"
                : "Siguiente pregunta";
    }
}

/* ========================================
   AVANZAR
======================================== */

function avanzarPregunta() {
    indicePregunta++;

    if (indicePregunta >= TOTAL_PREGUNTAS) {
        mostrarResultado();
        return;
    }

    mostrarPregunta();
}

/* ========================================
   RETROALIMENTACIÓN
======================================== */

function mostrarRetroalimentacion(
    mensaje,
    tipo
) {
    const feedback =
        document.getElementById("answerFeedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = mensaje;
    feedback.className =
        `answer-feedback ${tipo}`;
}

function ocultarRetroalimentacion() {
    const feedback =
        document.getElementById("answerFeedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = "";
    feedback.className =
        "answer-feedback hidden";
}

/* ========================================
   RESULTADO FINAL
======================================== */

function mostrarResultado() {
    const errores = TOTAL_PREGUNTAS - aciertos;
    const porcentaje =
        Math.round(
            (aciertos / TOTAL_PREGUNTAS) * 100
        );

    const calificacion =
        ((aciertos / TOTAL_PREGUNTAS) * 10)
            .toFixed(1);

    document
        .getElementById("practiceSection")
        ?.classList.add("hidden");

    document
        .getElementById("resultSection")
        ?.classList.remove("hidden");

    colocarTexto("correctAnswers", aciertos);
    colocarTexto("incorrectAnswers", errores);
    colocarTexto(
        "resultPercentage",
        `${porcentaje}%`
    );
    colocarTexto("resultGrade", calificacion);

    if(aciertos == TOTAL_PREGUNTAS) {
        lanzarConfeti();
    }
}

/* ========================================
   UTILIDADES
======================================== */

function lanzarConfeti() {
    if (typeof confetti !== "function") {
        return;
    }

    confetti({
        particleCount: 120,
        spread: 80,
        origin: {
            y: 0.65
        }
    });

    setTimeout(() => {
        confetti({
            particleCount: 80,
            angle: 60,
            spread: 70,
            origin: {
                x: 0,
                y: 0.7
            }
        });

        confetti({
            particleCount: 80,
            angle: 120,
            spread: 70,
            origin: {
                x: 1,
                y: 0.7
            }
        });
    }, 300);
}

function colocarTexto(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }
}