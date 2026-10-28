const form = document.getElementById("loginForm");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loader = document.getElementById("loader");
const loginButton = document.getElementById("loginButton");
const messageBox = document.getElementById("loginMessage");

togglePassword.addEventListener("click", () => {
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);

    togglePassword.innerHTML =
        type === "password"
            ? `<i class="fa-regular fa-eye"></i>`
            : `<i class="fa-regular fa-eye-slash"></i>`;
});

function showMessage(text, type = "error") {
    messageBox.textContent = text;
    messageBox.style.color = type === "error" ? "#D94B4B" : "#3F8F63";
    messageBox.classList.add("fade");
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showLoader() {
    loader.classList.remove("hidden");
    loginButton.disabled = true;
    loginButton.style.opacity = "0.7";
}

function hideLoader() {
    loader.classList.add("hidden");
    loginButton.disabled = false;
    loginButton.style.opacity = "1";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = correo.value.trim();
    const pass = password.value.trim();

    if (!email || !pass) {
        showMessage("Por favor completa todos los campos");
        return;
    }

    if (!validateEmail(email)) {
        showMessage("Correo inválido");
        return;
    }

    if (pass.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    try {
        showLoader();

        const response = await fetch("http://localhost:3000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                correo: email,
                password: pass
            })
        });

        const result = await response.json();

        hideLoader();

        if (!response.ok) {
            showMessage(result.message || "Error al iniciar sesión");
            return;
        }

        showMessage("Inicio de sesión exitoso", "success");

        const rol = Number(result.usuario.id_rol);
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");

        setTimeout(() => {

            // Si venía de una página protegida
            if (redirect) {
                window.location.href = decodeURIComponent(redirect);
                return;
            }

            // Redirección normal por rol
            if (rol === 1) {
                window.location.href = "admin.html";
            } else if (rol === 2) {
                window.location.href = "maestro.html";
            } else {
                window.location.href = "alumno.html";
            }

        }, 1000);
            } catch (error) {
                hideLoader();
                showMessage("Error de conexión con el servidor");
                console.error(error);
            }
        });