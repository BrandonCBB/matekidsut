const express = require("express");
const router = express.Router();

const {
    getCategorias,
    getMisEjercicios,
    getEstadisticasDocente,
    createEjercicio,
    updateEjercicio,
    deleteEjercicio,
    getAlumnosDocente,
    getHistorialAlumnoDocente,
    getDetalleIntentoDocente,
} = require("../controllers/ejercicio.controller");

const {
    requiereRol
} = require("../middlewares/auth.middleware");

/* ========================================
   RUTAS DEL DOCENTE
======================================== */

router.get(
    "/categorias",
    requiereRol(2),
    getCategorias
);

router.get(
    "/mis-ejercicios",
    requiereRol(2),
    getMisEjercicios
);

router.get(
    "/estadisticas",
    requiereRol(2),
    getEstadisticasDocente
);

router.get(
    "/alumnos",
    requiereRol(2),
    getAlumnosDocente
);

router.get(
    "/alumnos/:id/historial",
    requiereRol(2),
    getHistorialAlumnoDocente
);

router.get(
    "/intentos/:id/detalle-docente",
    requiereRol(2),
    getDetalleIntentoDocente
);

router.post(
    "/",
    requiereRol(2),
    createEjercicio
);

router.put(
    "/:id",
    requiereRol(2),
    updateEjercicio
);

router.delete(
    "/:id",
    requiereRol(2),
    deleteEjercicio
);

module.exports = router;