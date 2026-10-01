# PAE Backend — I.E.M. Ciudad Ebenezer

Backend en **Spring Boot 3.3 (Java 17)** para el Sistema de Gestión y
Planificación del Programa de Alimentación Escolar (PAE), con
**Arquitectura Limpia/Hexagonal simplificada**.

El núcleo del sistema es un modelo analítico de pronóstico de demanda
basado en el problema del vendedor de periódicos (*newsvendor model*):
a partir de la matrícula real de cada curso, la tasa de asistencia
esperada y los costos de sobrante/faltante, calcula la razón crítica
`Cu / (Cu + Co)`, su z-score sobre la normal estándar y el tamaño de
pedido que minimiza el costo esperado de desviación. Sobre ese mismo
dominio se calculan además los indicadores operativos del programa
(cobertura, desperdicio, ausentismo, rendimiento de cocina, error
absoluto medio del pronóstico) y el control de inventario de insumos
(consumo diario, punto de reorden, capacidad máxima de cocina por
turno).

## Estructura de carpetas

```
pae-backend/
└── src/main/java/co/edu/iem/pae/
    ├── PaeApplication.java
    │
    ├── domain/                          # Java puro. Sin Spring, sin JPA.
    │   ├── model/
    │   │   ├── Jornada.java
    │   │   ├── Curso.java
    │   │   ├── Estudiante.java
    │   │   ├── Insumo.java
    │   │   ├── MovimientoInsumo.java
    │   │   ├── Turno.java
    │   │   ├── PersonalCocina.java
    │   │   ├── PlanRacion.java
    │   │   ├── EntregaRacion.java
    │   │   ├── CalculadorDemanda.java       <- motor analítico (newsvendor)
    │   │   ├── CalculadorIndicadores.java   <- fórmulas de indicadores operativos
    │   │   ├── ResultadoCalculoDemanda.java
    │   │   ├── EstadisticasResumen.java
    │   │   ├── IndicadoresOperativos.java
    │   │   └── ResumenPeriodo.java
    │   ├── gateway/                      # Puertos (interfaces)
    │   │   ├── JornadaGateway.java
    │   │   ├── CursoGateway.java
    │   │   ├── EstudianteGateway.java
    │   │   ├── InsumoGateway.java
    │   │   ├── MovimientoInsumoGateway.java
    │   │   ├── TurnoGateway.java
    │   │   ├── PersonalCocinaGateway.java
    │   │   ├── PlanRacionGateway.java
    │   │   └── EntregaRacionGateway.java
    │   └── exception/
    │       └── RecursoNoEncontradoException.java
    │
    ├── usecases/                         # Java puro. Orquestan el dominio.
    │   ├── jornada/JornadaUseCase.java
    │   ├── curso/CursoUseCase.java
    │   ├── estudiante/EstudianteUseCase.java
    │   ├── insumo/InsumoUseCase.java
    │   ├── insumo/MovimientoInsumoUseCase.java
    │   ├── cocina/CocinaUseCase.java
    │   ├── plan/PlanRacionUseCase.java
    │   ├── entrega/EntregaRacionUseCase.java
    │   └── estadisticas/EstadisticasUseCase.java
    │
    └── infrastructure/                   # Aquí SÍ vive Spring/JPA.
        ├── config/
        │   ├── UseCasesConfig.java        <- @Configuration que crea los usecases como Beans
        │   ├── CorsConfig.java
        │   └── OpenApiConfig.java
        ├── driver_adapters/jpa_repository/
        │   ├── entity/                    # Entidades JPA (@Entity)
        │   ├── repository/                # Interfaces Spring Data JPA
        │   └── gateway/                   # Implementación de los puertos del dominio
        └── entry_points/api_rest/
            ├── JornadaController.java
            ├── CursoController.java
            ├── EstudianteController.java
            ├── InsumoController.java
            ├── CocinaController.java
            ├── PlanRacionController.java
            ├── EntregaRacionController.java
            ├── IndicadoresController.java
            ├── GlobalExceptionHandler.java
            └── dto/                       # Records: request/response de la API

src/main/resources/
└── application.properties               # Configuración PostgreSQL y puerto del servidor
```

## Cómo correrlo

Requisitos: **JDK 17 o superior** (con Java 8 no compila) y Maven.

### Con PostgreSQL (uso normal)

1. Crear la base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE pae_db;
   ```
2. Copiar `application.properties.example` a `application.properties` y poner
   la contraseña **real** del usuario `postgres` de tu instalación. Si no
   coincide, la app se detiene con `la autentificación password falló`. Para
   cambiarla desde pgAdmin: `ALTER USER postgres PASSWORD 'tu_clave';`
3. Ejecutar:
   ```bash
   mvn spring-boot:run
   ```
   Al arrancar, Hibernate crea automáticamente el esquema `pae` y sus tablas
   (`ddl-auto=update`). El servidor queda escuchando en `http://localhost:8082`.

### Modo demo (sin PostgreSQL)

Usa una base en memoria con los datos de ejemplo del documento (455
estudiantes, 3 insumos, cocina de 750 raciones y la semana simulada de la
Tabla 1). Los datos se borran al detener la aplicación.

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

En IntelliJ: *Run configuration → Active profiles → `demo`*. Para quitar el
modo demo del proyecto basta con borrar la dependencia `h2` del `pom.xml`,
`application-demo.properties` y `infrastructure/config/DemoDataSeeder.java`.

### Pruebas

```bash
mvn test
```

Verifican que el motor reproduce los ejemplos del documento (F1, F2, F3, F10,
F12, F19), los parámetros del modelo y el recálculo del plan sin duplicados.

## Documentación interactiva

Con la aplicación corriendo, la documentación OpenAPI/Swagger queda disponible en:

```
http://localhost:8082/swagger-ui.html
```

Desde ahí se puede probar cada endpoint sin necesidad de un cliente externo.

## Endpoints principales

| Módulo | Método | Ruta | Descripción |
|---|---|---|---|
| Jornadas | POST | `/api/pae/jornada` | Crea una jornada (Mañana, Tarde) |
| Jornadas | GET | `/api/pae/jornada` | Lista las jornadas |
| Cursos | POST | `/api/pae/curso` | Crea un curso dentro de una jornada |
| Cursos | GET | `/api/pae/curso/jornada/{idJornada}` | Lista los cursos de una jornada |
| Estudiantes | POST | `/api/pae/estudiante` | Matricula un estudiante en un curso |
| Estudiantes | GET | `/api/pae/estudiante/curso/{idCurso}` | Lista los matriculados de un curso |
| Insumos | POST | `/api/pae/insumo` | Registra un insumo (gramos por ración, stock, reserva) |
| Insumos | POST | `/api/pae/insumo/{idInsumo}/movimiento` | Registra el ingreso/consumo diario de un insumo |
| Insumos | GET | `/api/pae/insumo/{idInsumo}/punto-reorden` | Calcula el punto de reorden en kg |
| Cocina | POST | `/api/pae/cocina/turno` | Crea un turno de cocina |
| Cocina | POST | `/api/pae/cocina/personal` | Asigna personal a un turno |
| Cocina | GET | `/api/pae/cocina/turno/{idTurno}/capacidad-maxima` | Capacidad máxima de preparación del turno |
| Parámetros | GET | `/api/pae/parametros` | Costos y valores por defecto del modelo de pedido |
| Parámetros | PUT | `/api/pae/parametros` | Actualiza los parámetros del modelo |
| Planificación | POST | `/api/pae/plan/calcular` | Calcula y guarda el plan de un curso/fecha (recalcular reemplaza el plan del día) |
| Planificación | GET | `/api/pae/plan/fecha/{fecha}` | Plan vigente de cada curso en una fecha (yyyy-MM-dd) |
| Planificación | GET | `/api/pae/plan/curso/{idCurso}` | Lista los planes de un curso |
| Planificación | GET | `/api/pae/plan/curso/{idCurso}/estadisticas` | Estadísticas agregadas de un curso |
| Entregas | POST | `/api/pae/entrega/registrar` | Registra el consumo real de un plan |
| Entregas | GET | `/api/pae/entrega/plan/{idPlan}` | Consulta la entrega registrada de un plan |
| Indicadores | GET | `/api/pae/indicadores/plan/{idPlan}` | Desperdicio, faltante, cobertura, ausentismo, rendimiento |
| Indicadores | GET | `/api/pae/indicadores/curso/{idCurso}/resumen-periodo` | Costo ejecutado y error absoluto medio del pronóstico |
| Indicadores | GET | `/api/pae/indicadores/curso/{idCurso}/ahorro-optimizacion` | Ahorro por reducción de sobrantes entre dos periodos |

La lista completa (incluye `GET`/`PUT`/`DELETE` por id de cada recurso) está
documentada en Swagger.

Un curso necesita al menos un estudiante matriculado antes de poder calcular
su plan; la matrícula se toma de los estudiantes registrados, no se envía
como parámetro.

## Frontend

El panel (React + TypeScript + Tailwind) está en la carpeta `fronted`:

```bash
cd fronted
npm install
npm run dev      # abre http://localhost:8443
```

Por defecto consume `http://localhost:8082/api/pae`. Para apuntarlo a otro
servidor (por ejemplo al desplegar), definir la variable `VITE_API_URL`.

La navegación sigue el ciclo diario del PAE: **Inicio** (resumen y primeros
pasos) → **Plan del día** (cuántas raciones pedir y por qué) → **Comedor**
(raciones servidas) → **Inventario** → **Reportes** (indicadores F1–F20), más
**Configuración** (jornadas, cursos, estudiantes, cocina y parámetros).
