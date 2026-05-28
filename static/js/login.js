/**
 * AI Career Readiness Platform - Login Page JavaScript
 * Handles validation, password toggle, and API login
 */

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const errorBox = document.getElementById("errorMessage");
  const loginCard = document.getElementById("loginCard");
  const formContent = document.getElementById("formContent");
  const successOverlay = document.getElementById("successOverlay");
  const loginBtn = document.getElementById("loginBtn");
  const registrationSuccess = document.getElementById("registrationSuccess");

  // Show success message if redirected after registration
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("registered") === "success" && registrationSuccess) {
    registrationSuccess.textContent =
      "Registration successful! Please log in with your new account.";
    registrationSuccess.classList.add("show");
  }

  // Show or hide password when eye icon is clicked
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", function () {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";

      const icon = togglePasswordBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      }

      togglePasswordBtn.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  // Check if email format is valid
  function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  // Show error message below the form
  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }

  // Hide error message
  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = "";
    errorBox.classList.remove("show");
  }

  // Remove red border from inputs
  function clearInputErrors() {
    emailInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
  }

  // Validate form before sending to server
  function validateForm() {
    hideError();
    clearInputErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    let isValid = true;

    if (!email) {
      showError("Please enter your email address.");
      emailInput.classList.add("input-error");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError("Please enter a valid email address.");
      emailInput.classList.add("input-error");
      isValid = false;
    }

    if (!password) {
      showError(isValid ? "Please enter your password." : "Please fix the errors above.");
      passwordInput.classList.add("input-error");
      isValid = false;
    }

    return isValid;
  }

  // Show success animation before redirect
  function showSuccessAnimation() {
    if (loginCard) {
      loginCard.classList.add("login-success");
    }
    if (formContent) {
      formContent.style.display = "none";
    }
    if (successOverlay) {
      successOverlay.classList.add("show");
    }
  }

  // Send login data to Flask API
  async function submitLogin(email, password) {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();
    return { ok: response.ok, data: data };
  }

  // Handle form submit
  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      loginBtn.disabled = true;
      loginBtn.textContent = "Logging in...";
      hideError();

      try {
        const result = await submitLogin(email, password);

        if (result.ok && result.data.success) {
          showSuccessAnimation();

          // Redirect to dashboard after short success animation
          setTimeout(function () {
            window.location.href = result.data.redirect || "/dashboard";
          }, 1500);
        } else {
          showError(result.data.message || "Invalid email or password. Please try again.");
          loginBtn.disabled = false;
          loginBtn.textContent = "Login";
        }
      } catch (error) {
        showError("Unable to connect to server. Please try again later.");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    });
  }

  // Remove error styling when user starts typing
  [emailInput, passwordInput].forEach(function (input) {
    if (input) {
      input.addEventListener("input", function () {
        input.classList.remove("input-error");
        hideError();
      });
    }
  });
});
