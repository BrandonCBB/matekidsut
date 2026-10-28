const express = require("express");
const router = express.Router();

const {
    getEjercicioConPreguntas,
    createPregunta,
    updatePregunta,
    deletePregunta
} = require("../controllers/pregunta.controller");

const {
    requiereRol
} = require("../middlewares/auth.middleware");

/* ========================================
   RUTAS DE PREGUNTAS PARA DOCENTES
======================================== */

router.get(
    "/ejercicio/:id",
    requiereRol(2),
    getEjercicioConPreguntas
);

router.post(
    "/",
    requiereRol(2),
    createPregunta
);

router.put(
    "/:id",
    requiereRol(2),
    updatePregunta
);

router.delete(
    "/:id",
    requiereRol(2),
    deletePregunta
);

module.exports = router;