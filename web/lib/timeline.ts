// Hitos de la línea de tiempo (español). Mismo contenido que js/i18n.js de la versión actual;
// inglés y alemán llegan con el resto de idiomas.
export type Milestone = { id: string; period: string; title: string; region: string; text: string; book: string; bookTitle: string; chapter: number };

export const milestones: Milestone[] = [
  { id: "patriarchs", period: "Patriarcas", title: "Abraham sale hacia Canaán", region: "Mesopotamia · Canaán · Egipto", text: "La historia de Abraham conecta Ur, Harán, Canaán y las rutas hacia Egipto. El desplazamiento abre el relato de las promesas patriarcales.", book: "genesis", bookTitle: "Génesis", chapter: 12 },
  { id: "exodus", period: "Éxodo", title: "Israel sale de Egipto", region: "Egipto · Mar Rojo · Sinaí", text: "La salida de Egipto y el camino por el desierto forman el gran eje geográfico del éxodo y preparan la entrada en Canaán.", book: "exodo", bookTitle: "Éxodo", chapter: 12 },
  { id: "conquest", period: "Conquista", title: "Entrada y asentamiento en Canaán", region: "Jordán · Jericó · Canaán", text: "El cruce del Jordán y la organización del territorio sitúan a Israel en Canaán, con Jerusalén como referencia posterior.", book: "josue", bookTitle: "Josué", chapter: 1 },
  { id: "monarchy", period: "Monarquía", title: "Jerusalén se convierte en capital", region: "Jerusalén · Judá · Israel", text: "David establece Jerusalén como centro político y espiritual del reino, un punto que marcará la memoria bíblica.", book: "2-samuel", bookTitle: "2 Samuel", chapter: 5 },
  { id: "exile", period: "Exilio", title: "Jerusalén cae ante Babilonia", region: "Judá · Babilonia · Mesopotamia", text: "La caída de Jerusalén desplaza a comunidades de Judá hacia Babilonia y abre una etapa de pérdida, memoria y esperanza de retorno.", book: "2-reyes", bookTitle: "2 Reyes", chapter: 25 },
  { id: "return", period: "Retorno", title: "Regreso y reconstrucción", region: "Babilonia · Jerusalén · Judá", text: "El retorno desde Babilonia reactiva la vida comunitaria y la reconstrucción de Jerusalén.", book: "esdras", bookTitle: "Esdras", chapter: 1 },
  { id: "gospels", period: "Evangelios", title: "Jesús nace en Judea y recorre Galilea", region: "Belén · Galilea · Jerusalén", text: "Los evangelios recorren Galilea, Judea y Jerusalén, conectando aldeas, caminos y la ciudad de los acontecimientos finales.", book: "mateo", bookTitle: "Mateo", chapter: 1 },
  { id: "early-church", period: "Iglesia primitiva", title: "El mensaje llega a las naciones", region: "Jerusalén · Siria · Mediterráneo", text: "Hechos muestra la expansión del movimiento desde Jerusalén hacia Siria, Asia Menor, Grecia y Roma.", book: "hechos", bookTitle: "Hechos", chapter: 2 },
];
