document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authUrl = (endpoint) => {
    const url = window.apiUrl ? window.apiUrl(`auth/${endpoint}`) : `../backend/auth/${endpoint}`;
    console.log('Auth URL:', url); // Debug logging
    return url;
  };

  const redirectByRole = (role) => {
    window.location.href = role === "admin" ? "../admin/users.html" : "../index.html";
  };

  // Check if session is already active
  const checkSession = async () => {
    try {
      const response = await fetch(authUrl('session.php'), {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const result = await response.json();
        const user = result.user || result.data;
        if (user && user.role) {
          redirectByRole(user.role);
        }
      }
    } catch (err) {
      // Ignored
    }
  };

  if (loginForm || registerForm) {
    checkSession();
  }

  // Skip the localStorage-based auto-redirect here, 
  // protect.js will handle session verification.

  const clearFieldError = (inputId, errorId) => {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.remove("input-error");
    if (error) error.textContent = "";
  };
  const setFieldError = (inputId, errorId, msg) => {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (input) input.classList.add("input-error");
    if (error) error.textContent = msg;
  };

  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      target.type = target.type === "password" ? "text" : "password";
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("bx-show", target.type === "password");
        icon.classList.toggle("bx-hide", target.type === "text");
      }
    });
  });

  if (loginForm) {
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const submitBtn = document.getElementById("loginSubmit");
    const errorBox = document.getElementById("loginError");
    if (!emailInput || !passwordInput || !submitBtn || !errorBox) return;

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.textContent = "";
      clearFieldError("loginEmail", "loginEmailError");
      clearFieldError("loginPassword", "loginPasswordError");

      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;
      let hasError = false;
      if (!email) {
        setFieldError("loginEmail", "loginEmailError", "Email or username is required.");
        hasError = true;
      }
      if (!password) {
        setFieldError("loginPassword", "loginPasswordError", "Password is required.");
        hasError = true;
      }
      if (hasError) return;

      submitBtn.disabled = true;
      const oldText = submitBtn.innerHTML;
      submitBtn.innerHTML = "Loading...";

      try {
        const loginUrl = authUrl('login.php');
        const requestBody = JSON.stringify({ email, password });
        
        console.log('Login attempt:', {
          url: loginUrl,
          method: 'POST',
          body: requestBody,
          email: email
        });
        
        const response = await fetch(loginUrl, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        });
        
        console.log('Login response status:', response.status);
        const result = await response.json();
        console.log('Login response data:', result);
        
        if (!response.ok) {
          errorBox.textContent = result.message || "Invalid credentials.";
          submitBtn.disabled = false;
          submitBtn.innerHTML = oldText;
          return;
        }

        const user = result.user || result.data;
        if (user) {
          redirectByRole(user.role);
        } else {
          throw new Error("User data missing from response");
        }
      } catch (error) {
        console.error("Login mapping error:", error);
        errorBox.textContent = "An error occurred during login. Please try again.";
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldText;
      }
    });
  }

  if (registerForm) {
    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const passInput = document.getElementById("registerPassword");
    const confirmInput = document.getElementById("registerPasswordConfirm");
    const roleInput = document.getElementById("registerRole");
    const submitBtn = document.getElementById("registerSubmit");
    const errorBox = document.getElementById("registerError");
    if (!nameInput || !emailInput || !passInput || !confirmInput || !roleInput || !submitBtn || !errorBox) return;

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      ["registerName", "registerEmail", "registerPassword", "registerPasswordConfirm"].forEach((id) => {
        const err = `${id}Error`;
        clearFieldError(id, err);
      });
      errorBox.textContent = "";

      const name = nameInput.value.trim();
      const email = emailInput.value.trim().toLowerCase();
      const pass = passInput.value;
      const confirm = confirmInput.value;
      let hasError = false;
      if (!name) {
        setFieldError("registerName", "registerNameError", "Full name is required.");
        hasError = true;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError("registerEmail", "registerEmailError", "Enter a valid email address.");
        hasError = true;
      }
      if (!pass || pass.length < 6) {
        setFieldError("registerPassword", "registerPasswordError", "Password must be at least 6 characters.");
        hasError = true;
      }
      if (pass !== confirm) {
        setFieldError("registerPasswordConfirm", "registerPasswordConfirmError", "Passwords do not match.");
        hasError = true;
      }
      if (hasError) return;

      submitBtn.disabled = true;
      const oldText = submitBtn.innerHTML;
      submitBtn.innerHTML = "Loading...";

      const role = roleInput ? (roleInput.value === "admin" ? "admin" : "user") : "user";
      
      try {
        // Dynamic path generator allowing registration logic to execute
        const response = await fetch(authUrl('register.php'), {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass, role })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          if (result.message && result.message.toLowerCase().includes("email already exists")) {
            setFieldError("registerEmail", "registerEmailError", "Email already exists.");
          } else {
            errorBox.textContent = result.message || "Registration failed.";
          }
          submitBtn.disabled = false;
          submitBtn.innerHTML = oldText;
          return;
        }

        const newUser = result.user || result.data;
        if (newUser) {
          submitBtn.innerHTML = oldText;
          redirectByRole(newUser.role);
        } else {
          throw new Error("User data missing from response");
        }
      } catch (error) {
        console.error("Registration error:", error);
        errorBox.textContent = "An error occurred during registration. Please try again.";
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldText;
      }
    });
  }
});

