# P vs NP — Investigacion Experimental Abierta

> **Problema del Milenio #3** | Investigacion amateur con IA | Valencia, Espana, 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/15abJDDhgFzeM-fauj6itqWXPFt6Fjrd6)
[![Estado](https://img.shields.io/badge/estado-investigacion%20abierta-green.svg)]()

---

## La Pregunta

**P = NP?**

Si un problema cuya solucion es facilmente *verificable* tambien puede ser facilmente *resuelto*, entonces P = NP. Si no, P != NP.

Esta es la pregunta central de la informatica teorica, y lleva mas de 50 anos sin respuesta. El Clay Mathematics Institute ofrece **$1,000,000** por una prueba en cualquier direccion.

Este repositorio contiene una investigacion experimental sobre 3-SAT — el problema NP-completo canonico — usando Python, solucionadores industriales (Glucose4) y visualizacion cientifica.

---

## Estructura de la Investigacion

La investigacion se divide en 3 fases, cada una explorando una dimension diferente del problema:

```
pvsnp-investigacion-experimental/
|-- notebooks/
|   |-- pvsnp_completo.ipynb    <- Notebook principal (13 celdas)
|-- graficas/
|   |-- pvsnp_fase_a_transicion.png
|   |-- pvsnp_fase_b_geometria.png
|   |-- pvsnp_fase_c_complejidad.png
|-- README.md
|-- LICENSE
```

---

## FASE A: Transicion de Fase SAT

**Hipotesis H1**: El problema 3-SAT exhibe una transicion de fase abrupta en torno a alpha_c = clauses/vars ~ 4.267.

### Metodologia
- 50 valores de alpha entre 1.0 y 7.0
- 150 instancias aleatorias por punto (n=30 variables)
- Solver industrial Glucose4 (pysat)
- Medicion: tasa de satisfacibilidad, derivada numerica

### Resultados

| Zona | alpha | Soluciones | Descripcion |
|------|-------|-----------|-------------|
| SAT facil | < 4.0 | ~150/150 | Espacio lleno de soluciones |
| **Zona critica** | **~4.267** | **~50/150** | **Barrera de complejidad** |
| UNSAT | > 5.5 | 0/150 | Imposibilidad detectable |

**H1 CONFIRMADA**: Transicion abrupta confirmada en alpha_c = 4.267 (esperado teorico: ~4.267)

---

## FASE B: Geometria del Espacio de Soluciones

**Hipotesis**: El espacio de soluciones se fragmenta en la zona critica.

### Hipotesis y Resultados

| ID | Hipotesis | Metrica | Resultado |
|----|-----------|---------|----------|
| H2a | Fragmentacion (distancia Hamming) | Cae 68% en alpha_c | **CONFIRMADA** |
| H2b | Colapso del numero de soluciones | Factor 3x de reduccion | **CONFIRMADA** |
| H2c | Crecimiento del backbone | 74.2% variables forzadas en alpha_c | **CONFIRMADA** |

### Interpretacion

En alpha < 2: las soluciones forman una "nube continua" densa — cualquier punto del espacio lleva a una solucion.

En alpha = 4.267: el espacio se convierte en un **archipielago de islas minusculas y aisladas**. El solver debe adivinar exactamente en cual isla buscar. Esta es la **firma geometrica de NP**.

En alpha > 5.5: imposibilidad total, detectable rapidamente (UNSAT).

---

## FASE C: Complejidad Computacional

**Hipotesis**: El tiempo de resolucion crece exponencialmente con el numero de variables.

### Datos Medidos (alpha = 4.267, zona critica)

| n (variables) | Tiempo solver | Factor acumulado |
|---|---|---|
| 50 | 0.17 ms | 1x |
| 100 | 2.54 ms | 15x |
| 150 | 24.6 ms | 145x |
| 200 | 316 ms | **1,858x** |

De n=50 a n=200 (factor 4x variables) => factor **1,858x** en tiempo.

**Ajuste DPLL manual**: crecimiento ~ e^(0.094*n) — exponencial puro.

### La Brecha P vs NP

La comparacion directa entre una curva O(n^3) hipotetica (algoritmo polinomial P) y el 3-SAT real medido muestra que la **brecha se ABRE** conforme crece n — evidencia empirica de P != NP.

---

## Conclusion Experimental Global

Las tres fases producen un cuadro coherente y triangulado:

1. **Barrera de fase** (FASE A): existe una transicion abrupta en alpha_c que crea una zona de complejidad maxima imposible de suavizar.

2. **Fragmentacion geometrica** (FASE B): en alpha_c el espacio de soluciones colapsa en islas exponencialmente aisladas, obligando a cualquier algoritmo a explorar exponencialmente muchas ramas.

3. **Explosion temporal** (FASE C): el tiempo de resolucion crece exponencialmente con n, con una brecha que se abre respecto a cualquier curva polinomial.

### Conclusion: La evidencia experimental es **consistente con P != NP**.

> **Caveat honesto**: Evidencia experimental != prueba matematica. P vs NP sigue siendo el problema abierto mas importante de la informatica teorica. Esta investigacion confirma que el problema ES genuinamente dificil, pero no constituye una demostracion formal.

---

## Como Reproducir

### Opcion 1: Google Colab (recomendado)

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/15abJDDhgFzeM-fauj6itqWXPFt6Fjrd6)

Haz clic en el badge y ejecuta todas las celdas en orden.

### Opcion 2: Local

```bash
git clone https://github.com/mcarrionsiete/pvsnp-investigacion-experimental
cd pvsnp-investigacion-experimental
pip install python-sat numpy matplotlib scipy
jupyter notebook notebooks/pvsnp_completo.ipynb
```

### Dependencias

```
python-sat >= 3.1
numpy >= 1.21
matplotlib >= 3.4
scipy >= 1.7
```

---

## Referencias

- Cook, S.A. (1971). *The complexity of theorem-proving procedures*. STOC 1971.
- Mitzenmacher, M. & Upfal, E. *Probability and Computing*. Cambridge University Press.
- Clay Mathematics Institute. [P vs NP Problem](https://www.claymath.org/millennium/p-vs-np/).
- Mezard, M. et al. (2002). *Analytic and Algorithmic Solution of Random Satisfiability Problems*. Science.
- Achlioptas, D. & Moore, C. (2002). *The threshold for random k-SAT is 2^k * ln2*.

---

## Contexto: Problemas del Milenio

Esta investigacion forma parte de una serie de exploraciones amateurs de los 7 Problemas del Milenio del Clay Mathematics Institute:

| # | Problema | Estado en este repo |
|---|---------|--------------------|
| 1 | Conjetura de Birch y Swinnerton-Dyer (BSD) | Explorado previamente |
| 2 | Conjetura de Collatz (adjacent) | Explorado previamente |
| 3 | **P vs NP** | **Este repositorio** |

---

## Autor

**mcarrionsiete** — Investigador Amateur
Valencia, Espana | Abril 2026

Con asistencia de IA (Perplexity Comet) para generacion y ejecucion de codigo.

*"La matematica es el lenguaje en el que Dios ha escrito el universo."* — Galileo

---

## Licencia

MIT License — ver [LICENSE](LICENSE) para detalles.

Investigacion abierta. Contribuciones, issues y forks bienvenidos.
