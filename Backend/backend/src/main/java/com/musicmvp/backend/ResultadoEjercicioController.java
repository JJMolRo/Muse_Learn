package com.musicmvp.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/resultados")
@CrossOrigin("*")
public class ResultadoEjercicioController {

    @Autowired
    private ResultadoEjercicioRepository resultadoRepository;

    // 🔹 Obtener todos (general)
    @GetMapping
    public List<ResultadoEjercicio> obtenerResultados() {
        return resultadoRepository.findAll();
    }

    // 🔹 Obtener por usuario (NUEVO)
    @GetMapping("/usuario/{email}")
    public List<ResultadoEjercicio> obtenerResultadosPorUsuario(@PathVariable String email) {
        return resultadoRepository.findByUsuarioEmail(email);
    }

    // 🔹 Guardar resultado
    @PostMapping
    public ResultadoEjercicio guardarResultado(@RequestBody ResultadoEjercicio resultado) {
        return resultadoRepository.save(resultado);
    }
}
