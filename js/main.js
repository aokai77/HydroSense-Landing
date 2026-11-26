/* ==========================================================================
   HydroSense — Lógica Interactiva Principal (Index + Monitoreo IoT)
   ========================================================================== */

(() => {
  const STORAGE_KEYS = {
    accessible: "hydrosense_accessible",
    profile: "hydrosense_profile",
    sensor: "hydrosense_sensor",
    sim: "hydrosense_sim"
  };

  /* 1. Menú móvil responsivo */
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.getElementById("nav-principal");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  /* 2. Modo Accesible (+30% tipografía y alto contraste — HU-021) */
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

  /* 3. Selección de Perfil (HU-001, HU-003, HU-004) */
  const profileCards = document.querySelectorAll(".profile-card");
  const btnContinuarPerfil = document.getElementById("btn-continuar-perfil");
  const estadoPerfil = document.getElementById("estado-perfil");
  const badgePerfilActivo = document.getElementById("badge-perfil-activo");
  const panelDetallePerfil = document.getElementById("panel-detalle-perfil");

  const PERFILES_INFO = {
    hogar: {
      nombre: "Jefe de hogar",
      html: `
        <h3 style="margin:0 0 8px;">Configuración de Hogar Familiar</h3>
        <p class="helper-text">Controla el presupuesto mensual en soles y recibe alertas inmediatas ante fugas o sobrepaso de límite diario.</p>
      `
    },
    estudiante: {
      nombre: "Estudiante/Roommate",
      html: `
        <h3 style="margin:0 0 8px;">Departamento Compartido (Roommates)</h3>
        <p class="helper-text">Código único de invitación generado para tu piso: <strong>HS-482910</strong>. Comparte retos semanales y divide el recibo equitativamente.</p>
      `
    },
    lider: {
      nombre: "Líder comunitario",
      html: `
        <h3 style="margin:0 0 8px;">Panel de Local Comunal / Comedor Popular</h3>
        <div class="form-group" style="max-width:320px; margin-top:10px;">
          <label for="input-aforo-comunal">Aforo diario del local (personas)</label>
          <input type="number" id="input-aforo-comunal" min="1" value="65" />
          <small id="feedback-aforo" class="form-feedback"></small>
        </div>
      `
    }
  };

  let selectedProfileKey = localStorage.getItem(STORAGE_KEYS.profile) || "";

  const selectProfile = (key) => {
    if (!PERFILES_INFO[key]) return;
    selectedProfileKey = key;
    localStorage.setItem(STORAGE_KEYS.profile, key);

    profileCards.forEach((card) => {
      const match = card.dataset.profile === key;
      card.setAttribute("aria-checked", String(match));
    });

    if (btnContinuarPerfil) btnContinuarPerfil.disabled = false;
    if (estadoPerfil) estadoPerfil.textContent = `Perfil seleccionado: ${PERFILES_INFO[key].nombre}`;
    if (badgePerfilActivo) badgePerfilActivo.textContent = PERFILES_INFO[key].nombre;

    if (panelDetallePerfil) {
      panelDetallePerfil.hidden = false;
      panelDetallePerfil.innerHTML = PERFILES_INFO[key].html;
      const inputAforo = document.getElementById("input-aforo-comunal");
      const feedbackAforo = document.getElementById("feedback-aforo");
      if (inputAforo && feedbackAforo) {
        inputAforo.addEventListener("input", () => {
          const val = Number(inputAforo.value);
          if (val <= 0 || Number.isNaN(val)) {
            feedbackAforo.textContent = "El aforo debe ser mayor a 0 personas.";
          } else {
            feedbackAforo.style.color = "var(--color-teal)";
            feedbackAforo.textContent = `Aforo válido registrado: ${val} beneficiarios.`;
          }
        });
      }
    }
  };

  if (profileCards.length > 0) {
    profileCards.forEach((card) => {
      card.addEventListener("click", () => selectProfile(card.dataset.profile));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectProfile(card.dataset.profile);
        }
      });
    });

    if (selectedProfileKey) selectProfile(selectedProfileKey);

    if (btnContinuarPerfil) {
      btnContinuarPerfil.addEventListener("click", () => {
        const target = document.getElementById("acceso");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  /* 4. Vinculación de Sensor IoT (HU-002) */
  const formSensor = document.getElementById("form-sensor");
  const inputSensor = document.getElementById("input-codigo-sensor");
  const estadoSensor = document.getElementById("estado-sensor");
  const sensorIdActivo = document.getElementById("sensor-id-activo");

  const savedSensor = localStorage.getItem(STORAGE_KEYS.sensor);
  if (savedSensor && sensorIdActivo) {
    sensorIdActivo.textContent = savedSensor;
  }

  if (formSensor && inputSensor && estadoSensor) {
    formSensor.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = inputSensor.value.trim().toUpperCase();
      const regex = /^HS-[A-Z0-9]{2}-\d{4}-\d{4}$/;
      if (!regex.test(code)) {
        estadoSensor.style.color = "var(--color-error)";
        estadoSensor.textContent = "Formato inválido. Usa el código de serie del medidor (ejemplo: HS-BA-2409-0186).";
        return;
      }
      localStorage.setItem(STORAGE_KEYS.sensor, code);
      estadoSensor.style.color = "var(--color-teal)";
      estadoSensor.textContent = `Sensor ${code} vinculado exitosamente y transmitiendo telemetría en línea.`;
    });
  }

  /* 5. Tarjetas de Funcionalidades Core y Simulación de Alertas (HU-009 a HU-033) */
  const shortcutCards = document.querySelectorAll(".shortcut-card");
  const tituloModulo = document.getElementById("titulo-modulo-activo");
  const contenedorAlertaSimulada = document.getElementById("contenedor-alerta-simulada");

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

  const mostrarAlertaSimulada = (tipo) => {
    if (!contenedorAlertaSimulada || !ALERTAS_SIMULADAS[tipo]) return;
    const item = ALERTAS_SIMULADAS[tipo];
    contenedorAlertaSimulada.innerHTML = `
      <div class="alert-box ${item.clase}" role="${item.role}">
        <span>${item.texto}</span>
        <button type="button" class="btn-close-alert" aria-label="Cerrar alerta">Cerrar</button>
      </div>
    `;
    const btnClose = contenedorAlertaSimulada.querySelector(".btn-close-alert");
    if (btnClose) {
      btnClose.addEventListener("click", () => {
        contenedorAlertaSimulada.innerHTML = "";
      });
    }
  };

  document.querySelectorAll("[data-sim-alerta]").forEach((btn) => {
    btn.addEventListener("click", () => mostrarAlertaSimulada(btn.dataset.simAlerta));
  });

  if (shortcutCards.length > 0 && tituloModulo) {
    shortcutCards.forEach((card) => {
      card.addEventListener("click", () => {
        const mod = card.dataset.modulo;
        if (mod === "desglose") {
          tituloModulo.textContent = "Desglose de Consumo por Ambientes";
          contenedorAlertaSimulada.innerHTML = `
            <div class="alert-box is-success">
              <span><strong>Distribución actual:</strong> Ducha 40 % (58 L) · Lavadero 25 % (36.25 L) · Cocina 20 % (29 L) · Otros 15 % (21.75 L).</span>
            </div>
          `;
        } else if (mod === "alertas") {
          tituloModulo.textContent = "Simulador de Alertas y Fugas IoT";
          mostrarAlertaSimulada("fuga");
        } else if (mod === "retos") {
          tituloModulo.textContent = "Retos Semanales y Ranking Anónimo";
          contenedorAlertaSimulada.innerHTML = `
            <div class="alert-box is-success">
              <span><strong>Ranking Sectorial:</strong> #1 Departamento 302 (-22 % ahorro) · #2 Tu Hogar (-18 % ahorro) · Reto activo: “Ducha de 5 minutos”.</span>
            </div>
          `;
        } else if (mod === "comunal") {
          tituloModulo.textContent = "Gestión Comunal, Reportes y Cuotas";
          contenedorAlertaSimulada.innerHTML = `
            <div class="alert-box">
              <span><strong>Presupuesto Comunal:</strong> S/ 760.00 recaudados · Cuota equitativa: S/ 38.00/familia · Listo para exportar reporte PDF o difundir por WhatsApp.</span>
            </div>
          `;
        }
      });
    });
  }

  /* 6. Simulador Tarifario SEDAPAL (HU-010, HU-031, HU-045) */
  const calcularTarifaSedapal = (m3) => {
    const cargoFijo = 6.24;
    let consumo = 0;
    if (m3 <= 10) {
      consumo = m3 * 1.58;
    } else if (m3 <= 20) {
      consumo = 10 * 1.58 + (m3 - 10) * 2.36;
    } else if (m3 <= 50) {
      consumo = 10 * 1.58 + 10 * 2.36 + (m3 - 20) * 3.22;
    } else {
      consumo = 10 * 1.58 + 10 * 2.36 + 30 * 3.22 + (m3 - 50) * 7.32;
    }
    return Number((cargoFijo + consumo).toFixed(2));
  };

  const formSimulador = document.getElementById("form-simulador");
  const inputPersonas = document.getElementById("input-personas");
  const inputM3 = document.getElementById("input-consumo-m3");
  const outputM3 = document.getElementById("output-m3");
  const selectMeta = document.getElementById("select-meta");
  const resActual = document.getElementById("res-actual");
  const resAhorro = document.getElementById("res-ahorro");
  const resDiferencia = document.getElementById("res-diferencia");
  const resOms = document.getElementById("res-oms");
  const alertaTarifaSim = document.getElementById("alerta-tarifa-simulador");

  const actualizarSimulador = () => {
    if (!inputM3 || !inputPersonas || !selectMeta) return;
    const personas = Math.max(1, Number(inputPersonas.value) || 4);
    const m3 = Number(inputM3.value) || 18;
    const metaPct = Number(selectMeta.value) || 15;

    if (outputM3) outputM3.textContent = String(m3);

    const m3ConMeta = Math.max(1, Number((m3 * (1 - metaPct / 100)).toFixed(1)));
    const actual = calcularTarifaSedapal(m3);
    const conMeta = calcularTarifaSedapal(m3ConMeta);
    const ahorro = Number(Math.max(0, actual - conMeta).toFixed(2));
    const litrosPersonaDia = Math.round((m3 * 1000) / (personas * 30));

    if (resActual) resActual.textContent = `S/ ${actual.toFixed(2)}`;
    if (resAhorro) resAhorro.textContent = `S/ ${conMeta.toFixed(2)}`;
    if (resDiferencia) resDiferencia.textContent = `S/ ${ahorro.toFixed(2)}`;
    if (resOms) {
      resOms.textContent = `${litrosPersonaDia} L/persona/día`;
      resOms.style.color = litrosPersonaDia > 100 ? "var(--color-error)" : "var(--color-teal)";
    }

    if (alertaTarifaSim) {
      const avisos = [];
      if (m3 >= 19 && m3 <= 20) {
        avisos.push(`<strong>Aviso de bloque tarifario:</strong> Con ${m3} m³ estás al límite del tramo siguiente (> 20 m³, tarifa pasa de S/ 2.36 a S/ 3.22/m³).`);
      } else if (m3 > 50) {
        avisos.push(`<strong>Alerta crítica de tramo máximo:</strong> Superaste los 50 m³ y aplicas a la tarifa más alta de SEDAPAL (S/ 7.32/m³).`);
      }
      if (litrosPersonaDia > 100) {
        avisos.push(`Tu consumo equivale a <strong>${litrosPersonaDia} L/persona/día</strong>, superando el umbral recomendado por la OMS (100 L/persona/día).`);
      }
      alertaTarifaSim.innerHTML = avisos.length
        ? `<div class="alert-box is-warn" role="status"><span>${avisos.join("<br/>")}</span></div>`
        : "";
    }

    localStorage.setItem(
      STORAGE_KEYS.sim,
      JSON.stringify({ personas, m3, metaPct, actual, conMeta, ahorro })
    );
  };

  if (inputM3) {
    inputM3.addEventListener("input", actualizarSimulador);
    if (inputPersonas) inputPersonas.addEventListener("input", actualizarSimulador);
    if (selectMeta) selectMeta.addEventListener("change", actualizarSimulador);
    if (formSimulador) {
      formSimulador.addEventListener("submit", (e) => {
        e.preventDefault();
        actualizarSimulador();
      });
    }
    actualizarSimulador();
  }

  /* 7. Validación de Registro y Contacto (HU-001) */
  const formRegistro = document.getElementById("form-registro");
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

      const perfilNombre = PERFILES_INFO[selectedProfileKey]?.nombre || "Jefe de hogar";
      estadoReg.style.color = "var(--color-teal)";
      estadoReg.textContent = `¡Cuenta creada con éxito como ${perfilNombre}! Ya puedes explorar el panel de monitoreo.`;
    });
  }

  const formContacto = document.getElementById("form-contacto");
  if (formContacto) {
    formContacto.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre = document.getElementById("contacto-nombre").value.trim();
      const correo = document.getElementById("contacto-correo").value.trim();
      const mensaje = document.getElementById("contacto-mensaje").value.trim();
      const estado = document.getElementById("estado-contacto");

      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || mensaje.length < 5) {
        estado.style.color = "var(--color-error)";
        estado.textContent = "Completa tu nombre, un correo válido y tu consulta antes de enviar.";
        return;
      }
      estado.style.color = "var(--color-teal)";
      estado.textContent = `Gracias, ${nombre}. Tu solicitud fue registrada y nuestro equipo técnico te responderá pronto.`;
      formContacto.reset();
    });
  }

  /* 8. Lógica específica de pages/monitoreo.html */
  const periodTabs = document.querySelectorAll(".period-tab");
  const chartBarsContainer = document.getElementById("mon-chart-bars");

  const PERIODOS_MONITOREO = {
    dia: {
      titulo: "Consumo Actual (Hoy)",
      litros: "145 L",
      soles: "S/ 4.20",
      meta: "Meta diaria: 200 L",
      pct: 75,
      subtitulo: "Distribución horaria del consumo",
      pico: "Pico: 08:00 h (42 L)",
      desglose: ["40 % (58.0 L)", "25 % (36.25 L)", "20 % (29.0 L)", "15 % (21.75 L)"],
      barras: [
        { label: "06h", h: 35 },
        { label: "08h", h: 95, peak: true },
        { label: "12h", h: 55 },
        { label: "15h", h: 42 },
        { label: "19h", h: 70 },
        { label: "22h", h: 45 }
      ]
    },
    semana: {
      titulo: "Consumo Acumulado (Semana)",
      litros: "1,020 L",
      soles: "S/ 14.80",
      meta: "Meta semanal: 1,400 L",
      pct: 73,
      subtitulo: "Comparativo diario de la semana",
      pico: "Pico: Sábado (185 L)",
      desglose: ["40 % (408.0 L)", "25 % (255.0 L)", "20 % (204.0 L)", "15 % (153.0 L)"],
      barras: [
        { label: "Lun", h: 60 },
        { label: "Mar", h: 55 },
        { label: "Mié", h: 65 },
        { label: "Jue", h: 58 },
        { label: "Vie", h: 72 },
        { label: "Sáb", h: 96, peak: true },
        { label: "Dom", h: 78 }
      ]
    },
    mes: {
      titulo: "Consumo Mensual (Noviembre)",
      litros: "19,000 L (19 m³)",
      soles: "S/ 58.48",
      meta: "Meta mensual: 20 m³",
      pct: 95,
      subtitulo: "Evolución por semanas del mes",
      pico: "Pico: Semana 3 (5.2 m³)",
      desglose: ["40 % (7.6 m³)", "25 % (4.75 m³)", "20 % (3.8 m³)", "15 % (2.85 m³)"],
      barras: [
        { label: "Sem 1", h: 72 },
        { label: "Sem 2", h: 78 },
        { label: "Sem 3", h: 95, peak: true },
        { label: "Sem 4", h: 68 }
      ]
    }
  };

  const renderPeriodoMonitoreo = (key) => {
    const d = PERIODOS_MONITOREO[key];
    if (!d || !chartBarsContainer) return;

    document.getElementById("titulo-periodo").textContent = d.titulo;
    document.getElementById("mon-litros").textContent = d.litros;
    document.getElementById("mon-soles").textContent = d.soles;
    document.getElementById("mon-meta-texto").textContent = d.meta;
    document.getElementById("mon-meta-pct").textContent = `${d.pct} % utilizado`;
    document.getElementById("mon-barra").style.width = `${d.pct}%`;
    document.getElementById("mon-barra-wrap").setAttribute("aria-valuenow", String(d.pct));
    document.getElementById("mon-subtitulo-grafico").textContent = d.subtitulo;
    document.getElementById("mon-pico-grafico").textContent = d.pico;

    document.getElementById("desglose-ducha").textContent = d.desglose[0];
    document.getElementById("desglose-lavadero").textContent = d.desglose[1];
    document.getElementById("desglose-cocina").textContent = d.desglose[2];
    document.getElementById("desglose-otros").textContent = d.desglose[3];

    chartBarsContainer.innerHTML = d.barras
      .map(
        (b) => `
        <div class="chart-col">
          <div class="chart-bar ${b.peak ? "is-peak" : ""}" style="height: ${b.h}%;"></div>
          <span class="chart-label">${b.label}</span>
        </div>
      `
      )
      .join("");
  };

  if (periodTabs.length > 0 && chartBarsContainer) {
    periodTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        periodTabs.forEach((t) => t.setAttribute("aria-selected", "false"));
        tab.setAttribute("aria-selected", "true");
        renderPeriodoMonitoreo(tab.dataset.period);
      });
    });
    renderPeriodoMonitoreo("dia");

    // Sincronizar proyección guardada del simulador si existe
    const rawSim = localStorage.getItem(STORAGE_KEYS.sim);
    if (rawSim) {
      try {
        const s = JSON.parse(rawSim);
        document.getElementById("mon-proyeccion-desc").innerHTML = `Consumo proyectado: <strong>${s.m3} m³</strong> (${s.personas} integrantes)`;
        document.getElementById("mon-fact-actual").textContent = `S/ ${s.actual.toFixed(2)}`;
        document.getElementById("mon-fact-meta").textContent = `S/ ${s.conMeta.toFixed(2)}`;
        document.getElementById("mon-fact-ahorro").textContent = `S/ ${s.ahorro.toFixed(2)}`;
      } catch (_) {}
    }

    // Cierre de alerta crítica en monitoreo
    const btnCerrarAlertaMon = document.getElementById("btn-cerrar-alerta-monitoreo");
    if (btnCerrarAlertaMon) {
      btnCerrarAlertaMon.addEventListener("click", () => {
        const box = document.getElementById("alerta-critica-monitoreo");
        const filaEstado = document.getElementById("estado-fila-fuga");
        const badgeActivas = document.getElementById("badge-alertas-activas");
        box.className = "alert-box is-success";
        box.innerHTML = "<span><strong>Fuga revisada:</strong> El flujo volvió a parámetros normales y el evento quedó registrado como atendido.</span>";
        if (filaEstado) {
          filaEstado.className = "badge badge-teal";
          filaEstado.textContent = "Atendido";
        }
        if (badgeActivas) {
          badgeActivas.className = "badge badge-teal";
          badgeActivas.textContent = "0 alertas activas";
        }
      });
    }

    // Gestión comunal (PDF y WhatsApp)
    const estadoComunal = document.getElementById("estado-comunal-monitoreo");
    const btnPdf = document.getElementById("btn-reporte-pdf");
    const btnWa = document.getElementById("btn-whatsapp-comunal");
    if (btnPdf && estadoComunal) {
      btnPdf.addEventListener("click", () => {
        estadoComunal.style.color = "var(--color-teal)";
        estadoComunal.textContent = "Reporte mensual de asamblea generado (Presupuesto S/ 760.00 · Saldo S/ 245.00).";
      });
    }
    if (btnWa && estadoComunal) {
      btnWa.addEventListener("click", () => {
        estadoComunal.style.color = "var(--color-teal)";
        estadoComunal.textContent = "Mensaje comunitario preparado para difusión por WhatsApp con estado de cuotas y alertas.";
      });
    }
  }

  /* 9. Asistente por Voz (HU-019 / HU-022) */
  const btnVoz = document.getElementById("btn-asistente-voz");
  const voiceToast = document.getElementById("voice-toast");
  if (btnVoz && voiceToast) {
    btnVoz.addEventListener("click", () => {
      const mensaje = "Asistente HydroSense: Hoy has consumido 145 litros (S/ 4.20), equivalente al 75 % de tu meta diaria.";
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
})();
