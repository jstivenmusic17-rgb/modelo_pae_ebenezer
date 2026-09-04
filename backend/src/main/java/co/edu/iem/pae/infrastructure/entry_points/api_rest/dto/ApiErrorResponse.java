package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ApiErrorResponse(
        LocalDateTime momento,
        int codigoEstado,
        String mensaje,
        List<String> detalles
) {
    public static ApiErrorResponse de(int codigoEstado, String mensaje) {
        return new ApiErrorResponse(LocalDateTime.now(), codigoEstado, mensaje, List.of());
    }

    public static ApiErrorResponse de(int codigoEstado, String mensaje, List<String> detalles) {
        return new ApiErrorResponse(LocalDateTime.now(), codigoEstado, mensaje, detalles);
    }
}
