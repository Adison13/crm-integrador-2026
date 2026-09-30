package br.com.plataforma.crm.funil;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotEmpty;

public record OrdemEtapas(
        @NotEmpty(message = "Informe as etapas na nova ordem.")
        List<UUID> etapaIds) {
}
