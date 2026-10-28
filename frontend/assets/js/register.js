const form = document.getElementById("registerForm");

const nombre = document.getElementById("nombre");
const apPaterno = document.getElementById("apPaterno");
const apMaterno = document.getElementById("apMaterno");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");

const togglePassword = document.getElementById("togglePassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

const loader = document.getElementById("loader");
const registerButton = document.getElementById("registerButton");
const messageBox = document.getElementById("registerMessage");
const supportLink = document.getElementById("supportLink");



function toggleInputPassword(input, button) {
    const type = input.getAttribute("type") === "password" ? "text" : "password";
    input.setAttribute("type", type);

    button.innerHTML =
        type === "password"
            ? `<i class="fa-regular fa-eye"></i>`
            : `<i class="fa-regular fa-eye-slash"></i>`;
}


togglePassword.addEventListener("click", () => {
    toggleInputPassword(password, togglePassword);
});

toggleConfirmPassword.addEventListener("click", () => {
    toggleInputPassword(confirmPassword, toggleConfirmPassword);
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
    registerButton.disabled = true;
    registerButton.style.opacity = "0.7";
}

function hideLoader() {
    loader.classList.add("hidden");
    registerButton.disabled = false;
    registerButton.style.opacity = "1";
}

if (supportLink) {
    supportLink.addEventListener("click", (e) => {
        e.preventDefault();

        const correo = "brandoncb912@gmail.com";
        const asunto = encodeURIComponent("Soporte MateKids UT");
        const mensaje = encodeURIComponent(
            "Hola, necesito ayuda con mi cuenta de MateKids UT."
        );

        const urlGmail =
            `https://mail.google.com/mail/?view=cm&fs=1&to=${correo}` +
            `&su=${asunto}&body=${mensaje}`;

        window.open(urlGmail, "_blank");
    });
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        nombre: nombre.value.trim(),
        ap_paterno: apPaterno.value.trim(),
        ap_materno: apMaterno.value.trim(),
        correo: correo.value.trim(),
        password: password.value.trim(),
        confirmPassword: confirmPassword.value.trim(),

        rol: "Alumno"
    };

    if (
        !data.nombre ||
        !data.ap_paterno ||
        !data.ap_materno ||
        !data.correo ||
        !data.password ||
        !data.confirmPassword
    ) {
        showMessage("Por favor completa todos los campos");
        return;
    }

    if (!validateEmail(data.correo)) {
        showMessage("Correo inválido");
        return;
    }

    if (data.password.length < 6) {
        showMessage("La contraseña debe tener al menos 6 caracteres");
        return;
    }

    if (data.password !== data.confirmPassword) {
        showMessage("Las contraseñas no coinciden");
        return;
    }

    try {
    showLoader();

    const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            nombre: data.nombre,
            ap_paterno: data.ap_paterno,
            ap_materno: data.ap_materno,
            correo: data.correo,
            password: data.password
        })
    });

    const result = await response.json();

    hideLoader();

    if (!response.ok) {
        showMessage(result.message || "Error al crear la cuenta");
        return;
    }

    showMessage("Cuenta creada correctamente. Redirigiendo...", "success");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1200);

} catch (error) {
    hideLoader();
    showMessage("Error de conexión con el servidor");
    console.error(error);
}
});