const requiereSesion = (req, res, next) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            message: "Debes iniciar sesión"
        });
    }

    next();
};

const requiereRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.session.usuario) {
            return res.status(401).json({
                message: "Debes iniciar sesión"
            });
        }

        const idRol = Number(req.session.usuario.id_rol);

        if (!rolesPermitidos.includes(idRol)) {
            return res.status(403).json({
                message: "No tienes permiso para realizar esta acción"
            });
        }

        next();
    };
};

module.exports = {
    requiereSesion,
    requiereRol
};