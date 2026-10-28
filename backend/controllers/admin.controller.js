const bcrypt = require("bcrypt");
const pool = require("../config/db");

/* ========================================
   OBTENER ALUMNOS Y DOCENTES
======================================== */

const getUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                fecha_registro,
                estado,
                id_rol
            FROM usuario
            WHERE id_rol IN (2, 3)
            ORDER BY nombre ASC, ap_paterno ASC`
        );

        const alumnos = usuarios.filter(
            (usuario) => Number(usuario.id_rol) === 3
        );

        const docentes = usuarios.filter(
            (usuario) => Number(usuario.id_rol) === 2
        );

        return res.status(200).json({
            alumnos,
            docentes
        });

    } catch (error) {
        console.error("Error al obtener usuarios:", error);

        return res.status(500).json({
            message: "Error al obtener los usuarios"
        });
    }
};

/* ========================================
   OBTENER ESTADÍSTICAS
======================================== */

const getEstadisticas = async (req, res) => {
    try {
        const [resultadoUsuarios] = await pool.query(
            `SELECT
                SUM(CASE WHEN id_rol = 3 THEN 1 ELSE 0 END) AS alumnos,
                SUM(
                    CASE
                        WHEN id_rol = 2 AND estado = 1
                        THEN 1
                        ELSE 0
                    END
                ) AS docentes_activos,
                SUM(
                    CASE
                        WHEN id_rol IN (2, 3) AND estado = 0
                        THEN 1
                        ELSE 0
                    END
                ) AS usuarios_inactivos
            FROM usuario`
        );

        /*
           Este conteo se deja preparado.
           Cuando confirmemos la tabla ejercicio, ajustamos su nombre
           si fuera diferente.
        */
        let ejercicios = 0;

        try {
            const [resultadoEjercicios] = await pool.query(
                "SELECT COUNT(*) AS total FROM ejercicio"
            );

            ejercicios = Number(resultadoEjercicios[0].total) || 0;

        } catch (errorEjercicios) {
            console.warn(
                "No se pudo contar la tabla ejercicio:",
                errorEjercicios.message
            );
        }

        const estadisticas = resultadoUsuarios[0];

        return res.status(200).json({
            alumnos: Number(estadisticas.alumnos) || 0,
            docentes_activos:
                Number(estadisticas.docentes_activos) || 0,
            ejercicios,
            usuarios_inactivos:
                Number(estadisticas.usuarios_inactivos) || 0
        });

    } catch (error) {
        console.error("Error al obtener estadísticas:", error);

        return res.status(500).json({
            message: "Error al obtener las estadísticas"
        });
    }
};



/* ========================================
   CREAR ALUMNO O DOCENTE
======================================== */

const createUsuario = async (req, res) => {
    try {
        const {
            nombre,
            ap_paterno,
            ap_materno,
            correo,
            password,
            id_rol
        } = req.body;

        if (
            !nombre ||
            !ap_paterno ||
            !ap_materno ||
            !correo ||
            !password ||
            !id_rol
        ) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const rol = Number(id_rol);

        if (![2, 3].includes(rol)) {
            return res.status(400).json({
                message: "Solo se pueden crear alumnos o docentes"
            });
        }

        const nombreLimpio = nombre.trim();
        const apellidoPaternoLimpio = ap_paterno.trim();
        const apellidoMaternoLimpio = ap_materno.trim();
        const correoLimpio = correo.trim().toLowerCase();

        if (
            nombreLimpio.length < 2 ||
            apellidoPaternoLimpio.length < 2 ||
            apellidoMaternoLimpio.length < 2
        ) {
            return res.status(400).json({
                message:
                    "El nombre y los apellidos deben tener al menos 2 caracteres"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message:
                    "La contraseña debe tener al menos 8 caracteres"
            });
        }

        const [usuariosExistentes] = await pool.query(
            `SELECT id_usuario
            FROM usuario
            WHERE correo = ?`,
            [correoLimpio]
        );

        if (usuariosExistentes.length > 0) {
            return res.status(409).json({
                message: "El correo ya está registrado"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [resultado] = await pool.query(
            `INSERT INTO usuario
            (
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                contraseña,
                fecha_registro,
                estado,
                id_rol
            )
            VALUES (?, ?, ?, ?, ?, CURDATE(), 1, ?)`,
            [
                nombreLimpio,
                apellidoPaternoLimpio,
                apellidoMaternoLimpio,
                correoLimpio,
                passwordHash,
                rol
            ]
        );

        const [usuarios] = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                fecha_registro,
                estado,
                id_rol
            FROM usuario
            WHERE id_usuario = ?`,
            [resultado.insertId]
        );

        return res.status(201).json({
            message:
                rol === 2
                    ? "Docente creado correctamente"
                    : "Alumno creado correctamente",
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error("Error al crear usuario:", error);

        return res.status(500).json({
            message: "Error al crear el usuario"
        });
    }
};

/* ========================================
   ACTUALIZAR USUARIO
======================================== */

const updateUsuario = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);

        const {
            nombre,
            ap_paterno,
            ap_materno,
            correo,
            id_rol
        } = req.body;

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(400).json({
                message: "ID de usuario inválido"
            });
        }

        if (
            !nombre ||
            !ap_paterno ||
            !ap_materno ||
            !correo ||
            !id_rol
        ) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const rol = Number(id_rol);

        if (![2, 3].includes(rol)) {
            return res.status(400).json({
                message:
                    "El usuario solo puede ser alumno o docente"
            });
        }

        const nombreLimpio = nombre.trim();
        const apellidoPaternoLimpio = ap_paterno.trim();
        const apellidoMaternoLimpio = ap_materno.trim();
        const correoLimpio = correo.trim().toLowerCase();

        const [usuarios] = await pool.query(
            `SELECT id_usuario, id_rol
            FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (Number(usuarios[0].id_rol) === 1) {
            return res.status(403).json({
                message:
                    "No se puede modificar un administrador desde este módulo"
            });
        }

        const [correoExistente] = await pool.query(
            `SELECT id_usuario
            FROM usuario
            WHERE correo = ?
              AND id_usuario <> ?`,
            [correoLimpio, idUsuario]
        );

        if (correoExistente.length > 0) {
            return res.status(409).json({
                message: "El correo ya pertenece a otro usuario"
            });
        }

        await pool.query(
            `UPDATE usuario
            SET
                nombre = ?,
                ap_paterno = ?,
                ap_materno = ?,
                correo = ?,
                id_rol = ?
            WHERE id_usuario = ?`,
            [
                nombreLimpio,
                apellidoPaternoLimpio,
                apellidoMaternoLimpio,
                correoLimpio,
                rol,
                idUsuario
            ]
        );

        const [usuarioActualizado] = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                fecha_registro,
                estado,
                id_rol
            FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        return res.status(200).json({
            message: "Usuario actualizado correctamente",
            usuario: usuarioActualizado[0]
        });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);

        return res.status(500).json({
            message: "Error al actualizar el usuario"
        });
    }
};

/* ========================================
   ACTIVAR O DESACTIVAR USUARIO
======================================== */

const updateEstadoUsuario = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);
        const estado = Number(req.body.estado);

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(400).json({
                message: "ID de usuario inválido"
            });
        }

        if (![0, 1].includes(estado)) {
            return res.status(400).json({
                message: "El estado debe ser 0 o 1"
            });
        }

        const [usuarios] = await pool.query(
            `SELECT id_usuario, id_rol
            FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (Number(usuarios[0].id_rol) === 1) {
            return res.status(403).json({
                message:
                    "No se puede cambiar el estado de un administrador"
            });
        }

        await pool.query(
            `UPDATE usuario
            SET estado = ?
            WHERE id_usuario = ?`,
            [estado, idUsuario]
        );

        return res.status(200).json({
            message:
                estado === 1
                    ? "Usuario activado correctamente"
                    : "Usuario desactivado correctamente"
        });

    } catch (error) {
        console.error(
            "Error al cambiar el estado del usuario:",
            error
        );

        return res.status(500).json({
            message: "Error al cambiar el estado del usuario"
        });
    }
};

/* ========================================
   ELIMINAR USUARIO
======================================== */

const deleteUsuario = async (req, res) => {
    try {
        const idUsuario = Number(req.params.id);

        if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
            return res.status(400).json({
                message: "ID de usuario inválido"
            });
        }

        const [usuarios] = await pool.query(
            `SELECT id_usuario, id_rol
            FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (Number(usuarios[0].id_rol) === 1) {
            return res.status(403).json({
                message:
                    "No se puede eliminar un administrador"
            });
        }

        await pool.query(
            `DELETE FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        return res.status(200).json({
            message: "Usuario eliminado correctamente"
        });

    } catch (error) {
        console.error("Error al eliminar usuario:", error);

        /*
           Si el usuario tiene registros relacionados por llaves
           foráneas, MySQL puede impedir su eliminación.
        */
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message:
                    "No se puede eliminar porque tiene información relacionada. Puedes desactivarlo."
            });
        }

        return res.status(500).json({
            message: "Error al eliminar el usuario"
        });
    }
};

/* ========================================
   OBTENER EJERCICIOS
======================================== */

const getEjercicios = async (req, res) => {
    try {
        const [ejercicios] = await pool.query(
            `SELECT
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_categoria,
                c.nombre AS categoria,

                CONCAT(
                    u.nombre,
                    ' ',
                    u.ap_paterno,
                    ' ',
                    u.ap_materno
                ) AS docente,

                COUNT(p.id_pregunta) AS total_preguntas

            FROM ejercicio AS e

            INNER JOIN categoria AS c
                ON c.id_categoria = e.id_categoria

            INNER JOIN usuario AS u
                ON u.id_usuario = e.id_docente

            LEFT JOIN pregunta AS p
                ON p.id_ejercicio = e.id_ejercicio

            GROUP BY
                e.id_ejercicio,
                e.titulo,
                e.descripcion,
                e.fecha_creacion,
                e.id_categoria,
                c.nombre,
                u.nombre,
                u.ap_paterno,
                u.ap_materno

            ORDER BY
                e.fecha_creacion DESC,
                e.id_ejercicio DESC`
        );

        return res.status(200).json({
            ejercicios
        });

    } catch (error) {
        console.error(
            "Error al obtener ejercicios:",
            error
        );

        return res.status(500).json({
            message:
                "Error al obtener los ejercicios"
        });
    }
};

module.exports = {
    getUsuarios,
    getEstadisticas,
    getEjercicios,
    createUsuario,
    updateUsuario,
    updateEstadoUsuario,
    deleteUsuario
};