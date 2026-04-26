const DEFAULT_TASKS = [
  {
    id: "t1",
    title: "Préparer la présentation du projet",
    desc: "Projet de groupe IHM",
    date: new Date().toISOString().split("T")[0],
    start: "10:00",
    duration: 60,
    category: "Projet",
    completed: false,
    status: "todo",
    subtasks: []
  },
  {
    id: "t2",
    title: "Réunion de groupe",
    desc: "Point synchronisation",
    date: new Date().toISOString().split("T")[0],
    start: "14:00",
    duration: 45,
    category: "Travail",
    completed: false,
    status: "todo",
    subtasks: []
  }
];

const DEFAULT_CATEGORIES = ["Travail", "Cours", "Projet", "Personnel", "Urgent"];
