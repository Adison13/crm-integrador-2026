package br.com.plataforma.crm.api;

import java.util.Locale;

/** Monta o padrão do LIKE: % e _ digitados valem como texto, não como curinga. */
public final class Termos {

    private Termos() {
    }

    public static String padraoLike(String termo) {
        String escapado = termo.strip().toLowerCase(Locale.ROOT)
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escapado + "%";
    }
}
