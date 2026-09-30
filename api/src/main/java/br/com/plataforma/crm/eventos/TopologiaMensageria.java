package br.com.plataforma.crm.eventos;

import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.amqp.RabbitTemplateCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Exchanges do módulo. Regra das permissões do broker: o módulo declara só o que começa com o
 * próprio código. A exchange de outro módulo é referenciada pelo nome, nunca declarada —
 * declará-la seria recusado pelo RabbitMQ.
 */
@Configuration
public class TopologiaMensageria {

    static final String EXCHANGE_PROPRIA = "crm.eventos";
    static final String DLX = "crm.dlx";

    @Bean
    TopicExchange exchangePropria() {
        return new TopicExchange(EXCHANGE_PROPRIA, true, false);
    }

    @Bean
    DirectExchange exchangeDeMensagensComFalha() {
        return new DirectExchange(DLX, true, false);
    }

    /**
     * Toda mensagem sai com a propriedade user_id = usuário da conexão, mq_crm (Contrato §9.7).
     * O RabbitMQ confere que é mesmo quem está conectado.
     */
    @Bean
    RabbitTemplateCustomizer remetenteEmTodaMensagem(@Value("${spring.rabbitmq.username}") String usuario) {
        return template -> template.addBeforePublishPostProcessors(comRemetente(usuario));
    }

    static MessagePostProcessor comRemetente(String usuario) {
        return mensagem -> {
            mensagem.getMessageProperties().setUserId(usuario);
            return mensagem;
        };
    }

    /** JSON nos dois sentidos. O tipo vem do parâmetro do listener, não de cabeçalho Java de quem publicou. */
    @Bean
    MessageConverter conversorJson(ObjectMapper mapper) {
        Jackson2JsonMessageConverter conversor = new Jackson2JsonMessageConverter(mapper);
        conversor.setAlwaysConvertToInferredType(true);
        return conversor;
    }
}
