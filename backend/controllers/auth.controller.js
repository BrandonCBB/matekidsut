const bcrypt = require("bcrypt");
const pool = require("../config/db");

const register = async (req, res) => {
    try {
        const {
            nombre,
            ap_paterno,
            ap_materno,
            correo,
            password
        } = req.body;

        if (!nombre || !ap_paterno || !ap_materno || !correo || !password) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const [existe] = await pool.query(
            "SELECT id_usuario FROM usuario WHERE correo = ?",
            [correo]
        );

        if (existe.length > 0) {
            return res.status(409).json({
                message: "El correo ya está registrado"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
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
            VALUES (?, ?, ?, ?, ?, CURDATE(), 1, 3)`,
            [
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                passwordHash
            ]
        );

        return res.status(201).json({
            message: "Cuenta creada correctamente"
        });

    } catch (error) {
        console.error("Error al registrar usuario:", error);

        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const [usuarios] = await pool.query(
            `SELECT
                id_usuario,
                nombre,
                ap_paterno,
                ap_materno,
                correo,
                contraseña,
                fecha_registro,
                estado,
                id_rol
            FROM usuario
            WHERE correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const usuario = usuarios[0];

        if (usuario.estado !== 1) {
            return res.status(403).json({
                message: "Usuario inactivo. Contacta al administrador"
            });
        }

        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.contraseña
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        req.session.usuario = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            ap_paterno: usuario.ap_paterno,
            ap_materno: usuario.ap_materno,
            correo: usuario.correo,
            fecha_registro: usuario.fecha_registro,
            id_rol: usuario.id_rol
        };

        return res.status(200).json({
            message: "Inicio de sesión exitoso",
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error("Error al iniciar sesión:", error);

        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

const getSession = (req, res) => {
    if (!req.session.usuario) {
        return res.status(200).json({
            autenticado: false,
            usuario: null
        });
    }

    return res.status(200).json({
        autenticado: true,
        usuario: req.session.usuario
    });
};

const getProfile = async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                message: "Debes iniciar sesión"
            });
        }

        const idUsuario = req.session.usuario.id_usuario;

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
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            usuario: usuarios[0]
        });

    } catch (error) {
        console.error("Error al obtener el perfil:", error);

        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                message: "Debes iniciar sesión"
            });
        }

        const {
            nombre,
            ap_paterno,
            ap_materno
        } = req.body;

        if (!nombre || !ap_paterno || !ap_materno) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        const nombreLimpio = nombre.trim();
        const apellidoPaternoLimpio = ap_paterno.trim();
        const apellidoMaternoLimpio = ap_materno.trim();

        if (
            nombreLimpio.length < 2 ||
            apellidoPaternoLimpio.length < 2 ||
            apellidoMaternoLimpio.length < 2
        ) {
            return res.status(400).json({
                message: "Los nombres y apellidos deben tener al menos 2 caracteres"
            });
        }

        const idUsuario = req.session.usuario.id_usuario;

        const [resultado] = await pool.query(
            `UPDATE usuario
            SET
                nombre = ?,
                ap_paterno = ?,
                ap_materno = ?
            WHERE id_usuario = ?`,
            [
                nombreLimpio,
                apellidoPaternoLimpio,
                apellidoMaternoLimpio,
                idUsuario
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        // Actualizar también los datos guardados en la sesión
        req.session.usuario.nombre = nombreLimpio;
        req.session.usuario.ap_paterno = apellidoPaternoLimpio;
        req.session.usuario.ap_materno = apellidoMaternoLimpio;

        return res.status(200).json({
            message: "Perfil actualizado correctamente",
            usuario: req.session.usuario
        });

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);

        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

const updatePassword = async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                message: "Debes iniciar sesión"
            });
        }

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: "La nueva contraseña debe tener al menos 8 caracteres"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: "Las nuevas contraseñas no coinciden"
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "La nueva contraseña debe ser diferente a la actual"
            });
        }

        const idUsuario = req.session.usuario.id_usuario;

        const [usuarios] = await pool.query(
            `SELECT contraseña
            FROM usuario
            WHERE id_usuario = ?`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const passwordActualCorrecta = await bcrypt.compare(
            currentPassword,
            usuarios[0].contraseña
        );

        if (!passwordActualCorrecta) {
            return res.status(401).json({
                message: "La contraseña actual es incorrecta"
            });
        }

        const nuevoPasswordHash = await bcrypt.hash(newPassword, 10);

        const [resultado] = await pool.query(
            `UPDATE usuario
            SET contraseña = ?
            WHERE id_usuario = ?`,
            [nuevoPasswordHash, idUsuario]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        return res.status(200).json({
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Error al actualizar la contraseña:", error);

        return res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

const logout = (req, res) => {
    if (!req.session.usuario) {
        return res.status(200).json({
            message: "No hay una sesión activa"
        });
    }

    req.session.destroy((error) => {
        if (error) {
            console.error("Error al cerrar sesión:", error);

            return res.status(500).json({
                message: "No se pudo cerrar la sesión"
            });
        }

        res.clearCookie("connect.sid", {
            httpOnly: true,
            sameSite: "lax"
        });

        return res.status(200).json({
            message: "Sesión cerrada correctamente"
        });
    });
};

module.exports = {
    register,
    login,
    getSession,
    getProfile,
    updateProfile,
    updatePassword,
    logout
};