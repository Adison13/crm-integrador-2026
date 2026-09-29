package br.com.plataforma.crm.eventos;

import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Exchanges e filas do módulo. Regra das permissões do broker: o módulo declara só o que começa
 * com o próprio código. A exchange de outro módulo é referenciada pelo nome, nunca declarada —
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

    /** JSON nos dois sentidos. O tipo vem do parâmetro do listener, não de cabeçalho Java de quem publicou. */
    @Bean
    MessageConverter conversorJson(ObjectMapper mapper) {
        Jackson2JsonMessageConverter conversor = new Jackson2JsonMessageConverter(mapper);
        conversor.setAlwaysConvertToInferredType(true);
        return conversor;
    }
}
