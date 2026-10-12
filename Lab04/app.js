// app.js - Gestor de Tareas Universitarias
// Laboratorio 04 - Introducción al Desarrollo Web

// 1: Estado global y estructura de datos
let tareas = []; // arreglo de objetos { id, titulo, curso, fechaEntrega, completada }
let filtroActual = 'todas';

const generarId = () =>
  tareas.length ? Math.max(...tareas.map(t => t.id)) + 1 : 1;

const crearTarea = ({ titulo, curso, fechaEntrega }) => ({
  id: generarId(),
  titulo: titulo.trim(),
  curso: curso.trim(),
  fechaEntrega,
  completada: false
});

const agregarTarea = (datos) => {
  const nueva = crearTarea(datos);
  tareas.push(nueva);
  return nueva;
};

const buscarTarea = (id) => tareas.find(t => t.id === id);

const alternarEstado = (id) => {
  tareas = tareas.map(t =>
    t.id === id ? { ...t, completada: !t.completada } : t
  );
};

const eliminarTarea = (id) => {
  tareas = tareas.filter(t => t.id !== id);
};

const obtenerTareasFiltradas = () => {
  switch (filtroActual) {
    case 'pendientes':  return tareas.filter(t => !t.completada);
    case 'completadas': return tareas.filter(t => t.completada);
    default:            return tareas;
  }
};

const obtenerEstadisticas = () =>
  tareas.reduce(
    (acc, t) => {
      acc.total++;
      t.completada ? acc.completadas++ : acc.pendientes++;
      return acc;
    },
    { total: 0, completadas: 0, pendientes: 0 }
  );

// 2: Captura y validación con JavaScript
// Selectores del DOM
const formulario = document.querySelector('#tarea-form');
const inputTitulo = document.querySelector('#titulo');
const inputCurso = document.querySelector('#curso');
const inputFecha = document.querySelector('#fecha');
const contenedorAlertas = document.querySelector('#alertas');

// Alertas dinamicas
const mostrarAlertas = (mensajes) => {
  contenedorAlertas.innerHTML = '';
  mensajes.forEach(mensaje => {
    const div = document.createElement('div');
    div.className = 'alert alert-danger py-2';
    div.textContent = mensaje;
    contenedorAlertas.appendChild(div);
  });
};

const limpiarAlertas = () => { contenedorAlertas.innerHTML = ''; };

// Validacion
const parsearFechaLocal = (cadena) => {
  const [anio, mes, dia] = cadena.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};

const validarDatos = ({ titulo, curso, fechaEntrega }) => {
  const errores = [];

  if (!titulo.trim()) errores.push('El título es obligatorio.');
  if (!curso.trim())  errores.push('El curso es obligatorio.');

  if (!fechaEntrega) {
    errores.push('La fecha de entrega es obligatoria.');
  } 
  else {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);               
    if (parsearFechaLocal(fechaEntrega) <= hoy) {
      errores.push('La fecha de entrega debe ser posterior a la fecha actual.');
    }
  }

  return errores;
};

// Evento submit
formulario.addEventListener('submit', (e) => {
  e.preventDefault(); // evita que la página se recargue

  const datos = {
    titulo: inputTitulo.value,
    curso: inputCurso.value,
    fechaEntrega: inputFecha.value
  };
   const errores = validarDatos(datos);

  if (errores.length > 0) {
    mostrarAlertas(errores);
    return; // no se agrega la tarea
  }

  limpiarAlertas();
  agregarTarea(datos);  
  formulario.reset();
  inputTitulo.focus();
  guardarTareas();
  renderizarTareas();
}); 

// 3: Manipulacion dinamica del DOM
const listaTareas = document.querySelector('#lista-tareas');
const contenedorFiltros = document.querySelector('#filtros');
const textoEstadisticas = document.querySelector('#estadisticas');

const formatearFecha = (cadena) =>
  parsearFechaLocal(cadena).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const crearElementoTarea = ({ id, titulo, curso, fechaEntrega, completada }) => {
  const li = document.createElement('li');
  li.className = 'list-group-item d-flex justify-content-between align-items-center';
  li.dataset.id = id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'form-check-input me-3';
  checkbox.checked = completada;
  checkbox.dataset.accion = 'alternar';

  const info = document.createElement('div');
  info.className = 'flex-grow-1';

  const spanTitulo = document.createElement('strong');
  spanTitulo.textContent = titulo;
  // Se quitan clases CSS según el estado (tachado)
  spanTitulo.classList.toggle('text-decoration-line-through', completada);
  spanTitulo.classList.toggle('text-muted', completada);

  const detalle = document.createElement('small');
  detalle.className = 'd-block text-muted';
  detalle.textContent = `${curso} · Entrega: ${formatearFecha(fechaEntrega)}`;
 
  info.append(spanTitulo, detalle);

  // Botón eliminar
  const btnEliminar = document.createElement('button');
  btnEliminar.type = 'button';
  btnEliminar.className = 'btn btn-danger btn-sm';
  btnEliminar.textContent = 'Eliminar';
  btnEliminar.dataset.accion = 'eliminar';
 
  li.append(checkbox, info, btnEliminar);
  return li;
};

const actualizarEstadisticas = () => {
  const { total, completadas, pendientes } = obtenerEstadisticas();
  textoEstadisticas.textContent =
    `Total: ${total} · Pendientes: ${pendientes} · Completadas: ${completadas}`;
};

// Renderizado principal 
const renderizarTareas = () => {
  listaTareas.innerHTML = ''; // limpia para no duplicar elementos
  const visibles = obtenerTareasFiltradas();

  if (visibles.length === 0) {
    const vacio = document.createElement('li');
    vacio.className = 'list-group-item text-center text-muted';
    vacio.textContent = 'No hay tareas para mostrar.';
    listaTareas.appendChild(vacio);
  } else {
    const fragmento = document.createDocumentFragment();
    visibles.forEach(t => fragmento.appendChild(crearElementoTarea(t)));
    listaTareas.appendChild(fragmento); // una sola inserción en el DOM
  }
  actualizarEstadisticas();
};

listaTareas.addEventListener('click', (e) => {
  const elemento = e.target.closest('[data-accion]');
  if (!elemento) return;

  const id = Number(elemento.closest('li').dataset.id);

  if (elemento.dataset.accion === 'alternar') alternarEstado(id);
  if (elemento.dataset.accion === 'eliminar') eliminarTarea(id);
 
  guardarTareas();
  renderizarTareas();
});

// Filtro visual
contenedorFiltros.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-filtro]');
  if (!boton) return;
 
  filtroActual = boton.dataset.filtro;
  contenedorFiltros.querySelectorAll('[data-filtro]').forEach(b =>
    b.classList.toggle('active', b === boton)
  );
 
  renderizarTareas();
});

// 4: Persistencia de Datos
const CLAVE_STORAGE = 'tareasUniversitarias';
const guardarTareas = () => {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
  } catch (error) {
    console.error('No se pudieron guardar las tareas:', error);
  }
};

const cargarTareas = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    const datos = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    console.error('Datos guardados inválidos, se reinicia la lista:', error);
    return [];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  tareas = cargarTareas();
  renderizarTareas();
});
