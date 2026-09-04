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

1. Crear la base de datos en PostgreSQL:
   ```sql
   CREATE DATABASE pae_db;
   ```
2. Ajustar usuario/clave en `src/main/resources/application.properties` si es necesario.
3. Ejecutar:
   ```bash
   mvn spring-boot:run
   ```
   Al arrancar, Hibernate crea automáticamente el esquema `pae` y sus tablas
   (`ddl-auto=update`). El servidor queda escuchando en `http://localhost:8082`.

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
| Planificación | POST | `/api/pae/plan/calcular` | Calcula y guarda el plan de raciones óptimo para un curso/fecha |
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

El repositorio del panel de control (React + TypeScript + Tailwind) es un
proyecto aparte que consume esta API. Con el backend corriendo, basta con
apuntar el frontend a `http://localhost:8082/api/pae`.
