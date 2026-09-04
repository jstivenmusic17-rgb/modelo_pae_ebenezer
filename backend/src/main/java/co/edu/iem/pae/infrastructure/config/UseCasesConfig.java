package co.edu.iem.pae.infrastructure.config;

import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.InsumoGateway;
import co.edu.iem.pae.domain.gateway.JornadaGateway;
import co.edu.iem.pae.domain.gateway.MovimientoInsumoGateway;
import co.edu.iem.pae.domain.gateway.PersonalCocinaGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.gateway.TurnoGateway;
import co.edu.iem.pae.usecases.cocina.CocinaUseCase;
import co.edu.iem.pae.usecases.curso.CursoUseCase;
import co.edu.iem.pae.usecases.entrega.EntregaRacionUseCase;
import co.edu.iem.pae.usecases.estadisticas.EstadisticasUseCase;
import co.edu.iem.pae.usecases.estudiante.EstudianteUseCase;
import co.edu.iem.pae.usecases.insumo.InsumoUseCase;
import co.edu.iem.pae.usecases.insumo.MovimientoInsumoUseCase;
import co.edu.iem.pae.usecases.jornada.JornadaUseCase;
import co.edu.iem.pae.usecases.plan.PlanRacionUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class UseCasesConfig {
    @Bean
    public PlanRacionUseCase planRacionUseCase(CursoGateway cursoGateway,
                                                EstudianteGateway estudianteGateway,
                                                PlanRacionGateway planRacionGateway) {
        return new PlanRacionUseCase(cursoGateway, estudianteGateway, planRacionGateway);
    }

    @Bean
    public EntregaRacionUseCase entregaRacionUseCase(PlanRacionGateway planRacionGateway,
                                                       EntregaRacionGateway entregaRacionGateway) {
        return new EntregaRacionUseCase(planRacionGateway, entregaRacionGateway);
    }

    @Bean
    public EstadisticasUseCase estadisticasUseCase(CursoGateway cursoGateway,
                                                     PlanRacionGateway planRacionGateway,
                                                     EntregaRacionGateway entregaRacionGateway,
                                                     EstudianteGateway estudianteGateway) {
        return new EstadisticasUseCase(cursoGateway, planRacionGateway, entregaRacionGateway, estudianteGateway);
    }

    @Bean
    public JornadaUseCase jornadaUseCase(JornadaGateway jornadaGateway, CursoGateway cursoGateway) {
        return new JornadaUseCase(jornadaGateway, cursoGateway);
    }

    @Bean
    public CursoUseCase cursoUseCase(CursoGateway cursoGateway, JornadaGateway jornadaGateway,
                                      EstudianteGateway estudianteGateway, PlanRacionGateway planRacionGateway) {
        return new CursoUseCase(cursoGateway, jornadaGateway, estudianteGateway, planRacionGateway);
    }

    @Bean
    public EstudianteUseCase estudianteUseCase(EstudianteGateway estudianteGateway, CursoGateway cursoGateway) {
        return new EstudianteUseCase(estudianteGateway, cursoGateway);
    }

    @Bean
    public InsumoUseCase insumoUseCase(InsumoGateway insumoGateway, PlanRacionGateway planRacionGateway,
                                        MovimientoInsumoGateway movimientoInsumoGateway) {
        return new InsumoUseCase(insumoGateway, planRacionGateway, movimientoInsumoGateway);
    }

    @Bean
    public MovimientoInsumoUseCase movimientoInsumoUseCase(InsumoGateway insumoGateway,
                                                             MovimientoInsumoGateway movimientoInsumoGateway,
                                                             PlanRacionGateway planRacionGateway) {
        return new MovimientoInsumoUseCase(insumoGateway, movimientoInsumoGateway, planRacionGateway);
    }

    @Bean
    public CocinaUseCase cocinaUseCase(TurnoGateway turnoGateway, PersonalCocinaGateway personalCocinaGateway) {
        return new CocinaUseCase(turnoGateway, personalCocinaGateway);
    }
}
