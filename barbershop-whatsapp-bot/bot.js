/* =========================================================================
   CEREBRO DEL CHATBOT  —  la conversación de reserva de citas
   -------------------------------------------------------------------------
   Es una "máquina de estados": según en qué punto de la charla está el
   cliente, el bot responde una cosa u otra. Devuelve mensajes con botones
   (como los mensajes interactivos de WhatsApp) que la interfaz pinta.
   ========================================================================= */

const Bot = (() => {

  // Cliente simulado (el que escribe por WhatsApp en la demo)
  const CLIENTE = { telefono: "+34 611 22 33 44", nombre: "" };

  let estado = "INICIO";
  let borrador = {};   // datos de la reserva en curso

  const M = CONFIG.negocio.moneda;

  // --- Helpers para construir respuestas --------------------------------
  function msg(texto, botones = []) {
    return { texto, botones };   // botones: [{ etiqueta, valor }]
  }
  function precio(p) { return `${p}${M}`; }

  function menuPrincipal() {
    return msg(
      `¡Hola! 👋 Soy el asistente de *${CONFIG.negocio.nombre}*.\n¿Qué quieres hacer?`,
      [
        { etiqueta: "📅 Reservar cita",       valor: "reservar" },
        { etiqueta: "🔎 Ver / cancelar cita", valor: "miscitas" },
        { etiqueta: "✂️ Servicios y precios",  valor: "servicios" },
        { etiqueta: "📍 Horario y dirección",  valor: "info" },
      ]
    );
  }

  // --- Punto de entrada: el cliente dice o pulsa algo --------------------
  // Devuelve un array de mensajes (el bot puede contestar con varios).
  function recibir(entrada) {
    const txt = (entrada || "").trim();
    const low = txt.toLowerCase();

    // Atajos globales disponibles en cualquier momento
    if (["hola","buenas","menu","menú","inicio","empezar","start"].includes(low)) {
      estado = "INICIO"; borrador = {};
      return [menuPrincipal()];
    }
    if (["cancelar","salir","atrás","atras"].includes(low) && estado.startsWith("RES_")) {
      estado = "INICIO"; borrador = {};
      return [msg("Sin problema, lo dejamos aquí. 👌"), menuPrincipal()];
    }

    switch (estado) {
      case "INICIO":          return enInicio(low, txt);
      case "RES_PELUQUERO":   return elegirPeluquero(low, txt);
      case "RES_SERVICIO":    return elegirServicio(low, txt);
      case "RES_DIA":         return elegirDia(low, txt);
      case "RES_HORA":        return elegirHora(low, txt);
      case "RES_NOMBRE":      return pedirConfirmacion(txt);
      case "RES_CONFIRMA":    return confirmarReserva(low);
      case "MIS_CITAS":       return gestionarCitas(low, txt);
      default:
        estado = "INICIO";
        return [menuPrincipal()];
    }
  }

  // --- INICIO / menú -----------------------------------------------------
  function enInicio(low, txt) {
    if (low === "reservar" || low === "1") return iniciarReserva();
    if (low === "miscitas" || low === "2") return verMisCitas();
    if (low === "servicios" || low === "3") return [listaServicios(), menuPrincipal()];
    if (low === "info" || low === "4")     return [infoNegocio(), menuPrincipal()];
    return [msg("No te he entendido. Elige una opción del menú 👇"), menuPrincipal()];
  }

  function listaServicios() {
    const lineas = CONFIG.servicios.map(s =>
      `• *${s.nombre}* — ${precio(s.precio)} (${s.duracion} min)`);
    return msg("✂️ *Nuestros servicios:*\n" + lineas.join("\n"));
  }

  function infoNegocio() {
    const n = CONFIG.negocio;
    const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
    const lineas = [];
    for (let d = 1; d <= 6; d++) {
      const tramos = CONFIG.horario[d] || [];
      lineas.push(`${dias[d]}: ${tramos.length ? tramos.map(t => t.join("–")).join("  y  ") : "Cerrado"}`);
    }
    lineas.push(`${dias[0]}: ${(CONFIG.horario[0]||[]).length ? "" : "Cerrado"}`);
    return msg(
      `📍 *${n.nombre}*\n${n.direccion}\n📞 ${n.telefono}\n\n🕒 *Horario:*\n` +
      lineas.join("\n")
    );
  }

  // --- Flujo de RESERVA --------------------------------------------------
  function iniciarReserva() {
    borrador = {};
    estado = "RES_PELUQUERO";
    const botones = CONFIG.peluqueros.map(p => ({ etiqueta: "💈 " + p.nombre, valor: p.id }));
    botones.push({ etiqueta: "🤝 Me da igual (el primero libre)", valor: "cualquiera" });
    return [msg("¡Genial! ¿Con quién te quieres cortar? 💈", botones)];
  }

  function elegirPeluquero(low, txt) {
    if (low === "cualquiera") { borrador.peluqueroId = null; }
    else {
      const pel = CONFIG.peluqueros.find(p =>
        p.id === low || p.nombre.toLowerCase() === low);
      if (!pel) return [reintento("Elige un peluquero de los botones 👇",
        CONFIG.peluqueros.map(p => ({ etiqueta: "💈 " + p.nombre, valor: p.id }))
          .concat([{ etiqueta: "🤝 Me da igual", valor: "cualquiera" }]))];
      borrador.peluqueroId = pel.id;
    }
    estado = "RES_SERVICIO";
    const botones = CONFIG.servicios.map(s =>
      ({ etiqueta: `${s.nombre} · ${precio(s.precio)}`, valor: s.id }));
    return [msg("Perfecto. ¿Qué servicio quieres? ✂️", botones)];
  }

  function elegirServicio(low, txt) {
    const serv = CONFIG.servicios.find(s =>
      s.id === low || s.nombre.toLowerCase() === low);
    if (!serv) return [reintento("Elige un servicio de la lista 👇",
      CONFIG.servicios.map(s => ({ etiqueta: `${s.nombre} · ${precio(s.precio)}`, valor: s.id })))];
    borrador.servicioId = serv.id;

    // Calcular días con hueco
    const dias = Agenda.diasConDisponibilidad(borrador.servicioId, borrador.peluqueroId);
    if (dias.length === 0) {
      estado = "INICIO";
      return [msg("Ahora mismo no veo huecos disponibles para ese servicio 😕. " +
        "Prueba más adelante o llámanos."), menuPrincipal()];
    }
    borrador.diasDisp = dias;
    estado = "RES_DIA";
    const botones = dias.slice(0, 6).map((d, i) =>
      ({ etiqueta: Agenda.fechaBonita(d), valor: "dia:" + i }));
    return [msg(`Genial, *${serv.nombre}* (${serv.duracion} min, ${precio(serv.precio)}).\n` +
      `📅 ¿Qué día te viene bien?`, botones)];
  }

  function elegirDia(low, txt) {
    let idx = -1;
    if (low.startsWith("dia:")) idx = parseInt(low.split(":")[1], 10);
    if (isNaN(idx) || idx < 0 || idx >= borrador.diasDisp.length) {
      const botones = borrador.diasDisp.slice(0, 6).map((d, i) =>
        ({ etiqueta: Agenda.fechaBonita(d), valor: "dia:" + i }));
      return [reintento("Elige un día de los botones 👇", botones)];
    }
    borrador.dia = borrador.diasDisp[idx];

    const huecos = Agenda.huecosLibres(borrador.dia, borrador.servicioId, borrador.peluqueroId);
    borrador.huecos = huecos;
    estado = "RES_HORA";
    const botones = huecos.slice(0, 8).map((h, i) =>
      ({ etiqueta: "🕒 " + h.hora, valor: "hora:" + i }));
    return [msg(`📅 *${Agenda.fechaBonita(borrador.dia)}*\n¿A qué hora?`, botones)];
  }

  function elegirHora(low, txt) {
    let idx = -1;
    if (low.startsWith("hora:")) idx = parseInt(low.split(":")[1], 10);
    if (isNaN(idx) || idx < 0 || idx >= borrador.huecos.length) {
      const botones = borrador.huecos.slice(0, 8).map((h, i) =>
        ({ etiqueta: "🕒 " + h.hora, valor: "hora:" + i }));
      return [reintento("Elige una hora de los botones 👇", botones)];
    }
    const hueco = borrador.huecos[idx];
    borrador.hora = hueco.hora;

    // Si era "cualquiera", asignamos el primer peluquero libre de ese hueco
    if (!borrador.peluqueroId) borrador.peluqueroId = hueco.peluquerosLibres[0];

    estado = "RES_NOMBRE";
    if (CLIENTE.nombre) return pedirConfirmacion(CLIENTE.nombre);
    return [msg("Casi está 🙌 ¿A nombre de quién pongo la cita? (escribe tu nombre)")];
  }

  function pedirConfirmacion(nombre) {
    borrador.cliente = nombre;
    CLIENTE.nombre = nombre;
    estado = "RES_CONFIRMA";
    const serv = Agenda.servicioPorId(borrador.servicioId);
    const pel = Agenda.peluqueroPorId(borrador.peluqueroId);
    const resumen =
      `Repaso tu cita 📝\n\n` +
      `👤 ${nombre}\n` +
      `💈 ${pel.nombre}\n` +
      `✂️ ${serv.nombre} — ${precio(serv.precio)} (${serv.duracion} min)\n` +
      `📅 ${Agenda.fechaBonita(borrador.dia)}\n` +
      `🕒 ${borrador.hora}\n\n` +
      `¿Confirmo la reserva?`;
    return [msg(resumen, [
      { etiqueta: "✅ Sí, confirmar", valor: "si" },
      { etiqueta: "❌ No, cancelar",  valor: "no" },
    ])];
  }

  function confirmarReserva(low) {
    if (low === "no" || low === "cancelar") {
      estado = "INICIO"; borrador = {};
      return [msg("Vale, no he reservado nada. 👌"), menuPrincipal()];
    }
    if (low !== "si" && low !== "sí" && low !== "confirmar") {
      return [reintento("¿Confirmo la cita?", [
        { etiqueta: "✅ Sí, confirmar", valor: "si" },
        { etiqueta: "❌ No, cancelar",  valor: "no" },
      ])];
    }
    const cita = Agenda.crearCita({
      dia: Agenda.claveDia(borrador.dia),
      hora: borrador.hora,
      servicioId: borrador.servicioId,
      peluqueroId: borrador.peluqueroId,
      cliente: borrador.cliente,
      telefono: CLIENTE.telefono,
    });
    estado = "INICIO"; borrador = {};
    return [
      msg(`✅ *¡Cita confirmada!*\n\n` +
        `💈 ${cita.peluqueroNombre}\n` +
        `✂️ ${cita.servicioNombre}\n` +
        `📅 ${Agenda.fechaBonita(Agenda.fechaHoraDeCita(cita))}\n` +
        `🕒 ${cita.hora}\n\n` +
        `Recibirás un recordatorio. Recuerda: para *cancelar o cambiar* necesitas avisar con al menos ` +
        `*${CONFIG.horasBloqueo} h* de antelación. ¡Te esperamos! 💈`),
      menuPrincipal(),
    ];
  }

  // --- VER / CANCELAR citas ---------------------------------------------
  function verMisCitas() {
    const citas = Agenda.citasDeTelefono(CLIENTE.telefono);
    if (citas.length === 0) {
      estado = "INICIO";
      return [msg("No tienes ninguna cita próxima. 📭"), menuPrincipal()];
    }
    estado = "MIS_CITAS";
    borrador.misCitas = citas;
    const lineas = citas.map((c, i) =>
      `*${i + 1}.* ${Agenda.fechaBonita(Agenda.fechaHoraDeCita(c))} · ${c.hora} — ` +
      `${c.servicioNombre} con ${c.peluqueroNombre}`);
    const botones = citas.map((c, i) =>
      ({ etiqueta: `🗑️ Cancelar nº ${i + 1}`, valor: "cancelar:" + i }));
    botones.push({ etiqueta: "⬅️ Volver", valor: "menu" });
    return [msg("📋 *Tus próximas citas:*\n" + lineas.join("\n"), botones)];
  }

  function gestionarCitas(low, txt) {
    if (low === "menu" || low === "volver") {
      estado = "INICIO"; return [menuPrincipal()];
    }
    if (!low.startsWith("cancelar:")) {
      return [reintento("Pulsa el botón de la cita que quieres cancelar, o vuelve al menú.",
        borrador.misCitas.map((c, i) => ({ etiqueta: `🗑️ Cancelar nº ${i + 1}`, valor: "cancelar:" + i }))
          .concat([{ etiqueta: "⬅️ Volver", valor: "menu" }]))];
    }
    const idx = parseInt(low.split(":")[1], 10);
    const cita = borrador.misCitas[idx];
    if (!cita) { estado = "INICIO"; return [menuPrincipal()]; }

    const chequeo = Agenda.puedeCancelar(cita);
    if (!chequeo.ok) {
      estado = "INICIO";
      return [msg(
        `⛔ No puedo cancelar esa cita desde aquí: faltan menos de *${chequeo.horas} h*.\n` +
        `Por favor, llámanos al ${CONFIG.negocio.telefono} y lo vemos. 🙏`),
        menuPrincipal()];
    }
    Agenda.cancelarCita(cita.id);
    estado = "INICIO";
    return [msg(`✅ Cita del ${Agenda.fechaBonita(Agenda.fechaHoraDeCita(cita))} a las ${cita.hora} cancelada. ` +
      `¡Esperamos verte pronto! 👋`), menuPrincipal()];
  }

  // --- Util --------------------------------------------------------------
  function reintento(texto, botones) { return msg(texto, botones); }

  function saludoInicial() { estado = "INICIO"; borrador = {}; return menuPrincipal(); }

  return { recibir, saludoInicial, CLIENTE };
})();
