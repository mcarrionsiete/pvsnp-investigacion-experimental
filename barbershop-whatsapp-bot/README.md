# 💈 Simulador de chatbot de citas por WhatsApp — The Barber Mario Piqueras

Simulador (demo) de un asistente de **reserva de citas por WhatsApp** para la
barbería de **Mario Piqueras**, con **dos peluqueros (Mario y Salvador)** y la
regla de **bloqueo de 24 horas** para reservar y cancelar.

Está pensado para **enseñárselo a Mario**: se abre en el móvil o el ordenador,
parece WhatsApp de verdad y permite probar toda la conversación sin necesidad
de conectar la API real de WhatsApp ni ninguna clave.

---

## ▶️ Cómo abrirlo (lo más fácil)

1. Descarga esta carpeta (`barbershop-whatsapp-bot`).
2. Haz **doble clic en `index.html`**. Se abre en el navegador. ¡Ya está!

> No hace falta instalar nada. Funciona sin internet.

### Para verlo bien en el móvil (opcional)
Sube la carpeta a cualquier hosting gratuito de páginas estáticas
(GitHub Pages, Netlify, Vercel…) y comparte el enlace con Mario.

---

## 🧪 Cómo hacer la demo a Mario

En la pantalla hay un **panel de demostración** a la izquierda (en el móvil,
debajo). Sirve para practicar:

1. **Reservar una cita:** pulsa `📅 Reservar cita`, elige peluquero, servicio,
   día y hora, y confirma. Verás cómo el bot guarda la cita.
2. **Cancelar una cita:** pulsa `🔎 Ver / cancelar cita` y cancélala.
3. **Probar la regla de las 24 h:** en el panel, pon en *"Simular fecha y hora
   de hoy"* una hora que esté a **menos de 24 h** de una cita ya creada, y prueba
   a cancelarla. El bot **lo bloqueará** y pedirá llamar por teléfono. Así Mario
   ve la regla funcionando sin tener que esperar de verdad.
4. **🔄 Reiniciar demo:** borra todas las citas de prueba y empieza de cero.

---

## ✏️ Cómo cambiar servicios, precios, peluqueros y horarios

Todo lo editable está en **un solo archivo: `config.js`**. Ábrelo con cualquier
editor de texto (incluso el Bloc de notas) y cambia lo que necesites:

- **Peluqueros** → añade o quita nombres en `peluqueros`.
- **Servicios y precios** → edita la lista `servicios` (nombre, duración, precio).
- **Horarios** → edita `horario` (tramos de cada día; día vacío `[]` = cerrado).
- **Bloqueo de 24 h** → cambia `horasBloqueo` (por ejemplo a `48`).

> Los **precios y servicios son de ejemplo**. Sustitúyelos por los reales de
> Booksy. (No pude leer la página de Booksy automáticamente, así que puse
> valores típicos de barbería para que Mario los ajuste.)

---

## 🧩 Qué hace el bot

- Menú con: **Reservar**, **Ver/cancelar**, **Servicios y precios**, **Horario y dirección**.
- Reserva guiada: **peluquero → servicio → día → hora → nombre → confirmar**.
- Calcula los **huecos libres** según el horario, la duración del servicio y las
  citas ya ocupadas (no deja solapar dos citas del mismo peluquero).
- Opción **"me da igual el peluquero"**: asigna el primero que esté libre.
- **Regla de 24 h**: no ofrece huecos a menos de 24 h y no deja cancelar dentro
  de ese margen.
- Acepta tanto **botones** (como los mensajes interactivos de WhatsApp) como
  texto escrito.

---

## 🗂️ Archivos

| Archivo | Para qué sirve | ¿Lo toca Mario? |
|---|---|---|
| `index.html` | La pantalla (el "teléfono") | No |
| `styles.css` | El aspecto tipo WhatsApp | No |
| `config.js`  | **Servicios, precios, peluqueros, horarios** | **Sí** ✅ |
| `engine.js`  | Motor de agenda y regla de 24 h | No |
| `bot.js`     | La conversación del asistente | No (si quieres cambiar textos) |
| `app.js`     | Conecta el chat con la pantalla | No |

---

## 🚀 ¿Y para usarlo de verdad en WhatsApp?

Este proyecto es un **simulador**. Para pasarlo a WhatsApp real haría falta:

1. Una cuenta de **WhatsApp Business API** (vía Meta o un proveedor como Twilio,
   360dialog, etc.).
2. Un pequeño servidor que reciba los mensajes y reutilice la lógica de
   `engine.js` y `bot.js`.
3. Una base de datos para las citas (en vez del navegador).

La lógica de reservas y la regla de 24 h ya están listas para reaprovecharse.
Cuando quieras dar ese paso, avísame y preparamos la integración.

---

*Hecho como demo para enseñar el funcionamiento del asistente de citas a Mario.*
