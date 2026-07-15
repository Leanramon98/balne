# Guía de Testing — Role-Based Evaluation Scoping

> Branch: `feature/role-based-evaluation-scoping`
> DB reseedeada con modelo **Red Iberoamericana DTI Rev3-Sept25**
> Todos los usuarios usan contraseña: **`123456`**

## Setup

1. Asegurate de que los containers estén levantados:
   ```bash
   cd workspace/infra
   docker compose up -d
   ```

2. Entrá a [http://localhost:3000/login](http://localhost:3000/login)

3. Login con cada usuario, revisá **Evaluaciones** y verificá que se vea lo indicado.

---

## 1. admin@dti.org — **Admin**

| Campo | Valor |
|-------|-------|
| Rol | `admin` |
| Ve | **TODAS** las evaluaciones de todos los destinos |
| Filtro destino | ✅ Visible — puede filtrar por cualquier destino |

**Qué probar:**
- Login → ves **11 evaluaciones** en total
- El filtro de destino aparece en la UI
- Seleccioná un destino del filtro → se filtra
- Sacá el filtro → vuelven todas

**Evaluaciones que deberías ver:**
| Destino | Evaluación | Estado |
|---------|-----------|--------|
| Bariloche | Autodiagnóstico Bariloche 2026 | en_curso |
| Bariloche | Diagnóstico Anual Bariloche 2025 | cerrada |
| Buenos Aires | Autodiagnóstico Buenos Aires 2026 | borrador |
| Buenos Aires | Medición Espontánea Buenos Aires Q1 | carga_finalizada |
| Barcelona | Autodiagnóstico Barcelona 2025 | cerrada |
| Barcelona | Auditoría Barcelona 2026 | en_evaluacion |
| Taxco | Autodiagnóstico Inicial Taxco | borrador |
| Villa Pehuenia | Autodiagnóstico Villa Pehuenia 2026 | en_curso |
| San Martín de los Andes | Autodiagnóstico SMA 2026 | borrador |
| El Calafate | Autodiagnóstico Calafate 2026 | borrador |
| Ushuaia | Autodiagnóstico Ushuaia 2026 | borrador |

---

## 2. bsas@dti.org — **Admin de Destino (Buenos Aires)**

| Campo | Valor |
|-------|-------|
| Rol | `admin_destino` |
| Destino | Buenos Aires |
| Ve | Solo evaluaciones de **Buenos Aires** |
| Filtro destino | ✅ Visible (puede cambiar de destino dentro de su ámbito) |

**Qué probar:**
- Login → solo ves 2 evaluaciones de Buenos Aires:
  - **Autodiagnóstico Buenos Aires 2026** → borrador
  - **Medición Espontánea Buenos Aires Q1** → carga_finalizada
- El filtro de destino aparece en la UI
- No ves Bariloche, Barcelona, ni ningún otro destino

---

## 3. barna@dti.org — **Admin de Destino (Barcelona)**

| Campo | Valor |
|-------|-------|
| Rol | `admin_destino` |
| Destino | Barcelona |
| Ve | Solo evaluaciones de **Barcelona** |
| Filtro destino | ✅ Visible |

**Qué probar:**
- Login → solo ves 2 evaluaciones de Barcelona:
  - **Autodiagnóstico Barcelona 2025** → cerrada
  - **Auditoría Barcelona 2026** → en_evaluacion (promovida desde el autodiagnóstico)
- El filtro de destino aparece en la UI
- No ves ningún otro destino

---

## 4. gestor.bariloche@dti.org — **Gestor de Destino (Bariloche)**

| Campo | Valor |
|-------|-------|
| Rol | `gestor_destino` |
| Destino | San Carlos de Bariloche |
| Ve | Solo evaluaciones de **Bariloche** |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → solo ves 2 evaluaciones de Bariloche:
  - **Autodiagnóstico Bariloche 2026** → en_curso
  - **Diagnóstico Anual Bariloche 2025** → cerrada
- El filtro de destino **NO** aparece en la UI
- No ves Buenos Aires, Barcelona, etc.

---

## 5. gestor.taxco@dti.org — **Gestor de Destino (Taxco)**

| Campo | Valor |
|-------|-------|
| Rol | `gestor_destino` |
| Destino | Taxco de Alarcón |
| Ve | Solo evaluaciones de **Taxco** |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → solo ves 1 evaluación de Taxco:
  - **Autodiagnóstico Inicial Taxco** → borrador
- No ves ningún otro destino

---

## 6. pehuenia@dti.org — **Gestor de Destino (Villa Pehuenia)**

| Campo | Valor |
|-------|-------|
| Rol | `gestor_destino` |
| Destino | Villa Pehuenia |
| Ve | Solo evaluaciones de **Villa Pehuenia** |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → solo ves 1 evaluación:
  - **Autodiagnóstico Villa Pehuenia 2026** → en_curso
- **NO** ves SMA, Calafate, Ushuaia (misma región pero NO es tu destino)

---

## 7. regional@dti.org  — **Gestor Regional (Patagonia) ⭐**

| Campo | Valor |
|-------|-------|
| Rol | `gestor_regional` |
| Destino base | Villa Pehuenia (→ resuelve región Patagonia) |
| Ve | Evaluaciones de **TODOS** los destinos de la región Patagonia |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → ves **4 evaluaciones** de Patagonia:
  - ✅ Villa Pehuenia — Autodiagnóstico Villa Pehuenia 2026 (en_curso)
  - ✅ San Martín de los Andes — Autodiagnóstico SMA 2026 (borrador)
  - ✅ El Calafate — Autodiagnóstico Calafate 2026 (borrador)
  - ✅ Ushuaia — Autodiagnóstico Ushuaia 2026 (borrador)
- **NO** ves Bariloche, Buenos Aires, Barcelona, Taxco
- El filtro de destino **NO** aparece en la UI

---

## 8. nacional@dti.org — **Gestor Nacional**

| Campo | Valor |
|-------|-------|
| Rol | `gestor_nacional` |
| Destino | Ninguno |
| Ve | **TODAS** las evaluaciones (readonly) |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → ves las **11 evaluaciones** (como admin)
- El filtro de destino **NO** aparece en la UI
- Diferencia con admin: `gestor_nacional` es readonly. No puede crear/modificar evaluaciones.

---

## 9. consultor@dti.org — **Consultor**

| Campo | Valor |
|-------|-------|
| Rol | `consultor` |
| Asignado a | Autodiagnóstico Bariloche + Autodiagnóstico Buenos Aires |
| Ve | Solo evaluaciones donde está asignado via `evaluation_user` |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → solo ves **2 evaluaciones**:
  - **Autodiagnóstico Bariloche 2026** (evaluador)
  - **Autodiagnóstico Buenos Aires 2026** (evaluador)
- **NO** ves ninguna otra evaluación
- El filtro de destino **NO** aparece en la UI

---

## 10. auditor@dti.org — **Auditor**

| Campo | Valor |
|-------|-------|
| Rol | `auditor` |
| Asignado a | Auditoría Barcelona 2026 |
| Ve | Solo evaluaciones donde está asignado via `evaluation_user` |
| Filtro destino | ❌ Oculto |

**Qué probar:**
- Login → solo ves **1 evaluación**:
  - **Auditoría Barcelona 2026** (en_evaluacion)
- **NO** ves ninguna otra evaluación
- El filtro de destino **NO** aparece en la UI

---

## Resumen Visual

| Rol | ¿Qué ve? | Cant. | Filtro destino | Scope |
|-----|----------|-------|---------------|-------|
| `admin` | Todo | 11 | ✅ Visible | Sin filtro |
| `admin_destino` | Su destino | 2 | ✅ Visible | `destination_id` del user |
| `gestor_destino` | Su destino | 1-2 | ❌ Oculto | `destination_id` del user |
| `gestor_regional` | Toda su región | 4 | ❌ Oculto | Destinos en su `region_id` |
| `gestor_nacional` | Todo | 11 | ❌ Oculto | Sin filtro (readonly) |
| `consultor` | Solo asignados | 2 | ❌ Oculto | `evaluation_user` JOIN |
| `auditor` | Solo asignados | 1 | ❌ Oculto | `evaluation_user` JOIN |

---

## Acciones (Plan de Transformación)

Además de las evaluaciones, hay **6 acciones** seedeadas para probar el módulo de acciones.

### Por destino

| Destino | Acción | Estado | Evaluación vinculada |
|---------|--------|--------|---------------------|
| Bariloche | Crear Oficina DTI | `en_planificacion` | Autodiagnóstico Bariloche 2026 |
| Bariloche | Implementar sistema de gestión de calidad | `en_ejecucion` | Autodiagnóstico Bariloche 2026 |
| Bariloche | Capacitar equipo en herramientas digitales | `finalizada` | Diagnóstico Anual Bariloche 2025 |
| Bariloche | Habilitar plataforma de datos abiertos turísticos | `finalizada` | Diagnóstico Anual Bariloche 2025 |
| Buenos Aires | Plan estratégico de turismo sostenible | `idea` | Autodiagnóstico Buenos Aires 2026 |
| Barcelona | Mejorar accesibilidad web y app turística | `en_ejecucion` | Auditoría Barcelona 2026 |

**Para probar:** login como admin o gestor de destino correspondiente, andá a **Plan de Transformación** y verificá que veas las acciones de tu destino.

## Buenas Prácticas

Hay **2 buenas prácticas** aprobadas, ambas de Bariloche:

| Acción | Estado | Designada por |
|--------|--------|--------------|
| Capacitar equipo en herramientas digitales | `approved` | admin@dti.org |
| Habilitar plataforma de datos abiertos turísticos | `approved` | admin@dti.org |

**Para probar:** login como admin, andá a **Buenas Prácticas** y verificá que se muestren.

## Planes DTI

Hay **3 planes** activos con metas vinculadas a indicadores:

| Plan | Destino | Vigencia | Metas |
|------|---------|----------|-------|
| Plan DTI Bariloche 2025-2027 | Bariloche | 2025-2027 | 3 metas |
| Plan DTI Buenos Aires 2026-2028 | Buenos Aires | 2026-2028 | 2 metas |
| Plan DTI Villa Pehuenia 2026-2029 | Villa Pehuenia | 2026-2029 | 1 meta |

## Datos de Referencia

### Modelo de Evaluación (Red Iberoamericana DTI Rev3)

| Dato | Cantidad |
|------|----------|
| Ejes | 5 (GOB, INN, TEC, SOST, ACC) |
| Ámbitos | 16 |
| Requisitos | 74 |
| Indicadores | 152 (87 gradient, 45 boolean, 20 numeric) |
| Evaluaciones | 11 |
| Acciones | 6 (idea → en_planificacion → en_ejecucion → finalizada) |
| Buenas Prácticas | 2 (ambas de Bariloche, aprobadas) |
| Planes DTI | 3 (con metas vinculadas a indicadores) |
| Evaluation-User | 7 (asignaciones consultor/auditor) |

### Estados de Evaluación en los datos de prueba

| Estado | Cant. | Ejemplo |
|--------|-------|---------|
| `borrador` | 5 | Inicios sin completar |
| `en_curso` | 2 | Autodiagnósticos en progreso |
| `carga_finalizada` | 1 | Medición completada |
| `en_evaluacion` | 1 | Auditoría siendo evaluada |
| `cerrada` | 2 | Procesos finalizados |

## Debugging Directo (opcional)

```bash
# 1. Login y obtener cookie
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gestor.bariloche@dti.org","password":"123456"}' \
  -c cookies.txt

# 2. Listar evaluaciones (usa la cookie del login)
curl -X GET http://localhost:3000/api/evaluations/api/v1/evaluations \
  -b cookies.txt | jq .
```

El parámetro `?destination_id=xxx` en la URL SOLO funciona para `admin` y `admin_destino`. Para el resto de roles, el backend lo ignora y fuerza el scope desde el JWT.
