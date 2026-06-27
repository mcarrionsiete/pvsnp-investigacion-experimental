/* =========================================================================
   MOTOR DE RESERVAS  —  lógica de agenda, huecos y regla de las 24 h
   -------------------------------------------------------------------------
   Mario: normalmente NO necesitas tocar este archivo.
   Las citas de la demo se guardan en el propio navegador (localStorage),
   así no se pierden al cerrar y se pueden borrar desde "Reiniciar demo".
   ========================================================================= */

const Agenda = (() => {

  const STORAGE_KEY = "citas_barber_mario";

  // --- Persistencia de citas --------------------------------------------
  function cargarCitas() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch (e) { return []; }
  }
  function guardarCitas(citas) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(citas));
  }
  function borrarTodo() { localStorage.removeItem(STORAGE_KEY); }

  // --- Utilidades de tiempo ---------------------------------------------
  // "Ahora" puede simularse para enseñar la regla de las 24 h sin esperar.
  let ahoraSimulado = null;
  function ahora() { return ahoraSimulado ? new Date(ahoraSimulado) : new Date(); }
  function setAhora(fecha) { ahoraSimulado = fecha ? new Date(fecha) : null; }

  function aMinutos(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  }
  function aHHMM(min) {
    const h = String(Math.floor(min / 60)).padStart(2, "0");
    const m = String(min % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  // Clave de día YYYY-MM-DD en horario local (sin líos de zona horaria)
  function claveDia(fecha) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const d = String(fecha.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio",
                 "agosto","septiembre","octubre","noviembre","diciembre"];
  function fechaBonita(fecha) {
    return `${DIAS[fecha.getDay()]} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
  }

  // --- Catálogo helpers --------------------------------------------------
  function servicioPorId(id)  { return CONFIG.servicios.find(s => s.id === id); }
  function peluqueroPorId(id) { return CONFIG.peluqueros.find(p => p.id === id); }

  // --- Generación de huecos libres --------------------------------------
  // Devuelve los próximos días (objeto Date) que tienen al menos un hueco
  // libre para un servicio y un peluquero dados, respetando la regla 24 h.
  function diasConDisponibilidad(servicioId, peluqueroId) {
    const dias = [];
    const base = ahora();
    for (let i = 0; i <= CONFIG.diasVista; i++) {
      const dia = new Date(base);
      dia.setDate(base.getDate() + i);
      dia.setHours(0, 0, 0, 0);
      const huecos = huecosLibres(dia, servicioId, peluqueroId);
      if (huecos.length > 0) dias.push(dia);
    }
    return dias;
  }

  // Huecos libres de un día concreto para servicio + peluquero.
  // Si peluqueroId es null => "cualquiera": un hueco vale si está libre
  // para AL MENOS un peluquero, y se anota quién está disponible.
  function huecosLibres(dia, servicioId, peluqueroId) {
    const servicio = servicioPorId(servicioId);
    if (!servicio) return [];

    const tramos = CONFIG.horario[dia.getDay()] || [];
    if (tramos.length === 0) return [];

    const citas = cargarCitas();
    const clave = claveDia(dia);
    const limite = new Date(ahora().getTime() + CONFIG.horasBloqueo * 60 * 60 * 1000);

    const peluquerosObjetivo = peluqueroId
      ? [peluqueroPorId(peluqueroId)]
      : CONFIG.peluqueros;

    const huecos = [];
    for (const [ini, fin] of tramos) {
      const iniMin = aMinutos(ini);
      const finMin = aMinutos(fin);
      for (let t = iniMin; t + servicio.duracion <= finMin; t += CONFIG.intervaloMinutos) {
        // Momento de inicio del hueco como fecha real
        const inicio = new Date(dia);
        inicio.setHours(0, 0, 0, 0);
        inicio.setMinutes(t);

        // Regla de las 24 h: descartar huecos demasiado próximos
        if (inicio < limite) continue;

        // ¿Qué peluqueros tienen libre este hueco?
        const libres = peluquerosObjetivo.filter(pel =>
          !haySolapamiento(citas, clave, pel.id, t, servicio.duracion)
        );
        if (libres.length > 0) {
          huecos.push({
            hora: aHHMM(t),
            minuto: t,
            peluquerosLibres: libres.map(p => p.id),
          });
        }
      }
    }
    return huecos;
  }

  function haySolapamiento(citas, clave, peluqueroId, inicioMin, duracion) {
    const finMin = inicioMin + duracion;
    return citas.some(c => {
      if (c.dia !== clave || c.peluqueroId !== peluqueroId) return false;
      const cIni = aMinutos(c.hora);
      const cFin = cIni + c.duracion;
      return inicioMin < cFin && cIni < finMin;   // solapan
    });
  }

  // --- Crear / consultar / cancelar citas -------------------------------
  function crearCita({ dia, hora, servicioId, peluqueroId, cliente, telefono }) {
    const servicio = servicioPorId(servicioId);
    const cita = {
      id: "C" + Date.now().toString(36).toUpperCase(),
      dia,                       // YYYY-MM-DD
      hora,                      // HH:MM
      duracion: servicio.duracion,
      servicioId,
      servicioNombre: servicio.nombre,
      precio: servicio.precio,
      peluqueroId,
      peluqueroNombre: peluqueroPorId(peluqueroId).nombre,
      cliente: cliente || "",
      telefono: telefono || "",
      creada: ahora().toISOString(),
    };
    const citas = cargarCitas();
    citas.push(cita);
    guardarCitas(citas);
    return cita;
  }

  function citasDeTelefono(telefono) {
    const limite = ahora();
    return cargarCitas()
      .filter(c => c.telefono === telefono)
      .filter(c => fechaHoraDeCita(c) >= limite)   // solo futuras
      .sort((a, b) => fechaHoraDeCita(a) - fechaHoraDeCita(b));
  }

  function fechaHoraDeCita(cita) {
    const [y, m, d] = cita.dia.split("-").map(Number);
    const [hh, mm] = cita.hora.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }

  // Devuelve { ok, motivo } — aplica la regla de las 24 h a la cancelación.
  function puedeCancelar(cita) {
    const margen = (fechaHoraDeCita(cita) - ahora()) / (1000 * 60 * 60);
    if (margen < CONFIG.horasBloqueo) {
      return { ok: false, horas: CONFIG.horasBloqueo };
    }
    return { ok: true };
  }

  function cancelarCita(citaId) {
    const citas = cargarCitas().filter(c => c.id !== citaId);
    guardarCitas(citas);
  }

  // --- API pública -------------------------------------------------------
  return {
    ahora, setAhora, borrarTodo,
    fechaBonita, claveDia, fechaHoraDeCita,
    servicioPorId, peluqueroPorId,
    diasConDisponibilidad, huecosLibres,
    crearCita, citasDeTelefono, puedeCancelar, cancelarCita,
    cargarCitas,
  };
})();
