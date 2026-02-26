const MAX=34;

let state=JSON.parse(localStorage.getItem("ligueGoat"))||{
  month:1,
  history:[],
  players:[
    create("Joueur 1"),
    create("Joueur 2"),
    create("Joueur 3"),
    create("joueur 4"),
   


  ],
  bonus:[
    {label:"Meilleur buteur", winner:null},
    {label:"Meilleure série", winner:null},
    {label:"Fair-play", winner:null}
  ]
};

function create(name){
  return{
    name,
    avatar:"",
    pts:0,v:0,n:0,d:0,
    matches:0,
    buts:0,
    encaisses:0,
    history:[]
  }
}

const save=()=>localStorage.setItem("ligueGoat",JSON.stringify(state));


// Animation de transition de section et effet dynamique sur navigation
function show(id) {
  document.querySelectorAll("section").forEach(s => {
    if (s.classList.contains("active")) {
      s.classList.remove("active");
      s.classList.add("fade-out");
      setTimeout(() => s.classList.remove("fade-out"), 400);
    }
  });
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("active");
    el.classList.add("fade-in");
    setTimeout(() => el.classList.remove("fade-in"), 400);
  }
  // Animation sur le bouton nav actif
  document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("nav-active"));
  const navBtns = document.querySelectorAll("nav button");
  if (navBtns && navBtns.length) {
    const idx = ["dashboard","match","classement","diagramme","bonus","protection","historique","parametres"].indexOf(id);
    if (idx >= 0) navBtns[idx].classList.add("nav-active");
  }
  // Affichage conditionnel des graphiques
  if (id === 'diagramme') {
    setTimeout(() => {
      updateChart();
      updateChartClassement();
    }, 350);
  }
}

// Toast notification
function toast(msg, color = '#00fff0') {
  let t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = msg;
  t.style.background = `linear-gradient(90deg, ${color} 0%, #232526 100%)`;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(()=>t.remove(), 400); }, 2600);
}

// Effet vibration sur victoire GOAT
function goatVibrate() {
  const card = document.querySelector('.goat-card');
  if (!card) return;
  card.classList.add('vibrate');
  setTimeout(() => card.classList.remove('vibrate'), 700);
}

function ranking(){
  return [...state.players].sort((a,b)=>b.pts-a.pts);
}

function loadSelects(){
  ["playerA","playerB","challenger"].forEach(id=>{
    const s=document.getElementById(id);
    if(!s)return;
    s.innerHTML="";
    state.players.forEach((p,i)=>{
      s.innerHTML+=`<option value="${i}">${p.name}</option>`;
    });
  });
}

matchForm.onsubmit=e=>{
  e.preventDefault();
  const A=+playerA.value,B=+playerB.value;
  const sA=+scoreA.value,sB=+scoreB.value;
  if(A===B)return alert("Choisis 2 joueurs");

  const pA=state.players[A],pB=state.players[B];
  pA.matches++;pB.matches++;

  // Ajout des buts et encaissés
  pA.buts += sA;
  pA.encaisses += sB;
  pB.buts += sB;
  pB.encaisses += sA;


  if(sA>sB){
    pA.v++;pA.pts+=3;pB.d++;
    toast(`<b>${pA.name}</b> remporte le duel !`, '#00fff0');
    if (ranking()[0] === pA) goatVibrate();
  }
  else if(sB>sA){
    pB.v++;pB.pts+=3;pA.d++;
    toast(`<b>${pB.name}</b> remporte le duel !`, '#00fff0');
    if (ranking()[0] === pB) goatVibrate();
  }
  else{
    pA.n++;pB.n++;pA.pts++;pB.pts++;
    toast('Match nul !', '#FFD700');
  }

  pA.history.push(pA.pts);
  pB.history.push(pB.pts);

  // Ajout à l'historique global
  state.history.push({
    date: new Date().toLocaleString(),
    joueurA: pA.name,
    scoreA: sA,
    joueurB: pB.name,
    scoreB: sB
  });

  save();update();e.target.reset();
};

function update(){
  updateGoat();
  updateTable();
  updateProgressBars();
  updateEdit();
  updateBonus();
  updateHistory();
}
// Affichage des barres de progression pour chaque joueur
function updateProgressBars() {
  const container = document.getElementById('progressBars');
  if (!container) return;
  const maxPts = state.players.reduce((max, p) => p.pts > max ? p.pts : max, 1);
  container.innerHTML = '';
  state.players.forEach(p => {
    const percent = maxPts ? Math.round((p.pts / maxPts) * 100) : 0;
    container.innerHTML += `
      <div class="progress-bar-block">
        <span class="progress-bar-label">${p.name}</span>
        <div class="progress-bar"><div class="progress-bar-inner" style="width:${percent}%;"></div></div>
        <span class="progress-bar-value">${p.pts} pts</span>
      </div>
    `;
  });
}

function updateHistory(){
  if(!document.getElementById('history')) return;
  history.innerHTML = '';
  (state.history||[]).slice().reverse().forEach(h => {
    history.innerHTML += `<li><span style="color:gold">${h.date}</span> : <b>${h.joueurA}</b> <span style="color:#fff">${h.scoreA}</span> - <span style="color:#fff">${h.scoreB}</span> <b>${h.joueurB}</b></li>`;
  });
}

function updateBonus(){
  if(!document.getElementById('bonusList')) return;
  bonusList.innerHTML = '';
  (state.bonus||[]).forEach((b, i) => {
    bonusList.innerHTML += `
      <div class="glass">
        <strong>${b.label}</strong><br>
        <select onchange="setBonusWinner(${i},this.value)">
          <option value="">-- Choisir --</option>
          ${state.players.map((p,pi)=>`<option value="${pi}" ${b.winner==pi?'selected':''}>${p.name}</option>`).join('')}
        </select>
        <div style="margin-top:6px;color:gold;min-height:18px;">
          ${b.winner!==null?`🏅 ${state.players[b.winner].name}`:''}
        </div>
      </div>
    `;
  });
}

window.setBonusWinner = (bonusIdx, playerIdx) => {
  if(playerIdx==='') state.bonus[bonusIdx].winner = null;
  else state.bonus[bonusIdx].winner = +playerIdx;
  save(); update();
}

function updateGoat(){
  const g=ranking()[0];
  goatCard.innerHTML=`
    <img src="${g.avatar||'https://i.imgur.com/6VBx3io.png'}">
    <h2>${g.name}</h2>
    <p>👑 LE GOAT » ${g.pts} pts</p>
  `;
}

function updateTable(){
  table.innerHTML="";
  const top=ranking()[0];
  ranking().forEach((p,i)=>{
    const diff = (p.buts||0)-(p.encaisses||0);
    table.innerHTML+=`
      <tr class="${p===top?'goat-row':''}">
        <td>${i+1}</td>
        <td>${p.name}</td>
        <td>${p.pts}</td>
        <td>${p.v}</td>
        <td>${p.n}</td>
        <td>${p.d}</td>
        <td>${p.matches}/${MAX}</td>
        <td>${p.buts||0}</td>
        <td>${p.encaisses||0}</td>
        <td>${diff}</td>
      </tr>`;
  });
}

function updateChart(){
  // N'affiche le graphique que si la section diagramme est visible
  const diagSection = document.getElementById('diagramme');
  if (!diagSection || !diagSection.classList.contains('active')) return;
  if(window.chart)window.chart.destroy();
  if (!window.evolutionChart) return;
  window.chart=new Chart(evolutionChart,{
    type:"line",
    data:{
      labels:[...Array(MAX).keys()].map(i=>i+1),
      datasets:state.players.map((p,idx)=>({
        label:p.name,
        data:p.history,
        tension:.5,
        borderWidth:3,
        fill:true,
        borderColor:["#FFD700","#00BFFF","#FF6347","#32CD32","#FF69B4"][idx%5],
        backgroundColor:["rgba(255,215,0,0.15)","rgba(0,191,255,0.15)","rgba(255,99,71,0.15)","rgba(50,205,50,0.15)","rgba(255,105,180,0.15)"][idx%5]
      }))
    },
    options:{
      animation:{duration:1200},
      plugins:{
        legend:{labels:{color:"gold",font:{size:13}}},
        title:{display:true,text:"Progression des joueurs",color:"gold",font:{size:15}}
      },
      scales:{
        x:{ticks:{color:"#FFD700"}},
        y:{ticks:{color:"#FFD700"}}
      }
    }
  });
}

function updateChartClassement(){
  // N'affiche le graphique que si la section diagramme est visible
  const diagSection = document.getElementById('diagramme');
  if (!diagSection || !diagSection.classList.contains('active')) return;
  if(!window.evolutionChartClassement) return;
  if(window.chartClassement)window.chartClassement.destroy();
  window.chartClassement=new Chart(evolutionChartClassement,{
    type:"bar",
    data:{
      labels:state.players.map(p=>p.name),
      datasets:[{
        label:"Buts",
        data:state.players.map(p=>p.buts||0),
        backgroundColor:"rgba(255,215,0,0.7)",
        borderColor:"gold",
        borderWidth:2
      },{
        label:"Différence",
        data:state.players.map(p=>(p.buts||0)-(p.encaisses||0)),
        backgroundColor:"rgba(0,191,255,0.5)",
        borderColor:"#00BFFF",
        borderWidth:2
      }]
    },
    options:{
      indexAxis: 'y',
      animation:{duration:1200},
      plugins:{
        legend:{labels:{color:"gold",font:{size:13}}}
      },
      scales:{
        x:{ticks:{color:"#FFD700"}},
        y:{ticks:{color:"#FFD700"}}
      }
    }
  });
}

function updateEdit(){
  editPlayers.innerHTML="";
  state.players.forEach((p,i)=>{
    editPlayers.innerHTML+=`
      <div class="glass">
        <input value="${p.name}" onchange="rename(${i},this.value)">
        <input type="file" onchange="avatar(${i},this)">
      </div>`;
  });
}

window.rename=(i,v)=>{state.players[i].name=v;save();update()}
window.avatar=(i,input)=>{
  const r=new FileReader();
  r.onload=()=>{state.players[i].avatar=r.result;save();update()}
  r.readAsDataURL(input.files[0]);
}

function resetMonth(){
  state.month++;
  state.players.forEach(p=>{
    p.pts=p.v=p.n=p.d=p.matches=p.buts=p.encaisses=0;
    p.history=[];
  });
  save();update();
}

function resetAll(){
  localStorage.clear();
  location.reload();
}


// --- GOAT PROTECTION ---
window.addEventListener('DOMContentLoaded', () => {
  const protectForm = document.getElementById('protectForm');
  const gScoreInput = document.getElementById('gScore');
  const cScoreInput = document.getElementById('cScore');
  const challenger = document.getElementById('challenger');
  const protectStatus = document.getElementById('protectStatus');
  if (protectForm && gScoreInput && cScoreInput && challenger && protectStatus) {
    protectForm.onsubmit = e => {
      e.preventDefault();
      const goatIdx = ranking().findIndex(p => p === ranking()[0]);
      const challengerIdx = +challenger.value;
      const gScore = +gScoreInput.value;
      const cScore = +cScoreInput.value;
      if (challengerIdx === goatIdx) {
        protectStatus.innerHTML = '<span style="color:red">Le GOAT ne peut pas se défier lui-même !</span>';
        return;
      }
      if (isNaN(gScore) || isNaN(cScore)) {
        protectStatus.innerHTML = '<span style="color:red">Scores invalides.</span>';
        return;
      }
      let goat = ranking()[0];
      let challengerPlayer = state.players[challengerIdx];
      let msg = '';
      if (gScore > cScore) {
        msg = `<span style='color:lime'>${goat.name} défend son titre !</span>`;
        toast(`👑 ${goat.name} défend son titre !`, '#00fff0');
        goatVibrate();
      } else if (cScore > gScore) {
        msg = `<span style='color:gold'>${challengerPlayer.name} détrône le GOAT !</span>`;
        toast(`👑 ${challengerPlayer.name} détrône le GOAT !`, '#FFD700');
        goatVibrate();
      } else {
        msg = `<span style='color:orange'>Match nul, le GOAT reste en place.</span>`;
        toast('Match nul, le GOAT reste en place.', '#FFD700');
      }
      protectStatus.innerHTML = msg;
    };
  }
});


// Ajout d'un effet de survol dynamique sur les boutons nav
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    btn.style.transform = 'scale(1.12) rotate(-2deg)';
  });
  btn.addEventListener('mouseleave', e => {
    btn.style.transform = '';
  });
});

// Ajout d'une animation d'entrée sur la page au chargement
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
  setTimeout(() => document.body.classList.remove('page-loaded'), 1200);
});

loadSelects();
update();
