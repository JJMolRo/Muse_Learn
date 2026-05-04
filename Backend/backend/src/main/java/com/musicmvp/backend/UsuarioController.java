package com.musicmvp.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin("*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

@PostMapping
public ResponseEntity<?> guardarUsuario(@RequestBody Usuario usuario) {
    Optional<Usuario> existente = usuarioRepository.findByEmail(usuario.getEmail());

    if (existente.isPresent()) {
        return ResponseEntity.status(409).body(Map.of("mensaje", "El email ya está registrado"));
    }

    usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
    Usuario nuevoUsuario = usuarioRepository.save(usuario);

    return ResponseEntity.status(201).body(nuevoUsuario);
}

@PutMapping("/{id}")
public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuarioActualizado) {
    Optional<Usuario> usuarioOptional = usuarioRepository.findById(id);

    if (usuarioOptional.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("mensaje", "Usuario no encontrado"));
    }

    Optional<Usuario> existenteConEmail = usuarioRepository.findByEmail(usuarioActualizado.getEmail());

    if (existenteConEmail.isPresent() && !existenteConEmail.get().getId().equals(id)) {
        return ResponseEntity.status(409).body(Map.of("mensaje", "El email ya está registrado"));
    }

    Usuario usuario = usuarioOptional.get();
    usuario.setNombre(usuarioActualizado.getNombre());
    usuario.setEmail(usuarioActualizado.getEmail());

    if (usuarioActualizado.getPassword() != null && !usuarioActualizado.getPassword().isBlank()) {
        usuario.setPassword(passwordEncoder.encode(usuarioActualizado.getPassword()));
    }

    Usuario actualizado = usuarioRepository.save(usuario);
    return ResponseEntity.ok(actualizado);
}

@DeleteMapping("/{id}")
public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
    Optional<Usuario> usuarioOptional = usuarioRepository.findById(id);

    if (usuarioOptional.isEmpty()) {
        return ResponseEntity.status(404).body(Map.of("mensaje", "Usuario no encontrado"));
    }

    usuarioRepository.deleteById(id);
    return ResponseEntity.ok(Map.of("mensaje", "Usuario eliminado correctamente"));
}

    @PostMapping("/login")
    public Object login(@RequestBody Map<String, String> datos) {

        String email = datos.get("email");
        String password = datos.get("password");

        Optional<Usuario> usuarioOptional = usuarioRepository.findByEmail(email);

        if (usuarioOptional.isPresent()) {
            Usuario usuario = usuarioOptional.get();

            if (passwordEncoder.matches(password, usuario.getPassword())) {

                String token = jwtUtil.generarToken(usuario.getEmail());

                return Map.of(
                        "mensaje", "Login exitoso",
                        "token", token
                );

            } else {
                return Map.of("mensaje", "Contraseña incorrecta");
            }

        } else {
            return Map.of("mensaje", "Usuario no encontrado");
        }
    }
}