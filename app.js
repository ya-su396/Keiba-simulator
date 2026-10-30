const KEY = "keiba-sim-v1";
let races = load();
let range = {from:"",to:""};
const $ = id => document.getElementById(id);
const fields = ["date","venue","raceNo","raceName","course","going","prediction","modelVersion","stake","payout","settled","notes"];
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return []}}
function save(){localStorage.setItem(KEY,JSON.stringify(races));renderAll()}
function uid(){return "r_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function yen(n){return new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(Number(n)||0)}
function pct(n){return Number.isFinite(n)?n.toFixed(1)+"%":"—"}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function settled(){return races.filter(r=>r.settled)}
function stats(list){const stake=list.reduce((a,r)=>a+(+r.stake||0),0), payout=list.reduce((a,r)=>a+(+r.payout||0),0), hits=list.filter(r=>(+r.payout||0)>0).length;return {count:list.length,stake,payout,hits,hit:list.length?hits/list.length*100:NaN,roi:stake?payout/stake*100:NaN,profit:payout-stake}}
function setText(id,v){$(id).textContent=v}
function renderMetrics(){
 const all=stats(races), done=stats(settled());
 setText("mRaces",all.count);setText("mHit",pct(done.hit));setText("mRoi",pct(done.roi));setText("mProfit",yen(done.profit));
 setText("bCount",done.count);setText("bHit",pct(done.hit));setText("bRoi",pct(done.roi));setText("bTotals",yen(done.stake)+" / "+yen(done.payout));
}
function raceLabel(r){return `${r.date||"日付未入力"} ${r.venue||""} ${r.raceNo||""} ${r.raceName||""}`.trim()}
function cardHTML(r){return `<div class="race-card"><div><div class="race-title">${esc(raceLabel(r))} ${r.settled?'<span class="status">確定</span>':'<span class="status pending">未確定</span>'}</div><div class="race-sub">${esc(r.course||"")}${r.going?"・"+esc(r.going):""}　購入 ${yen(r.stake)} / 払戻 ${yen(r.payout)}</div><div class="race-sub">予想：${esc(r.prediction||"未入力")}　モデル：${esc(r.modelVersion||"—")}</div></div><div class="race-actions"><button data-edit="${r.id}">編集</button><button data-delete="${r.id}" class="secondary">削除</button></div></div>`}
function renderRaces(){
 const q=($("raceSearch").value||"").toLowerCase();
 const list=[...races].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).filter(r=>raceLabel(r).toLowerCase().includes(q));
 $("raceList").innerHTML=list.length?list.map(cardHTML).join(""):'<div class="empty">レースはまだ登録されていません。</div>';
 $("recentRaces").innerHTML=[...races].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5).map(cardHTML).join("")||'<div class="empty">まだデータがありません。レースを登録して始めましょう。</div>';
}
function renderBacktest(){
 let list=settled().filter(r=>(!range.from||r.date>=range.from)&&(!range.to||r.date<=range.to)).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 if(!list.length){$("backtestTable").innerHTML='<div class="empty">条件に合う確定済みレースがありません。</div>';return}
 $("backtestTable").innerHTML=`<div class="table-wrap"><table><thead><tr><th>日付・レース</th><th>購入</th><th>払戻</th><th>収支</th><th>結果</th></tr></thead><tbody>${list.map(r=>`<tr><td>${esc(raceLabel(r))}</td><td>${yen(r.stake)}</td><td>${yen(r.payout)}</td><td>${yen((+r.payout||0)-(+r.stake||0))}</td><td>${+r.payout>0?"的中":"不的中"}</td></tr>`).join("")}</tbody></table></div>`;
}
function renderAll(){renderMetrics();renderRaces();renderBacktest()}
function resetForm(){ $("raceForm").reset();$("raceId").value="";$("modelVersion").value="手動予想 v1";$("stake").value=0;$("payout").value=0;$("formTitle").textContent="レースを登録";$("cancelEdit").classList.add("hidden")}
function editRace(id){const r=races.find(x=>x.id===id);if(!r)return; $("raceId").value=r.id;fields.forEach(k=>{const el($(fieldId(k))).type==="checkbox"?$(fieldId(k)).checked=!!r[k]:$(fieldId(k)).value=r[k]??""});$("formTitle").textContent="レースを編集";$("cancelEdit").classList.remove("hidden");showView("races");window.scrollTo({top:0,behavior:"smooth"})}
function fieldId(k){return ({date:"raceDate",venue:"venue",raceNo:"raceNo",raceName:"raceName",course:"course",going:"going",prediction:"prediction",modelVersion:"modelVersion",stake:"stake",payout:"payout",settled:"settled",notes:"notes"})[k]}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===id))}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("quickAdd").onclick=()=>{resetForm();showView("races");$("raceDate").value=new Date().toISOString().slice(0,10);window.scrollTo({top:0,behavior:"smooth"})};
$("raceForm").addEventListener("submit",e=>{e.preventDefault();const id=$("raceId").value||uid();const r={id};fields.forEach(k=>{r[k]=k==="settled"?$(fieldId(k)).checked:k==="stake"||k==="payout"?Math.max(0,Number($(fieldId(k)).value)||0):$(fieldId(k)).value.trim()});const idx=races.findIndex(x=>x.id===id);if(idx>=0)races[idx]=r;else races.push(r);save();resetForm();showView("races")});
$("cancelEdit").onclick=resetForm;
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit)editRace(edit.dataset.edit);const del=e.target.closest("[data-delete]");if(del&&confirm("このレースを削除しますか？")){races=races.filter(r=>r.id!==del.dataset.delete);save()}});
$("raceSearch").addEventListener("input",renderRaces);
$("applyRange").onclick=()=>{range={from:$("fromDate").value,to:$("toDate").value};renderMetrics();renderBacktest()};
$("clearRange").onclick=()=>{$("fromDate").value="";$("toDate").value="";range={from:"",to:""};renderMetrics();renderBacktest()};
function csvCell(v){let s=String(v??"");return '"'+s.replace(/"/g,'""')+'"'}
function makeCSV(){const cols=["id",...fields];return "\\ufeff"+[cols.join(","),...races.map(r=>cols.map(c=>csvCell(c==="settled"?(r[c]?"true":"false"):r[c])).join(","))].join("\\r\\n")}
$("exportCsv").onclick=()=>{const blob=new Blob([makeCSV()],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="keiba-races.csv";a.click();URL.revokeObjectURL(a.href)};
function parseCSV(text){text=text.replace(/^\\uFEFF/,"");const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===","){row.push(cell);cell=""}else if(c==="\\n"){row.push(cell.replace(/\\r$/,""));rows.push(row);row=[];cell=""}else cell+=c}if(cell.length||row.length){row.push(cell.replace(/\\r$/,""));rows.push(row)}return rows}
$("importCsv").onclick=async()=>{const file=$("importFile").files[0];if(!file){$("importStatus").textContent="先にCSVファイルを選んでください。";return}try{const rows=parseCSV(await file.text());const headers=rows.shift();let count=0;for(const cells of rows){if(!cells.length||cells.every(v=>!v))continue;const o={};headers.forEach((h,i)=>o[h]=cells[i]??"");if(!o.id)o.id=uid();o.settled=o.settled===true||o.settled==="true";o.stake=Number(o.stake)||0;o.payout=Number(o.payout)||0;const idx=races.findIndex(r=>r.id===o.id);if(idx>=0)races[idx]={...races[idx],...o};else races.push(o);count++}save();$("importStatus").textContent=`${count}件を読み込みました。`}catch(e){$("importStatus").textContent="読み込みに失敗しました。CSV形式を確認してください。"}};
$("clearAll").onclick=()=>{if(confirm("すべての登録データを削除します。この操作は取り消せません。")){races=[];save();resetForm()}};
renderAll();

// ===== AI予想強化モジュール v2 =====

// 馬の評価データを解析する
function analyzeHorseStrength(horse) {
  const odds = Number(horse.odds);
  const form = Number(horse.form);
  const distance = Number(horse.distance ?? 3);
  const course = Number(horse.course ?? 3);
  const jockey = Number(horse.jockey ?? 3);

  if (!Number.isFinite(odds) || odds <= 0) {
    throw new Error("オッズが正しくありません");
  }

  const scores = {
    odds: Math.min(100, (1 / odds) * 100),
    form: form * 20,
    distance: distance * 20,
    course: course * 20,
    jockey: jockey * 20
  };

  const total =
    scores.odds * 0.30 +
    scores.form * 0.30 +
    scores.distance * 0.15 +
    scores.course * 0.15 +
    scores.jockey * 0.10;

  return {
    ...horse,
    scores,
    total
  };
}

// 出走馬の総合順位とモデル推定勝率を計算
function runEnhancedPrediction(horses) {
  if (!Array.isArray(horses) || horses.length < 3) {
    throw new Error("3頭以上の馬を登録してください");
  }

  const analyzed = horses
    .map(analyzeHorseStrength)
    .sort((a, b) => b.total - a.total);

  const temperature = 15;
  const weights = analyzed.map(h =>
    Math.exp((h.total - analyzed[0].total) / temperature)
  );

  const totalWeight = weights.reduce((a, b) => a + b, 0);

  return analyzed.map((horse, index) => {
    const winProbability = weights[index] / totalWeight;

    return {
      ...horse,
      rank: index + 1,
      estimatedWinRate: winProbability * 100,
      expectedValue: winProbability * Number(horse.odds)
    };
  });
}

// 予想結果を画面に表示
function showEnhancedPrediction() {
  try {
    const horses = parseHorses();
    const results = runEnhancedPrediction(horses);

    const rows = results.map(h => `
      <tr>
        <td>${h.rank}位</td>
        <td>${esc(h.no)} ${esc(h.name)}</td>
        <td>${h.total.toFixed(1)}</td>
        <td>${h.estimatedWinRate.toFixed(2)}%</td>
        <td>${((h.expectedValue - 1) * 100).toFixed(1)}%</td>
      </tr>
    `).join("");

    const old = $("enhancedPredictionResults");
    if (old) old.remove();

    const output = document.createElement("div");
    output.id = "enhancedPredictionResults";
    output.innerHTML = `
      <h3>強化AI予想ランキング</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>順位</th>
              <th>馬名</th>
              <th>総合点</th>
              <th>モデル推定勝率</th>
              <th>期待値指数</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="hint">
        推定値は未校正のモデル出力です。
        実際の勝率や利益を保証しません。
      </p>
    `;

    $("predictionResults").after(output);

  } catch (error) {
    $("predictionError").textContent = error.message;
  }
}

// 新しい予想ボタンを既存画面に追加
(function addEnhancedPredictionButton() {
  if (!$("runPrediction") ||
      $("runEnhancedPrediction")) return;

  const button = document.createElement("button");
  button.id = "runEnhancedPrediction";
  button.textContent = "強化AI予想を実行";
  button.addEventListener("click", showEnhancedPrediction);

  $("runPrediction").after(button);
})();

// Rule-based prediction module: odds-implied strength + manually entered recent-form score.
let lastPrediction = [];
function parseHorses(){
 const lines=$("horseInput").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const horses=[];
 for(let i=0;i<lines.length;i++){
   const p=lines[i].split(",").map(s=>s.trim());
   if(p.length<4) throw new Error(`${i+1}行目：馬番,馬名,単勝オッズ,近走評価 の4項目が必要です。`);
   const no=p[0], name=p[1], odds=Number(p[2]), form=Number(p[3]);
   if(!no||!name||!Number.isFinite(odds)||odds<=0||!Number.isFinite(form)||form<1||form>5)
     throw new Error(`${i+1}行目：馬番・馬名・正のオッズ・1〜5の近走評価を確認してください。`);
   horses.push({no,name,odds,form});
 }
 if(horses.length<3) throw new Error("予想には最低3頭を入力してください。");
 return horses;
}
function calculatePrediction(){
 const horses=parseHorses();
 let ow=Number($("oddsWeight").value), fw=Number($("formWeight").value);
 const total=ow+fw||1;ow/=total;fw/=total;
 const inv=horses.map(h=>1/h.odds), maxInv=Math.max(...inv);
 const scored=horses.map((h,i)=>{
   const oddsScore=inv[i]/maxInv*100;
   const formScore=h.form/5*100;
   // Transparent heuristic score, not a calibrated win probability.
   const score=oddsScore*ow+formScore*fw;
   return {...h,oddsScore,formScore,score};
 }).sort((a,b)=>b.score-a.score);
 const maxScore=scored[0]?.score||1;
 return scored.map((h,i)=>({...h,rank:i+1,relative:(h.score/maxScore*100)}));
}
function renderPrediction(){
 try{
  lastPrediction=calculatePrediction();
  $("predictionError").textContent="";
  $("predictionResults").innerHTML=`<div class="prediction-note">スコアはオッズと手入力の近走評価を重み付けした相対評価です。勝率そのものではありません。</div><div class="table-wrap"><table><thead><tr><th>順位</th><th>馬番・馬名</th><th>単勝オッズ</th><th>近走評価</th><th>スコア</th></tr></thead><tbody>${lastPrediction.map(h=>`<tr><td><span class="rank-badge">${h.rank}</span></td><td>${esc(h.no)} ${esc(h.name)}</td><td>${h.odds.toFixed(1)}倍</td><td>${h.form}/5</td><td class="horse-score">${h.score.toFixed(1)}</td></tr>`).join("")}</tbody></table></div>`;
  const top=lastPrediction.slice(0,4);
  let bets=[];
  const type=$("predBetType").value;
  if(type==="wide") bets=top.slice(0,3).flatMap((a,i)=>top.slice(i+1,3).map(b=>`${a.no}-${b.no}`));
  else if(type==="umaren") bets=top.slice(0,3).flatMap((a,i)=>top.slice(i+1,3).map(b=>`${a.no}-${b.no}`));
  else bets=top.slice(0,3).length===3?[`${top[0].no}-${top[1].no}-${top[2].no}`]:[];
  $("predictionBets").innerHTML=`<p><strong>${type==="wide"?"ワイド":type==="umaren"?"馬連":"3連複"}候補</strong></p><p>${bets.map(esc).join("　／　")||"候補を作成できません"}</p><p class="hint">上位馬を組み合わせた単純候補です。券種のオッズ・期待値は計算していません。</p>`;
 }catch(e){lastPrediction=[];$("predictionError").textContent=e.message;$("predictionResults").innerHTML='<div class="empty">入力内容を確認してください。</div>';$("predictionBets").innerHTML='<div class="empty">有効なデータがありません。</div>'}
}
$("oddsWeight").addEventListener("input",()=>{$("oddsWeightLabel").textContent=$("oddsWeight").value+"%";$("formWeight").value=100-Number($("oddsWeight").value);$("formWeightLabel").textContent=$("formWeight").value+"%"});
$("formWeight").addEventListener("input",()=>{$("formWeightLabel").textContent=$("formWeight").value+"%";$("oddsWeight").value=100-Number($("formWeight").value);$("oddsWeightLabel").textContent=$("oddsWeight").value+"%"});
$("runPrediction").onclick=renderPrediction;
$("addHorse").onclick=()=>{$("horseInput").value += ($("horseInput").value.trim()?"\n":"")+"7,追加ホース,10.0,3"};
$("savePredictionRace").onclick=()=>{
 if(!lastPrediction.length)renderPrediction();
 if(!lastPrediction.length)return;
 const date=new Date().toISOString().slice(0,10);
 const raceName=$("predRaceName").value.trim()||"自動予想レース";
 const top=lastPrediction.slice(0,3).map(h=>`${h.rank}位 ${h.no} ${h.name} (score ${h.score.toFixed(1)})`).join(" / ");
 const r={id:uid(),date,venue:"未入力",raceNo:"未入力",raceName,course:"",going:"",prediction:top,modelVersion:"簡易スコア v1",stake:0,payout:0,settled:false,notes:`券種候補: ${$("predBetType").selectedOptions[0].textContent}\n出走馬:\n${$("horseInput").value}`};
 races.push(r);save();showView("races");alert("予想をレース管理に保存しました。開催日・競馬場・購入想定額などを必要に応じて編集してください。");
};

