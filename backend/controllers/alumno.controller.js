const pool = require("../config/db");

/**
 * Obtener ejercicios disponibles por categoría.
 *
 * Ejemplo:
 * GET /api/alumno/ejercicios/Suma
 */
const getEjerciciosPorCategoria = async (req, res) => {
    try {
        const { categoria } = req.params;

        if (!categoria) {
            return res.status(400).json({
                error: "La categoría es obligatoria",
            });
        }

        const [ejercicios] = await pool.query(
            `
            SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                c.id_categoria,
                c.nombre AS categoria,
                CONCAT(
                    u.nombre,
                    ' ',
                    u.ap_paterno
                ) AS docente,
                COUNT(p.id_pregunta) AS total_preguntas
            FROM ejercicio e
            INNER JOIN categoria c
                ON e.id_categoria = c.id_categoria
            INNER JOIN usuario u
                ON e.id_docente = u.id_usuario
            LEFT JOIN pregunta p
                ON e.id_ejercicio = p.id_ejercicio
            WHERE LOWER(c.nombre) = LOWER(?)
            GROUP BY
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                c.id_categoria,
                c.nombre,
                u.nombre,
                u.ap_paterno
            HAVING COUNT(p.id_pregunta) > 0
            ORDER BY e.fecha_creacion DESC,
                     e.id_ejercicio DESC
            `,
            [categoria]
        );

        res.json({
            categoria,
            total: ejercicios.length,
            ejercicios,
        });
    } catch (error) {
        console.error(
            "Error al obtener ejercicios por categoría:",
            error
        );

        res.status(500).json({
            error: "No se pudieron obtener los ejercicios",
        });
    }
};

/**
 * Obtener un ejercicio y sus preguntas.
 *
 * No se envían las respuestas correctas al frontend.
 *
 * Ejemplo:
 * GET /api/alumno/ejercicio/1
 */
const getEjercicioParaResolver = async (req, res) => {
    try {
        const idEjercicio = Number(req.params.id);

        if (
            !Number.isInteger(idEjercicio) ||
            idEjercicio <= 0
        ) {
            return res.status(400).json({
                error: "El ID del ejercicio no es válido",
            });
        }

        const [ejercicios] = await pool.query(
            `
            SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                c.id_categoria,
                c.nombre AS categoria,
                CONCAT(
                    u.nombre,
                    ' ',
                    u.ap_paterno
                ) AS docente
            FROM ejercicio e
            INNER JOIN categoria c
                ON e.id_categoria = c.id_categoria
            INNER JOIN usuario u
                ON e.id_docente = u.id_usuario
            WHERE e.id_ejercicio = ?
            LIMIT 1
            `,
            [idEjercicio]
        );

        if (ejercicios.length === 0) {
            return res.status(404).json({
                error: "Ejercicio no encontrado",
            });
        }

        const [preguntas] = await pool.query(
            `
            SELECT
                id_pregunta,
                pregunta
            FROM pregunta
            WHERE id_ejercicio = ?
            ORDER BY id_pregunta ASC
            `,
            [idEjercicio]
        );

        if (preguntas.length === 0) {
            return res.status(404).json({
                error: "Este ejercicio todavía no tiene preguntas",
            });
        }

        res.json({
            ejercicio: {
                ...ejercicios[0],
                total_preguntas: preguntas.length,
            },
            preguntas,
        });
    } catch (error) {
        console.error(
            "Error al obtener ejercicio para resolver:",
            error
        );

        res.status(500).json({
            error: "No se pudo cargar el ejercicio",
        });
    }
};

/**
 * Calificar y guardar las respuestas del alumno.
 *
 * Body esperado:
 * {
 *   "id_ejercicio": 1,
 *   "respuestas": [
 *      {
 *        "id_pregunta": 1,
 *        "respuesta": "8"
 *      }
 *   ]
 * }
 */
const enviarRespuestas = async (req, res) => {
    let connection;

    try {
        const idUsuario =
            req.session.usuario.id_usuario;

        const idEjercicio = Number(
            req.body.id_ejercicio
        );

        const { respuestas } = req.body;

        if (
            !Number.isInteger(idEjercicio) ||
            idEjercicio <= 0
        ) {
            return res.status(400).json({
                error: "El ID del ejercicio no es válido",
            });
        }

        if (
            !Array.isArray(respuestas) ||
            respuestas.length === 0
        ) {
            return res.status(400).json({
                error: "Debes enviar al menos una respuesta",
            });
        }

        const respuestasValidas = respuestas.every(
            (item) =>
                Number.isInteger(
                    Number(item.id_pregunta)
                ) &&
                Number(item.id_pregunta) > 0 &&
                item.respuesta !== undefined &&
                item.respuesta !== null &&
                String(item.respuesta).trim() !== ""
        );

        if (!respuestasValidas) {
            return res.status(400).json({
                error: "Hay respuestas incompletas o inválidas",
            });
        }

        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [preguntasBD] = await connection.query(
            `
            SELECT
                p.id_pregunta,
                p.pregunta,
                rc.respuesta AS respuesta_correcta
            FROM pregunta p
            INNER JOIN respuesta_correcta rc
                ON p.id_pregunta = rc.id_pregunta
            WHERE p.id_ejercicio = ?
            ORDER BY p.id_pregunta ASC
            `,
            [idEjercicio]
        );

        if (preguntasBD.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                error: "El ejercicio no existe o no tiene preguntas",
            });
        }

        if (
            respuestas.length !== preguntasBD.length
        ) {
            await connection.rollback();

            return res.status(400).json({
                error:
                    "Debes responder todas las preguntas del ejercicio",
            });
        }

        const mapaRespuestas = new Map();

        for (const item of respuestas) {
            const idPregunta = Number(
                item.id_pregunta
            );

            if (mapaRespuestas.has(idPregunta)) {
                await connection.rollback();

                return res.status(400).json({
                    error:
                        "No puedes enviar una pregunta más de una vez",
                });
            }

            mapaRespuestas.set(
                idPregunta,
                String(item.respuesta).trim()
            );
        }

        let aciertos = 0;
        const resultados = [];

        for (const preguntaBD of preguntasBD) {
            const respuestaAlumno =
                mapaRespuestas.get(
                    preguntaBD.id_pregunta
                );

            if (respuestaAlumno === undefined) {
                await connection.rollback();

                return res.status(400).json({
                    error:
                        "Una o más preguntas no pertenecen al ejercicio",
                });
            }

            const respuestaCorrecta =
                normalizarRespuesta(
                    preguntaBD.respuesta_correcta
                );

            const respuestaNormalizada =
                normalizarRespuesta(
                    respuestaAlumno
                );

            const esCorrecta =
                respuestaNormalizada ===
                respuestaCorrecta;

            if (esCorrecta) {
                aciertos++;
            }

            resultados.push({
                id_pregunta:
                    preguntaBD.id_pregunta,
                pregunta:
                    preguntaBD.pregunta,
                respuesta_alumno:
                    respuestaAlumno,
                respuesta_correcta:
                    preguntaBD.respuesta_correcta,
                es_correcta: esCorrecta,
            });
        }

        const totalPreguntas =
            preguntasBD.length;

        const errores =
            totalPreguntas - aciertos;

        const calificacion = Number(
            (
                (aciertos / totalPreguntas) *
                10
            ).toFixed(1)
        );

        const porcentaje = Number(
            (
                (aciertos / totalPreguntas) *
                100
            ).toFixed(1)
        );

        /*
            Primero creamos el intento.
        */
        const [resultadoIntento] =
            await connection.query(
                `
                INSERT INTO intento_ejercicio (
                    id_usuario,
                    id_ejercicio,
                    aciertos,
                    errores,
                    total_preguntas,
                    porcentaje,
                    calificacion
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    idUsuario,
                    idEjercicio,
                    aciertos,
                    errores,
                    totalPreguntas,
                    porcentaje,
                    calificacion,
                ]
            );

        const idIntento =
            resultadoIntento.insertId;

        /*
            Después guardamos las respuestas
            relacionadas con el intento.
        */
        for (const resultado of resultados) {
            await connection.query(
                `
                INSERT INTO respuesta_alumno (
                    respuesta,
                    es_correcta,
                    fecha_respuesta,
                    id_usuario,
                    id_pregunta,
                    id_intento
                )
                VALUES (?, ?, CURDATE(), ?, ?, ?)
                `,
                [
                    resultado.respuesta_alumno,
                    resultado.es_correcta ? 1 : 0,
                    idUsuario,
                    resultado.id_pregunta,
                    idIntento,
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            mensaje:
                "Ejercicio calificado correctamente",
            resultado: {
                id_intento: idIntento,
                total_preguntas:
                    totalPreguntas,
                aciertos,
                errores,
                calificacion,
                porcentaje,
            },
            respuestas: resultados,
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(
            "Error al enviar respuestas:",
            error
        );

        res.status(500).json({
            error:
                "No se pudieron calificar las respuestas",
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Evita diferencias por espacios o mayúsculas.
 *
 * Ejemplos:
 * "  Ocho " → "ocho"
 * "8" → "8"
 */

const getHistorial = async (req, res) => {
    try {
        const idUsuario =
            req.session.usuario.id_usuario;

        const [historial] = await pool.query(
            `
            SELECT
                i.id_intento,
                i.aciertos,
                i.errores,
                i.total_preguntas,
                i.porcentaje,
                i.calificacion,
                i.fecha_intento,

                e.id_ejercicio,
                e.titulo,
                e.descripcion,

                c.id_categoria,
                c.nombre AS categoria,

                CONCAT(
                    u.nombre,
                    ' ',
                    u.ap_paterno
                ) AS docente

            FROM intento_ejercicio i

            INNER JOIN ejercicio e
                ON i.id_ejercicio = e.id_ejercicio

            INNER JOIN categoria c
                ON e.id_categoria = c.id_categoria

            INNER JOIN usuario u
                ON e.id_docente = u.id_usuario

            WHERE i.id_usuario = ?

            ORDER BY
                i.fecha_intento DESC,
                i.id_intento DESC
            `,
            [idUsuario]
        );

        return res.json({
            total: historial.length,
            historial,
        });
    } catch (error) {
        console.error(
            "Error al obtener el historial del alumno:",
            error
        );

        return res.status(500).json({
            error: "No se pudo obtener el historial",
        });
    }
};

/**
 * Obtener el detalle de un intento del alumno.
 *
 * Ejemplo:
 * GET /api/alumno/historial/15
 */
const getDetalleIntento = async (req, res) => {
    try {
        const idUsuario =
            req.session.usuario.id_usuario;

        const idIntento =
            Number(req.params.id);

        if (
            !Number.isInteger(idIntento) ||
            idIntento <= 0
        ) {
            return res.status(400).json({
                error:
                    "El ID del intento no es válido",
            });
        }

        /*
         * Primero buscamos la información general
         * del intento.
         *
         * También verificamos que pertenezca
         * al alumno que inició sesión.
         */
        const [intentos] = await pool.query(
            `
            SELECT
                i.id_intento,
                i.id_usuario,
                i.id_ejercicio,
                i.aciertos,
                i.errores,
                i.total_preguntas,
                i.porcentaje,
                i.calificacion,
                i.fecha_intento,

                e.titulo,
                e.descripcion,

                c.id_categoria,
                c.nombre AS categoria,

                CONCAT(
                    u.nombre,
                    ' ',
                    u.ap_paterno
                ) AS docente

            FROM intento_ejercicio i

            INNER JOIN ejercicio e
                ON i.id_ejercicio =
                   e.id_ejercicio

            INNER JOIN categoria c
                ON e.id_categoria =
                   c.id_categoria

            INNER JOIN usuario u
                ON e.id_docente =
                   u.id_usuario

            WHERE i.id_intento = ?
              AND i.id_usuario = ?

            LIMIT 1
            `,
            [
                idIntento,
                idUsuario,
            ]
        );

        if (intentos.length === 0) {
            return res.status(404).json({
                error:
                    "No se encontró el intento solicitado",
            });
        }

        /*
         * Recuperamos todas las respuestas
         * relacionadas con ese intento.
         */
        const [respuestas] = await pool.query(
            `
            SELECT
                ra.id_respuesta_alumno,
                ra.id_pregunta,
                ra.respuesta AS respuesta_alumno,
                ra.es_correcta,
                ra.fecha_respuesta,

                p.pregunta,

                rc.respuesta AS respuesta_correcta

            FROM respuesta_alumno ra

            INNER JOIN pregunta p
                ON ra.id_pregunta =
                   p.id_pregunta

            INNER JOIN respuesta_correcta rc
                ON p.id_pregunta =
                   rc.id_pregunta

            WHERE ra.id_intento = ?
              AND ra.id_usuario = ?

            ORDER BY
                ra.id_respuesta_alumno ASC
            `,
            [
                idIntento,
                idUsuario,
            ]
        );

        return res.json({
            intento: intentos[0],
            total_respuestas:
                respuestas.length,
            respuestas,
        });
    } catch (error) {
        console.error(
            "Error al obtener el detalle del intento:",
            error
        );

        return res.status(500).json({
            error:
                "No se pudo obtener el detalle del intento",
        });
    }
};

function normalizarRespuesta(respuesta) {
    return String(respuesta ?? "")
        .trim()
        .toLowerCase()
        .replace(",", ".")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

module.exports = {
    getEjerciciosPorCategoria,
    getEjercicioParaResolver,
    enviarRespuestas,
    getHistorial,
    getDetalleIntento,
};