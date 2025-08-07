document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  // Get the current origin for dynamic URLs
  const currentOrigin = window.location.origin;
  //   const frontendUrl = currentOrigin === 'http://localhost:8800' ? 'http://localhost:5173' : currentOrigin;
  const frontendUrl = currentOrigin === "http://localhost:5173";

  // Set dynamic URL for login link
  document.getElementById("login-link").href = frontendUrl + "/";

  // Set userId if provided in URL
  if (userId) {
    document.getElementById("userId").value = userId;
  }

  // Alert functions
  function showSuccessAlert(message) {
    const alert = document.getElementById("success-alert");
    const messageEl = document.getElementById("success-message");
    messageEl.textContent = message;
    alert.classList.add("show");
    document.getElementById("error-alert").classList.remove("show");

    // Auto-hide after 3 seconds and redirect
    setTimeout(function () {
      window.location.href = frontendUrl + "/";
    }, 3000);
  }

  function showErrorAlert(message) {
    const alert = document.getElementById("error-alert");
    const messageEl = document.getElementById("error-message");
    messageEl.textContent = message;
    alert.classList.add("show");
    document.getElementById("success-alert").classList.remove("show");
  }

  function hideAlerts() {
    document.getElementById("success-alert").classList.remove("show");
    document.getElementById("error-alert").classList.remove("show");
  }

  function showFormError(message) {
    const formError = document.getElementById("form-error");
    formError.textContent = message;
    formError.classList.add("show");
  }

  function hideFormError() {
    const formError = document.getElementById("form-error");
    formError.classList.remove("show");
  }

  // Password validation
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const lengthReq = document.getElementById("length-req");

  function validatePassword() {
    const password = passwordInput.value;
    const isValidLength = password.length >= 6;

    if (isValidLength) {
      lengthReq.classList.remove("unmet");
      lengthReq.classList.add("met");
    } else {
      lengthReq.classList.remove("met");
      lengthReq.classList.add("unmet");
    }

    return isValidLength;
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", validatePassword);
  }

  // Form submission handler
  const resetForm = document.getElementById("reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      console.log("Form submitted, preventDefault called");

      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const userId = document.getElementById("userId").value;

      const submitButton = document.getElementById("submit-button");
      const buttonText = document.getElementById("button-text");
      const buttonSpinner = document.getElementById("button-spinner");

      // Hide previous alerts and errors
      hideAlerts();
      hideFormError();

      console.log("Form data:", {
        userId: userId,
        passwordLength: password.length,
      });

      // Client-side validation
      if (!userId) {
        showErrorAlert(
          "Invalid reset session. Please request a new password reset link."
        );
        return false;
      }

      if (password.length < 6) {
        showFormError("Password must be at least 6 characters long.");
        return false;
      }

      if (password !== confirmPassword) {
        showFormError("Passwords do not match.");
        return false;
      }

      // Show spinner and disable button
      submitButton.disabled = true;
      buttonText.classList.add("hidden");
      buttonSpinner.classList.add("show");

      try {
        console.log("Making fetch request to /users/reset-password");

        const response = await fetch("/users/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            password: password,
          }),
        });

        console.log("Response received:", response.status, response.statusText);

        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok && data.success) {
          // Password reset successful
          showSuccessAlert(
            "Password reset successfully! Redirecting to login..."
          );
        } else {
          // Show error message
          showErrorAlert(
            data.message || "An unexpected error occurred. Please try again."
          );
        }
      } catch (error) {
        console.error("Fetch error:", error);
        showErrorAlert(
          "Could not connect to the server. Please check your connection and try again."
        );
      } finally {
        // Re-enable the button
        submitButton.disabled = false;
        buttonText.classList.remove("hidden");
        buttonSpinner.classList.remove("show");
      }

      return false; // Prevent any default form submission
    });
  }
});
