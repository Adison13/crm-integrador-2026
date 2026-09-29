package br.com.plataforma.exemplo.item;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ItemRepositorio extends JpaRepository<Item, UUID> {

    /**
     * Busca por id como consulta, não como findById: o filtro de tenant do Hibernate vale para
     * consultas, e assim um id de outra empresa responde "não encontrado".
     */
    @Query("select i from Item i where i.id = :id")
    Optional<Item> buscarPorId(UUID id);
}
