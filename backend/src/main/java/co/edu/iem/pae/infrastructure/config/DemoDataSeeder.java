package co.edu.iem.pae.infrastructure.config;

import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.InsumoGateway;
import co.edu.iem.pae.domain.gateway.JornadaGateway;
import co.edu.iem.pae.domain.gateway.ParametrosModeloGateway;
import co.edu.iem.pae.domain.gateway.PersonalCocinaGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.gateway.TurnoGateway;
import co.edu.iem.pae.domain.model.CalculadorDemanda;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.domain.model.Estudiante;
import co.edu.iem.pae.domain.model.Insumo;
import co.edu.iem.pae.domain.model.Jornada;
import co.edu.iem.pae.domain.model.ParametrosModelo;
import co.edu.iem.pae.domain.model.PersonalCocina;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.domain.model.Turno;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

// Carga los datos de ejemplo del documento del proyecto (455 estudiantes y la
// semana simulada de la Tabla 1). Solo se ejecuta con el perfil "demo".
// Usa los gateways directamente porque el caso de uso no admite planes con
// fecha pasada, y la semana de ejemplo es la semana anterior a hoy.
@Component
@Profile("demo")
public class DemoDataSeeder implements CommandLineRunner {
    private static final String[] NOMBRES = {
            "Ana", "Luis", "Maria", "Juan", "Sofia", "Carlos", "Valentina", "Andres", "Camila", "Jorge",
            "Isabella", "Diego", "Mariana", "Santiago", "Daniela", "Felipe", "Laura", "Sebastian", "Paula", "Mateo"};
    private static final String[] APELLIDOS = {
            "Gomez", "Rodriguez", "Martinez", "Lopez", "Garcia", "Hernandez", "Ramirez", "Torres", "Diaz", "Moreno",
            "Rojas", "Vargas", "Castro", "Ortiz", "Suarez", "Romero", "Herrera", "Medina", "Aguilar", "Pardo"};

    // Asistencia de lunes a viernes de la Tabla 1 del documento
    private static final double[] ASISTENCIA_SEMANA = {0.92, 0.90, 0.88, 0.91, 0.85};

    private final JornadaGateway jornadaGateway;
    private final CursoGateway cursoGateway;
    private final EstudianteGateway estudianteGateway;
    private final InsumoGateway insumoGateway;
    private final TurnoGateway turnoGateway;
    private final PersonalCocinaGateway personalCocinaGateway;
    private final ParametrosModeloGateway parametrosModeloGateway;
    private final PlanRacionGateway planRacionGateway;
    private final EntregaRacionGateway entregaRacionGateway;

    public DemoDataSeeder(JornadaGateway jornadaGateway, CursoGateway cursoGateway,
                          EstudianteGateway estudianteGateway, InsumoGateway insumoGateway,
                          TurnoGateway turnoGateway, PersonalCocinaGateway personalCocinaGateway,
                          ParametrosModeloGateway parametrosModeloGateway, PlanRacionGateway planRacionGateway,
                          EntregaRacionGateway entregaRacionGateway) {
        this.jornadaGateway = jornadaGateway;
        this.cursoGateway = cursoGateway;
        this.estudianteGateway = estudianteGateway;
        this.insumoGateway = insumoGateway;
        this.turnoGateway = turnoGateway;
        this.personalCocinaGateway = personalCocinaGateway;
        this.parametrosModeloGateway = parametrosModeloGateway;
        this.planRacionGateway = planRacionGateway;
        this.entregaRacionGateway = entregaRacionGateway;
    }

    @Override
    public void run(String... args) {
        ParametrosModelo parametros = parametrosModeloGateway.guardar(ParametrosModelo.porDefecto());

        Jornada manana = jornadaGateway.guardar(new Jornada(null, "Mañana"));
        Jornada tarde = jornadaGateway.guardar(new Jornada(null, "Tarde"));

        // 280 estudiantes en la mañana y 175 en la tarde = 455 (documento, seccion 3.2)
        List<long[]> cursosConMatricula = new ArrayList<>();
        int documento = 1000000;
        documento = crearCursos(manana, new String[]{"6A", "6B", "7A", "8A", "9A"},
                new int[]{56, 56, 56, 56, 56}, documento, cursosConMatricula);
        crearCursos(tarde, new String[]{"10A", "10B", "11A", "11B"},
                new int[]{44, 44, 44, 43}, documento, cursosConMatricula);

        insumoGateway.guardar(new Insumo(null, "Arroz", "kg", 80, 120, 20, 3));
        insumoGateway.guardar(new Insumo(null, "Pollo", "kg", 90, 100, 15, 2));
        insumoGateway.guardar(new Insumo(null, "Fruta", "kg", 120, 60, 10, 2));

        // 3 cocineros x 50 raciones/hora x 5 horas = 750 raciones (formula 19)
        Turno turno = turnoGateway.guardar(new Turno(null, "Mañana", 5));
        for (String cocinero : new String[]{"Rosa Pineda", "Marta Cifuentes", "Gloria Bernal"}) {
            personalCocinaGateway.guardar(new PersonalCocina(null, cocinero, 50, turno.getIdTurno()));
        }

        crearSemanaDeEjemplo(parametros, cursosConMatricula);
    }

    private int crearCursos(Jornada jornada, String[] nombres, int[] matriculas, int documento,
                            List<long[]> cursosConMatricula) {
        for (int i = 0; i < nombres.length; i++) {
            Curso curso = cursoGateway.guardar(new Curso(null, nombres[i], jornada.getIdJornada()));
            for (int j = 0; j < matriculas[i]; j++) {
                String nombre = NOMBRES[documento % NOMBRES.length] + " "
                        + APELLIDOS[(documento / NOMBRES.length) % APELLIDOS.length];
                estudianteGateway.guardar(new Estudiante(null, String.valueOf(documento), nombre, curso.getIdCurso()));
                documento++;
            }
            cursosConMatricula.add(new long[]{curso.getIdCurso(), matriculas[i]});
        }
        return documento;
    }

    private void crearSemanaDeEjemplo(ParametrosModelo parametros, List<long[]> cursosConMatricula) {
        LocalDate lunesPasado = LocalDate.now()
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .minusWeeks(1);

        for (int dia = 0; dia < ASISTENCIA_SEMANA.length; dia++) {
            LocalDate fecha = lunesPasado.plusDays(dia);
            for (int c = 0; c < cursosConMatricula.size(); c++) {
                long idCurso = cursosConMatricula.get(c)[0];
                long matricula = cursosConMatricula.get(c)[1];

                int pedido = CalculadorDemanda.calcular(matricula, ASISTENCIA_SEMANA[dia],
                        parametros.getCostoSobranteUnitario(), parametros.getCostoFaltanteUnitario(),
                        parametros.getCoeficienteVariacion()).getPedidoOptimo();

                PlanRacion plan = planRacionGateway.guardar(new PlanRacion(null, fecha, idCurso, matricula,
                        ASISTENCIA_SEMANA[dia], pedido, parametros.getCostoSobranteUnitario(),
                        parametros.getCostoFaltanteUnitario(), parametros.getCostoProduccionUnitario(),
                        parametros.getMargenSeguridadReferencia()));

                // Asistencia real = la de la tabla +-2 puntos, fija por curso y dia
                double asistenciaReal = ASISTENCIA_SEMANA[dia] + (((c + dia) % 5) - 2) / 100.0;
                int servidas = (int) Math.round(matricula * Math.min(1.0, asistenciaReal));
                entregaRacionGateway.guardar(EntregaRacion.calcularDesdeServidas(null, plan, servidas));
            }
        }
    }
}
