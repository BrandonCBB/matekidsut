const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getSession,
    getProfile,
    updateProfile,
    updatePassword,
    logout
} = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/session", getSession);
router.get("/profile", getProfile);
router.put("/profile", updateProfile)
router.put("/password", updatePassword)
router.post("/logout", logout);

module.exports = router;