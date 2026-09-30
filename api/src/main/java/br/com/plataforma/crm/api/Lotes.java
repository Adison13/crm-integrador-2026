package br.com.plataforma.crm.api;

import java.util.List;

/** Limite das consultas em lote (Contrato §9.4). */
public final class Lotes {

    public static final int MAXIMO = 100;

    private Lotes() {
    }

    public static <T> List<T> validar(List<T> ids) {
        if (ids.size() > MAXIMO) {
            throw new CampoInvalidoException("ids", "LIMITE_EXCEDIDO", "Informe no máximo " + MAXIMO + " ids por chamada.");
        }
        return ids;
    }
}
