const API_BASE_URL = "http://localhost:5000/api"; // production: "https://api.mysite.com/api"
const LOGIN_ENDPOINT = `${API_BASE_URL}/login`;
const GOOGLE_OAUTH_URL = `${API_BASE_URL}/auth/google`;
const FACEBOOK_OAUTH_URL = `${API_BASE_URL}/auth/facebook`;
const form = document.getElementById("login-form");
const statusEl = document.getElementById("status");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberInput = document.getElementById("remember");
const submitBtn = document.getElementById("login-submit");
const googleBtn = document.getElementById("google-login");
const facebookBtn = document.getElementById("facebook-login");
function setStatus(message, type = "error") {
  statusEl.textContent = message;
  statusEl.classList.toggle("is-success", type === "success");
}
function clearStatus() {
  statusEl.textContent = "";
  statusEl.classList.remove("is-success");
}
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function markInvalid(input, isInvalid) {
  input.classList.toggle("is-invalid", isInvalid);
}
document.querySelectorAll(".field input").forEach((input) => {
  input.addEventListener("input", () => markInvalid(input, false));
});
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;
  markInvalid(emailInput, !emailValid);
  markInvalid(passwordInput, !passwordValid);
  if (!emailValid || !passwordValid) {
    setStatus("Enter a valid email and a password of at least 8 characters.");
    return;
  }
  setLoading(true);
  try {
    const response = await fetch(LOGIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({ email, password, remember: rememberInput.checked }),
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
    }
    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Login failed (${response.status}).`
      );
    }
    if (response.status === 202 || data.Statusdb === false) {
      throw new Error(data.detail || "Logged in, but something went wrong. Try again.");
    }
    setStatus("Logged in. Redirecting…", "success");
    setTimeout(() => {
      window.location.href = data.next || "/dashboard";
    }, 500);
  } catch (err) {
    setStatus(err.message || "Could not reach the server. Try again.");
  } finally {
    setLoading(false);
  }
});
googleBtn.addEventListener("click", () => {
  window.location.href = GOOGLE_OAUTH_URL;
});
facebookBtn.addEventListener("click", () => {
  window.location.href = FACEBOOK_OAUTH_URL;
});