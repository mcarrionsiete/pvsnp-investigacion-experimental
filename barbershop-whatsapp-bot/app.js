/* =========================================================================
   INTERFAZ DEL SIMULADOR  —  pinta el chat tipo WhatsApp y conecta el bot
   ========================================================================= */

const chat      = document.getElementById("chat");
const inputBox  = document.getElementById("input");
const sendBtn   = document.getElementById("send");
const quickWrap = document.getElementById("quick");

// --- Pintar mensajes ----------------------------------------------------
function horaActual() {
  const d = Agenda.ahora();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// Convierte *negrita* de WhatsApp y saltos de línea a HTML seguro
function formatear(texto) {
  const escapado = texto
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escapado
    .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function pintarMensaje(texto, quien, enlaces) {
  const burbuja = document.createElement("div");
  burbuja.className = "msg " + (quien === "bot" ? "bot" : "user");
  let html = `<div class="txt">${formatear(texto)}</div>`;
  // Botones-enlace (abren una web, p. ej. Google Calendar). Van DENTRO de la
  // burbuja para que queden fijos en el historial del chat.
  if (enlaces && enlaces.length) {
    html += `<div class="links">` + enlaces.map(e =>
      `<a class="link-btn" href="${e.url}" target="_blank" rel="noopener">${e.etiqueta}</a>`
    ).join("") + `</div>`;
  }
  html += `<span class="time">${horaActual()}${quien === "user" ? " ✓✓" : ""}</span>`;
  burbuja.innerHTML = html;
  chat.appendChild(burbuja);
  chat.scrollTop = chat.scrollHeight;
}

function limpiarBotones() { quickWrap.innerHTML = ""; }

function pintarBotones(botones) {
  limpiarBotones();
  botones.forEach(b => {
    const btn = document.createElement("button");
    btn.className = "quick-btn";
    btn.textContent = b.etiqueta;
    btn.onclick = () => enviar(b.valor, b.etiqueta);
    quickWrap.appendChild(btn);
  });
}

// --- Mostrar respuestas del bot (con efecto "escribiendo...") -----------
function indicadorEscribiendo() {
  const t = document.createElement("div");
  t.className = "msg bot typing";
  t.id = "typing";
  t.innerHTML = `<div class="txt"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  chat.appendChild(t);
  chat.scrollTop = chat.scrollHeight;
}
function quitarEscribiendo() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

async function responder(mensajes) {
  limpiarBotones();
  for (let i = 0; i < mensajes.length; i++) {
    indicadorEscribiendo();
    await espera(450 + Math.random() * 350);
    quitarEscribiendo();
    pintarMensaje(mensajes[i].texto, "bot", mensajes[i].enlaces);
    if (mensajes[i].botones && mensajes[i].botones.length) {
      pintarBotones(mensajes[i].botones);
    }
    await espera(150);
  }
}
function espera(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Enviar lo que escribe / pulsa el cliente ---------------------------
function enviar(valor, etiquetaVisible) {
  const texto = etiquetaVisible || valor;
  if (!valor) return;
  pintarMensaje(texto, "user");
  inputBox.value = "";
  const respuesta = Bot.recibir(valor);
  responder(respuesta);
}

sendBtn.onclick = () => { if (inputBox.value.trim()) enviar(inputBox.value.trim()); };
inputBox.addEventListener("keydown", e => {
  if (e.key === "Enter" && inputBox.value.trim()) enviar(inputBox.value.trim());
});

// --- Panel de "profesor" (para enseñar a Mario) -------------------------
document.getElementById("reset").onclick = () => {
  if (confirm("¿Borrar todas las citas de la demo y empezar de cero?")) {
    Agenda.borrarTodo();
    Agenda.setAhora(null);
    document.getElementById("fakeNow").value = "";
    reiniciarChat();
  }
};

document.getElementById("fakeNow").addEventListener("change", e => {
  Agenda.setAhora(e.target.value ? new Date(e.target.value) : null);
  pintarMensaje(e.target.value
    ? "🧪 (Modo demo: ahora el bot cree que estamos a " + new Date(e.target.value).toLocaleString("es-ES") + ")"
    : "🧪 (Modo demo: vuelvo a usar la fecha real)", "bot");
});

function reiniciarChat() {
  chat.innerHTML = "";
  limpiarBotones();
  const saludo = Bot.saludoInicial();
  responder([saludo]);
}

// --- Arranque -----------------------------------------------------------
reiniciarChat();
