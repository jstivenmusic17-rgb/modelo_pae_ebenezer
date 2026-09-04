package co.edu.iem.pae.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI paeOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("PAE Backend - I.E.M. Ciudad Ebenezer")
                        .description("Sistema de Gestion y Planificacion del Programa de Alimentacion Escolar (PAE). "
                                + "Calcula la demanda estimada de raciones (modelo del vendedor de periodicos) "
                                + "para minimizar costos por sobrantes y faltantes.")
                        .version("1.0.0")
                        .contact(new Contact().name("I.E.M. Ciudad Ebenezer")));
    }
}
