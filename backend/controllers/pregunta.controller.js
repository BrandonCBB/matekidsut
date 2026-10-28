const pool = require("../config/db");

/* ========================================
   OBTENER EJERCICIO CON PREGUNTAS
======================================== */

const getEjercicioConPreguntas = async (req, res) => {
    try {
        const idDocente = req.session.usuario.id_usuario;
        const idEjercicio = Number(req.params.id);

        if (!Number.isInteger(idEjercicio) || idEjercicio <= 0) {
            return res.status(400).json({
                message: "ID de ejercicio inválido"
            });
        }

        const [ejercicios] = await pool.query(
            `SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_categoria,
                c.nombre AS categoria
            FROM ejercicio AS e
            INNER JOIN categoria AS c
                ON c.id_categoria = e.id_categoria
            WHERE e.id_ejercicio = ?
              AND e.id_docente = ?`,
            [idEjercicio, idDocente]
        );

        if (ejercicios.length === 0) {
            return res.status(404).json({
                message:
                    "El ejercicio no existe o no te pertenece"
            });
        }

        const [preguntas] = await pool.query(
            `SELECT
                p.id_pregunta,
                p.pregunta,
                rc.id_respuesta_correcta,
                rc.respuesta AS respuesta_correcta
            FROM pregunta AS p
            LEFT JOIN respuesta_correcta AS rc
                ON rc.id_pregunta = p.id_pregunta
            WHERE p.id_ejercicio = ?
            ORDER BY p.id_pregunta ASC`,
            [idEjercicio]
        );

        return res.status(200).json({
            ejercicio: ejercicios[0],
            preguntas
        });

    } catch (error) {
        console.error(
            "Error al obtener ejercicio y preguntas:",
            error
        );

        return res.status(500).json({
            message:
                "Error al obtener el ejercicio y sus preguntas"
        });
    }
};

/* ========================================
   CREAR PREGUNTA
======================================== */

const createPregunta = async (req, res) => {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const idDocente = req.session.usuario.id_usuario;

        const {
            pregunta,
            respuesta_correcta,
            id_ejercicio
        } = req.body;

        if (!pregunta || !respuesta_correcta || !id_ejercicio) {
            await conexion.rollback();

            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const textoPregunta = pregunta.trim();
        const textoRespuesta = respuesta_correcta.trim();
        const idEjercicio = Number(id_ejercicio);

        if (textoPregunta.length < 3) {
            await conexion.rollback();

            return res.status(400).json({
                message:
                    "La pregunta debe tener al menos 3 caracteres"
            });
        }

        if (textoRespuesta.length === 0) {
            await conexion.rollback();

            return res.status(400).json({
                message:
                    "Debes indicar una respuesta correcta"
            });
        }

        if (!Number.isInteger(idEjercicio) || idEjercicio <= 0) {
            await conexion.rollback();

            return res.status(400).json({
                message: "ID de ejercicio inválido"
            });
        }

        const [ejercicios] = await conexion.query(
            `SELECT id_ejercicio
            FROM ejercicio
            WHERE id_ejercicio = ?
              AND id_docente = ?`,
            [idEjercicio, idDocente]
        );

        if (ejercicios.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                message:
                    "El ejercicio no existe o no te pertenece"
            });
        }

        const [resultadoPregunta] = await conexion.query(
            `INSERT INTO pregunta
            (
                pregunta,
                id_ejercicio
            )
            VALUES (?, ?)`,
            [
                textoPregunta,
                idEjercicio
            ]
        );

        const idPregunta = resultadoPregunta.insertId;

        await conexion.query(
            `INSERT INTO respuesta_correcta
            (
                respuesta,
                id_pregunta
            )
            VALUES (?, ?)`,
            [
                textoRespuesta,
                idPregunta
            ]
        );

        await conexion.commit();

        return res.status(201).json({
            message: "Pregunta creada correctamente",
            pregunta: {
                id_pregunta: idPregunta,
                pregunta: textoPregunta,
                respuesta_correcta: textoRespuesta,
                id_ejercicio: idEjercicio
            }
        });

    } catch (error) {
        await conexion.rollback();

        console.error("Error al crear pregunta:", error);

        return res.status(500).json({
            message: "Error al crear la pregunta"
        });

    } finally {
        conexion.release();
    }
};

/* ========================================
   ACTUALIZAR PREGUNTA
======================================== */

const updatePregunta = async (req, res) => {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const idDocente = req.session.usuario.id_usuario;
        const idPregunta = Number(req.params.id);

        const {
            pregunta,
            respuesta_correcta
        } = req.body;

        if (!Number.isInteger(idPregunta) || idPregunta <= 0) {
            await conexion.rollback();

            return res.status(400).json({
                message: "ID de pregunta inválido"
            });
        }

        if (!pregunta || !respuesta_correcta) {
            await conexion.rollback();

            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const textoPregunta = pregunta.trim();
        const textoRespuesta = respuesta_correcta.trim();

        if (textoPregunta.length < 3) {
            await conexion.rollback();

            return res.status(400).json({
                message:
                    "La pregunta debe tener al menos 3 caracteres"
            });
        }

        if (textoRespuesta.length === 0) {
            await conexion.rollback();

            return res.status(400).json({
                message:
                    "Debes indicar una respuesta correcta"
            });
        }

        const [preguntas] = await conexion.query(
            `SELECT
                p.id_pregunta,
                p.id_ejercicio
            FROM pregunta AS p
            INNER JOIN ejercicio AS e
                ON e.id_ejercicio = p.id_ejercicio
            WHERE p.id_pregunta = ?
              AND e.id_docente = ?`,
            [idPregunta, idDocente]
        );

        if (preguntas.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                message:
                    "La pregunta no existe o no te pertenece"
            });
        }

        await conexion.query(
            `UPDATE pregunta
            SET pregunta = ?
            WHERE id_pregunta = ?`,
            [
                textoPregunta,
                idPregunta
            ]
        );

        const [respuestas] = await conexion.query(
            `SELECT id_respuesta_correcta
            FROM respuesta_correcta
            WHERE id_pregunta = ?`,
            [idPregunta]
        );

        if (respuestas.length > 0) {
            await conexion.query(
                `UPDATE respuesta_correcta
                SET respuesta = ?
                WHERE id_pregunta = ?`,
                [
                    textoRespuesta,
                    idPregunta
                ]
            );
        } else {
            await conexion.query(
                `INSERT INTO respuesta_correcta
                (
                    respuesta,
                    id_pregunta
                )
                VALUES (?, ?)`,
                [
                    textoRespuesta,
                    idPregunta
                ]
            );
        }

        await conexion.commit();

        return res.status(200).json({
            message: "Pregunta actualizada correctamente"
        });

    } catch (error) {
        await conexion.rollback();

        console.error("Error al actualizar pregunta:", error);

        return res.status(500).json({
            message: "Error al actualizar la pregunta"
        });

    } finally {
        conexion.release();
    }
};

/* ========================================
   ELIMINAR PREGUNTA
======================================== */

const deletePregunta = async (req, res) => {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const idDocente = req.session.usuario.id_usuario;
        const idPregunta = Number(req.params.id);

        if (!Number.isInteger(idPregunta) || idPregunta <= 0) {
            await conexion.rollback();

            return res.status(400).json({
                message: "ID de pregunta inválido"
            });
        }

        const [preguntas] = await conexion.query(
            `SELECT p.id_pregunta
            FROM pregunta AS p
            INNER JOIN ejercicio AS e
                ON e.id_ejercicio = p.id_ejercicio
            WHERE p.id_pregunta = ?
              AND e.id_docente = ?`,
            [idPregunta, idDocente]
        );

        if (preguntas.length === 0) {
            await conexion.rollback();

            return res.status(404).json({
                message:
                    "La pregunta no existe o no te pertenece"
            });
        }

        /*
            Primero se eliminan respuestas de alumnos,
            por si ya existen registros relacionados.
        */
        await conexion.query(
            `DELETE FROM respuesta_alumno
            WHERE id_pregunta = ?`,
            [idPregunta]
        );

        await conexion.query(
            `DELETE FROM respuesta_correcta
            WHERE id_pregunta = ?`,
            [idPregunta]
        );

        await conexion.query(
            `DELETE FROM pregunta
            WHERE id_pregunta = ?`,
            [idPregunta]
        );

        await conexion.commit();

        return res.status(200).json({
            message: "Pregunta eliminada correctamente"
        });

    } catch (error) {
        await conexion.rollback();

        console.error("Error al eliminar pregunta:", error);

        return res.status(500).json({
            message: "Error al eliminar la pregunta"
        });

    } finally {
        conexion.release();
    }
};

module.exports = {
    getEjercicioConPreguntas,
    createPregunta,
    updatePregunta,
    deletePregunta
};