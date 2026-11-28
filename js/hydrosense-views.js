document.addEventListener('DOMContentLoaded', () => {
  // 1. Marcar pestaña activa automáticamente según la URL actual
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.hs-nav-item').forEach(link => {
    const target = link.getAttribute('href').split('#')[0];
    if (target === currentFile) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });

  // 2. Lógica de la vista Análisis e Historial (analisis.html)
  const chartContainer = document.getElementById('chartBarsContainer');
  if (chartContainer) {
    const datasets = {
      hoy: {
        title: 'Consumo de hoy',
        subtitle: 'Litros por persona · Franjas horarias',
        trend: '↘ -6.2%',
        currentLabel: 'Hoy',
        previousLabel: 'Ayer',
        total: '74 L',
        bars: [
          { label: '06h', cur: 14, prev: 16 },
          { label: '09h', cur: 18, prev: 19 },
          { label: '12h', cur: 11, prev: 12 },
          { label: '15h', cur: 8,  prev: 9 },
          { label: '18h', cur: 9,  prev: 10 },
          { label: '21h', cur: 10, prev: 9 },
          { label: '00h', cur: 4,  prev: 4 }
        ],
        breakdown: [
          { key: 'ducha', name: 'Ducha', pct: 42, liters: '31 L', color: '#1262D5' },
          { key: 'lavadero', name: 'Lavadero', pct: 23, liters: '17 L', color: '#087F8C' },
          { key: 'cocina', name: 'Cocina', pct: 22, liters: '16 L', color: '#10B981' },
          { key: 'otros', name: 'Otros', pct: 13, liters: '10 L', color: '#F59E0B' }
        ]
      },
      semana: {
        title: 'Consumo semanal',
        subtitle: 'Litros por persona · 30 sep–6 oct',
        trend: '↘ -4.6%',
        currentLabel: 'Semana actual',
        previousLabel: 'Semana pasada',
        total: '553 L',
        bars: [
          { label: 'L', cur: 72, prev: 68 },
          { label: 'M', cur: 81, prev: 78 },
          { label: 'M', cur: 68, prev: 71 },
          { label: 'J', cur: 86, prev: 79 },
          { label: 'V', cur: 74, prev: 82 },
          { label: 'S', cur: 95, prev: 88 },
          { label: 'D', cur: 76, prev: 84 }
        ],
        breakdown: [
          { key: 'ducha', name: 'Ducha', pct: 40, liters: '221 L', color: '#1262D5' },
          { key: 'lavadero', name: 'Lavadero', pct: 25, liters: '138 L', color: '#087F8C' },
          { key: 'cocina', name: 'Cocina', pct: 20, liters: '111 L', color: '#10B981' },
          { key: 'otros', name: 'Otros', pct: 15, liters: '83 L', color: '#F59E0B' }
        ]
      },
      mes: {
        title: 'Consumo mensual',
        subtitle: 'Litros por persona · Últimas 4 semanas',
        trend: '↘ -5.1%',
        currentLabel: 'Mes actual',
        previousLabel: 'Mes pasado',
        total: '2,240 L',
        bars: [
          { label: 'S1', cur: 580, prev: 610 },
          { label: 'S2', cur: 560, prev: 590 },
          { label: 'S3', cur: 547, prev: 575 },
          { label: 'S4', cur: 553, prev: 585 },
          { label: 'Proy.', cur: 530, prev: 570 },
          { label: 'Meta', cur: 510, prev: 550 },
          { label: 'Prom.', cur: 546, prev: 580 }
        ],
        breakdown: [
          { key: 'ducha', name: 'Ducha', pct: 39, liters: '874 L', color: '#1262D5' },
          { key: 'lavadero', name: 'Lavadero', pct: 26, liters: '582 L', color: '#087F8C' },
          { key: 'cocina', name: 'Cocina', pct: 21, liters: '470 L', color: '#10B981' },
          { key: 'otros', name: 'Otros', pct: 14, liters: '314 L', color: '#F59E0B' }
        ]
      }
    };

    const icons = {
      ducha: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h5"/><path d="M4 9a9 9 0 0 1 14.2-7.3"/><line x1="12" y1="13" x2="12" y2="15"/><line x1="9" y1="16" x2="9" y2="18"/><line x1="15" y1="16" x2="15" y2="18"/></svg>',
      lavadero: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><line x1="7" y1="6" x2="7.01" y2="6"/></svg>',
      cocina: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
      otros: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22v-7"/><path d="M9 15c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M15 15c3 0 5-2 5-5-3 0-5 2-5 5z"/></svg>'
    };

    function renderAnalysis(periodKey) {
      const data = datasets[periodKey];
      document.getElementById('chartTitle').textContent = data.title;
      document.getElementById('chartSubtitle').textContent = data.subtitle;
      document.getElementById('trendBadge').textContent = data.trend;
      document.getElementById('legendCurrent').textContent = data.currentLabel;
      document.getElementById('legendPrevious').textContent = data.previousLabel;
      document.getElementById('totalLitersLabel').textContent = data.total;

      const maxVal = Math.max(...data.bars.flatMap(b => [b.cur, b.prev])) * 1.1;
      chartContainer.innerHTML = data.bars.map(b => {
        const hCur = Math.round((b.cur / maxVal) * 125);
        const hPrev = Math.round((b.prev / maxVal) * 125);
        return `
          <div class="hs-bar-col">
            <div class="hs-bar-values"><span class="cur">${b.cur}</span> ${b.prev}</div>
            <div class="hs-bar-pair">
              <div class="hs-bar current" style="height:${hCur}px" title="${data.currentLabel}: ${b.cur} L"></div>
              <div class="hs-bar previous" style="height:${hPrev}px" title="${data.previousLabel}: ${b.prev} L"></div>
            </div>
            <span class="hs-bar-day">${b.label}</span>
          </div>
        `;
      }).join('');

      const breakdownContainer = document.getElementById('breakdownContainer');
      breakdownContainer.innerHTML = data.breakdown.map(item => `
        <div class="hs-breakdown-item">
          <div class="hs-item-icon ${item.key}">${icons[item.key]}</div>
          <div class="hs-item-body">
            <div class="hs-item-top">
              <span class="hs-item-name">${item.name}</span>
              <span class="hs-item-pct">${item.pct}%</span>
            </div>
            <div class="hs-progress-track">
              <div class="hs-progress-fill" style="width:${item.pct}%; background:${item.color};"></div>
            </div>
          </div>
          <span class="hs-item-liters">${item.liters} &rsaquo;</span>
        </div>
      `).join('');
    }

    document.querySelectorAll('.hs-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.hs-tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        renderAnalysis(btn.dataset.period);
      });
    });

    renderAnalysis('semana');
  }

  // 3. Lógica del simulador en Proyección y Ahorro (proyeccion.html)
  const showerSlider = document.getElementById('showerSlider');
  if (showerSlider) {
    const laundrySlider = document.getElementById('laundrySlider');
    const kitchenSlider = document.getElementById('kitchenSlider');

    function updateProjection() {
      const sMin = Number(showerSlider.value);
      const lLoads = Number(laundrySlider.value);
      const kLiters = Number(kitchenSlider.value);

      document.getElementById('showerVal').textContent = `-${sMin} min/día`;
      document.getElementById('laundryVal').textContent = `-${lLoads} carga/sem`;
      document.getElementById('kitchenVal').textContent = `${kLiters} L/día`;

      // Cálculo mensual estimado (30 días)
      const savedShower = sMin * 9 * 30;
      const savedLaundry = lLoads * 55 * 4;
      const savedKitchen = kLiters * 30;
      const totalSavedLiters = savedShower + savedLaundry + savedKitchen;

      const baseLiters = 2330;
      const projectedLiters = Math.max(1100, baseLiters - totalSavedLiters);
      const costPerLiter = 0.022;
      const projectedCost = (projectedLiters * costPerLiter).toFixed(2);
      const savedMoney = (totalSavedLiters * costPerLiter).toFixed(2);

      document.getElementById('kpiLiters').textContent = `${projectedLiters.toLocaleString('es-PE')} L`;
      document.getElementById('kpiCost').textContent = `S/ ${projectedCost}`;
      document.getElementById('kpiSavings').textContent = `S/ ${savedMoney} / mes`;
      document.getElementById('kpiSavedLiters').textContent = `Equivale a ${totalSavedLiters.toLocaleString('es-PE')} L ahorrados`;

      const scenarioContainer = document.getElementById('scenarioContainer');
      const months = ['Mes 1 (Nov)', 'Mes 2 (Dic)', 'Mes 3 (Ene)'];
      scenarioContainer.innerHTML = months.map((m, idx) => {
        const factor = 1 - (idx * 0.02);
        const lit = Math.round(projectedLiters * factor);
        const sol = (lit * costPerLiter).toFixed(2);
        return `
          <div class="hs-scenario-row">
            <div>
              <strong>${m}</strong>
              <p class="hs-card-subtitle">Consumo proyectado con metas</p>
            </div>
            <div style="text-align:right">
              <strong>${lit.toLocaleString('es-PE')} L</strong>
              <p class="hs-kpi-sub">S/ ${sol}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    [showerSlider, laundrySlider, kitchenSlider].forEach(el => {
      el.addEventListener('input', updateProjection);
    });
    updateProjection();
  }

  // 4. Botón compartir reporte/proyección
  const btnShare = document.getElementById('btnShare');
  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareData = { title: document.title, url: window.location.href };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (_) {}
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles.');
      }
    });
  }

  // 5. Lógica interactiva de Retos y Comunidad (retos.html)
  const joinButtons = document.querySelectorAll('.hs-btn-join');
  if (joinButtons.length > 0) {
    let currentPoints = 2480;
    const pointsEl = document.getElementById('userPointsVal');

    joinButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.challenge;
        const pts = Number(btn.dataset.points) || 0;
        const baseJoined = Number(btn.dataset.joined) || 0;
        const countEl = document.getElementById(`joinedCount${id}`);
        const isJoined = btn.classList.toggle('is-joined');

        if (isJoined) {
          btn.textContent = 'Unido ✓';
          if (countEl) countEl.textContent = String(baseJoined + 1);
          currentPoints += pts;
        } else {
          btn.textContent = 'Unirme';
          if (countEl) countEl.textContent = String(baseJoined);
          currentPoints -= pts;
        }
        if (pointsEl) pointsEl.textContent = currentPoints.toLocaleString('en-US');
      });
    });

    const btnToggleAll = document.getElementById('btnToggleAllChallenges');
    const extraCards = document.querySelectorAll('.is-extra-challenge');
    if (btnToggleAll && extraCards.length > 0) {
      btnToggleAll.addEventListener('click', () => {
        const isHidden = extraCards[0].hidden;
        extraCards.forEach(c => { c.hidden = !isHidden; });
        btnToggleAll.textContent = isHidden ? 'Ver menos' : 'Ver todos';
      });
    }
  }


  // 6. Lógica interactiva de Guías, Consejos, Simulaciones y Soporte (consejos.html)
  const alertOutput = document.getElementById('consejoAlertOutput');
  if (alertOutput) {
    const alertGuides = {
      fuga: {
        badgeClass: 'is-danger',
        badgeText: 'Alerta de flujo continuo',
        title: 'Posible fuga silenciosa detectada (0.8 L/min constantes)',
        desc: 'Se detectó paso de agua ininterrumpido durante más de 45 minutos sin apertura manual registrada.',
        steps: [
          'Revisa el tanque del inodoro verificando si hay movimiento en el espejo de agua.',
          'Comprueba llaves de paso en lavadero y patio trasero.',
          'Si el flujo persiste, cierra la válvula general y programa revisión técnica.'
        ]
      },
      corte: {
        badgeClass: 'is-warning',
        badgeText: 'Aviso preventivo SEDAPAL',
        title: 'Corte programado por mantenimiento en tu sector (Mañana 09:00–17:00)',
        desc: 'Se recomienda almacenar únicamente el agua necesaria para higiene y preparación de alimentos.',
        steps: [
          'Reserva aproximadamente 25 litros por persona en recipientes limpios y tapados.',
          'Adelanta el lavado de ropa hoy para evitar acumulación.',
          'Mantén cerradas las llaves interiores durante el horario de corte.'
        ]
      },
      limite: {
        badgeClass: 'is-warning',
        badgeText: 'Meta diaria al 85%',
        title: 'Estás cerca de alcanzar tu límite diario configurado (170 L / 200 L)',
        desc: 'Mantenerte debajo del umbral evita saltar al siguiente rango de facturación mensual.',
        steps: [
          'Limita las duchas restantes del día a un máximo de 5 minutos.',
          'Usa un recipiente al enjuagar frutas o utensilios en la cocina.',
          'Revisa tu avance semanal en la pestaña Análisis.'
        ]
      },
      presion: {
        badgeClass: 'is-info',
        badgeText: 'Diagnóstico hidráulico',
        title: 'Descenso temporal de presión en la red domiciliaria',
        desc: 'El sensor registra caudal reducido en horas punta sin pérdida en tuberías internas.',
        steps: [
          'Verifica que la válvula principal de ingreso esté completamente abierta.',
          'Evita encender lavadora y ducha de forma simultánea.',
          'Si la baja presión continúa más de 3 horas, reporta el caso en Soporte.'
        ]
      }
    };

    document.querySelectorAll('[data-consejo-alerta]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-consejo-alerta]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const g = alertGuides[btn.dataset.consejoAlerta];
        if (!g) return;
        alertOutput.innerHTML = `
          <div class="hs-alert-guide-head">
            <span class="hs-alert-tag ${g.badgeClass}">${g.badgeText}</span>
            <span class="hs-muted-label">Sensor HS-BA-2409-0186</span>
          </div>
          <h4>${g.title}</h4>
          <p>${g.desc}</p>
          <ul class="hs-guide-steps">
            ${g.steps.map(s => `<li>${s}</li>`).join('')}
          </ul>
        `;
      });
    });

    const m3Slider = document.getElementById('consejoM3Slider');
    const metaSlider = document.getElementById('consejoMetaSlider');
    function updateConsejoTariff() {
      const m3 = Number(m3Slider.value);
      const pct = Number(metaSlider.value);
      document.getElementById('consejoM3Val').textContent = `${m3} m³`;
      document.getElementById('consejoMetaVal').textContent = `${pct}% de ahorro`;

      const tarifaUnit = m3 > 20 ? 3.45 : 3.08;
      const actual = m3 * tarifaUnit;
      const conMeta = m3 * (1 - pct / 100) * (m3 * (1 - pct / 100) > 20 ? 3.45 : 3.08);
      const ahorro = Math.max(0, actual - conMeta);

      document.getElementById('consejoResActual').textContent = `S/ ${actual.toFixed(2)}`;
      document.getElementById('consejoResMeta').textContent = `S/ ${conMeta.toFixed(2)}`;
      document.getElementById('consejoResAhorro').textContent = `S/ ${ahorro.toFixed(2)}`;
    }
    m3Slider.addEventListener('input', updateConsejoTariff);
    metaSlider.addEventListener('input', updateConsejoTariff);
    updateConsejoTariff();

    const supForm = document.getElementById('hsSupportForm');
    if (supForm) {
      supForm.addEventListener('submit', e => {
        e.preventDefault();
        const nombre = document.getElementById('supNombre').value.trim();
        const correo = document.getElementById('supCorreo').value.trim();
        const msg = document.getElementById('supMensaje').value.trim();
        const feedback = document.getElementById('supFeedback');
        if (!nombre || !correo || !msg) {
          feedback.style.color = '#B91C1C';
          feedback.textContent = 'Completa tu nombre, correo y mensaje antes de enviar.';
          return;
        }
        feedback.style.color = '#087F8C';
        feedback.textContent = `¡Solicitud registrada, ${nombre}! Te responderemos pronto a ${correo}.`;
        supForm.reset();
      });
    }
  }


  // 7. Lógica interactiva de Dispositivos Vinculados, QR y Código de Serie (dispositivos.html)
  const devicesGrid = document.getElementById('devicesGrid');
  if (devicesGrid) {
    const viewList = document.getElementById('viewDevicesList');
    const viewQR = document.getElementById('viewScanQR');
    const viewManual = document.getElementById('viewManualCode');
    const modal = document.getElementById('linkDeviceModal');
    const counterBadge = document.getElementById('devicesCounterBadge');

    function showDeviceView(target) {
      [viewList, viewQR, viewManual].forEach(v => { if (v) v.hidden = true; });
      if (target) target.hidden = false;
      if (modal) modal.hidden = true;
    }

    function updateDeviceCount() {
      const count = devicesGrid.querySelectorAll('.hs-device-card').length;
      if (counterBadge) counterBadge.textContent = `${count} ${count === 1 ? 'dispositivo' : 'dispositivos'}`;
    }

    function addNewSensorCard(serial, room) {
      const card = document.createElement('article');
      card.className = 'hs-card hs-device-card';
      card.innerHTML = `
        <div class="hs-device-main">
          <div class="hs-device-icon is-online" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div class="hs-device-info">
            <h3>Sensor ${room}</h3>
            <span class="hs-device-serial">N.° de serie: <strong>${serial}</strong></span>
            <div class="hs-device-meta">
              <span>📍 Espacio: ${room}</span>
              <span>🔋 Batería: 100%</span>
            </div>
          </div>
        </div>
        <span class="hs-status-pill is-online"><span class="hs-dot"></span> En línea</span>
      `;
      devicesGrid.appendChild(card);
      updateDeviceCount();
      showDeviceView(viewList);
    }

    document.getElementById('btnOpenLinkModal')?.addEventListener('click', () => {
      if (modal) modal.hidden = false;
    });

    document.getElementById('btnCloseLinkModal')?.addEventListener('click', () => {
      if (modal) modal.hidden = true;
    });

    modal?.addEventListener('click', e => {
      if (e.target === modal) modal.hidden = true;
    });

    document.getElementById('optChooseQR')?.addEventListener('click', () => showDeviceView(viewQR));
    document.getElementById('optChooseManual')?.addEventListener('click', () => showDeviceView(viewManual));
    document.getElementById('btnSwitchToManual')?.addEventListener('click', () => showDeviceView(viewManual));
    document.getElementById('btnSwitchToQR')?.addEventListener('click', () => showDeviceView(viewQR));

    document.querySelectorAll('[data-back-devices]').forEach(btn => {
      btn.addEventListener('click', () => showDeviceView(viewList));
    });

    const btnFlash = document.getElementById('btnToggleFlash');
    const qrViewport = document.getElementById('qrViewport');
    btnFlash?.addEventListener('click', () => {
      const active = btnFlash.classList.toggle('is-active');
      qrViewport?.classList.toggle('is-flash', active);
      btnFlash.textContent = active ? '🔦 Desactivar linterna' : '🔦 Activar linterna';
    });

    document.getElementById('btnSimulateQRScan')?.addEventListener('click', () => {
      const statusEl = document.getElementById('qrStatusText');
      if (statusEl) statusEl.textContent = '✓ Código detectado: HS-LV-2409-0214';
      setTimeout(() => {
        addNewSensorCard('HS-LV-2409-0214', 'Lavadero');
        if (statusEl) statusEl.textContent = '••• Buscando código...';
      }, 600);
    });

    const formManual = document.getElementById('formManualSerial');
    formManual?.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('inputSerialCode');
      const roomSelect = document.getElementById('selectRoomLocation');
      const feedback = document.getElementById('manualSerialFeedback');
      const code = input.value.trim().toUpperCase();
      const pattern = /^HS-[A-Z]{2}-\d{4}-\d{4}$/;

      if (!pattern.test(code)) {
        feedback.style.color = '#B91C1C';
        feedback.textContent = 'Formato inválido. Usa el formato HS-XX-0000-0000 (ej. HS-BA-2409-0160).';
        return;
      }

      feedback.style.color = '#087F8C';
      feedback.textContent = `Validando sensor ${code}...`;
      setTimeout(() => {
        feedback.textContent = '';
        addNewSensorCard(code, roomSelect.value);
      }, 500);
    });
  }


  // 8. Toggle global de Modo Accesible (persistente entre pantallas)
  const accessibleToggle = document.getElementById('toggle-modo-accesible');
  function applyAccessibleMode(enabled) {
    document.documentElement.classList.toggle('is-accessible', enabled);
    document.body.classList.toggle('is-accessible', enabled);
    if (accessibleToggle) accessibleToggle.checked = enabled;
  }

  const savedAccessible = localStorage.getItem('hs_modo_accesible') === 'true';
  applyAccessibleMode(savedAccessible);

  accessibleToggle?.addEventListener('change', () => {
    const isChecked = accessibleToggle.checked;
    localStorage.setItem('hs_modo_accesible', String(isChecked));
    applyAccessibleMode(isChecked);
  });

  // 9. Asistente por Voz flotante (Web Speech API + respuestas contextuales)
  const btnVoice = document.getElementById('btn-asistente-voz');
  const voiceToast = document.getElementById('voice-toast');
  let toastTimeout = null;

  function showVoiceMessage(text, speak = true) {
    if (!voiceToast) return;
    voiceToast.textContent = text;
    voiceToast.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { voiceToast.hidden = true; }, 7500);

    if (speak && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-PE';
      window.speechSynthesis.speak(utterance);
    }
  }

  function getContextualVoiceReply(transcript = '') {
    const q = transcript.toLowerCase();
    if (q.includes('fuga') || q.includes('goteo')) {
      return 'No se detectan fugas activas en el Sensor Principal. Si notas goteo en el inodoro, revisa la válvula del tanque.';
    }
    if (q.includes('ahorro') || q.includes('recibo') || q.includes('proyeccion') || q.includes('proyección')) {
      return 'Tu ahorro proyectado este mes es de S/ 11.20 aplicando las metas de ducha y lavadora.';
    }
    if (q.includes('reto') || q.includes('punto')) {
      return 'Tienes 2,480 puntos acumulados y Medalla Oro. Te faltan 2 días para completar el reto Ducha de 5 minutos.';
    }
    if (q.includes('sensor') || q.includes('dispositivo')) {
      return 'El Sensor Principal del baño está en línea con 84% de batería. El sensor de cocina requiere revisión de conexión.';
    }
    return 'Tu consumo de hoy es de 145 litros, equivalente al 75% de tu límite diario. Vas por buen camino.';
  }

  btnVoice?.addEventListener('click', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showVoiceMessage(getContextualVoiceReply());
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-PE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btnVoice.classList.add('is-listening');
    showVoiceMessage('🎙️ Escuchando tu consulta sobre consumo o ahorro...', false);

    recognition.onresult = event => {
      const spoken = event.results[0][0].transcript;
      const reply = getContextualVoiceReply(spoken);
      showVoiceMessage(`“${spoken}” — ${reply}`);
    };

    recognition.onerror = () => {
      showVoiceMessage(getContextualVoiceReply());
    };

    recognition.onend = () => {
      btnVoice.classList.remove('is-listening');
    };

    try {
      recognition.start();
    } catch (_) {
      btnVoice.classList.remove('is-listening');
      showVoiceMessage(getContextualVoiceReply());
    }
  });



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

});
