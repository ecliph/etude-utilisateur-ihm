const options = {
  data: exp, // le jeu de test
  defaultTestId: "todo.js",   //id du jeu de données
  defaultVersionId: "A",// id de l'appli testée
  defaultUserId: 0,
  maxTaskDuration: 300, //max durée des tâches en minutes
  total: Math.floor(exp.length/2) - 1, // le nombre max de tests par expérience
};

class Viewer {
  test;

  constructor() {
    this.main = document.getElementById("main");
    this.msg = document.getElementById("msg");
    this.controls = document.getElementById("controls");

    this.controls.innerHTML =
      '<button id="save">Enregistrer les résultats</button>\
      <button id="new">Nouvelle expérience</button>\
      <button id="next">Tâche suivante</button>';

    const bSave = document.getElementById("save");
    const bNew = document.getElementById("new");
    const bNext = document.getElementById("next");

    this.test = new Test(this);
    bSave.addEventListener("click", (e) => this.test.save());
    bNew.addEventListener("click", (e) => this.newTest());
    bNext.addEventListener("click", (e) => this.test.next());
  }

  newTest() {
    this.test = new Test(this);
  }

  display(msg) {
    this.msg.innerHTML = msg;
  }
}

class Test {
  constructor(view, userName, testId) {
    this.result = [];
    this.userName = userName ?? options.defaultUserId;
    this.testId = testId ?? options.defaultTestId;
    this.view = view;
    this.currentItem = 0;
    this.create = false;
    this.nb = exp.length;
    this.num = 0;
    this.total = options.total;
    this.start = Date.now();
    this.cat = 0;

    this.next();
  }

  next() {
    if (this.num < this.total) {      
      this.currentItem = Math.floor((Math.random() * this.nb) / 2);
      this.task();
    }else{
      this.view.display("L'expérience est terminée, enregistrez les résultats et/ou recommencez une nouvelle expérience.");
    }
  }

  task(){
    let item;
    if (this.create) {
        item = exp[this.nb - this.currentItem - 1];
        this.view.display(
          `<dl><dt>Créer une nouvelle tâche avec les informations suivantes: </dt>
       <dd>titre: "${item.task}" </dd>
       <dd>durée: ${item.duration} minutes </dd>
       <dd>heure et date: ${this.twoDigitString(item.hours)}:${this.twoDigitString(item.minutes)}, le 23/04/2026 </dd>
       <dd>catégorie: ${categories[this.cat].nom}</dd>
       </dl>`,
        );
        this.create = false;
        this.essaiSuivant();
      } else {
        item = exp[this.currentItem];
        const d = this.createPossibleDuration(item);
        this.view.display(
          `<dl><dt>Sélectionner la tâche intitulée </dt>
       <dd>"${item.task}" </dd>
       <dd> et ajuster sa durée à ${d} minutes </dd>
       </dl>`,
        );
        this.create = true;
      }
  }

  createPossibleDuration(item){
    let m = 60 - Number(item.minutes);
    let h = 23 - Number(item.hours);
    return (10*Math.floor(Math.random()*Math.min(h*60+m,options.maxTaskDuration)/10));
  }

  essaiSuivant() {
        this.result.push({
          subject: this.userName, 
          data: this.testId, 
          num: this.num,
          task: this.currentItem,
          cat: this.cat, 
          time: this.getDuration(), 
          nbErrors: undefined }),
        this.num++;
        this.cat = this.cat + 2 > categories.length ? 0: this.cat + 1;
  }

  getDuration(){
    const end = Date.now(), start = this.start;
    this.start = Date.now();
    return end - start;
  }

  save() {
    const type = "application/json";
    const blob = new Blob([JSON.stringify(this.result)], { type });
    const url = URL.createObjectURL(blob);
    const filename = `result-${this.getTimeStamp()}.json`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  twoDigitString(i) {
    return i < 10 ? "0" + i : String(i);
  }

  getTimeStamp() {
    const now = new Date();
    let month = this.twoDigitString(now.getMonth() + 1),
      day = this.twoDigitString(now.getDate()),
      h = this.twoDigitString(now.getHours()),
      min = this.twoDigitString(now.getMinutes()),
      sec = this.twoDigitString(now.getSeconds());
    return `${now.getFullYear()}-${month}-${day}-${h}-${min}-${sec}`;
  }
}