const API_URL = "http://192.168.20.12:8080";

let listaUsuarios = [];
let usuarioAEliminar = null;
let intervaloMetronomo = null;
let contextoAudio = null;

// TOAST
function mostrarToast(texto, tipo = "exito") {
  const toast = document.getElementById("toast");
  toast.textContent = texto;
  toast.className = "toast";
  toast.classList.add(tipo === "exito" ? "toast-exito" : "toast-error");

  setTimeout(() => {
    toast.className = "toast hidden";
  }, 2500);
}

// MENSAJES
function mostrarMensaje(texto, tipo = "exito") {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = texto;
  mensaje.className = "";
  mensaje.classList.add(tipo === "exito" ? "mensaje-exito" : "mensaje-error");
}

function limpiarMensaje() {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = "";
  mensaje.className = "hidden";
}

// LOGIN
async function login(email, password) {
  try {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const texto = await response.text();
    const data = JSON.parse(texto);

    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", email);
      mostrarToast("Login exitoso", "exito");
      cargarSesion();
    } else {
      mostrarToast(data.mensaje || "No se pudo iniciar sesión", "error");
    }
  } catch (error) {
    console.error("Error en login:", error);
    mostrarToast("Error al conectar con el backend", "error");
  }
}

function hacerLogin() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    mostrarToast("Completa email y contraseña", "error");
    return;
  }

  login(email, password);
}

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + getToken()
  };
}

// USUARIOS
async function obtenerUsuarios() {
  const token = getToken();

  if (!token) {
    mostrarMensaje("Debes iniciar sesión primero", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/usuarios`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!response.ok) {
      mostrarMensaje("Error al consultar usuarios: " + response.status, "error");
      return;
    }

    listaUsuarios = await response.json();
    renderizarUsuarios(listaUsuarios);

  } catch (error) {
    console.error("Error al consultar usuarios:", error);
    mostrarMensaje("Error al consultar usuarios", "error");
  }
}

function renderizarUsuarios(usuarios) {
  document.getElementById("totalUsuarios").textContent = usuarios.length;

  let html = "";

  if (usuarios.length === 0) {
    html = "<p>No se encontraron usuarios.</p>";
  } else {
    html = `
      <table class="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;

    usuarios.forEach(user => {
      html += `
        <tr>
          <td>${user.id}</td>
          <td>${user.nombre}</td>
          <td>${user.email}</td>
          <td>
            <button onclick="editarUsuario(${user.id}, '${escapeHtml(user.nombre)}', '${escapeHtml(user.email)}')">Editar</button>
            <button class="danger" onclick="abrirModalEliminar(${user.id})">Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  document.getElementById("resultado").innerHTML = html;
}

function filtrarUsuarios() {
  const texto = document.getElementById("buscadorUsuarios").value.toLowerCase().trim();

  const filtrados = listaUsuarios.filter(user =>
    user.nombre.toLowerCase().includes(texto) ||
    user.email.toLowerCase().includes(texto)
  );

  renderizarUsuarios(filtrados);
}

async function guardarOActualizarUsuario() {
  limpiarMensaje();

  const id = document.getElementById("usuarioId").value;
  const nombre = document.getElementById("nombreUsuario").value.trim();
  const email = document.getElementById("emailUsuario").value.trim();
  const password = document.getElementById("passwordUsuario").value.trim();

  const esEdicion = !!id;

  if (!validarFormularioUsuario(esEdicion)) {
    mostrarMensaje("Revisa los campos del formulario", "error");
    return;
  }

  const body = { nombre, email, password };

  try {
    let response;

    if (id) {
      response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
    } else {
      response = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    }

    const texto = await response.text();

    let data = {};
    try {
      data = JSON.parse(texto);
    } catch (e) {
      data = {};
    }

    if (response.status === 409) {
      mostrarMensaje(data.mensaje || "El email ya está registrado", "error");
      return;
    }

    if (response.status === 404) {
      mostrarMensaje(data.mensaje || "Usuario no encontrado", "error");
      return;
    }

    if (response.status === 201) {
      mostrarMensaje("Usuario creado", "exito");
      mostrarToast("Usuario creado", "exito");
      limpiarFormulario();
      activarModoCrear();
      obtenerUsuarios();
      return;
    }

    if (response.status === 200) {
      mostrarMensaje("Usuario actualizado", "exito");
      mostrarToast("Usuario actualizado", "exito");
      limpiarFormulario();
      activarModoCrear();
      obtenerUsuarios();
      return;
    }

    mostrarMensaje(`No se pudo guardar/actualizar. Código: ${response.status}`, "error");

  } catch (error) {
    console.error("Error al guardar/actualizar:", error);
    mostrarMensaje("Error al guardar/actualizar", "error");
  }
}

function editarUsuario(id, nombre, email) {
  limpiarMensaje();
  document.getElementById("usuarioId").value = id;
  document.getElementById("nombreUsuario").value = nombre;
  document.getElementById("emailUsuario").value = email;
  document.getElementById("passwordUsuario").value = "";
  activarModoEditar();
  mostrarToast("Modo edición activado", "exito");
}

function abrirModalEliminar(id) {
  usuarioAEliminar = id;
  document.getElementById("modalEliminar").classList.remove("hidden");
}

function cerrarModalEliminar() {
  usuarioAEliminar = null;
  document.getElementById("modalEliminar").classList.add("hidden");
}

function confirmarEliminar() {
  if (usuarioAEliminar !== null) {
    eliminarUsuario(usuarioAEliminar);
  }
}

async function eliminarUsuario(id) {
  limpiarMensaje();
  mostrarMensaje("Eliminando usuario...", "exito");

  try {
    const response = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + getToken()
      }
    });

    const texto = await response.text();

    let data = {};
    try {
      data = JSON.parse(texto);
    } catch (e) {
      data = {};
    }

    if (response.status === 404) {
      mostrarMensaje(data.mensaje || "Usuario no encontrado", "error");
      mostrarToast(data.mensaje || "Usuario no encontrado", "error");
      cerrarModalEliminar();
      return;
    }

    if (response.status === 200) {
      mostrarMensaje(data.mensaje || "Usuario eliminado correctamente", "exito");
      mostrarToast(data.mensaje || "Usuario eliminado correctamente", "exito");
      cerrarModalEliminar();
      obtenerUsuarios();
      return;
    }

    mostrarMensaje(`Error al eliminar (${response.status})`, "error");
    cerrarModalEliminar();

  } catch (error) {
    console.error("Error al eliminar:", error);
    mostrarMensaje("Error al conectar con el backend", "error");
    cerrarModalEliminar();
  }
}

function limpiarFormulario() {
  document.getElementById("usuarioId").value = "";
  document.getElementById("nombreUsuario").value = "";
  document.getElementById("emailUsuario").value = "";
  document.getElementById("passwordUsuario").value = "";
  limpiarErroresFormulario();
}

function activarModoCrear() {
  document.getElementById("tituloFormulario").textContent = "Crear usuario";
  document.getElementById("btnGuardar").textContent = "Crear usuario";
  document.getElementById("btnCancelarEdicion").classList.add("hidden");
}

function activarModoEditar() {
  document.getElementById("tituloFormulario").textContent = "Editar usuario";
  document.getElementById("btnGuardar").textContent = "Actualizar usuario";
  document.getElementById("btnCancelarEdicion").classList.remove("hidden");
}

function cancelarEdicion() {
  limpiarFormulario();
  activarModoCrear();
  mostrarToast("Edición cancelada", "exito");
}

// VALIDACIONES
function limpiarErroresFormulario() {
  const campos = ["nombreUsuario", "emailUsuario", "passwordUsuario"];

  campos.forEach(id => {
    const input = document.getElementById(id);
    input.classList.remove("input-error");
    input.classList.remove("input-ok");
  });
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarFormularioUsuario(esEdicion = false) {
  limpiarErroresFormulario();

  const nombre = document.getElementById("nombreUsuario");
  const email = document.getElementById("emailUsuario");
  const password = document.getElementById("passwordUsuario");

  let valido = true;

  if (!nombre.value.trim()) {
    nombre.classList.add("input-error");
    valido = false;
  } else {
    nombre.classList.add("input-ok");
  }

  if (!email.value.trim() || !validarEmail(email.value.trim())) {
    email.classList.add("input-error");
    valido = false;
  } else {
    email.classList.add("input-ok");
  }

  if (!esEdicion && !password.value.trim()) {
    password.classList.add("input-error");
    valido = false;
  } else if (password.value.trim()) {
    password.classList.add("input-ok");
  }

  return valido;
}

// EJERCICIOS
async function obtenerEjercicios() {
  try {
    const nivel = document.getElementById("nivelEjercicio").value;

    let url = `${API_URL}/ejercicios`;

    if (nivel) {
      url = `${API_URL}/ejercicios/nivel/${nivel}`;
    }

    const response = await fetch(url, {
      method: "GET"
    });

    if (!response.ok) {
      console.log("Error ejercicios status:", response.status);
      mostrarToast("Error al cargar ejercicios: " + response.status, "error");
      return;
    }

    const ejercicios = await response.json();

    renderizarEjercicios(ejercicios);

  } catch (error) {
    console.error("Error al obtener ejercicios:", error);
    mostrarToast("Error al conectar con ejercicios", "error");
  }
}

function generarPreguntaPorDefecto(ejercicio) {
  if (ejercicio.tipo === "grado") {
    return "Escribe las notas del grado solicitado.";
  }

  if (ejercicio.tipo === "audio") {
    return "Escucha el audio y escribe la respuesta.";
  }

  if (ejercicio.tipo === "ritmo") {
    return "Practica el siguiente patrón rítmico.";
  }

  return ejercicio.contenido || "Resuelve el ejercicio.";
}

function renderizarRitmo(contenido) {
  if (!contenido || !contenido.includes(":")) {
    return `
      <div style="margin-top:10px; padding:10px; background:#111; border-radius:8px;">
        <p style="color:#00ff88; font-size:18px;">${escapeHtml(contenido || "Sin patrón rítmico")}</p>
      </div>
    `;
  }

  const partes = contenido.split("|");

  let html = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">`;

  partes.forEach(parte => {
    if (!parte.includes(":")) return;

    const [figura, notas] = parte.split(":");

    html += `
      <div style="
        background:#111;
        padding:10px;
        border-radius:10px;
        min-width:120px;
        text-align:center;
        border:1px solid #333;
      ">
        <strong style="color:#00ff88;">${escapeHtml(figura.trim())}</strong>
        <p style="margin-top:5px;">${escapeHtml((notas || "").trim())}</p>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

async function evaluarEjercicio(id) {
  const input = document.getElementById(`respuesta-${id}`);
  const feedback = document.getElementById(`feedback-${id}`);

  if (!input || !feedback) {
    mostrarToast("Este ejercicio es de práctica y no requiere respuesta", "error");
    return;
  }

  const respuestaUsuario = input.value.trim();

  if (!respuestaUsuario) {
    feedback.innerHTML = `<p style="color:#ff9b9b;">Debes escribir una respuesta.</p>`;
    return;
  }

  try {
    const response = await fetch(`${API_URL}/ejercicios`);
    const ejercicios = await response.json();
    const ejercicio = ejercicios.find(e => e.id === id);

    if (!ejercicio) {
      mostrarToast("No se encontró el ejercicio", "error");
      return;
    }

    const respuestaCorrecta = (ejercicio.respuestaCorrecta || ejercicio.contenido || "").trim();

    const correcto = normalizarRespuesta(respuestaUsuario) === normalizarRespuesta(respuestaCorrecta);

  if (correcto) {
  feedback.innerHTML = `
    <div style="margin-top:10px; padding:12px; background:#103a22; border-radius:10px;">
      <strong style="color:#7CFFB2;">Correcto</strong>
      <p style="color:#cfcfcf;">Muy bien. La respuesta coincide con el ejercicio.</p>
    </div>
  `;
  mostrarToast("Respuesta correcta", "exito");
} else {
  feedback.innerHTML = `
    <div style="margin-top:10px; padding:12px; background:#2a1111; border-left:4px solid #ff4d4d; border-radius:10px;">
      <strong style="color:#ff9b9b;">Incorrecto, pero vas bien.</strong>
      <p style="color:#ddd;">Respuesta correcta: <b>${escapeHtml(respuestaCorrecta)}</b></p>
      <p style="color:#bbb;">${generarExplicacionEjercicio(ejercicio, respuestaCorrecta)}</p>
    </div>
  `;
  mostrarToast("Respuesta incorrecta", "error");
}

    await guardarResultadoEjercicio(id, respuestaUsuario, correcto);

  } catch (error) {
    console.error("Error al evaluar ejercicio:", error);
    mostrarToast("Error al evaluar ejercicio", "error");
  }
}

function normalizarRespuesta(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .replace(/,/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function guardarResultadoEjercicio(ejercicioId, respuestaUsuario, correcto) {
  try {
    const email = localStorage.getItem("email");

    const response = await fetch(`${API_URL}/resultados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ejercicioId,
        respuestaUsuario,
        correcto,
        usuarioEmail: email
      })
    });

    if (!response.ok) {
      mostrarToast("Error al guardar resultado", "error");
      return;
    }

    console.log("Resultado guardado correctamente");

  } catch (error) {
    console.error("Error al guardar resultado:", error);
    mostrarToast("Error al guardar resultado", "error");
  }
}

// RESULTADOS
async function obtenerResultados() {
  try {
    const email = localStorage.getItem("email");

    if (!email) {
      mostrarToast("Debes iniciar sesión para ver resultados", "error");
      return;
    }

    const response = await fetch(`${API_URL}/resultados/usuario/${encodeURIComponent(email)}`, {
      method: "GET"
    });

    if (!response.ok) {
      mostrarToast("Error al cargar resultados", "error");
      return;
    }

    const resultados = await response.json();

    actualizarEstadisticas(resultados);
    actualizarProgresoPorNivel(resultados);

    const nivelRecomendado = recomendarNivel(resultados);
    document.getElementById("nivelRecomendado").textContent = nivelRecomendado;

    renderizarTablaResultados(resultados);

    const progreso = generarHistorialProgreso(resultados);
    renderizarProgreso(progreso);

  } catch (error) {
    console.error("Error al obtener resultados:", error);
    mostrarToast("Error al conectar con resultados", "error");
  }
}

function renderizarTablaResultados(resultados) {
  let html = "";

  if (resultados.length === 0) {
    html = "<p>No hay resultados guardados.</p>";
  } else {
    html = `
      <table class="tabla-usuarios">
        <thead>
          <tr>
            <th>ID</th>
            <th>Ejercicio</th>
            <th>Respuesta</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
    `;

    resultados.forEach(resultado => {
      html += `
        <tr>
          <td>${resultado.id}</td>
          <td>${resultado.ejercicioId}</td>
          <td>${escapeHtml(resultado.respuestaUsuario || "")}</td>
          <td>${resultado.correcto ? "Correcto" : "Incorrecto"}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  document.getElementById("listaResultados").innerHTML = html;
}

function actualizarEstadisticas(resultados) {
  const total = resultados.length;
  const correctas = resultados.filter(r => r.correcto).length;
  const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

  document.getElementById("totalResultados").textContent = total;
  document.getElementById("totalCorrectas").textContent = correctas;
  document.getElementById("porcentajeAcierto").textContent = porcentaje + "%";
}

function recomendarNivel(resultados) {
  const total = resultados.length;

  if (total === 0) return "basico";

  const correctas = resultados.filter(r => r.correcto).length;
  const porcentaje = Math.round((correctas / total) * 100);

  if (porcentaje < 60) return "basico";
  if (porcentaje < 85) return "intermedio";

  return "avanzado";
}

function cargarNivelRecomendado() {
  const nivel = document.getElementById("nivelRecomendado").textContent;

  document.getElementById("nivelEjercicio").value = nivel;
  obtenerEjercicios();

  mostrarToast("Cargando ejercicios de nivel " + nivel, "exito");
}

function generarHistorialProgreso(resultados) {
  let total = 0;
  let correctas = 0;
  let progreso = [];

  resultados.forEach((resultado, index) => {
    total++;

    if (resultado.correcto) {
      correctas++;
    }

    const porcentaje = Math.round((correctas / total) * 100);

    progreso.push({
      intento: index + 1,
      porcentaje
    });
  });

  return progreso;
}

function renderizarProgreso(progreso) {
  const contenedor = document.getElementById("progresoUsuario");

  if (!contenedor) return;

  let html = "<h3>Progreso del usuario</h3>";

  if (progreso.length === 0) {
    html += "<p>No hay progreso registrado.</p>";
  } else {
    progreso.forEach(p => {
      html += `
        <div style="margin: 10px 0;">
          <span>Intento ${p.intento}: ${p.porcentaje}%</span>
          <div style="background:#333; border-radius:8px; overflow:hidden; margin-top:5px;">
            <div style="width:${p.porcentaje}%; background:#00ff88; padding:5px 0;"></div>
          </div>
        </div>
      `;
    });
  }

  contenedor.innerHTML = html;
}

// METRÓNOMO
function iniciarMetronomo() {
  const bpm = parseInt(document.getElementById("bpm").value);

  if (!bpm || bpm < 40 || bpm > 200) {
    mostrarToast("BPM inválido", "error");
    return;
  }

  detenerMetronomo();

  const intervalo = 60000 / bpm;

  contextoAudio = new (window.AudioContext || window.webkitAudioContext)();

  intervaloMetronomo = setInterval(() => {
    reproducirClick();
  }, intervalo);

  document.getElementById("estadoMetronomo").textContent = `Sonando a ${bpm} BPM`;
}

function detenerMetronomo() {
  if (intervaloMetronomo) {
    clearInterval(intervaloMetronomo);
    intervaloMetronomo = null;
  }

  const estado = document.getElementById("estadoMetronomo");
  if (estado) estado.textContent = "Detenido";
}

function reproducirClick() {
  if (!contextoAudio) return;

  const osc = contextoAudio.createOscillator();
  const gain = contextoAudio.createGain();

  osc.connect(gain);
  gain.connect(contextoAudio.destination);

  osc.frequency.value = 1000;
  gain.gain.value = 0.2;

  osc.start();
  osc.stop(contextoAudio.currentTime + 0.05);
}

// SESIÓN
function logout() {
  localStorage.clear();
  location.reload();
}

// CARGAR SESIÓN
function cargarSesion() {
  const token = localStorage.getItem("token");

  if (token) {
    document.getElementById("landingPage").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");

    const email = localStorage.getItem("email");
    document.getElementById("usuarioLogeado").textContent = email;

    mostrarSeccion("rutaSection");
    obtenerUsuarios();
  }
}

// UTILIDAD
function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// MOSTRAR SECCIÓN
function mostrarSeccion(idSeccion) {
  const secciones = document.querySelectorAll(".app-section");

  secciones.forEach(seccion => {
    seccion.classList.add("hidden");
  });

  document.getElementById(idSeccion).classList.remove("hidden");
}

// MOSTRAR PISTA
async function mostrarPista(id) {
  try {
    const response = await fetch(`${API_URL}/ejercicios`);
    const ejercicios = await response.json();

    const ejercicio = ejercicios.find(e => e.id === id);
    const pistaDiv = document.getElementById(`pista-${id}`);

    if (!ejercicio || !pistaDiv) {
      mostrarToast("No se pudo cargar la pista", "error");
      return;
    }

    let pista = "Lee el ejercicio con calma y observa qué te está pidiendo.";

    if (ejercicio.tipo === "grado") {
      pista = "Recuerda: un grado en una escala se forma tomando una nota base y saltando una nota entre cada una. Ejemplo: Do - Mi - Sol.";
    }

    if (ejercicio.tipo === "acordes") {
      pista = "Observa la progresión como una secuencia. No pienses nota por nota, sino en el orden de los acordes.";
    }

    if (ejercicio.tipo === "audio") {
      pista = "Escucha varias veces el audio. Primero identifica si las notas suben, bajan o se mantienen cercanas.";
    }

    pistaDiv.innerHTML = `
      <div style="margin-top:10px; padding:12px; background:#111; border-left:4px solid #d4af37; border-radius:10px;">
        <strong style="color:#d4af37;">Pista:</strong>
        <p style="color:#ccc;">${pista}</p>
      </div>
    `;

  } catch (error) {
    console.error("Error al mostrar pista:", error);
    mostrarToast("Error al mostrar pista", "error");
  }
}


function generarExplicacionEjercicio(ejercicio, respuestaCorrecta) {
  if (ejercicio.tipo === "grado") {
    return "En los grados de una escala, se forman acordes tomando una nota base y saltando una nota entre cada sonido. Por eso la respuesta se organiza como una triada.";
  }

  if (ejercicio.tipo === "acordes") {
    return "Una progresión de acordes es una secuencia armónica. Lo importante es respetar el orden exacto de los acordes.";
  }

  if (ejercicio.tipo === "audio") {
    return "En los ejercicios de audio, escucha varias veces e intenta reconocer si la melodía sube, baja o mantiene un patrón cercano.";
  }

  return "Revisa el enunciado, compara tu respuesta con la correcta y vuelve a intentarlo.";
}


async function actualizarProgresoPorNivel(resultados) {
  try {
    const response = await fetch(`${API_URL}/ejercicios`);
    const ejercicios = await response.json();

    const progreso = {
      basico: { total: 0, correctas: 0 },
      intermedio: { total: 0, correctas: 0 },
      avanzado: { total: 0, correctas: 0 }
    };

    resultados.forEach(resultado => {
      const ejercicio = ejercicios.find(e => e.id === resultado.ejercicioId);

      if (!ejercicio || !ejercicio.nivel) return;

      const nivel = ejercicio.nivel.toLowerCase();

      if (!progreso[nivel]) return;

      progreso[nivel].total++;

      if (resultado.correcto) {
        progreso[nivel].correctas++;
      }
    });

    actualizarTextoProgreso("progresoBasico", progreso.basico);
    actualizarTextoProgreso("progresoIntermedio", progreso.intermedio);
    actualizarTextoProgreso("progresoAvanzado", progreso.avanzado);

  } catch (error) {
    console.error("Error al actualizar progreso por nivel:", error);
  }
}

function actualizarTextoProgreso(idElemento, datos) {
  const total = datos.total;
  const correctas = datos.correctas;
  const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;

  document.getElementById(idElemento).textContent = porcentaje + "%";
}


async function cargarNivelRuta(tipo) {

  mostrarSeccion("ejerciciosSection");

  try {

    const response =
      await fetch(`${API_URL}/ejercicios`);

    const ejercicios =
      await response.json();

    const ejerciciosFiltrados =
      ejercicios.filter(e => e.tipo === tipo);

    renderizarEjercicios(ejerciciosFiltrados);

  } catch(error) {

    console.error(error);

    mostrarToast(
      "Error al cargar ejercicios",
      "error"
    );
  }
}


function renderizarEjercicios(ejercicios) {
  const lista = document.getElementById("listaEjercicios");

  lista.innerHTML = "";

  if (ejercicios.length === 0) {
    lista.innerHTML = "<p>No hay ejercicios disponibles.</p>";
    return;
  }

  ejercicios.forEach(ejercicio => {
    lista.innerHTML += `
      <div class="ejercicio-card">
        <strong style="color:#d4af37; font-size:20px;">
          ${escapeHtml(ejercicio.pregunta || "Ejercicio")}
        </strong>

        ${
          ejercicio.tipo === "ritmo"
            ? `
              <p style="color:#d4af37;">🎵 Practica este patrón con metrónomo</p>
              ${renderizarRitmo(ejercicio.contenido || "")}
            `
            : ejercicio.tipo === "acordes"
              ? `
                <p style="color:#d4af37;">🎸 Practica esta progresión con metrónomo</p>
                ${renderizarAcordes(ejercicio.contenido || "")}
              `
              : `
                <p>${escapeHtml(ejercicio.contenido || "")}</p>

                ${ejercicio.audioUrl ? `
                  <audio controls style="width:100%; margin-top:14px;">
                    <source src="${escapeHtml(ejercicio.audioUrl)}" type="audio/mpeg">
                  </audio>
                ` : ""}

                <input id="respuesta-${ejercicio.id}" placeholder="Escribe tu respuesta">

                <button onclick="evaluarEjercicio(${ejercicio.id})">Responder</button>

                <button class="secondary" onclick="mostrarPista(${ejercicio.id})">No entiendo</button>
              `
        }

        <div id="pista-${ejercicio.id}"></div>
        <div id="feedback-${ejercicio.id}"></div>
      </div>
    `;
  });
}


function renderizarAcordes(contenido) {
  if (!contenido || !contenido.includes(":")) {
    return `
      <div style="margin-top:10px; padding:10px; background:#111; border-radius:8px;">
        <p style="color:#d4af37;">${escapeHtml(contenido || "Sin acordes")}</p>
      </div>
    `;
  }

  const partes = contenido.split("|");

  let html = `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">`;

  partes.forEach(parte => {
    if (!parte.includes(":")) return;

    const [acorde, notas] = parte.split(":");

    html += `
      <div style="
        background:#111;
        padding:14px;
        border-radius:12px;
        min-width:150px;
        text-align:center;
        border:1px solid rgba(212,175,55,0.25);
      ">
        <strong style="color:#d4af37;">${escapeHtml(acorde.trim())}</strong>
        <p style="margin-top:8px; color:#ddd;">${escapeHtml((notas || "").trim())}</p>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

activarModoCrear();
cargarSesion();