package br.com.plataforma.crm.api;

/** Detalhe de um erro, campo a campo, dentro do envelope. */
public record ErroCampo(String campo, String codigo, String detalhe) {
}
