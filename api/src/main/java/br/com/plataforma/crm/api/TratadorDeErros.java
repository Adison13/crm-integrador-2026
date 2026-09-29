package br.com.plataforma.crm.api;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import br.com.plataforma.crm.empresa.EmpresaDuplicadaException;

/** Converte toda exceção no envelope padrão, com o código HTTP da §8.4. */
@RestControllerAdvice
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Resposta<Void>> dadosInvalidos(MethodArgumentNotValidException e) {
        List<ErroCampo> erros = e.getBindingResult().getFieldErrors().stream()
                .map(c -> new ErroCampo(c.getField(), "CAMPO_INVALIDO", c.getDefaultMessage()))
                .toList();
        return ResponseEntity.badRequest()
                .body(Resposta.falha("Não foi possível salvar: confira os campos.", erros));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<Resposta<Void>> requisicaoInvalida(Exception e) {
        return ResponseEntity.badRequest().body(Resposta.falha("Requisição inválida."));
    }

    @ExceptionHandler(NaoEncontradoException.class)
    ResponseEntity<Resposta<Void>> naoEncontrado(NaoEncontradoException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Resposta.falha(e.getMessage()));
    }

    @ExceptionHandler(EmpresaDuplicadaException.class)
    ResponseEntity<Resposta<Void>> empresaDuplicada(EmpresaDuplicadaException e) {
        ErroCampo erro = new ErroCampo("cnpj", "CNPJ_DUPLICADO", "Empresa existente: " + e.getEmpresaId());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Resposta.falha(e.getMessage(), List.of(erro)));
    }

    /** Duas gravações simultâneas com o mesmo CNPJ: a segunda esbarra no índice único do banco. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Resposta<Void>> conflitoNoBanco(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Resposta.falha("Registro em conflito com outro já existente."));
    }

    /** Lançada pelo @PreAuthorize: autenticado, mas sem a permissão exigida. */
    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<Resposta<Void>> semPermissao(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Resposta.falha("Sem permissão para esta operação."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Resposta<Void>> inesperado(Exception e) {
        if (e instanceof ErrorResponse erroDoSpring) {
            // 404 de rota inexistente, 405 de método errado e afins: já trazem o código certo
            return ResponseEntity.status(erroDoSpring.getStatusCode())
                    .body(Resposta.falha("Requisição não atendida por este endpoint."));
        }
        log.error("Erro inesperado", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Resposta.falha("Erro inesperado. Tente de novo em instantes."));
    }
}
