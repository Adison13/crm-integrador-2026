package br.com.plataforma.crm.api;

/** Regra de negócio violada por um campo específico da requisição; responde 400 com o campo. */
public class CampoInvalidoException extends RuntimeException {

    private final String campo;
    private final String codigo;

    public CampoInvalidoException(String campo, String codigo, String mensagem) {
        super(mensagem);
        this.campo = campo;
        this.codigo = codigo;
    }

    public String getCampo() {
        return campo;
    }

    public String getCodigo() {
        return codigo;
    }
}
