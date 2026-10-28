const express = require("express");
const router = express.Router();

const {
    getUsuarios,
    getEstadisticas,
    getEjercicios,
    createUsuario,
    updateUsuario,
    updateEstadoUsuario,
    deleteUsuario
} = require("../controllers/admin.controller");

const {
    requiereRol
} = require("../middlewares/auth.middleware");

/* ========================================
   RUTAS ADMINISTRADOR
======================================== */

router.get(
    "/usuarios",
    requiereRol(1),
    getUsuarios
);

router.get(
    "/estadisticas",
    requiereRol(1),
    getEstadisticas
);

router.get(
    "/ejercicios",
    requiereRol(1),
    getEjercicios
);

router.post(
    "/usuarios",
    requiereRol(1),
    createUsuario
);

router.put(
    "/usuarios/:id",
    requiereRol(1),
    updateUsuario
);

router.patch(
    "/usuarios/:id/estado",
    requiereRol(1),
    updateEstadoUsuario
);

router.delete(
    "/usuarios/:id",
    requiereRol(1),
    deleteUsuario
);

module.exports = router;