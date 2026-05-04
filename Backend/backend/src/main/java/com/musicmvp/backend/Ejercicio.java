package com.musicmvp.backend;

import jakarta.persistence.*;

@Entity
public class Ejercicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipo;   // ritmo o melodía
    private String nivel;  // básico, intermedio

    private String pregunta;
    private String respuestaCorrecta;
    
    @Column(length = 1000)
    private String contenido;
    
    
    private String audioUrl; // audio


    public Ejercicio() {}

    public Ejercicio(String tipo, String nivel, String contenido) {
        this.tipo = tipo;
        this.nivel = nivel;
        this.contenido = contenido;
    }

    public Long getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getNivel() {
        return nivel;
    }

    public void setNivel(String nivel) {
        this.nivel = nivel;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public String getAudioUrl() {
    return audioUrl;
}

public void setAudioUrl(String audioUrl) {
    this.audioUrl = audioUrl;
}

public String getPregunta() {
    return pregunta;
}

public void setPregunta(String pregunta) {
    this.pregunta = pregunta;
}

public String getRespuestaCorrecta() {
    return respuestaCorrecta;
}

public void setRespuestaCorrecta(String respuestaCorrecta) {
    this.respuestaCorrecta = respuestaCorrecta;
}

}