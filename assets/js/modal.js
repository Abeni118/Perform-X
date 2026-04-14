(() => {
  const qs = (s, r = document) => r.querySelector(s);

  const ensureRoot = () => {
    let root = qs("#px-modal-root");
    if (root) return root;
    root = document.createElement("div");
    root.id = "px-modal-root";
    document.body.appendChild(root);
    return root;
  };

  const escClose = (handler) => {
    const fn = (e) => {
      if (e.key === "Escape") handler();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  };

  const buildField = (field) => {
    const wrap = document.createElement("label");
    wrap.className = "px-field";
    const label = document.createElement("span");
    label.className = "px-field-label";
    label.textContent = field.label || field.name;
    wrap.appendChild(label);

    if (field.type === "textarea") {
      const el = document.createElement("textarea");
      el.className = "px-textarea";
      el.name = field.name;
      el.placeholder = field.placeholder || "";
      el.value = field.value || "";
      wrap.appendChild(el);
      return wrap;
    }

    if (field.type === "select") {
      const el = document.createElement("select");
      el.className = "px-select";
      el.name = field.name;
      (field.options || []).forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        if (String(opt.value) === String(field.value)) option.selected = true;
        el.appendChild(option);
      });
      wrap.appendChild(el);
      return wrap;
    }

    if (field.type === "checkbox-group") {
      const group = document.createElement("div");
      group.className = "px-check-grid";
      (field.options || []).forEach((opt) => {
        const item = document.createElement("label");
        item.className = "px-check-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.name = field.name;
        cb.value = opt.value;
        if ((field.value || []).includes(opt.value)) cb.checked = true;
        const txt = document.createElement("span");
        txt.textContent = opt.label;
        item.append(cb, txt);
        group.appendChild(item);
      });
      wrap.appendChild(group);
      return wrap;
    }

    const el = document.createElement("input");
    el.className = "px-input";
    el.type = field.type || "text";
    el.name = field.name;
    el.placeholder = field.placeholder || "";
    el.value = field.value || "";
    wrap.appendChild(el);
    return wrap;
  };

  const openForm = ({ title, fields = [], submitText = "Save", cancelText = "Cancel", validate }) =>
    new Promise((resolve) => {
      const root = ensureRoot();
      const overlay = document.createElement("div");
      overlay.className = "px-modal-overlay";
      overlay.innerHTML = `
        <div class="px-modal" role="dialog" aria-modal="true">
          <div class="px-modal-header">
            <div class="px-modal-title"></div>
            <button type="button" class="px-modal-close" aria-label="Close">✕</button>
          </div>
          <form class="px-modal-body"></form>
          <div class="px-modal-error"></div>
          <div class="px-modal-footer">
            <button type="button" class="px-btn px-cancel"></button>
            <button type="button" class="px-btn px-btn-primary px-submit"></button>
          </div>
        </div>
      `;
      root.appendChild(overlay);

      const modal = qs(".px-modal", overlay);
      const form = qs("form", overlay);
      const titleEl = qs(".px-modal-title", overlay);
      const errorEl = qs(".px-modal-error", overlay);
      const cancelBtn = qs(".px-cancel", overlay);
      const submitBtn = qs(".px-submit", overlay);
      const closeBtn = qs(".px-modal-close", overlay);

      titleEl.textContent = title || "Modal";
      cancelBtn.textContent = cancelText;
      submitBtn.textContent = submitText;

      fields.forEach((f) => form.appendChild(buildField(f)));

      const close = (result = null) => {
        overlay.classList.remove("active");
        stopEsc();
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 180);
      };

      const stopEsc = escClose(() => close(null));

      const collect = () => {
        const data = {};
        fields.forEach((f) => {
          if (f.type === "checkbox-group") {
            data[f.name] = Array.from(form.querySelectorAll(`input[name="${f.name}"]:checked`)).map((i) => i.value);
          } else {
            const el = form.querySelector(`[name="${f.name}"]`);
            data[f.name] = el ? el.value : "";
          }
        });
        return data;
      };

      submitBtn.addEventListener("click", () => {
        const data = collect();
        if (typeof validate === "function") {
          const verdict = validate(data);
          if (verdict !== true) {
            errorEl.textContent = typeof verdict === "string" ? verdict : "Please fix form errors.";
            return;
          }
        }
        close(data);
      });

      [cancelBtn, closeBtn].forEach((btn) => btn.addEventListener("click", () => close(null)));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(null);
      });
      modal.addEventListener("click", (e) => e.stopPropagation());

      requestAnimationFrame(() => {
        overlay.classList.add("active");
      });
      const firstInput = form.querySelector("input, textarea, select");
      firstInput?.focus();
    });

  const confirmDialog = ({ title = "Confirm Action", message = "Are you sure?", confirmText = "Confirm" } = {}) =>
    new Promise((resolve) => {
      const root = ensureRoot();
      const overlay = document.createElement("div");
      overlay.className = "px-modal-overlay";
      overlay.innerHTML = `
        <div class="px-modal" role="dialog" aria-modal="true">
          <div class="px-modal-header">
            <div class="px-modal-title"></div>
            <button type="button" class="px-modal-close" aria-label="Close">✕</button>
          </div>
          <div class="px-modal-body"><p style="margin:0;color:var(--px-modal-muted);line-height:1.55;"></p></div>
          <div class="px-modal-footer">
            <button type="button" class="px-btn px-cancel">Cancel</button>
            <button type="button" class="px-btn px-btn-primary px-submit"></button>
          </div>
        </div>
      `;
      root.appendChild(overlay);
      qs(".px-modal-title", overlay).textContent = title;
      qs(".px-modal-body p", overlay).textContent = message;
      qs(".px-submit", overlay).textContent = confirmText;

      const close = (value) => {
        overlay.classList.remove("active");
        stopEsc();
        setTimeout(() => {
          overlay.remove();
          resolve(value);
        }, 180);
      };

      const stopEsc = escClose(() => close(false));
      qs(".px-cancel", overlay)?.addEventListener("click", () => close(false));
      qs(".px-modal-close", overlay)?.addEventListener("click", () => close(false));
      qs(".px-submit", overlay)?.addEventListener("click", () => close(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(false);
      });
      requestAnimationFrame(() => overlay.classList.add("active"));
    });

  window.PerformXModal = {
    openForm,
    confirm: confirmDialog
  };
})();

