package br.com.plataforma.crm.api;

/** A operação conflita com o estado atual do registro; responde 409 com o código da regra. */
public class ConflitoException extends RuntimeException {

    private final String codigo;
    private final String detalhe;

    public ConflitoException(String codigo, String mensagem, String detalhe) {
        super(mensagem);
        this.codigo = codigo;
        this.detalhe = detalhe;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getDetalhe() {
        return detalhe;
    }
}
