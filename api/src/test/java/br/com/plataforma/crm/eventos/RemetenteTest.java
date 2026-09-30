package br.com.plataforma.crm.eventos;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;

/** Contrato §9.7: toda mensagem sai com user_id igual ao usuário da conexão. */
class RemetenteTest {

    @Test
    void todaMensagemSaiComOUsuarioDaConexao() {
        Message mensagem = TopologiaMensageria.comRemetente("mq_crm").postProcessMessage(new Message(new byte[0]));

        assertThat(mensagem.getMessageProperties().getUserId()).isEqualTo("mq_crm");
    }
}
