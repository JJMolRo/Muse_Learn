package com.musicmvp.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EjercicioRepository extends JpaRepository<Ejercicio, Long> {

    List<Ejercicio> findByTipo(String tipo);

    List<Ejercicio> findByNivel(String nivel);
}