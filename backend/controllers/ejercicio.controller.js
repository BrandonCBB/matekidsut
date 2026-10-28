const pool = require("../config/db");

/* ========================================
   OBTENER CATEGORÍAS
======================================== */

const getCategorias = async (req, res) => {
    try {
        const [categorias] = await pool.query(
            `SELECT
                id_categoria,
                nombre
            FROM categoria
            ORDER BY id_categoria ASC`
        );

        return res.status(200).json({
            categorias
        });

    } catch (error) {
        console.error("Error al obtener categorías:", error);

        return res.status(500).json({
            message: "Error al obtener las categorías"
        });
    }
};

/* ========================================
   OBTENER EJERCICIOS DEL DOCENTE
======================================== */

const getMisEjercicios = async (req, res) => {
    try {
        const idDocente = req.session.usuario.id_usuario;

        const [ejercicios] = await pool.query(
            `SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_docente,
                e.id_categoria,
                c.nombre AS categoria,
                COUNT(p.id_pregunta) AS total_preguntas
            FROM ejercicio AS e
            INNER JOIN categoria AS c
                ON c.id_categoria = e.id_categoria
            LEFT JOIN pregunta AS p
                ON p.id_ejercicio = e.id_ejercicio
            WHERE e.id_docente = ?
            GROUP BY
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_docente,
                e.id_categoria,
                c.nombre
            ORDER BY e.fecha_creacion DESC, e.id_ejercicio DESC`,
            [idDocente]
        );

        return res.status(200).json({
            ejercicios
        });

    } catch (error) {
        console.error("Error al obtener ejercicios:", error);

        return res.status(500).json({
            message: "Error al obtener los ejercicios"
        });
    }
};

/* ========================================
   OBTENER ESTADÍSTICAS DEL DOCENTE
======================================== */

const getEstadisticasDocente = async (req, res) => {
    try {
        const idDocente =
            req.session.usuario.id_usuario;

        const [resultados] = await pool.query(
            `
            SELECT
                COUNT(DISTINCT e.id_ejercicio)
                    AS ejercicios,

                COUNT(DISTINCT i.id_usuario)
                    AS alumnos,

                COUNT(DISTINCT i.id_intento)
                    AS respuestas

            FROM ejercicio AS e

            LEFT JOIN intento_ejercicio AS i
                ON i.id_ejercicio = e.id_ejercicio

            WHERE e.id_docente = ?
            `,
            [idDocente]
        );

        const estadisticas = resultados[0];

        return res.status(200).json({
            estadisticas: {
                ejercicios:
                    Number(estadisticas.ejercicios) || 0,

                alumnos:
                    Number(estadisticas.alumnos) || 0,

                respuestas:
                    Number(estadisticas.respuestas) || 0
            }
        });

    } catch (error) {
        console.error(
            "Error al obtener estadísticas del docente:",
            error
        );

        return res.status(500).json({
            message:
                "Error al obtener las estadísticas"
        });
    }
};

/* ========================================
   CREAR EJERCICIO
======================================== */

const createEjercicio = async (req, res) => {
    try {
        const idDocente = req.session.usuario.id_usuario;

        const {
            titulo,
            descripcion,
            id_categoria
        } = req.body;

        if (!titulo || !descripcion || !id_categoria) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const tituloLimpio = titulo.trim();
        const descripcionLimpia = descripcion.trim();
        const idCategoria = Number(id_categoria);

        if (tituloLimpio.length < 3) {
            return res.status(400).json({
                message: "El título debe tener al menos 3 caracteres"
            });
        }

        if (descripcionLimpia.length < 5) {
            return res.status(400).json({
                message: "La descripción debe tener al menos 5 caracteres"
            });
        }

        if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
            return res.status(400).json({
                message: "La categoría seleccionada no es válida"
            });
        }

        const [categorias] = await pool.query(
            `SELECT id_categoria
            FROM categoria
            WHERE id_categoria = ?`,
            [idCategoria]
        );

        if (categorias.length === 0) {
            return res.status(404).json({
                message: "La categoría no existe"
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO ejercicio
            (
                titulo,
                descripcion,
                fecha_creacion,
                id_docente,
                id_categoria
            )
            VALUES (?, ?, CURDATE(), ?, ?)`,
            [
                tituloLimpio,
                descripcionLimpia,
                idDocente,
                idCategoria
            ]
        );

        const [ejercicios] = await pool.query(
            `SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_docente,
                e.id_categoria,
                c.nombre AS categoria,
                0 AS total_preguntas
            FROM ejercicio AS e
            INNER JOIN categoria AS c
                ON c.id_categoria = e.id_categoria
            WHERE e.id_ejercicio = ?`,
            [resultado.insertId]
        );

        return res.status(201).json({
            message: "Ejercicio creado correctamente",
            ejercicio: ejercicios[0]
        });

    } catch (error) {
        console.error("Error al crear ejercicio:", error);

        return res.status(500).json({
            message: "Error al crear el ejercicio"
        });
    }
};

/* ========================================
   ACTUALIZAR EJERCICIO
======================================== */

const updateEjercicio = async (req, res) => {
    try {
        const idDocente = req.session.usuario.id_usuario;
        const idEjercicio = Number(req.params.id);

        const {
            titulo,
            descripcion,
            id_categoria
        } = req.body;

        if (!Number.isInteger(idEjercicio) || idEjercicio <= 0) {
            return res.status(400).json({
                message: "ID de ejercicio inválido"
            });
        }

        if (!titulo || !descripcion || !id_categoria) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const tituloLimpio = titulo.trim();
        const descripcionLimpia = descripcion.trim();
        const idCategoria = Number(id_categoria);

        if (tituloLimpio.length < 3) {
            return res.status(400).json({
                message: "El título debe tener al menos 3 caracteres"
            });
        }

        if (descripcionLimpia.length < 5) {
            return res.status(400).json({
                message: "La descripción debe tener al menos 5 caracteres"
            });
        }

        const [ejercicios] = await pool.query(
            `SELECT id_ejercicio
            FROM ejercicio
            WHERE id_ejercicio = ?
              AND id_docente = ?`,
            [idEjercicio, idDocente]
        );

        if (ejercicios.length === 0) {
            return res.status(404).json({
                message:
                    "El ejercicio no existe o no te pertenece"
            });
        }

        const [categorias] = await pool.query(
            `SELECT id_categoria
            FROM categoria
            WHERE id_categoria = ?`,
            [idCategoria]
        );

        if (categorias.length === 0) {
            return res.status(404).json({
                message: "La categoría no existe"
            });
        }

        await pool.query(
            `UPDATE ejercicio
            SET
                titulo = ?,
                descripcion = ?,
                id_categoria = ?
            WHERE id_ejercicio = ?
              AND id_docente = ?`,
            [
                tituloLimpio,
                descripcionLimpia,
                idCategoria,
                idEjercicio,
                idDocente
            ]
        );

        return res.status(200).json({
            message: "Ejercicio actualizado correctamente"
        });

    } catch (error) {
        console.error("Error al actualizar ejercicio:", error);

        return res.status(500).json({
            message: "Error al actualizar el ejercicio"
        });
    }
};

/* ========================================
   ELIMINAR EJERCICIO
======================================== */

const deleteEjercicio = async (req, res) => {
    try {
        const idDocente = req.session.usuario.id_usuario;
        const idEjercicio = Number(req.params.id);

        if (!Number.isInteger(idEjercicio) || idEjercicio <= 0) {
            return res.status(400).json({
                message: "ID de ejercicio inválido"
            });
        }

        const [ejercicios] = await pool.query(
            `SELECT id_ejercicio
            FROM ejercicio
            WHERE id_ejercicio = ?
              AND id_docente = ?`,
            [idEjercicio, idDocente]
        );

        if (ejercicios.length === 0) {
            return res.status(404).json({
                message:
                    "El ejercicio no existe o no te pertenece"
            });
        }

        await pool.query(
            `DELETE FROM ejercicio
            WHERE id_ejercicio = ?
              AND id_docente = ?`,
            [idEjercicio, idDocente]
        );

        return res.status(200).json({
            message: "Ejercicio eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar ejercicio:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message:
                    "No se puede eliminar porque contiene preguntas relacionadas"
            });
        }

        return res.status(500).json({
            message: "Error al eliminar el ejercicio"
        });
    }
};

/**
 * Obtener alumnos que han resuelto ejercicios
 * creados por el docente autenticado.
 *
 * GET /api/ejercicios/alumnos
 */
const getAlumnosDocente = async (req, res) => {
    try {
        const idDocente =
            req.session.usuario.id_usuario;

        const [alumnos] = await pool.query(
            `
            SELECT
                alumno.id_usuario,
                alumno.nombre,
                alumno.ap_paterno,
                alumno.ap_materno,
                alumno.correo,

                CONCAT(
                    alumno.nombre,
                    ' ',
                    alumno.ap_paterno,
                    CASE
                        WHEN alumno.ap_materno IS NOT NULL
                             AND alumno.ap_materno <> ''
                        THEN CONCAT(
                            ' ',
                            alumno.ap_materno
                        )
                        ELSE ''
                    END
                ) AS nombre_completo,

                COUNT(
                    DISTINCT i.id_intento
                ) AS total_intentos,

                COUNT(
                    DISTINCT i.id_ejercicio
                ) AS ejercicios_realizados,

                ROUND(
                    AVG(i.calificacion),
                    1
                ) AS promedio,

                MAX(i.calificacion)
                    AS mejor_calificacion,

                MAX(i.fecha_intento)
                    AS ultimo_intento

            FROM intento_ejercicio i

            INNER JOIN ejercicio e
                ON i.id_ejercicio =
                   e.id_ejercicio

            INNER JOIN usuario alumno
                ON i.id_usuario =
                   alumno.id_usuario

            WHERE e.id_docente = ?

            GROUP BY
                alumno.id_usuario,
                alumno.nombre,
                alumno.ap_paterno,
                alumno.ap_materno,
                alumno.correo

            ORDER BY
                ultimo_intento DESC,
                nombre_completo ASC
            `,
            [idDocente]
        );

        return res.json({
            total: alumnos.length,
            alumnos,
        });
    } catch (error) {
        console.error(
            "Error al obtener los alumnos del docente:",
            error
        );

        return res.status(500).json({
            error:
                "No se pudieron obtener los alumnos",
        });
    }
};

/**
 * Obtener el historial de un alumno en los ejercicios
 * creados por el docente autenticado.
 *
 * GET /api/ejercicios/alumnos/:id/historial
 */
const getHistorialAlumnoDocente = async (req, res) => {
    try {
        const idDocente =
            req.session.usuario.id_usuario;

        const idAlumno =
            Number(req.params.id);

        if (
            !Number.isInteger(idAlumno) ||
            idAlumno <= 0
        ) {
            return res.status(400).json({
                error: "El ID del alumno no es válido",
            });
        }

        /*
         * Primero verificamos que el usuario exista
         * y que tenga el rol de alumno.
         */
        const [alumnos] = await pool.query(
            `
            SELECT
                id_usuario,
                nombre,
                ap_paterno,
                ap_materno,
                correo,

                CONCAT(
                    nombre,
                    ' ',
                    ap_paterno,
                    CASE
                        WHEN ap_materno IS NOT NULL
                             AND ap_materno <> ''
                        THEN CONCAT(
                            ' ',
                            ap_materno
                        )
                        ELSE ''
                    END
                ) AS nombre_completo

            FROM usuario

            WHERE
                id_usuario = ?
                AND id_rol = 3
            `,
            [idAlumno]
        );

        if (alumnos.length === 0) {
            return res.status(404).json({
                error: "Alumno no encontrado",
            });
        }

        const alumno = alumnos[0];

        /*
         * Se consultan únicamente los intentos
         * realizados en ejercicios del docente.
         */
        const [historial] = await pool.query(
            `
            SELECT
                i.id_intento,
                i.id_ejercicio,

                e.titulo AS ejercicio,

                c.nombre AS categoria,

                i.aciertos,
                i.errores,
                i.total_preguntas,
                i.porcentaje,
                i.calificacion,
                i.fecha_intento

            FROM intento_ejercicio i

            INNER JOIN ejercicio e
                ON i.id_ejercicio =
                   e.id_ejercicio

            LEFT JOIN categoria c
                ON e.id_categoria =
                   c.id_categoria

            WHERE
                i.id_usuario = ?
                AND e.id_docente = ?

            ORDER BY
                i.fecha_intento DESC,
                i.id_intento DESC
            `,
            [
                idAlumno,
                idDocente,
            ]
        );

        /*
         * Estadísticas generales del alumno
         * dentro de los ejercicios del docente.
         */
        const [estadisticas] = await pool.query(
            `
            SELECT
                COUNT(
                    DISTINCT i.id_intento
                ) AS total_intentos,

                COUNT(
                    DISTINCT i.id_ejercicio
                ) AS ejercicios_realizados,

                ROUND(
                    AVG(i.calificacion),
                    1
                ) AS promedio,

                MAX(i.calificacion)
                    AS mejor_calificacion

            FROM intento_ejercicio i

            INNER JOIN ejercicio e
                ON i.id_ejercicio =
                   e.id_ejercicio

            WHERE
                i.id_usuario = ?
                AND e.id_docente = ?
            `,
            [
                idAlumno,
                idDocente,
            ]
        );

        return res.json({
            alumno,
            estadisticas:
                estadisticas[0],
            total:
                historial.length,
            historial,
        });
    } catch (error) {
        console.error(
            "Error al obtener el historial del alumno:",
            error
        );

        return res.status(500).json({
            error:
                "No se pudo obtener el historial del alumno",
        });
    }
};

async function getDetalleIntentoDocente(req, res) {
    try {

        const idIntento = Number(req.params.id);
        const idDocente = req.session.usuario.id_usuario;

        const [detalle] = await pool.query(
            `
            SELECT
                ie.id_intento,
                ie.fecha_intento,
                ie.calificacion,
                ie.porcentaje,
                ie.aciertos,
                ie.errores,
                ie.total_preguntas,

                u.id_usuario,
                CONCAT(
                    u.nombre,' ',
                    u.ap_paterno,' ',
                    u.ap_materno
                ) AS alumno,

                e.id_ejercicio,
                e.titulo,
                e.descripcion

            FROM intento_ejercicio ie

            INNER JOIN usuario u
                ON u.id_usuario = ie.id_usuario

            INNER JOIN ejercicio e
                ON e.id_ejercicio = ie.id_ejercicio

            WHERE
                ie.id_intento = ?
                AND e.id_docente = ?
            `,
            [idIntento, idDocente]
        );

        if (detalle.length === 0) {
            return res.status(404).json({
                error: "Intento no encontrado."
            });
        }

        const [preguntas] = await pool.query(
            `
            SELECT

                p.id_pregunta,
                p.pregunta,

                ra.respuesta AS respuesta_alumno,

                rc.respuesta AS respuesta_correcta,

                ra.es_correcta

            FROM respuesta_alumno ra

            INNER JOIN pregunta p
                ON p.id_pregunta = ra.id_pregunta

            INNER JOIN respuesta_correcta rc
                ON rc.id_pregunta = p.id_pregunta

            WHERE ra.id_intento = ?

            ORDER BY p.id_pregunta
            `,
            [idIntento]
        );

        res.json({

            detalle: detalle[0],

            total_preguntas: preguntas.length,

            preguntas

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Error al obtener el detalle."
        });

    }
}

module.exports = {
    getCategorias,
    getMisEjercicios,
    getEstadisticasDocente,
    createEjercicio,
    updateEjercicio,
    deleteEjercicio,
    getAlumnosDocente,
    getHistorialAlumnoDocente,
    getDetalleIntentoDocente,
};