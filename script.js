const MAX=25;

let state=JSON.parse(localStorage.getItem("ligueGoat"))||{
  month:1,
  history:[],
  players:[
    create("Joueur 1"),
    create("Joueur 2"),
    create("Joueur 3")
  ]
};

function create(name){
  return{
    name,
    avatar:"",
    pts:0,v:0,n:0,d:0,
    matches:0,
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

  if(sA>sB){pA.v++;pA.pts+=3;pB.d++}
  else if(sB>sA){pB.v++;pB.pts+=3;pA.d++}
  else{pA.n++;pB.n++;pA.pts++;pB.pts++}

  pA.history.push(pA.pts);
  pB.history.push(pB.pts);

  save();update();e.target.reset();
};

function update(){
  updateGoat();
  updateTable();
  updateChart();
  updateEdit();
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
    table.innerHTML+=`
      <tr class="${p===top?'goat-row':''}">
        <td>${i+1}</td>
        <td>${p.name}</td>
        <td>${p.pts}</td>
        <td>${p.v}</td>
        <td>${p.n}</td>
        <td>${p.d}</td>
        <td>${p.matches}/${MAX}</td>
      </tr>`;
  });
}

function updateChart(){
  if(window.chart)window.chart.destroy();
  window.chart=new Chart(evolutionChart,{
    type:"line",
    data:{
      labels:[...Array(MAX).keys()].map(i=>i+1),
      datasets:state.players.map(p=>({
        label:p.name,
        data:p.history,
        tension:.4,
        borderWidth:3,
        fill:true
      }))
    },
    options:{
      animation:{duration:1200},
      plugins:{legend:{labels:{color:"#fff"}}},
      scales:{
        x:{ticks:{color:"#aaa"}},
        y:{ticks:{color:"#aaa"}}
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
    p.pts=p.v=p.n=p.d=p.matches=0;
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
