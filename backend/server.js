require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");

const ejercicioRoutes = require("./routes/ejercicio.routes");
const preguntaRoutes = require("./routes/pregunta.routes");

const alumnoRoutes = require("./routes/alumno.routes"); 

const app = express();

app.use(cors({
    origin: "http://localhost",
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ejercicios", ejercicioRoutes);
app.use("/api/preguntas", preguntaRoutes);
app.use("/api/alumno", alumnoRoutes);

app.get("/", (req, res) => {
    res.send("Servidor MateKids UT funcionando");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});