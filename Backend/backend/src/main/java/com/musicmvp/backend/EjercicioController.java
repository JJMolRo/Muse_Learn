package com.musicmvp.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ejercicios")
@CrossOrigin("*")
public class EjercicioController {

    @Autowired
    private EjercicioRepository ejercicioRepository;

    @GetMapping
    public List<Ejercicio> obtenerEjercicios() {
        return ejercicioRepository.findAll();
    }

    @PostMapping
    public Ejercicio crearEjercicio(@RequestBody Ejercicio ejercicio) {
        return ejercicioRepository.save(ejercicio);
    }

    @GetMapping("/tipo/{tipo}")
    public List<Ejercicio> obtenerPorTipo(@PathVariable String tipo) {
        return ejercicioRepository.findByTipo(tipo);
    }

    @GetMapping("/nivel/{nivel}")
    public List<Ejercicio> obtenerPorNivel(@PathVariable String nivel) {
        return ejercicioRepository.findByNivel(nivel);
    }
}
