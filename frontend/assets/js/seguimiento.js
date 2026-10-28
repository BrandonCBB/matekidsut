const API =
    "http://localhost:3000/api/ejercicios/alumnos";

const contenedor =
    document.getElementById("contenedorAlumnos");

const buscador =
    document.getElementById("buscarAlumno");

let alumnos = [];

document.addEventListener(
    "DOMContentLoaded",
    cargarAlumnos
);

async function cargarAlumnos() {

    try {

        const respuesta = await fetch(API,{
            credentials:"include"
        });

        const data = await respuesta.json();

        alumnos = data.alumnos;

        renderizar(alumnos);

    } catch (error) {

        console.error(error);

    }

}

function renderizar(lista){

    if(lista.length===0){

        contenedor.innerHTML=`
            <p>No hay alumnos.</p>
        `;

        return;

    }

    contenedor.innerHTML="";

    lista.forEach(alumno=>{

        contenedor.innerHTML+=`

        <article class="student-card">

            <div class="student-name">
                ${alumno.nombre_completo}
            </div>

            <div class="student-email">
                ${alumno.correo}
            </div>

            <div class="student-stats">

                <div class="stat">
                    <h3>${alumno.promedio}</h3>
                    <span>Promedio</span>
                </div>

                <div class="stat">
                    <h3>${alumno.total_intentos}</h3>
                    <span>Intentos</span>
                </div>

                <div class="stat">
                    <h3>${alumno.ejercicios_realizados}</h3>
                    <span>Ejercicios</span>
                </div>

                <div class="stat">
                    <h3>${alumno.mejor_calificacion}</h3>
                    <span>Mejor</span>
                </div>

            </div>

            <button
                class="btn-history"
                data-id="${alumno.id_usuario}">

                <i class="fa-solid fa-chart-line"></i>

                Ver historial

            </button>

        </article>

        `;

    });

}

buscador.addEventListener("input",()=>{

    const texto=
        buscador.value.toLowerCase();

    const filtrados=
        alumnos.filter(alumno=>

            alumno.nombre_completo
            .toLowerCase()
            .includes(texto)

        );

    renderizar(filtrados);

});

document.addEventListener("click",(e)=>{

    const boton=
        e.target.closest(".btn-history");

    if(!boton) return;

    const id=
        boton.dataset.id;

    window.location.href=
        `historial-alumno.html?id=${id}`;

});