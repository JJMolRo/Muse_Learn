package com.musicmvp.backend;

import jakarta.persistence.*;

@Entity
public class ResultadoEjercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ejercicioId;
    private String respuestaUsuario;
    private boolean correcto;

    private String usuarioEmail;

    public ResultadoEjercicio() {
    }

    public ResultadoEjercicio(Long ejercicioId, String respuestaUsuario, boolean correcto) {
        this.ejercicioId = ejercicioId;
        this.respuestaUsuario = respuestaUsuario;
        this.correcto = correcto;
    }

    public Long getId() {
        return id;
    }

    public Long getEjercicioId() {
        return ejercicioId;
    }

    public void setEjercicioId(Long ejercicioId) {
        this.ejercicioId = ejercicioId;
    }

    public String getRespuestaUsuario() {
        return respuestaUsuario;
    }

    public void setRespuestaUsuario(String respuestaUsuario) {
        this.respuestaUsuario = respuestaUsuario;
    }

    public boolean isCorrecto() {
        return correcto;
    }

    public void setCorrecto(boolean correcto) {
        this.correcto = correcto;
    }

    public String getUsuarioEmail() {
    return usuarioEmail;
}

public void setUsuarioEmail(String usuarioEmail) {
    this.usuarioEmail = usuarioEmail;
}
} 
