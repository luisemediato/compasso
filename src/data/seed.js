const relativeDate = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const seed = {
  profile: {
    name: "Luís Henrique",
    instrument: "Viola de arco",
    city: "Belo Horizonte, MG",
    headline: "Entre cordas, histórias e novos encontros.",
    bio: "Este é um perfil demonstrativo. Edite este texto para contar sua trajetória, seu repertório e o que torna a sua música única.",
    email: "",
    instagram: "",
  },
  events: [
    {
      id: "e1",
      title: "Recital de cordas",
      date: relativeDate(5),
      time: "19:30",
      venue: "Sala de recital",
      city: "Belo Horizonte, MG",
      type: "Recital",
      ticket: "",
      description: "Programa demonstrativo de música de câmara.",
    },
    {
      id: "e2",
      title: "Música no fim da tarde",
      date: relativeDate(11),
      time: "17:00",
      venue: "Espaço cultural",
      city: "Belo Horizonte, MG",
      type: "Concerto",
      ticket: "",
      description:
        "Uma apresentação demonstrativa para experimentar sua agenda.",
    },
    {
      id: "e3",
      title: "Encontro de música de câmara",
      date: relativeDate(20),
      time: "20:00",
      venue: "Auditório principal",
      city: "Belo Horizonte, MG",
      type: "Música de câmara",
      ticket: "",
      description: "",
    },
  ],
  works: [],
};
export { seed };
