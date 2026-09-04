package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ApiErrorResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Pattern LLAVE_DUPLICADA = Pattern.compile("\\(([a-z_]+)\\)=\\(");

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiErrorResponse> manejarRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiErrorResponse.de(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> manejarArgumentoInvalido(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.de(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    // Llave duplicada, columna obligatoria nula, referencia a un registro que
    // no existe, etc. Se traduce a un mensaje legible en vez de dejar pasar
    // el error crudo de PostgreSQL (nombre de restricción, sentencia SQL).
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> manejarIntegridadDeDatos(DataIntegrityViolationException ex) {
        String campoDuplicado = campoDuplicadoDe(ex);
        String mensaje = campoDuplicado != null
                ? "Ya existe un registro con ese " + campoDuplicado.replace("_", " ") + "."
                : "El registro no se pudo guardar porque entra en conflicto con datos ya existentes.";

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiErrorResponse.de(HttpStatus.CONFLICT.value(), mensaje));
    }

    private String campoDuplicadoDe(Throwable ex) {
        Throwable raiz = ex;
        while (raiz.getCause() != null && raiz.getCause() != raiz) {
            raiz = raiz.getCause();
        }
        String detalle = raiz.getMessage() == null ? "" : raiz.getMessage();
        Matcher coincidencia = LLAVE_DUPLICADA.matcher(detalle);
        return coincidencia.find() ? coincidencia.group(1) : null;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> manejarValidacion(MethodArgumentNotValidException ex) {
        List<String> detalles = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .toList();

        // El mensaje principal muestra el primer detalle (el error mas relevante
        // para el usuario), y "detalles" trae la lista completa por si hay mas
        // de un campo invalido a la vez.
        String mensajePrincipal = detalles.isEmpty() ? "Datos de entrada invalidos" : detalles.get(0);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiErrorResponse.de(HttpStatus.BAD_REQUEST.value(), mensajePrincipal, detalles));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> manejarErrorGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiErrorResponse.de(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Error interno: " + ex.getMessage()));
    }
}
