package com.musicmvp.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ResultadoEjercicioRepository extends JpaRepository<ResultadoEjercicio, Long> {

    List<ResultadoEjercicio> findByUsuarioEmail(String usuarioEmail);
}