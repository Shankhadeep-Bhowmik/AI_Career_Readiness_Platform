/**
 * AI Career Readiness Platform - Register Page JavaScript
 * Password strength, validation, and API registration
 */

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const courseSelect = document.getElementById("course");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const termsCheckbox = document.getElementById("terms");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");
  const errorBox = document.getElementById("errorMessage");
  const registerCard = document.getElementById("registerCard");
  const formContent = document.getElementById("formContent");
  const successOverlay = document.getElementById("successOverlay");
  const registerBtn = document.getElementById("registerBtn");
  const strengthBarFill = document.getElementById("strengthBarFill");
  const strengthLabel = document.getElementById("strengthLabel");
  const confirmHint = document.getElementById("confirmHint");

  // Toggle password visibility for a field
  function setupPasswordToggle(button, input) {
    if (!button || !input) return;

    button.addEventListener("click", function () {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      const icon = button.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      }

      button.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  setupPasswordToggle(togglePasswordBtn, passwordInput);
  setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

  // Check valid email format
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Calculate password strength: weak, medium, or strong
  function getPasswordStrength(password) {
    if (!password) {
      return { level: "", label: "" };
    }

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) {
      return { level: "weak", label: "Weak" };
    }
    if (score <= 4) {
      return { level: "medium", label: "Medium" };
    }
    return { level: "strong", label: "Strong" };
  }

  // Update password strength bar and label
  function updatePasswordStrength() {
    const password = passwordInput.value;
    const strength = getPasswordStrength(password);

    strengthBarFill.className = "strength-bar-fill";
    strengthLabel.className = "strength-label";

    if (!password) {
      strengthLabel.textContent = "Password strength";
      return;
    }

    strengthBarFill.classList.add(strength.level);
    strengthLabel.classList.add(strength.level);
    strengthLabel.textContent = "Password strength: " + strength.label;
  }

  // Show or hide error message box
  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("show");
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.classList.remove("show");
  }

  // Real-time check if confirm password matches
  function validateConfirmPasswordRealtime() {
    const password = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    if (!confirm) {
      confirmHint.classList.remove("show", "error", "success");
      confirmPasswordInput.classList.remove("input-error", "input-valid");
      return;
    }

    confirmHint.classList.add("show");

    if (password === confirm) {
      confirmHint.textContent = "Passwords match";
      confirmHint.classList.remove("error");
      confirmHint.classList.add("success");
      confirmPasswordInput.classList.remove("input-error");
      confirmPasswordInput.classList.add("input-valid");
    } else {
      confirmHint.textContent = "Passwords do not match";
      confirmHint.classList.remove("success");
      confirmHint.classList.add("error");
      confirmPasswordInput.classList.remove("input-valid");
      confirmPasswordInput.classList.add("input-error");
    }
  }

  // Real-time email validation
  function validateEmailRealtime() {
    const email = emailInput.value.trim();
    const hint = document.getElementById("emailHint");

    if (!email) {
      hint.classList.remove("show", "error", "success");
      emailInput.classList.remove("input-error", "input-valid");
      return;
    }

    hint.classList.add("show");

    if (isValidEmail(email)) {
      hint.textContent = "Valid email format";
      hint.classList.remove("error");
      hint.classList.add("success");
      emailInput.classList.remove("input-error");
      emailInput.classList.add("input-valid");
    } else {
      hint.textContent = "Please enter a valid email address";
      hint.classList.remove("success");
      hint.classList.add("error");
      emailInput.classList.remove("input-valid");
      emailInput.classList.add("input-error");
    }
  }

  // Full form validation before submit
  function validateForm() {
    hideError();
    let isValid = true;
    const fields = [fullNameInput, emailInput, courseSelect, passwordInput, confirmPasswordInput];

    fields.forEach(function (field) {
      field.classList.remove("input-error");
    });

    document.querySelector(".terms-group").classList.remove("terms-error");

    const name = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const course = courseSelect.value;
    const password = passwordInput.value;
    const confirm = confirmPasswordInput.value;

    if (!name) {
      showError("Please enter your full name.");
      fullNameInput.classList.add("input-error");
      isValid = false;
    }

    if (!email) {
      showError(isValid ? "Please enter your email address." : "Please fix all required fields.");
      emailInput.classList.add("input-error");
      isValid = false;
    } else if (!isValidEmail(email)) {
      showError("Please enter a valid email address.");
      emailInput.classList.add("input-error");
      isValid = false;
    }

    if (!course) {
      showError(isValid ? "Please select your course or field of study." : "Please fix all required fields.");
      courseSelect.classList.add("input-error");
      isValid = false;
    }

    if (!password) {
      showError(isValid ? "Please enter a password." : "Please fix all required fields.");
      passwordInput.classList.add("input-error");
      isValid = false;
    } else if (password.length < 8) {
      showError("Password must be at least 8 characters long.");
      passwordInput.classList.add("input-error");
      isValid = false;
    }

    if (!confirm) {
      showError(isValid ? "Please confirm your password." : "Please fix all required fields.");
      confirmPasswordInput.classList.add("input-error");
      isValid = false;
    } else if (password !== confirm) {
      showError("Password and confirm password do not match.");
      confirmPasswordInput.classList.add("input-error");
      isValid = false;
    }

    if (!termsCheckbox.checked) {
      showError(isValid ? "You must agree to the Terms and Conditions." : "Please fix all required fields.");
      document.querySelector(".terms-group").classList.add("terms-error");
      isValid = false;
    }

    return isValid;
  }

  // Show success animation before redirect
  function showSuccessAnimation() {
    registerCard.classList.add("register-success");
    formContent.style.display = "none";
    successOverlay.classList.add("show");
  }

  // Send registration data to Flask API
  async function submitRegistration(formData) {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    return { ok: response.ok, data: data };
  }

  // Event listeners for real-time validation
  passwordInput.addEventListener("input", function () {
    updatePasswordStrength();
    validateConfirmPasswordRealtime();
    hideError();
  });

  confirmPasswordInput.addEventListener("input", function () {
    validateConfirmPasswordRealtime();
    hideError();
  });

  emailInput.addEventListener("input", function () {
    validateEmailRealtime();
    hideError();
  });

  fullNameInput.addEventListener("input", hideError);
  courseSelect.addEventListener("change", hideError);
  termsCheckbox.addEventListener("change", function () {
    document.querySelector(".terms-group").classList.remove("terms-error");
    hideError();
  });

  // Form submit handler
  if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      const formData = {
        name: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        course: courseSelect.value,
        password: passwordInput.value,
      };

      registerBtn.disabled = true;
      registerBtn.textContent = "Creating Account...";
      hideError();

      try {
        const result = await submitRegistration(formData);

        if (result.ok && result.data.success) {
          showSuccessAnimation();

          // Redirect to login with success message
          setTimeout(function () {
            window.location.href = "/login?registered=success";
          }, 1500);
        } else {
          showError(result.data.message || "Registration failed. Please try again.");
          registerBtn.disabled = false;
          registerBtn.textContent = "Register";
        }
      } catch (error) {
        showError("Unable to connect to server. Please try again later.");
        registerBtn.disabled = false;
        registerBtn.textContent = "Register";
      }
    });
  }
});
