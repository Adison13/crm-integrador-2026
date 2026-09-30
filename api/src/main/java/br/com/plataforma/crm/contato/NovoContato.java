package br.com.plataforma.crm.contato;

import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Corpo da criação e da edição de contato (Contrato: NovoContato). */
public record NovoContato(
        @NotNull(message = "Informe a empresa do contato.")
        UUID empresaId,

        @NotBlank(message = "Informe o nome.")
        @Size(max = 255, message = "O nome pode ter até 255 caracteres.")
        String nome,

        @Size(max = 100, message = "O cargo pode ter até 100 caracteres.")
        String cargo,

        @Email(message = "Informe um e-mail válido.")
        @Size(max = 255, message = "O e-mail pode ter até 255 caracteres.")
        String email,

        @Size(max = 20, message = "O telefone pode ter até 20 caracteres.")
        String telefone,

        @Pattern(regexp = "decisor|influenciador|tecnico|financeiro|proprietario|outro",
                message = "Papel deve ser decisor, influenciador, tecnico, financeiro, proprietario ou outro.")
        String papel,

        @Pattern(regexp = "concedido|pendente|revogado",
                message = "Consentimento LGPD deve ser concedido, pendente ou revogado.")
        String consentimentoLgpd,

        @Pattern(regexp = "telefone|whatsapp|email",
                message = "Preferência de comunicação deve ser telefone, whatsapp ou email.")
        String preferenciaComunicacao,

        @Size(max = 30, message = "A origem pode ter até 30 caracteres.")
        String origem,

        @Size(max = 100, message = "O identificador de origem pode ter até 100 caracteres.")
        String origemModuloId,

        @Size(max = 100) String utmSource,
        @Size(max = 100) String utmMedium,
        @Size(max = 100) String utmCampaign) {
}
