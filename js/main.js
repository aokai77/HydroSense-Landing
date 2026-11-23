(function () {
  'use strict';

  /* ==========================================================================
     1. SIMULADOR DE TARIFAS SEDAPAL, VALIDACIONES Y ALERTAS (Módulo 1)
     ========================================================================== */
  var TARIFAS_SEDAPAL = {
    fuente: 'SUNASS / SEDAPAL — estructura tarifaria doméstica (dic. 2025)',
    cargoFijo: 6.32,
    igv: 0.18,
    tramos: [
      { desde: 0, hasta: 10, tarifa: 2.2 },
      { desde: 10, hasta: 20, tarifa: 2.36 },
      { desde: 20, hasta: 50, tarifa: 3.22 },
      { desde: 50, hasta: Infinity, tarifa: 7.32 }
    ]
  };

  var LITROS_OMS_POR_PERSONA_DIA = 100;

  function redondear(valor) {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  function formatearSoles(valor) {
    return 'S/ ' + redondear(valor).toFixed(2);
  }

  function calcularFacturaSedapal(consumoM3, opciones) {
    var cfg = opciones || {};
    var tarifas = cfg.tarifas || TARIFAS_SEDAPAL;
    var consumo = Number(consumoM3);
    if (!isFinite(consumo) || consumo < 0) {
      throw new RangeError('El consumo debe ser un número mayor o igual a 0.');
    }

    var detalle = [];
    var subtotalVolumen = 0;
    tarifas.tramos.forEach(function (tramo) {
      var m3EnTramo = Math.max(0, Math.min(consumo, tramo.hasta) - tramo.desde);
      if (m3EnTramo > 0) {
        var importe = m3EnTramo * tramo.tarifa;
        subtotalVolumen += importe;
        detalle.push({
          desde: tramo.desde,
          hasta: tramo.hasta,
          m3: redondear(m3EnTramo),
          tarifa: tramo.tarifa,
          importe: redondear(importe)
        });
      }
    });

    var subtotal = subtotalVolumen + tarifas.cargoFijo;
    var aplicaIgv = cfg.incluirIGV !== false;
    var igv = aplicaIgv ? subtotal * tarifas.igv : 0;

    return {
      consumoM3: consumo,
      cargoFijo: tarifas.cargoFijo,
      detalle: detalle,
      subtotalVolumen: redondear(subtotalVolumen),
      subtotal: redondear(subtotal),
      igv: redondear(igv),
      total: redondear(subtotal + igv)
    };
  }

  function calcularProyeccionAhorro(consumoM3, metaPorcentaje, opciones) {
    var meta = Number(metaPorcentaje);
    if (!isFinite(meta) || meta < 0 || meta > 100) {
      throw new RangeError('La meta de ahorro debe estar entre 0 y 100.');
    }
    var actual = calcularFacturaSedapal(consumoM3, opciones);
    var consumoMeta = redondear(Number(consumoM3) * (1 - meta / 100));
    var conMeta = calcularFacturaSedapal(consumoMeta, opciones);
    return {
      actual: actual,
      conMeta: conMeta,
      consumoMetaM3: consumoMeta,
      ahorro: redondear(actual.total - conMeta.total)
    };
  }

  function metrosParaSiguienteEscalon(consumoM3, tarifas) {
    var cfg = tarifas || TARIFAS_SEDAPAL;
    var consumo = Number(consumoM3);
    for (var i = 0; i < cfg.tramos.length - 1; i++) {
      var tramo = cfg.tramos[i];
      if (consumo <= tramo.hasta) {
        return {
          restantes: redondear(tramo.hasta - consumo),
          limite: tramo.hasta,
          tarifaActual: tramo.tarifa,
          tarifaSiguiente: cfg.tramos[i + 1].tarifa
        };
      }
    }
    return null;
  }

  function calcularLitrosPorPersonaDia(consumoM3, personas) {
    var n = Number(personas);
    if (!isFinite(n) || n < 1) {
      throw new RangeError('Debe haber al menos 1 integrante.');
    }
    return redondear((Number(consumoM3) * 1000) / (n * 30));
  }

  function resultadoValidacion(valido, mensaje) {
    return { valido: valido, mensaje: mensaje || '' };
  }

  function validarEmail(valor) {
    var texto = String(valor || '').trim();
    if (!texto) {
      return resultadoValidacion(false, 'Ingresa tu correo electrónico.');
    }
    var formato = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!formato.test(texto)) {
      return resultadoValidacion(false, 'Escribe un correo válido, por ejemplo ana@correo.com.');
    }
    return resultadoValidacion(true, '');
  }

  function validarPassword(valor) {
    var texto = String(valor || '');
    if (!texto) {
      return resultadoValidacion(false, 'Crea una contraseña.');
    }
    if (texto.length < 8) {
      return resultadoValidacion(false, 'La contraseña debe tener al menos 8 caracteres.');
    }
    if (!/\d/.test(texto)) {
      return resultadoValidacion(false, 'Agrega al menos un número a tu contraseña.');
    }
    return resultadoValidacion(true, '');
  }

  function validarNombreCompleto(valor) {
    var texto = String(valor || '').trim().replace(/\s+/g, ' ');
    if (!texto) {
      return resultadoValidacion(false, 'Ingresa tu nombre completo.');
    }
    if (texto.split(' ').length < 2 || texto.length < 5) {
      return resultadoValidacion(false, 'Escribe tu nombre y apellido.');
    }
    if (/\d/.test(texto)) {
      return resultadoValidacion(false, 'El nombre no debe contener números.');
    }
    return resultadoValidacion(true, '');
  }

  function validarMensaje(valor) {
    var texto = String(valor || '').trim();
    if (!texto) {
      return resultadoValidacion(false, 'Cuéntanos cómo podemos ayudarte.');
    }
    if (texto.length < 10) {
      return resultadoValidacion(false, 'Escribe al menos 10 caracteres para entender tu consulta.');
    }
    return resultadoValidacion(true, '');
  }

  function validarEnteroEnRango(valor, minimo, maximo, etiqueta) {
    var texto = String(valor === undefined || valor === null ? '' : valor).trim();
    if (texto === '') {
      return resultadoValidacion(false, 'Ingresa ' + etiqueta + '.');
    }
    var numero = Number(texto);
    if (!isFinite(numero) || Math.floor(numero) !== numero) {
      return resultadoValidacion(false, etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) + ' debe ser un número entero.');
    }
    if (numero < minimo || numero > maximo) {
      return resultadoValidacion(false, 'Ingresa un valor entre ' + minimo + ' y ' + maximo + '.');
    }
    return resultadoValidacion(true, '');
  }

  var ALERTAS_ICONOS = { info: 'ℹ️', exito: '✅', advertencia: '⚠️', critica: '🚨' };

  function crearAlertaEscalon(consumoM3) {
    var info = metrosParaSiguienteEscalon(consumoM3);
    if (!info) {
      return {
        tipo: 'critica',
        titulo: 'Tramo tarifario más alto',
        mensaje: 'Superas los 50 m³ al mes: cada m³ adicional se cobra a S/ ' +
          TARIFAS_SEDAPAL.tramos[3].tarifa.toFixed(2) + '.'
      };
    }
    if (info.restantes <= 2) {
      return {
        tipo: 'advertencia',
        titulo: 'Estás cerca de cambiar de tramo',
        mensaje: 'Atención: estás a ' + info.restantes + ' m³ de pasar de S/ ' +
          info.tarifaActual.toFixed(2) + ' a S/ ' + info.tarifaSiguiente.toFixed(2) + ' por m³.'
      };
    }
    return null;
  }

  function crearAlertaConsumoPorPersona(litrosPorPersonaDia) {
    if (litrosPorPersonaDia > LITROS_OMS_POR_PERSONA_DIA) {
      return {
        tipo: 'advertencia',
        titulo: 'Consumo por encima de lo recomendado',
        mensaje: 'Tu hogar usaría unos ' + Math.round(litrosPorPersonaDia) +
          ' litros por persona al día; la OMS recomienda hasta ' + LITROS_OMS_POR_PERSONA_DIA + '.'
      };
    }
    return null;
  }

  function crearAlertaSimulada(tipoSimulacion) {
    var catalogo = {
      fuga: {
        tipo: 'critica',
        titulo: 'Posible fuga continua detectada',
        mensaje: 'El sensor registra flujo constante desde hace 3 horas, sin pausas. Revisa grifos e inodoros.'
      },
      limite: {
        tipo: 'advertencia',
        titulo: 'Límite diario superado',
        mensaje: 'Hoy ya usaste 200 litros, el 100% de tu meta diaria. Tu proyección mensual se actualizó.'
      },
      corte: {
        tipo: 'info',
        titulo: 'Corte de agua programado',
        mensaje: 'Mañana de 9:00 a 15:00 habrá un corte en tu zona. Almacena agua con anticipación.'
      }
    };
    return catalogo[tipoSimulacion] || null;
  }

  function asegurarContenedorAlertas() {
    var contenedor = document.getElementById('alertas-simuladas');
    if (contenedor) { return contenedor; }
    contenedor = document.createElement('div');
    contenedor.id = 'alertas-simuladas';
    contenedor.className = 'hs-alertas';
    contenedor.setAttribute('role', 'region');
    contenedor.setAttribute('aria-label', 'Alertas de HydroSense');
    document.body.appendChild(contenedor);
    return contenedor;
  }

  function mostrarAlerta(alerta) {
    if (!alerta) { return null; }
    var contenedor = asegurarContenedorAlertas();
    var tipo = ALERTAS_ICONOS[alerta.tipo] ? alerta.tipo : 'info';

    var nodo = document.createElement('div');
    nodo.className = 'hs-alerta hs-alerta--' + tipo;
    nodo.setAttribute('role', tipo === 'critica' ? 'alert' : 'status');

    var icono = document.createElement('span');
    icono.className = 'hs-alerta__icono';
    icono.setAttribute('aria-hidden', 'true');
    icono.textContent = ALERTAS_ICONOS[tipo];

    var cuerpo = document.createElement('div');
    cuerpo.className = 'hs-alerta__cuerpo';
    var titulo = document.createElement('strong');
    titulo.textContent = alerta.titulo;
    var mensaje = document.createElement('p');
    mensaje.textContent = alerta.mensaje;
    cuerpo.appendChild(titulo);
    cuerpo.appendChild(mensaje);

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'hs-alerta__cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar alerta');
    cerrar.textContent = '×';

    function quitar() {
      if (nodo.parentNode) { nodo.parentNode.removeChild(nodo); }
    }
    cerrar.addEventListener('click', quitar);

    nodo.appendChild(icono);
    nodo.appendChild(cuerpo);
    nodo.appendChild(cerrar);
    contenedor.appendChild(nodo);

    while (contenedor.children.length > 3) {
      contenedor.removeChild(contenedor.firstChild);
    }
    if (tipo !== 'critica') { window.setTimeout(quitar, 8000); }
    return nodo;
  }

  function inyectarEstilos() {
    if (document.getElementById('hs-estilos-modulo')) { return; }
    var css = [
      '.hs-alertas{position:fixed;right:16px;bottom:96px;z-index:1000;display:flex;flex-direction:column;gap:10px;width:min(380px,calc(100vw - 32px));}',
      '.hs-alerta{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:14px;background:#fff;border:2px solid #DFE7EC;border-left-width:8px;box-shadow:0 6px 20px rgba(18,58,82,.18);color:#123A52;}',
      '.hs-alerta p{margin:4px 0 0;font-size:.95rem;line-height:1.4;}',
      '.hs-alerta__cuerpo{flex:1;}',
      '.hs-alerta__icono{font-size:1.4rem;line-height:1;}',
      '.hs-alerta__cerrar{min-width:48px;min-height:48px;margin:-8px -8px -8px 0;border:0;background:transparent;font-size:1.6rem;cursor:pointer;color:#123A52;border-radius:50%;}',
      '.hs-alerta__cerrar:focus-visible{outline:3px solid #1262D5;outline-offset:2px;}',
      '.hs-alerta--info{border-color:#1262D5;}',
      '.hs-alerta--exito{border-color:#087F8C;}',
      '.hs-alerta--advertencia{border-color:#B26A00;}',
      '.hs-alerta--critica{border-color:#C62828;}',
      '.form-feedback.is-success{color:#087F8C;}',
      'input.is-invalid,textarea.is-invalid,select.is-invalid{border-color:#C62828!important;}',
      '.hs-desglose{list-style:none;margin:12px 0 0;padding:0;font-size:.95rem;color:#123A52;}',
      '.hs-desglose li{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid #DFE7EC;}',
      '@media (prefers-reduced-motion:no-preference){.hs-alerta{animation:hs-entra .25s ease-out;}}',
      '@keyframes hs-entra{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}'
    ].join('\n');
    var estilo = document.createElement('style');
    estilo.id = 'hs-estilos-modulo';
    estilo.textContent = css;
    document.head.appendChild(estilo);
  }

  function pintarEstadoCampo(campo, aviso, resultado) {
    if (!campo) { return; }
    campo.classList.toggle('is-invalid', !resultado.valido);
    campo.setAttribute('aria-invalid', resultado.valido ? 'false' : 'true');
    if (aviso) {
      aviso.textContent = resultado.mensaje;
      aviso.classList.remove('is-success');
      campo.setAttribute('aria-describedby', aviso.id);
    }
  }

  function asegurarAviso(campo) {
    var id = 'error-' + campo.id;
    var aviso = document.getElementById(id);
    if (!aviso) {
      aviso = document.createElement('small');
      aviso.id = id;
      aviso.className = 'form-feedback';
      aviso.setAttribute('aria-live', 'polite');
      campo.parentNode.appendChild(aviso);
    }
    return aviso;
  }

  function iniciarSimulador() {
    var form = document.getElementById('form-simulador');
    if (!form) { return; }
    var personas = document.getElementById('input-personas');
    var rango = document.getElementById('input-consumo-m3');
    var salidaM3 = document.getElementById('output-m3');
    var selectMeta = document.getElementById('select-meta');
    var resActual = document.getElementById('res-actual');
    var resAhorro = document.getElementById('res-ahorro');
    var resDiferencia = document.getElementById('res-diferencia');
    var contenedor = document.getElementById('resultado-simulador');

    var desglose = document.createElement('ul');
    desglose.className = 'hs-desglose';
    desglose.id = 'desglose-tarifa';
    desglose.setAttribute('aria-label', 'Detalle del cálculo por tramo tarifario');
    contenedor.appendChild(desglose);

    function lineaDesglose(texto, valor) {
      var li = document.createElement('li');
      var a = document.createElement('span');
      var b = document.createElement('strong');
      a.textContent = texto;
      b.textContent = valor;
      li.appendChild(a);
      li.appendChild(b);
      desglose.appendChild(li);
    }

    function calcular(mostrarAlertas) {
      var avisoPersonas = asegurarAviso(personas);
      var validacion = validarEnteroEnRango(personas.value, 1, 20, 'el número de integrantes');
      pintarEstadoCampo(personas, avisoPersonas, validacion);
      if (!validacion.valido) { return; }

      var consumo = Number(rango.value);
      var meta = Number(selectMeta.value);
      var proyeccion = calcularProyeccionAhorro(consumo, meta);

      resActual.textContent = formatearSoles(proyeccion.actual.total);
      resAhorro.textContent = formatearSoles(proyeccion.conMeta.total);
      resDiferencia.textContent = formatearSoles(proyeccion.ahorro);

      desglose.textContent = '';
      proyeccion.actual.detalle.forEach(function (t) {
        var hasta = t.hasta === Infinity ? 'más' : t.hasta;
        lineaDesglose(t.m3 + ' m³ (tramo ' + t.desde + ' a ' + hasta + ') × S/ ' + t.tarifa.toFixed(2), formatearSoles(t.importe));
      });
      lineaDesglose('Cargo fijo mensual', formatearSoles(proyeccion.actual.cargoFijo));
      lineaDesglose('IGV (' + Math.round(TARIFAS_SEDAPAL.igv * 100) + '%)', formatearSoles(proyeccion.actual.igv));

      if (mostrarAlertas) {
        var litros = calcularLitrosPorPersonaDia(consumo, personas.value);
        mostrarAlerta(crearAlertaEscalon(consumo));
        mostrarAlerta(crearAlertaConsumoPorPersona(litros));
      }
    }

    rango.addEventListener('input', function () {
      salidaM3.textContent = rango.value;
      calcular(false);
    });
    personas.addEventListener('input', function () { calcular(false); });
    selectMeta.addEventListener('change', function () { calcular(false); });
    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      calcular(true);
    });

    salidaM3.textContent = rango.value;
    calcular(false);
  }

  function iniciarRegistro() {
    var form = document.getElementById('form-registro');
    if (!form) { return; }
    var email = document.getElementById('reg-email');
    var password = document.getElementById('reg-password');
    var avisoEmail = document.getElementById('error-email');
    var avisoPassword = document.getElementById('error-password');
    var estado = document.getElementById('estado-registro');

    email.addEventListener('blur', function () { pintarEstadoCampo(email, avisoEmail, validarEmail(email.value)); });
    password.addEventListener('blur', function () { pintarEstadoCampo(password, avisoPassword, validarPassword(password.value)); });

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var vEmail = validarEmail(email.value);
      var vPass = validarPassword(password.value);
      pintarEstadoCampo(email, avisoEmail, vEmail);
      pintarEstadoCampo(password, avisoPassword, vPass);
      estado.classList.remove('is-success');

      if (!vEmail.valido || !vPass.valido) {
        estado.textContent = 'Revisa los campos marcados para continuar.';
        (vEmail.valido ? password : email).focus();
        return;
      }
      estado.classList.add('is-success');
      estado.textContent = 'Cuenta creada correctamente. Ya puedes vincular tu sensor.';
      mostrarAlerta({ tipo: 'exito', titulo: 'Registro exitoso', mensaje: 'Bienvenido a HydroSense. Te enviamos un correo de confirmación (simulado).' });
      form.reset();
    });
  }

  function iniciarContacto() {
    var form = document.getElementById('form-contacto');
    if (!form) { return; }
    var campos = [
      { el: document.getElementById('contacto-nombre'), validar: validarNombreCompleto },
      { el: document.getElementById('contacto-correo'), validar: validarEmail },
      { el: document.getElementById('contacto-mensaje'), validar: validarMensaje }
    ];
    var estado = document.getElementById('estado-contacto');

    campos.forEach(function (c) {
      if (!c.el) { return; }
      var aviso = asegurarAviso(c.el);
      c.el.addEventListener('blur', function () { pintarEstadoCampo(c.el, aviso, c.validar(c.el.value)); });
    });

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var primeroInvalido = null;
      campos.forEach(function (c) {
        if (!c.el) { return; }
        var r = c.validar(c.el.value);
        pintarEstadoCampo(c.el, asegurarAviso(c.el), r);
        if (!r.valido && !primeroInvalido) { primeroInvalido = c.el; }
      });
      estado.classList.remove('is-success');

      if (primeroInvalido) {
        estado.textContent = 'No se envió la solicitud: completa correctamente los campos marcados.';
        primeroInvalido.focus();
        return;
      }
      estado.classList.add('is-success');
      estado.textContent = 'Solicitud enviada. Te responderemos en un plazo de 24 horas.';
      mostrarAlerta({ tipo: 'exito', titulo: 'Solicitud enviada', mensaje: 'Recibimos tu consulta de soporte (simulado).' });
      form.reset();
    });
  }

  function iniciarAlertasSimuladas() {
    var botones = document.querySelectorAll('[data-alerta]');
    Array.prototype.forEach.call(botones, function (boton) {
      boton.addEventListener('click', function () {
        mostrarAlerta(crearAlertaSimulada(boton.getAttribute('data-alerta')));
      });
    });
  }

  /* ==========================================================================
     2. MENÚ RESPONSIVE Y SELECCIÓN DE PERFILES (HU-001)
     ========================================================================== */
  function iniciarMenuResponsive() {
    var btnMenu = document.querySelector('.menu-toggle');
    var nav = document.getElementById('nav-principal');
    if (!btnMenu || !nav) { return; }

    btnMenu.addEventListener('click', function () {
      var abierto = nav.classList.toggle('is-open');
      btnMenu.setAttribute('aria-expanded', String(abierto));
    });

    nav.querySelectorAll('a').forEach(function (enlace) {
      enlace.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btnMenu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function iniciarPerfiles() {
    var tarjetas = document.querySelectorAll('.profile-card');
    var btnContinuar = document.getElementById('btn-continuar-perfil');
    var estadoPerfil = document.getElementById('estado-perfil');
    var badgeActivo = document.getElementById('badge-perfil-activo');
    if (!tarjetas.length) { return; }

    var etiquetas = {
      hogar: 'Jefe de hogar',
      estudiante: 'Estudiante/Roommate',
      lider: 'Líder comunitario'
    };

    function seleccionar(tarjeta) {
      var clave = tarjeta.getAttribute('data-profile');
      var nombre = etiquetas[clave] || 'Perfil seleccionado';
      tarjetas.forEach(function (t) {
        var esActiva = t === tarjeta;
        t.setAttribute('aria-checked', String(esActiva));
        var link = t.querySelector('.card-link');
        if (link) { link.textContent = esActiva ? 'Seleccionado' : 'Toca para elegir'; }
      });
      if (btnContinuar) { btnContinuar.disabled = false; }
      if (estadoPerfil) { estadoPerfil.textContent = '1 perfil seleccionado: ' + nombre; }
      if (badgeActivo) { badgeActivo.textContent = nombre; }
    }

    tarjetas.forEach(function (tarjeta) {
      tarjeta.addEventListener('click', function () { seleccionar(tarjeta); });
      tarjeta.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          seleccionar(tarjeta);
        }
      });
    });

    if (btnContinuar) {
      btnContinuar.addEventListener('click', function () {
        var seccionAcceso = document.getElementById('acceso');
        if (seccionAcceso) { seccionAcceso.scrollIntoView({ behavior: 'smooth' }); }
      });
    }
  }

  /* ==========================================================================
     3. MODO ACCESIBLE (HU-021) Y ASISTENTE POR VOZ (HU-019) (Módulo 2)
     ========================================================================== */
  function iniciarModoAccesible() {
    var toggleAccesible = document.getElementById('toggle-modo-accesible');
    if (!toggleAccesible) { return; }

    if (localStorage.getItem('hydro_modo_accesible') === 'true') {
      toggleAccesible.checked = true;
      document.documentElement.classList.add('modo-accesible');
      document.body.classList.add('modo-accesible');
    }

    toggleAccesible.addEventListener('change', function () {
      var activo = toggleAccesible.checked;
      document.documentElement.classList.toggle('modo-accesible', activo);
      document.body.classList.toggle('modo-accesible', activo);
      localStorage.setItem('hydro_modo_accesible', String(activo));
    });
  }

  function iniciarAsistenteVoz() {
    var btnVoz = document.getElementById('btn-asistente-voz');
    var toggleAccesible = document.getElementById('toggle-modo-accesible');
    if (!btnVoz) { return; }

    var panel = document.createElement('aside');
    panel.className = 'voice-panel';
    panel.innerHTML =
      '<div class="voice-panel-header">' +
        '<strong>Asistente por Voz</strong>' +
        '<button type="button" class="voice-close" aria-label="Cerrar">✕</button>' +
      '</div>' +
      '<p class="voice-status" aria-live="polite">Elige escuchar la pantalla o hablar.</p>' +
      '<div class="voice-actions">' +
        '<button type="button" class="btn btn-outline" id="btn-leer-pantalla">🔊 Leer pantalla</button>' +
        '<button type="button" class="btn btn-primary" id="btn-hablar">🎙️ Hablar</button>' +
      '</div>';
    document.body.appendChild(panel);

    var estado = panel.querySelector('.voice-status');
    var btnLeer = panel.querySelector('#btn-leer-pantalla');
    var btnHablar = panel.querySelector('#btn-hablar');

    function hablarTexto(texto) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var voz = new SpeechSynthesisUtterance(texto);
        voz.lang = 'es-PE';
        window.speechSynthesis.speak(voz);
      }
      estado.textContent = texto;
    }

    btnVoz.addEventListener('click', function () {
      var abierto = panel.classList.toggle('is-open');
      if (!abierto && 'speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    });

    panel.querySelector('.voice-close').addEventListener('click', function () {
      panel.classList.remove('is-open');
      if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    });

    btnLeer.addEventListener('click', function () {
      var secciones = document.querySelectorAll('main section');
      var seccionVisible = secciones[0];

      secciones.forEach(function (sec) {
        var rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.3) {
          seccionVisible = sec;
        }
      });

      if (seccionVisible) {
        var textos = seccionVisible.querySelectorAll('h1, h2, h3, p');
        var contenido = Array.prototype.slice.call(textos)
          .map(function (el) { return el.textContent.trim(); })
          .filter(Boolean)
          .join('. ');
        hablarTexto(contenido);
      }
    });

    var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
    btnHablar.addEventListener('click', function () {
      if (!Reconocimiento) {
        estado.textContent = 'Usa Chrome o Edge para activar el micrófono.';
        return;
      }

      var micro = new Reconocimiento();
      micro.lang = 'es-PE';
      estado.textContent = 'Escuchando...';
      btnVoz.classList.add('is-listening');

      micro.onresult = function (evento) {
        var dicho = evento.results[0][0].transcript;
        var texto = dicho.toLowerCase();

        if (texto.indexOf('leer') !== -1 || texto.indexOf('pantalla') !== -1) {
          btnLeer.click();
        } else if (texto.indexOf('consumo') !== -1 || texto.indexOf('litros') !== -1) {
          hablarTexto('Hoy llevas 145 litros consumidos, equivalente a 4 soles con 20 céntimos.');
        } else if (texto.indexOf('accesible') !== -1) {
          document.documentElement.classList.add('modo-accesible');
          document.body.classList.add('modo-accesible');
          localStorage.setItem('hydro_modo_accesible', 'true');
          if (toggleAccesible) { toggleAccesible.checked = true; }
          hablarTexto('Modo accesible activado.');
        } else {
          var cajaMensaje = document.getElementById('contacto-mensaje');
          if (cajaMensaje) { cajaMensaje.value = dicho; }
          hablarTexto('Redactado: "' + dicho + '"');
        }
      };

      micro.onend = function () { btnVoz.classList.remove('is-listening'); };
      micro.start();
    });
  }

  /* ==========================================================================
     4. INICIALIZACIÓN GLOBAL Y API DE PRUEBAS
     ========================================================================== */
  function iniciar() {
    inyectarEstilos();
    iniciarMenuResponsive();
    iniciarPerfiles();
    iniciarSimulador();
    iniciarRegistro();
    iniciarContacto();
    iniciarAlertasSimuladas();
    iniciarModoAccesible();
    iniciarAsistenteVoz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  window.HydroSenseModulo = {
    TARIFAS_SEDAPAL: TARIFAS_SEDAPAL,
    calcularFacturaSedapal: calcularFacturaSedapal,
    calcularProyeccionAhorro: calcularProyeccionAhorro,
    metrosParaSiguienteEscalon: metrosParaSiguienteEscalon,
    calcularLitrosPorPersonaDia: calcularLitrosPorPersonaDia,
    validarEmail: validarEmail,
    validarPassword: validarPassword,
    validarNombreCompleto: validarNombreCompleto,
    validarMensaje: validarMensaje,
    validarEnteroEnRango: validarEnteroEnRango,
    crearAlertaEscalon: crearAlertaEscalon,
    crearAlertaConsumoPorPersona: crearAlertaConsumoPorPersona,
    crearAlertaSimulada: crearAlertaSimulada,
    mostrarAlerta: mostrarAlerta
  };
})();