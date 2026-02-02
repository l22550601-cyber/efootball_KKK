const MAX=25;

let state=JSON.parse(localStorage.getItem("ligueGoat"))||{
  month:1,
  history:[],
  players:[
    create("Joueur 1"),
    create("Joueur 2"),
    create("Joueur 3")
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

function show(id){
  document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
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

  if(sA>sB){pA.v++;pA.pts+=3;pB.d++}
  else if(sB>sA){pB.v++;pB.pts+=3;pA.d++}
  else{pA.n++;pB.n++;pA.pts++;pB.pts++}

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
  updateChart();
  updateChartClassement();
  updateEdit();
  updateBonus();
  updateHistory();
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
    <p>👑 GOAT – ${g.pts} pts</p>
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
  if(window.chart)window.chart.destroy();
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

loadSelects();
update();
