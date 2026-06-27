/* =========================================================================
   CONFIGURACIÓN DEL CHATBOT  —  The Barber Mario Piqueras
   -------------------------------------------------------------------------
   Mario: este es el ÚNICO archivo que normalmente necesitarás tocar.
   Cambia nombres, servicios, precios y horarios aquí abajo.
   Todo lo demás (la lógica del bot) funciona solo.
   ========================================================================= */

const CONFIG = {

  // --- Datos del negocio -------------------------------------------------
  negocio: {
    nombre: "The Barber Mario Piqueras",
    direccion: "C/ Ejemplo 12, tu ciudad",   // <-- pon tu dirección real
    telefono: "+34 600 000 000",             // <-- pon tu teléfono real
    moneda: "€",
  },

  // --- Peluqueros --------------------------------------------------------
  // Quita o añade peluqueros libremente.
  peluqueros: [
    { id: "mario",    nombre: "Mario" },
    { id: "salvador", nombre: "Salvador" },
  ],

  // --- Servicios (nombre, duración en minutos, precio) -------------------
  // La duración se usa para calcular los huecos libres en la agenda.
  servicios: [
    { id: "corte",     nombre: "Corte de pelo",        duracion: 30, precio: 12 },
    { id: "cortebarba",nombre: "Corte + barba",        duracion: 45, precio: 18 },
    { id: "barba",     nombre: "Arreglo de barba",     duracion: 20, precio: 8  },
    { id: "nino",      nombre: "Corte niño",           duracion: 30, precio: 10 },
    { id: "rapado",    nombre: "Rapado a máquina",     duracion: 20, precio: 9  },
    { id: "afeitado",  nombre: "Afeitado tradicional", duracion: 30, precio: 14 },
  ],

  // --- Horario de apertura ----------------------------------------------
  // Para cada día de la semana (0 = domingo ... 6 = sábado) define los
  // tramos en los que se atiende. Día vacío [] = cerrado.
  horario: {
    0: [],                                          // Domingo: cerrado
    1: [["10:00", "14:00"], ["16:30", "20:30"]],    // Lunes
    2: [["10:00", "14:00"], ["16:30", "20:30"]],    // Martes
    3: [["10:00", "14:00"], ["16:30", "20:30"]],    // Miércoles
    4: [["10:00", "14:00"], ["16:30", "20:30"]],    // Jueves
    5: [["10:00", "14:00"], ["16:30", "20:30"]],    // Viernes
    6: [["10:00", "14:00"]],                        // Sábado: solo mañana
  },

  // --- Reglas de reserva -------------------------------------------------
  // Bloqueo de 24 h: no se puede reservar NI cancelar con menos de estas
  // horas de antelación.  Pon otro número si quieres cambiarlo.
  horasBloqueo: 24,

  // Cada cuántos minutos empieza un posible hueco (granularidad de la agenda)
  intervaloMinutos: 15,

  // Cuántos días vista se ofrecen al cliente para elegir
  diasVista: 14,
};
