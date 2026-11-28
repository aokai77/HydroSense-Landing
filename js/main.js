/* ==========================================================================
   HydroSense — Lógica Interactiva Principal (Index + Monitoreo IoT)
   ========================================================================== */

(() => {
  const STORAGE_KEYS = {
    accessible: "hydrosense_accessible",
    profile: "hydrosense_profile",
    sensor: "hydrosense_sensor",
    sim: "hydrosense_sim",
    session: "hydrosense_session"
  };

  /* 0. Gestor de Vistas Exclusivas a Pantalla Completa */
  const appViews = document.querySelectorAll(".app-view");
  const getDefaultPanelForRole = (roleKey) => (roleKey === "lider" ? "panel-lider" : "panel");

  const getStoredSession = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.session);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  };

  const syncLiderBannerVisibility = (roleOverride) => {
    const bannerRetornoLider = document.getElementById("banner-retorno-lider");
    if (!bannerRetornoLider) return;
    const session = getStoredSession();
    const activeRole = roleOverride || session?.role || selectedProfileKey;
    const isLider = activeRole === "lider";
    bannerRetornoLider.hidden = !isLider;
    bannerRetornoLider.style.display = isLider ? "" : "none";
  };

  const showView = (viewName) => {
    if (appViews.length === 0) return;
    const session = getStoredSession();
    const isLider = session?.role === "lider";

    const safeViewName = viewName === "panel-lider" && !isLider ? "panel" : viewName;

    appViews.forEach((sec) => {
      sec.hidden = sec.dataset.view !== safeViewName;
    });
    const isPanelView = safeViewName === "panel" || safeViewName === "panel-lider";
    document.body.classList.toggle("is-panel-active", isPanelView);
    syncLiderBannerVisibility(session?.role);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  document.querySelectorAll("[data-nav-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const target = el.dataset.navView;
      if (el.classList.contains("brand")) {
        const session = getStoredSession();
        showView(session ? getDefaultPanelForRole(session.role) : "inicio");
      } else {
        showView(target);
      }
    });
  });

  /* 1. Modo Accesible (+30% tipografía y alto contraste — HU-021) */
  const toggleAccesible = document.getElementById("toggle-modo-accesible");
  const applyAccessibleMode = (enabled) => {
    document.body.classList.toggle("modo-accesible", enabled);
    if (toggleAccesible) toggleAccesible.checked = enabled;
  };
  const savedAccessible = localStorage.getItem(STORAGE_KEYS.accessible) === "true";
  applyAccessibleMode(savedAccessible);

  if (toggleAccesible) {
    toggleAccesible.addEventListener("change", () => {
      const enabled = toggleAccesible.checked;
      localStorage.setItem(STORAGE_KEYS.accessible, String(enabled));
      applyAccessibleMode(enabled);
    });
  }

  /* 2. Selección de Perfil mediante Menú Desplegable en Acceso (HU-001, HU-003, HU-004) */
  const selectPerfilAcceso = document.getElementById("select-perfil-acceso");
  const badgePerfilActivo = document.getElementById("badge-perfil-activo");
  const hubPerfilTag = document.getElementById("hub-perfil-tag");
  const panelDetallePerfil = document.getElementById("panel-detalle-perfil");

  const PERFILES_INFO = {
    hogar: {
      nombre: "Jefe de hogar",
      html: `
        <h3 style="margin:0 0 6px; font-size:1rem;">Configuración de Hogar Familiar</h3>
        <p class="helper-text" style="margin:0;">Controla el presupuesto mensual en soles y recibe alertas inmediatas ante fugas o sobrepaso de límite diario.</p>
      `
    },
    estudiante: {
      nombre: "Estudiante / Roommate",
      html: `
        <h3 style="margin:0 0 6px; font-size:1rem;">Departamento Compartido (Roommates)</h3>
        <p class="helper-text" style="margin:0;">Código único de invitación generado para tu piso: <strong>HS-482910</strong>. Comparte retos semanales y divide el recibo equitativamente.</p>
      `
    },
    lider: {
      nombre: "Líder comunitario",
      html: `
        <h3 style="margin:0 0 6px; font-size:1rem;">Panel de Local Comunal / Comedor Popular</h3>
        <div class="form-group" style="margin:8px 0 0;">
          <label for="input-aforo-comunal">Aforo diario del local (personas)</label>
          <input type="number" id="input-aforo-comunal" min="1" value="65" />
          <small id="feedback-aforo" class="form-feedback"></small>
        </div>
      `
    }
  };

  let selectedProfileKey = localStorage.getItem(STORAGE_KEYS.profile) || "hogar";
  if (!PERFILES_INFO[selectedProfileKey]) selectedProfileKey = "hogar";

  const selectProfile = (key) => {
    if (!PERFILES_INFO[key]) return;
    selectedProfileKey = key;
    localStorage.setItem(STORAGE_KEYS.profile, key);

    if (selectPerfilAcceso) selectPerfilAcceso.value = key;
    if (badgePerfilActivo) badgePerfilActivo.textContent = PERFILES_INFO[key].nombre;
    if (hubPerfilTag) hubPerfilTag.textContent = PERFILES_INFO[key].nombre;

    if (panelDetallePerfil) {
      panelDetallePerfil.hidden = false;
      panelDetallePerfil.innerHTML = PERFILES_INFO[key].html;
      const inputAforo = document.getElementById("input-aforo-comunal");
      const feedbackAforo = document.getElementById("feedback-aforo");
      if (inputAforo && feedbackAforo) {
        inputAforo.addEventListener("input", () => {
          const val = Number(inputAforo.value);
          if (val <= 0 || Number.isNaN(val)) {
            feedbackAforo.style.color = "var(--color-error)";
            feedbackAforo.textContent = "El aforo debe ser mayor a 0 personas.";
          } else {
            feedbackAforo.style.color = "var(--color-teal)";
            feedbackAforo.textContent = `Aforo válido registrado: ${val} beneficiarios.`;
          }
        });
      }
    }
  };

  selectProfile(selectedProfileKey);

  if (selectPerfilAcceso) {
    selectPerfilAcceso.addEventListener("change", () => {
      selectProfile(selectPerfilAcceso.value);
    });
  }

  const setDailyRingProgress = (pct) => {
    const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    const ring = document.getElementById("ring-consumo-diario");
    const txt = document.getElementById("texto-limite-diario");
    if (ring) {
      ring.style.setProperty("--ring-pct", String(clamped));
    }
    if (txt) {
      txt.textContent = `${clamped}% del límite diario alcanzado`;
    }
  };
  setDailyRingProgress(75);

  /* 3. Sincronización de Sensor IoT guardado (HU-002) */
  const sensorIdActivo = document.getElementById("sensor-id-activo");
  const hubSensorCode = document.getElementById("hub-sensor-code");
  const savedSensor = localStorage.getItem(STORAGE_KEYS.sensor);
  if (savedSensor) {
    if (sensorIdActivo) sensorIdActivo.textContent = savedSensor;
    if (hubSensorCode) hubSensorCode.textContent = savedSensor;
  }

  /* 4. Simulador de alertas rápidas en el Hub de Inicio */
  const ALERTAS_SIMULADAS = {
    fuga: {
      clase: "is-danger",
      role: "alert",
      texto: "Alerta crítica de fuga continua: Flujo constante detectado durante 3 horas en línea principal (0.4 L/min). Cierra la llave general o revisa sanitarios."
    },
    corte: {
      clase: "is-warn",
      role: "status",
      texto: "Alerta preventiva de corte de servicio: Mantenimiento programado SEDAPAL de 09:00 a 15:00 h. Almacena al menos 40 L de reserva."
    },
    limite: {
      clase: "is-warn",
      role: "alert",
      texto: "Sobrepaso de límite diario: Alcanzaste el 100 % de tu meta diaria (200 L). Se actualizó la proyección mensual."
    },
    presion: {
      clase: "",
      role: "status",
      texto: "Variación brusca de presión: Baja presión detectada en la red externa (12 PSI). El suministro se estabilizará en breve."
    }
  };

  const contenedorAlerta = document.getElementById("contenedor-alerta-simulada");
  document.querySelectorAll("[data-sim-alerta]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!contenedorAlerta) return;
      const item = ALERTAS_SIMULADAS[btn.dataset.simAlerta];
      if (!item) return;
      contenedorAlerta.innerHTML = `
        <div class="alert-box ${item.clase}" role="${item.role}">
          <span>${item.texto}</span>
          <button type="button" class="btn-close-alert" aria-label="Cerrar alerta">Cerrar</button>
        </div>
      `;
      const btnClose = contenedorAlerta.querySelector(".btn-close-alert");
      if (btnClose) {
        btnClose.addEventListener("click", () => {
          contenedorAlerta.innerHTML = "";
        });
      }
    });
  });

  /* 5. Registro en 2 pasos: Datos -> Código por correo -> Notificación e Inicio (HU-001) */
  const formRegistro = document.getElementById("form-registro");
  const pasoDatosRegistro = document.getElementById("paso-datos-registro");
  const pasoVerificarCodigo = document.getElementById("paso-verificar-codigo");
  const textoCorreoEnviado = document.getElementById("texto-correo-enviado");
  const inputCodigo = document.getElementById("reg-codigo");
  const btnVerificarCodigo = document.getElementById("btn-verificar-codigo");
  const btnVolverRegistro = document.getElementById("btn-volver-registro");

  let codigoGenerado = "";
  let correoPendiente = "";

  if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value.trim();
      const pass = document.getElementById("reg-password").value;
      const errEmail = document.getElementById("error-email");
      const errPass = document.getElementById("error-password");
      const estadoReg = document.getElementById("estado-registro");

      errEmail.textContent = "";
      errPass.textContent = "";
      estadoReg.textContent = "";

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const passOk = pass.length >= 8 && /\d/.test(pass);

      if (!emailOk) {
        errEmail.textContent = "Ingresa un correo electrónico válido (ejemplo: ana@correo.com).";
      }
      if (!passOk) {
        errPass.textContent = "La contraseña debe tener al menos 8 caracteres y 1 número.";
      }
      if (!emailOk || !passOk) return;

      correoPendiente = email;
      codigoGenerado = String(Math.floor(100000 + Math.random() * 900000));

      if (pasoDatosRegistro && pasoVerificarCodigo) {
        pasoDatosRegistro.hidden = true;
        pasoVerificarCodigo.hidden = false;
      }
      if (textoCorreoEnviado) {
        textoCorreoEnviado.innerHTML = `Enviamos un código de 6 dígitos a <strong>${email}</strong>. <br/><small>(Código de prueba: <strong>${codigoGenerado}</strong>)</small>`;
      }
      if (inputCodigo) {
        inputCodigo.value = codigoGenerado;
        inputCodigo.focus();
      }
      estadoReg.style.color = "var(--color-primary)";
      estadoReg.textContent = "Revisa tu bandeja e ingresa el código para confirmar tu cuenta.";
    });
  }

  if (btnVerificarCodigo) {
    btnVerificarCodigo.addEventListener("click", () => {
      const errCodigo = document.getElementById("error-codigo");
      const estadoReg = document.getElementById("estado-registro");
      const valor = (inputCodigo ? inputCodigo.value : "").trim();

      if (errCodigo) errCodigo.textContent = "";

      if (!/^\d{6}$/.test(valor)) {
        if (errCodigo) errCodigo.textContent = "Ingresa el código numérico de 6 dígitos.";
        return;
      }

      const activeRole = selectPerfilAcceso ? selectPerfilAcceso.value : selectedProfileKey;
      selectProfile(activeRole);
      const perfilNombre = PERFILES_INFO[activeRole]?.nombre || "Jefe de hogar";
      estadoReg.style.color = "var(--color-teal)";
      estadoReg.textContent = `✓ ¡Cuenta creada con éxito como ${perfilNombre}! Abriendo tu panel...`;

      const saludoGenerado = formatearSaludoCorreo(correoPendiente, activeRole);
      aplicarSesionActiva(correoPendiente, saludoGenerado, activeRole);

      const toast = document.getElementById("voice-toast");
      if (toast) {
        toast.hidden = false;
        toast.textContent = `✓ Cuenta verificada (${correoPendiente} · ${perfilNombre}). ¡Bienvenido a HydroSense!`;
      }

      setTimeout(() => {
        if (pasoDatosRegistro && pasoVerificarCodigo) {
          pasoVerificarCodigo.hidden = true;
          pasoDatosRegistro.hidden = false;
        }
        if (formRegistro) formRegistro.reset();
        estadoReg.textContent = "";

        showView(getDefaultPanelForRole(activeRole));

        if (toast) {
          setTimeout(() => { toast.hidden = true; }, 4500);
        }
      }, 900);
    });
  }

  if (btnVolverRegistro) {
    btnVolverRegistro.addEventListener("click", () => {
      const estadoReg = document.getElementById("estado-registro");
      if (pasoVerificarCodigo) pasoVerificarCodigo.hidden = true;
      if (pasoDatosRegistro) pasoDatosRegistro.hidden = false;
      if (estadoReg) estadoReg.textContent = "";
    });
  }

  /* 5b. Pestañas de Acceso, Inicio de Sesión y Biometría (HU-001) */
  const authTabs = document.querySelectorAll(".auth-tab");
  const formLogin = document.getElementById("form-login");
  const openAuthTriggers = document.querySelectorAll("[data-open-auth]");

  const switchAuthTab = (tabName) => {
    authTabs.forEach((tab) => {
      const isSelected = tab.dataset.authTab === tabName;
      tab.setAttribute("aria-selected", String(isSelected));
    });
    if (formRegistro && formLogin) {
      formRegistro.hidden = tabName !== "register";
      formLogin.hidden = tabName !== "login";
    }
  };

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthTab(tab.dataset.authTab));
  });

  openAuthTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      switchAuthTab(trigger.dataset.openAuth || "login");
      showView("acceso");
    });
  });

  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const pass = document.getElementById("login-password").value;
      const errEmail = document.getElementById("error-login-email");
      const errPass = document.getElementById("error-login-password");
      const estadoLogin = document.getElementById("estado-login");

      errEmail.textContent = "";
      errPass.textContent = "";
      estadoLogin.textContent = "";

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const passOk = pass.length >= 6;

      if (!emailOk) {
        errEmail.textContent = "Ingresa un correo electrónico válido (ejemplo: ana@correo.com).";
      }
      if (!passOk) {
        errPass.textContent = "Ingresa tu contraseña (mínimo 6 caracteres).";
      }
      if (!emailOk || !passOk) return;

      const activeRole = selectPerfilAcceso ? selectPerfilAcceso.value : selectedProfileKey;
      selectProfile(activeRole);
      const perfilNombre = PERFILES_INFO[activeRole]?.nombre || "Jefe de hogar";
      estadoLogin.style.color = "var(--color-teal)";
      estadoLogin.textContent = `✓ ¡Bienvenido de nuevo (${email})! Redirigiendo a tu panel (${perfilNombre})...`;
      aplicarSesionActiva(email, formatearSaludoCorreo(email, activeRole), activeRole);
      setTimeout(() => {
        showView(getDefaultPanelForRole(activeRole));
      }, 700);
    });
  }

  const btnBiometria = document.getElementById("btn-biometria");
  if (btnBiometria) {
    btnBiometria.addEventListener("click", () => {
      const estadoLogin = document.getElementById("estado-login");
      const activeRole = selectPerfilAcceso ? selectPerfilAcceso.value : selectedProfileKey;
      selectProfile(activeRole);
      const perfilNombre = PERFILES_INFO[activeRole]?.nombre || "Jefe de hogar";
      const emailEscrito = (document.getElementById("login-email")?.value || "").trim();
      btnBiometria.disabled = true;
      estadoLogin.style.color = "var(--color-primary)";
      estadoLogin.textContent = "Verificando huella digital / Face ID...";

      setTimeout(() => {
        btnBiometria.disabled = false;
        estadoLogin.style.color = "var(--color-teal)";
        estadoLogin.textContent = `✓ Identidad verificada con Face ID / Huella (${perfilNombre}). Abriendo tu panel...`;
        aplicarSesionActiva(emailEscrito, formatearSaludoCorreo(emailEscrito, activeRole), activeRole);
        setTimeout(() => {
          showView(getDefaultPanelForRole(activeRole));
        }, 550);
      }, 650);
    });
  }

  const extraerNombreDeCorreo = (email) => {
    if (!email || !email.includes("@")) return "";
    const base = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    if (!base) return "";
    return base
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatearSaludoCorreo = (email, roleKey = selectedProfileKey) => {
    const nombreUsuario = extraerNombreDeCorreo(email);
    if (roleKey === "lider") {
      return nombreUsuario ? `Hola, líder ${nombreUsuario}` : "Hola, líder";
    }
    return nombreUsuario ? `Hola, ${nombreUsuario}` : "Hola";
  };

  /* 5c. Estado de Sesión Activa (Redirección al Panel Principal según Rol) */
  const aplicarSesionActiva = (email, nombreMostrado, roleKey = selectedProfileKey) => {
    const isLider = roleKey === "lider";
    const perfilNombre = PERFILES_INFO[roleKey]?.nombre || "Jefe de hogar";
    const nombreBase = extraerNombreDeCorreo(email);
    const saludoPersonal = nombreBase ? `Hola, ${nombreBase}` : (nombreMostrado || "Hola");
    const saludoLider = nombreBase ? `Hola, líder ${nombreBase}` : "Hola, líder";

    const hubSaludo = document.getElementById("hub-saludo");
    const liderSaludo = document.getElementById("lider-saludo");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    if (hubSaludo) hubSaludo.textContent = saludoPersonal;
    if (liderSaludo) liderSaludo.textContent = saludoLider;
    if (hubPerfilTag) hubPerfilTag.textContent = perfilNombre;
    if (btnCerrarSesion) btnCerrarSesion.hidden = false;

    localStorage.setItem(
      STORAGE_KEYS.session,
      JSON.stringify({
        email,
        saludo: isLider ? saludoLider : saludoPersonal,
        role: roleKey
      })
    );

    syncLiderBannerVisibility(roleKey);
  };

  const cerrarSesionGeneral = () => {
    localStorage.removeItem(STORAGE_KEYS.session);
    const hubSaludo = document.getElementById("hub-saludo");
    const liderSaludo = document.getElementById("lider-saludo");
    const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");

    if (hubSaludo) hubSaludo.textContent = "Hola";
    if (liderSaludo) liderSaludo.textContent = "Hola, líder";
    if (btnCerrarSesion) btnCerrarSesion.hidden = true;
    syncLiderBannerVisibility("hogar");
    showView("inicio");
  };

  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", cerrarSesionGeneral);
  }

  const btnCerrarSesionLider = document.getElementById("btn-cerrar-sesion-lider");
  if (btnCerrarSesionLider) {
    btnCerrarSesionLider.addEventListener("click", cerrarSesionGeneral);
  }

  /* 5d. Interacción del Menú de Líder Comunitario: solo "Mi consumo" funciona */
  const btnMiConsumo = document.getElementById("btn-mi-consumo");
  if (btnMiConsumo) {
    btnMiConsumo.addEventListener("click", () => {
      showView("panel");
    });
  }

  const btnVolverPanelLider = document.getElementById("btn-volver-panel-lider");
  if (btnVolverPanelLider) {
    btnVolverPanelLider.addEventListener("click", () => {
      const session = getStoredSession();
      if (session?.role === "lider") {
        showView("panel-lider");
      }
    });
  }

  document.querySelectorAll("[data-lider-static]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
    });
  });

  const savedSession = localStorage.getItem(STORAGE_KEYS.session);
  if (savedSession) {
    try {
      const s = JSON.parse(savedSession);
      const role = s.role || selectedProfileKey;
      if (s.role) selectProfile(s.role);
      const saludoLimpio = formatearSaludoCorreo(s.email, role);
      aplicarSesionActiva(s.email, saludoLimpio, role);

      if (window.location.hash === "#funcionalidades") {
        showView("panel");
      } else {
        showView(getDefaultPanelForRole(role));
      }
    } catch (_) {
      syncLiderBannerVisibility("hogar");
      showView("inicio");
    }
  } else {
    syncLiderBannerVisibility("hogar");
    showView("inicio");
  }

  /* 6. Lógica específica de Gestión Comunal en pages/monitoreo.html */
  const estadoComunal = document.getElementById("estado-comunal-monitoreo");
  const btnPdf = document.getElementById("btn-reporte-pdf");
  const btnWa = document.getElementById("btn-whatsapp-comunal");
  const btnAbrirIncidente = document.getElementById("btn-abrir-incidente");
  const formIncidente = document.getElementById("form-incidente-comunal");
  const listaIncidentes = document.getElementById("lista-incidentes-comunales");

  if (btnPdf && estadoComunal) {
    btnPdf.addEventListener("click", () => {
      estadoComunal.style.color = "var(--color-teal)";
      estadoComunal.textContent = "Reporte mensual de asamblea generado (Presupuesto S/ 760.00 · Disponible S/ 520.00).";
    });
  }

  if (btnWa && estadoComunal) {
    btnWa.addEventListener("click", () => {
      estadoComunal.style.color = "var(--color-teal)";
      estadoComunal.textContent = "Mensaje comunitario preparado para difusión por WhatsApp con estado de cuotas y alertas.";
    });
  }

  if (btnAbrirIncidente && formIncidente) {
    btnAbrirIncidente.addEventListener("click", () => {
      formIncidente.hidden = !formIncidente.hidden;
    });
  }

  if (formIncidente && listaIncidentes) {
    formIncidente.addEventListener("submit", (e) => {
      e.preventDefault();
      const tipo = document.getElementById("incidente-tipo").value;
      const detalleInput = document.getElementById("incidente-detalle");
      const detalle = detalleInput.value.trim();

      if (!detalle) {
        if (estadoComunal) {
          estadoComunal.style.color = "var(--color-error)";
          estadoComunal.textContent = "Ingresa una descripción breve del incidente antes de guardar.";
        }
        return;
      }

      const hoy = new Date().toLocaleDateString("es-PE");
      const item = document.createElement("li");
      item.className = "sensor-device-item";
      item.innerHTML = `
        <div>
          <strong>${tipo}</strong>
          <span class="helper-text" style="display:block; margin:2px 0 0;">${detalle} · ${hoy}</span>
        </div>
        <span class="badge badge-warn">En revisión</span>
      `;
      listaIncidentes.prepend(item);

      formIncidente.reset();
      formIncidente.hidden = true;
      if (estadoComunal) {
        estadoComunal.style.color = "var(--color-teal)";
        estadoComunal.textContent = "Incidente registrado correctamente en la bitácora comunal.";
      }
    });
  }

  /* 7. Asistente por Voz (HU-019 / HU-022) */
  const btnVoz = document.getElementById("btn-asistente-voz");
  const voiceToast = document.getElementById("voice-toast");
  if (btnVoz && voiceToast) {
    btnVoz.addEventListener("click", () => {
      const mensaje = "Asistente HydroSense: Comedor San Martín cuenta con un presupuesto de S/ 760.00 y un saldo disponible de S/ 520.00.";
      voiceToast.hidden = false;
      voiceToast.textContent = mensaje;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(mensaje);
        utter.lang = "es-PE";
        window.speechSynthesis.speak(utter);
      }

      setTimeout(() => {
        voiceToast.hidden = true;
      }, 6500);
    });
  }


  /* ==========================================================================
     Menú Hamburguesa Responsive (Tablet & Mobile <= 992px)
     ========================================================================== */
  (function initMobileHamburgerMenu() {
    const subnavs = Array.from(document.querySelectorAll('.hs-subnav'));
    if (!subnavs.length) return;

    // Crear backdrop único
    let backdrop = document.querySelector('.hs-mobile-nav-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'hs-mobile-nav-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    // Obtener la barra de navegación visible actualmente (soporta index.html con 2 vistas de panel y páginas secundarias)
    function getActiveSubnav() {
      for (const nav of subnavs) {
        const parentSection = nav.closest('section.app-view');
        if (!parentSection || !parentSection.hidden) {
          return nav;
        }
      }
      return subnavs[0];
    }

    function closeAllDrawers() {
      subnavs.forEach(nav => nav.classList.remove('is-mobile-open'));
      backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
      document.querySelectorAll('.hs-hamburger-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });
    }

    function openDrawer() {
      const targetNav = getActiveSubnav();
      if (!targetNav) return;
      targetNav.classList.add('is-mobile-open');
      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      document.querySelectorAll('.hs-hamburger-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', 'true');
      });
    }

    // Inyectar botón hamburguesa en el header (.hs-topbar o .site-header .header-actions)
    const topbar = document.querySelector('.hs-topbar');
    const siteHeaderActions = document.querySelector('.site-header .header-actions');

    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.type = 'button';
    hamburgerBtn.className = 'hs-hamburger-btn';
    hamburgerBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <span class="hs-hamburger-label">Menú</span>
    `;

    if (topbar) {
      let rightWrap = topbar.querySelector('.hs-topbar-right');
      if (!rightWrap) {
        rightWrap = document.createElement('div');
        rightWrap.className = 'hs-topbar-right';
        const toggle = topbar.querySelector('.hs-access-toggle');
        if (toggle) {
          topbar.appendChild(rightWrap);
          rightWrap.appendChild(toggle);
        } else {
          topbar.appendChild(rightWrap);
        }
      }
      rightWrap.appendChild(hamburgerBtn);
    } else if (siteHeaderActions) {
      siteHeaderActions.appendChild(hamburgerBtn);
    }

    // Añadir encabezado con botón cerrar dentro de cada .hs-subnav para el modo drawer móvil/tablet
    subnavs.forEach(nav => {
      if (!nav.querySelector('.hs-drawer-header')) {
        const header = document.createElement('div');
        header.className = 'hs-drawer-header';
        header.innerHTML = `
          <span class="hs-drawer-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1262D5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
            <span>Secciones</span>
          </span>
          <button type="button" class="hs-drawer-close" aria-label="Cerrar menú">✕</button>
        `;
        nav.prepend(header);
        header.querySelector('.hs-drawer-close').addEventListener('click', closeAllDrawers);
      }

      // Cerrar drawer automáticamente al seleccionar una opción
      nav.querySelectorAll('.hs-nav-item').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 992) {
            closeAllDrawers();
          }
        });
      });
    });

    hamburgerBtn.addEventListener('click', () => {
      const targetNav = getActiveSubnav();
      if (targetNav && targetNav.classList.contains('is-mobile-open')) {
        closeAllDrawers();
      } else {
        openDrawer();
      }
    });

    backdrop.addEventListener('click', closeAllDrawers);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllDrawers();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 992) {
        closeAllDrawers();
      }
    });
  })();

})();
