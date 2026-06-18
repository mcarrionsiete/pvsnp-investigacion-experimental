# Chatbot de WhatsApp para Clínica Dental — Documento de Diseño

> Estado: **borrador para revisión** · Fecha: 2026-06-18 · Enfoque: **prototipo / prueba de fuego**

Este documento describe el diseño de un chatbot de WhatsApp para una clínica
dental. El objetivo del primer hito es un **prototipo funcional** que se pueda
probar con la clínica real ("prueba de fuego") y luego ir mejorando según cómo
funcione.

---

## 1. Objetivos

### Lo que pidió la clínica
- Atender **consultas** de pacientes.
- **Agendar citas**.
- **Recordar** al paciente una cita próxima para que confirme con un "OK".

### Mejoras propuestas (a validar con la clínica)
- **Reprogramar y cancelar** cita desde el propio chat.
- **Recordatorios escalonados**: 48 h antes (confirmar) + 2 h antes (recordatorio final).
- **Lista de espera**: si alguien cancela, avisar automáticamente al siguiente para llenar el hueco.
- **Instrucciones pre-cita** (ej. "ven en ayunas", "no tomes anticoagulantes").
- **Encuesta de satisfacción** post-cita y petición de reseña en Google.
- **Reactivación** de pacientes que llevan >6 meses sin venir.
- **Handoff a humano**: cuando el bot no sepa algo, pasar la conversación a recepción con un aviso.
- **Cumplimiento RGPD**: consentimiento y aviso de privacidad (datos de salud → categoría especial).

### Fuera de alcance del prototipo (fases posteriores)
- Pagos / cobros por WhatsApp.
- Integración con software dental propietario (Gesden, Dentalink, etc.).
- Multi-clínica / multi-sede.
- Panel web completo para recepción (en el prototipo basta con Google Calendar + logs).

---

## 2. Decisiones tomadas

| Tema | Decisión | Motivo |
|---|---|---|
| Canal de WhatsApp | **API oficial de Meta (Cloud API)**, empezando con el **número de pruebas gratuito** | Legal, sin coste inicial, sin riesgo de baneo |
| Agenda | **Google Calendar** | Sencillo, la recepción ya sabe usar un calendario, API buena |
| Enfoque | **Prototipo iterativo** | Probar rápido con la clínica y adaptar |
| Entrega | **Documento de diseño primero** | Validar antes de programar |

---

## 3. Costes estimados (prototipo)

- **Meta Cloud API**: gratis. El número de pruebas permite mensajes gratuitos a
  hasta ~5 contactos de test. Las respuestas dentro de la ventana de 24 h son
  gratuitas; los recordatorios proactivos (plantillas "utility") cuestan
  ~0,03–0,05 € cada uno en España, pero **en el número de pruebas no se cobra**.
- **Hosting**: gratis al principio (capa gratuita de Render/Railway/Fly.io) o
  un VPS pequeño ~5 €/mes.
- **Google Calendar API**: gratis.
- **IA para lenguaje natural** (opcional pero recomendado): coste por uso,
  céntimos por conversación con un modelo eficiente.

**Coste real del prototipo ≈ 0 €.** El coste aparece al pasar a producción con
el número real y volumen de recordatorios.

---

## 4. Arquitectura

```
┌──────────────┐     mensajes      ┌─────────────────────────────────┐
│   Paciente   │ ───────────────▶  │   WhatsApp Cloud API (Meta)     │
│  (WhatsApp)  │ ◀───────────────  │                                 │
└──────────────┘                   └───────────────┬─────────────────┘
                                          webhook   │   ▲ envío
                                                    ▼   │
                                   ┌─────────────────────────────────┐
                                   │     Backend del bot (FastAPI)   │
                                   │  ┌───────────────────────────┐  │
                                   │  │  Motor de conversación    │  │
                                   │  │  (intenciones + IA NLU)   │  │
                                   │  └───────────────────────────┘  │
                                   │  ┌───────────────────────────┐  │
                                   │  │  Gestor de citas          │──┼──▶ Google Calendar
                                   │  └───────────────────────────┘  │
                                   │  ┌───────────────────────────┐  │
                                   │  │  Base de datos (estado)   │──┼──▶ SQLite
                                   │  └───────────────────────────┘  │
                                   │  ┌───────────────────────────┐  │
                                   │  │  Programador recordatorios│  │
                                   │  │  (APScheduler)            │  │
                                   │  └───────────────────────────┘  │
                                   └─────────────────────────────────┘
```

### Componentes

1. **WhatsApp Cloud API (Meta)** — recibe y envía mensajes. Manda un *webhook*
   HTTP al backend por cada mensaje entrante.

2. **Backend (FastAPI, Python)** — elegimos Python para alinear con el resto del
   repo y por su buen soporte de webhooks e IA. Expone:
   - `GET /webhook` — verificación del webhook (handshake con Meta).
   - `POST /webhook` — recepción de mensajes entrantes.
   - `GET /health` — comprobación de estado.

3. **Motor de conversación** — interpreta el mensaje del paciente y decide la
   acción. Dos capas:
   - **Reglas rápidas** para casos claros ("OK", "SÍ", "CANCELAR").
   - **IA (NLU)** para lenguaje natural ("hola, ¿podría pedir hora para una
     limpieza la semana que viene por la tarde?"). Extrae intención + datos
     (tipo de cita, fechas/horas preferidas, nombre).

4. **Gestor de citas** — consulta huecos libres y crea/mueve/borra eventos en
   **Google Calendar**. Cada cita guarda en su descripción los metadatos
   (teléfono del paciente, estado de confirmación).

5. **Base de datos (SQLite en prototipo)** — guarda pacientes, estado de la
   conversación, consentimiento RGPD y registro de recordatorios enviados.

6. **Programador de recordatorios (APScheduler)** — cada X minutos revisa
   Google Calendar y, para citas dentro de la ventana (ej. 48 h), envía el
   mensaje de confirmación si no se ha enviado ya.

---

## 5. Flujos de conversación

### 5.1 Agendar cita
```
Paciente: Hola, quería pedir cita para una limpieza
Bot:      ¡Hola! Claro 😊 ¿Qué días te vienen mejor? (mañana/tarde)
Paciente: El jueves por la tarde si puede ser
Bot:      Tengo libre el jueves 25 a las 17:00 o 18:30. ¿Cuál prefieres?
Paciente: 18:30
Bot:      ¡Perfecto! Te he reservado limpieza el jueves 25 a las 18:30.
          Te recordaré la cita 48 h antes. ¿Algo más?
```

### 5.2 Recordatorio + confirmación
```
Bot:      Hola Ana 👋 Te recordamos tu cita de limpieza el jueves 25 a las 18:30
          en Clínica X. Responde OK para confirmar o CAMBIAR para reprogramar.
Paciente: OK
Bot:      ¡Gracias! Cita confirmada ✅ Te esperamos.
```

### 5.3 Cancelar / reprogramar
```
Paciente: CAMBIAR
Bot:      Sin problema. ¿Qué otro día te viene bien?
...
```

### 5.4 Consulta general / handoff
```
Paciente: ¿Hacéis ortodoncia invisible?
Bot:      Sí, ofrecemos ortodoncia invisible. ¿Quieres que te agende una
          primera visita de valoración, o prefieres que te llame recepción?
```
Si el bot no sabe responder → marca la conversación para recepción y avisa al
paciente de que le contestarán pronto.

---

## 6. Modelo de datos (prototipo)

**paciente**: `id`, `telefono`, `nombre`, `consentimiento_rgpd` (bool + fecha),
`ultima_visita`, `creado_en`.

**conversacion**: `id`, `paciente_id`, `estado` (libre / agendando / esperando_confirmacion / handoff),
`contexto_json`, `actualizado_en`.

**recordatorio**: `id`, `evento_calendar_id`, `paciente_id`, `tipo` (48h / 2h),
`enviado_en`, `estado` (enviado / confirmado / sin_respuesta).

Las **citas** viven en Google Calendar (fuente de verdad); SQLite solo guarda
estado conversacional y de recordatorios.

---

## 7. Privacidad y cumplimiento (RGPD)

- En el primer contacto, pedir **consentimiento** para tratar datos por WhatsApp
  y enlazar a la política de privacidad de la clínica.
- Minimizar datos: no pedir historial clínico por WhatsApp.
- Los datos de salud son **categoría especial** → en producción habrá que
  documentar base legal, encargados de tratamiento (Meta, Google) y firmar los
  contratos correspondientes (DPA).
- Permitir al paciente pedir baja ("BAJA" → dejar de enviar mensajes).

---

## 8. Plan por fases

### Fase 0 — Diseño (este documento) ✅
Validar alcance, costes y flujos con la clínica.

### Fase 1 — Prototipo "esqueleto" (sin WhatsApp real)
- Backend FastAPI con webhook simulado.
- Motor de conversación con los flujos básicos.
- Integración real con Google Calendar (crear/leer/mover citas).
- Recordatorios funcionando contra el calendario.
- **Simulador de chat por consola/web** para probar sin Meta.

### Fase 2 — Conexión a WhatsApp (número de pruebas)
- Alta en Meta for Developers, app + número de pruebas.
- Webhook real, plantillas de recordatorio aprobadas.
- Prueba con 2–3 móviles del equipo.

### Fase 3 — Prueba de fuego con la clínica
- Número real verificado.
- Pacientes piloto.
- Recoger feedback y métricas (citas agendadas, % confirmaciones, dudas no resueltas).

### Fase 4 — Mejoras
- Lista de espera, encuestas, reactivación, panel para recepción, etc.

---

## 9. Preguntas abiertas para la clínica

1. **¿Qué software de gestión usan hoy?** (Gesden, Clinic Cloud, Dentalink,
   agenda en papel…). Aunque empecemos con Google Calendar, saberlo nos dice si
   en el futuro conviene integrarlo.
2. **¿Qué otras tareas hacen hoy manualmente por WhatsApp con una persona?**
   (presupuestos, enviar radiografías, recordar pagos, captar reseñas…). Cada
   una puede ser una mejora futura.
3. **Tipos de cita y duración** (revisión, limpieza, urgencia, ortodoncia…).
4. **Horario de la clínica y profesionales** (¿una agenda o varias por doctor?).
5. **Tono del bot**: ¿tuteo o trato de usted? ¿Nombre/personalidad del bot?
6. **¿Quién atiende los handoff** y en qué horario?

---

## 10. Stack técnico propuesto

| Capa | Tecnología | Motivo |
|---|---|---|
| Lenguaje | Python 3.10+ | Alineado con el repo, gran ecosistema |
| Web/API | FastAPI + Uvicorn | Webhooks rápidos, async, sencillo |
| Agenda | Google Calendar API | Decisión tomada |
| BD | SQLite (prototipo) → PostgreSQL (producción) | Cero configuración para empezar |
| Recordatorios | APScheduler | Tareas programadas en el mismo proceso |
| NLU | Modelo de IA (Claude) | Entender lenguaje natural sin menús rígidos |
| WhatsApp | Meta Cloud API | Decisión tomada |
| Hosting | Render/Railway/Fly.io (gratis) → VPS | Coste inicial cero |

---

## 11. Siguiente paso sugerido

Si validas este diseño, el siguiente paso es montar la **Fase 1**: el esqueleto
del backend con un simulador de chat y la integración real con Google Calendar,
para poder "hablar" con el bot sin necesidad aún de WhatsApp. Así vemos la lógica
funcionando antes de tocar Meta.
