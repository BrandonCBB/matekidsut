const express = require("express");

const router = express.Router();

const {
    getEjerciciosPorCategoria,
    getEjercicioParaResolver,
    enviarRespuestas,
    getHistorial,
    getDetalleIntento
} = require("../controllers/alumno.controller");

const {
    requiereSesion,
    requiereRol,
} = require("../middlewares/auth.middleware");

router.get(
    "/historial",
    requiereSesion,
    requiereRol(3),
    getHistorial
);

router.get(
    "/historial/:id",
    requiereSesion,
    requiereRol(3),
    getDetalleIntento
);

router.get(
    "/ejercicios/:categoria",
    requiereSesion,
    requiereRol(3),
    getEjerciciosPorCategoria
);

router.get(
    "/ejercicio/:id",
    requiereSesion,
    requiereRol(3),
    getEjercicioParaResolver
);

router.post(
    "/respuestas",
    requiereSesion,
    requiereRol(3),
    enviarRespuestas
);

module.exports = router;