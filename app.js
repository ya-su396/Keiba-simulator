const KEY = "keiba-sim-v1";
let races = load();
let range = {from:"",to:""};
const $ = id => document.getElementById(id);
const fields = ["date","venue","raceNo","raceName","course","going","prediction","modelVersion","stake","payout","settled","notes","predictedHorses"];function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){return []}}
function save(){localStorage.setItem(KEY,JSON.stringify(races));renderAll()}
function uid(){return "r_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function yen(n){return new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(Number(n)||0)}
function pct(n){return Number.isFinite(n)?n.toFixed(1)+"%":"—"}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function settled(){return races.filter(r=>r.settled)}
function stats(list){const stake=list.reduce((a,r)=>a+(+r.stake||0),0), payout=list.reduce((a,r)=>a+(+r.payout||0),0), hits=list.filter(r=>(+r.payout||0)>0).length;return {count:list.length,stake,payout,hits,hit:list.length?hits/list.length*100:NaN,roi:stake?payout/stake*100:NaN,profit:payout-stake}}
function checkPredictedHorses(r) {
  // 予想した馬番を配列にする
  const predicted = String(r.predictedHorses || "")
    .split(/[,、，\s]+/)
    .map(n => n.trim())
    .filter(n => /^\d+$/.test(n));

  // 実際の1〜3着の馬番
  const actual = [
    r.actualFirst,
    r.actualSecond,
    r.actualThird
  ]
    .map(n => String(n || "").trim())
    .filter(n => /^\d+$/.test(n));

  // 結果が未入力なら判定しない
  if (predicted.length === 0 || actual.length !== 3) {
    return null;
  }

  // 予想した馬のうち、実際の1〜3着に入った頭数
  const hits = new Set(predicted)
    ? [...new Set(predicted)].filter(n => actual.includes(n)).length
    : 0;

  return {
    hits,
    total: 3,
    result: `${hits}頭的中（3着以内）`
  };
}
function setText(id,v){$(id).textContent=v}
function renderMetrics() {
  const all = stats(races);
  const done = stats(settled());

  setText("mRaces", all.count);
  setText("mHit", pct(done.hit));
  setText("mRoi", pct(done.roi));
  setText("mProfit", yen(done.profit));

  setText("bCount", done.count);
  setText("bHit", pct(done.hit));
  setText("bRoi", pct(done.roi));
  setText("bTotals", yen(done.stake) + " / " + yen(done.payout));
}

function renderPredictionStats() {
  const list = settled().filter(r =>
    r.actualFirst &&
    r.actualSecond &&
    r.actualThird &&
    checkPredictedHorses(r) !== null
  );

  const total = list.length;

  const hits = list.reduce(
    (sum, r) => sum + checkPredictedHorses(r).hits,
    0
  );

  const predictedTotal = list.reduce((sum, r) => {
    const horses = String(r.predictedHorses || "")
      .split(",")
      .map(n => n.trim())
      .filter(Boolean);

    return sum + new Set(horses).size;
  }, 0);

  const hitRate = predictedTotal
    ? (hits / predictedTotal * 100).toFixed(1)
    : "0.0";

  const message = total
    ? `判定レース数：${total} ／ 3着以内に入った予想馬：${hits}頭 ／ 予想馬の的中率：${hitRate}%`
    : "予想馬番と実際の1〜3着を登録すると、ここに集計されます。";

  const el = $("predictionStats");
  if (el) el.textContent = message;
}
function raceLabel(r){return `${r.date||"日付未入力"} ${r.venue||""} ${r.raceNo||""} ${r.raceName||""}`.trim()}
function cardHTML(r) {
  const result = checkPredictedHorses(r);

  const resultHTML = result
    ? `<div class="race-sub">予想結果：${result.hits}頭が3着以内！</div>`
    : "";

  return `
    <div class="race-card">
      <div>
        <div class="race-title">
          ${esc(raceLabel(r))}
          ${r.settled
            ? '<span class="status">確定</span>'
            : '<span class="status pending">未確定</span>'}
        </div>

        <div class="race-sub">
          ${esc(r.course || "")}
          ${r.going ? "・" + esc(r.going) : ""}
          購入 ${yen(r.stake)} / 払戻 ${yen(r.payout)}
        </div>

        <div class="race-sub">
          予想：${esc(r.prediction || "未入力")}
          モデル：${esc(r.modelVersion || "—")}
        </div>

        ${resultHTML}
      </div>

      <div class="race-actions">
        <button data-edit="${r.id}">編集</button>
        <button data-delete="${r.id}" class="secondary">削除</button>
      </div>
    </div>
  `;
}

function renderRaces() {
  const q = ($("raceSearch").value || "").toLowerCase();

  const list = [...races]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter(r => raceLabel(r).toLowerCase().includes(q));

  $("raceList").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : '<div class="empty">レースはまだ登録されていません。</div>';

  $("recentRaces").innerHTML =
    [...races]
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5)
      .map(cardHTML)
      .join("") ||
    '<div class="empty">まだデータがありません。レースを登録して始めましょう。</div>';
}
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
function renderAll(){
 renderMetrics();
 renderRaces();
 renderBacktest();
 renderPredictionStats();
}
function resetForm(){ $("raceForm").reset();$("raceId").value="";$("modelVersion").value="手動予想 v1";$("stake").value=0;$("payout").value=0;$("formTitle").textContent="レースを登録";$("cancelEdit").classList.add("hidden")}
function editRace(id){const r=races.find(x=>x.id===id);if(!r)return; $("raceId").value=r.id;fields.forEach(k=>{const el=$(fieldId(k));el.type==="checkbox"?$(fieldId(k)).checked=!!r[k]:$(fieldId(k)).value=r[k]??""});$("actualFirst").value = r.actualFirst ?? "";
$("actualSecond").value = r.actualSecond ?? "";
$("actualThird").value = r.actualThird ?? "";$("formTitle").textContent="レースを編集";$("cancelEdit").classList.remove("hidden");showView("races");window.scrollTo({top:0,behavior:"smooth"})}
function fieldId(k){
  return ({
    date:"raceDate",
    venue:"venue",
    raceNo:"raceNo",
    raceName:"raceName",
    course:"course",
    going:"going",
    prediction:"prediction",
    predictedHorses:"predictedHorses",
    modelVersion:"modelVersion",
    stake:"stake",
    payout:"payout",
    settled:"settled",
    notes:"notes"
  })[k];
}function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===id))}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("quickAdd").onclick=()=>{resetForm();showView("races");$("raceDate").value=new Date().toISOString().slice(0,10);window.scrollTo({top:0,behavior:"smooth"})};
$("raceForm").addEventListener("submit", e => {
  e.preventDefault();

  const id = $("raceId").value || uid();
  const r = { id };

  fields.forEach(k => {
    r[k] = k === "settled"
      ? $(fieldId(k)).checked
      : k === "stake" || k === "payout"
        ? Math.max(0, Number($(fieldId(k)).value) || 0)
        : $(fieldId(k)).value.trim();
  });

  // 実際の着順を保存
  r.actualFirst = $("actualFirst").value;
  r.actualSecond = $("actualSecond").value;
  r.actualThird = $("actualThird").value;

  const idx = races.findIndex(x => x.id === id);

  if (idx >= 0) {
    races[idx] = r;
  } else {
    races.push(r);
  }

  save();
  resetForm();
  showView("races");
});
$("cancelEdit").onclick=resetForm;
document.addEventListener("click",e=>{const edit=e.target.closest("[data-edit]");if(edit)editRace(edit.dataset.edit);const del=e.target.closest("[data-delete]");if(del&&confirm("このレースを削除しますか？")){races=races.filter(r=>r.id!==del.dataset.delete);save()}});
$("raceSearch").addEventListener("input",renderRaces);
$("applyRange").onclick=()=>{range={from:$("fromDate").value,to:$("toDate").value};renderMetrics();renderBacktest()};
$("clearRange").onclick=()=>{$("fromDate").value="";$("toDate").value="";range={from:"",to:""};renderMetrics();renderBacktest()};
function csvCell(v){let s=String(v??"");return '"'+s.replace(/"/g,'""')+'"'}
function makeCSV() {
  const cols = [
    "id",
    ...fields,
    "actualFirst",
    "actualSecond",
    "actualThird"
  ];

  return "\uFEFF" + [
    cols.join(","),
    ...races.map(r =>
      cols.map(c =>
        csvCell(c === "settled" ? (r[c] ? "true" : "false") : r[c])
      ).join(",")
    )
  ].join("\r\n");
}
$("exportCsv").onclick = async () => {
  try {
    const csv = makeCSV();
    const file = new File(
      [csv],
      "keiba-races.csv",
      { type: "text/csv;charset=utf-8;" }
    );

    // iPadのSafariで共有シートを開く
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: "競馬レースデータCSV"
      });
      return;
    }

    // 共有機能が使えない場合は通常のダウンロード
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keiba-races.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error) {
    if (error.name !== "AbortError") {
      alert("CSV出力に失敗しました：" + error.message);
    }
  }
};
function parseCSV(text){text=text.replace(/^\\uFEFF/,"");const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===","){row.push(cell);cell=""}else if(c==="\\n"){row.push(cell.replace(/\\r$/,""));rows.push(row);row=[];cell=""}else cell+=c}if(cell.length||row.length){row.push(cell.replace(/\\r$/,""));rows.push(row)}return rows}
$("importCsv").onclick=async()=>{const file=$("importFile").files[0];if(!file){$("importStatus").textContent="先にCSVファイルを選んでください。";return}try{const rows=parseCSV(await file.text());const headers=rows.shift();let count=0;for(const cells of rows){if(!cells.length||cells.every(v=>!v))continue;const o={};headers.forEach((h,i)=>o[h]=cells[i]??"");if(!o.id)o.id=uid();o.settled=o.settled===true||o.settled==="true";o.stake=Number(o.stake)||0;o.payout=Number(o.payout)||0;const idx=races.findIndex(r=>r.id===o.id);if(idx>=0)races[idx]={...races[idx],...o};else races.push(o);count++}save();$("importStatus").textContent=`${count}件を読み込みました。`}catch(e){$("importStatus").textContent="読み込みに失敗しました。CSV形式を確認してください。"}};
$("clearAll").onclick=()=>{if(confirm("すべての登録データを削除します。この操作は取り消せません。")){races=[];save();resetForm()}};
renderAll();



// ===== AI予想エンジン v3 =====

let lastPrediction = [];

// 評価ウェイト（合計100）
const AI_WEIGHTS = {
  form: 0.30,
  distance: 0.15,
  course: 0.15,
  jockey: 0.10,
  odds: 0.20,
  going: 0.10
};

// 1〜5点を0〜100点に変換
function ratingScore(value) {
  return (Number(value) - 1) * 25;
}

// 出走馬データ解析
// 入力形式：
// 馬番,馬名,単勝オッズ,近走評価,
// 距離適性,コース適性,騎手評価,馬場適性

function parseHorses() {
  const lines = $("horseInput").value
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  const horses = [];
  const numbers = new Set();

  lines.forEach((line, i) => {
    const p = line.split(",").map(s => s.trim());

    if (p.length < 4) {
      throw new Error(
        `${i + 1}行目：馬番、馬名、オッズ、近走評価が必要です。`
      );
    }

    const [no, name] = p;
const odds = Number(p[2]);
const runningStyle = p[8] || "差し";

    const values = [
      Number(p[3]),
      p[4] === undefined || p[4] === "" ? 3 : Number(p[4]),
      p[5] === undefined || p[5] === "" ? 3 : Number(p[5]),
      p[6] === undefined || p[6] === "" ? 3 : Number(p[6]),
      p[7] === undefined || p[7] === "" ? 3 : Number(p[7])
    ];

    if (!no || !name || !Number.isFinite(odds) || odds <= 0) {
      throw new Error(`${i + 1}行目：馬番・馬名・オッズを確認してください。`);
    }

    if (numbers.has(no)) {
      throw new Error(`${i + 1}行目：馬番が重複しています。`);
    }

    if (values.some(v => !Number.isFinite(v) || v < 1 || v > 5)) {
      throw new Error(`${i + 1}行目：評価はすべて1〜5で入力してください。`);
    }

    numbers.add(no);

    horses.push({
  no,
  name,
  odds,
  form: values[0],
  distance: values[1],
  course: values[2],
  jockey: values[3],
  going: values[4],
  runningStyle
});
  });

  if (horses.length < 3) {
    throw new Error("出走馬を3頭以上入力してください。");
  }

  return horses;
}

// オッズから市場評価を算出
function marketProbabilities(horses) {
  const inverse = horses.map(h => 1 / h.odds);
  const total = inverse.reduce((a, b) => a + b, 0);

  return inverse.map(v => v / total);
}

// 再現可能な乱数生成
function seededRandom(seed) {
  let x = seed >>> 0;

  return function() {
    x += 0x6D2B79F5;
    let t = x;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plackett-Luce方式による順位シミュレーション
// 各馬の強さに応じて1〜3着を繰り返し抽選する
function simulatePlaces(horses, weights) {
  const N = 5000;
  const counts = new Array(horses.length).fill(0);

  const seedText = horses
    .map(h => `${h.no}:${h.odds}:${h.form}:${h.distance}:${h.course}:${h.jockey}:${h.going}`)
    .join("|");

  let seed = 2166136261;

  for (let i = 0; i < seedText.length; i++) {
    seed = Math.imul(seed ^ seedText.charCodeAt(i), 16777619);
  }
const random = seededRandom(seed);

  for (let n = 0; n < N; n++) {
    const remaining = weights.map((w, i) => ({
      index: i,
      weight: w
    }));

    for (let place = 0; place < Math.min(horses.length >= 8 ? 3 : horses.length >= 2 ? 2 : 1, horses.length); place++) {
      const total = remaining.reduce(
        (sum, h) => sum + h.weight, 0
      );

      let target = random() * total;
      let selected = 0;

      for (let j = 0; j < remaining.length; j++) {
        target -= remaining[j].weight;

        if (target <= 0) {
          selected = j;
          break;
        }
      }

      const winner = remaining.splice(selected, 1)[0];
      counts[winner.index]++;
    }
  }

  return counts.map(v => v / N * 100);
}
  
// v3予想本体
function calculatePrediction() {
  const horses = parseHorses();
  const pace = $("racePace").value;
 
  let ow = Number($("oddsWeight").value);
  let fw = Number($("formWeight").value);

  const weightTotal = ow + fw || 1;
  ow /= weightTotal;
  fw /= weightTotal;

  // 市場オッズの評価
  const market = marketProbabilities(horses);
  const maxMarket = Math.max(...market);

  const analyzed = horses.map((h, i) => {
    const scores = {
      form: ratingScore(h.form),
      distance: ratingScore(h.distance),
      course: ratingScore(h.course),
      jockey: ratingScore(h.jockey),
      odds: market[i] / maxMarket * 100,
      going: ratingScore(h.going)
    };

    // 既存のオッズ・近走重視スライダーも利用
    const otherWeight = 0.30;

       // ペースと脚質の相性を評価
    let paceBonus = 0;

    if (pace === "slow") {
      if (h.runningStyle === "逃げ") paceBonus = 8;
      else if (h.runningStyle === "先行") paceBonus = 5;
      else if (h.runningStyle === "差し") paceBonus = -2;
      else if (h.runningStyle === "追込") paceBonus = -4;
    } else if (pace === "fast") {
      if (h.runningStyle === "逃げ") paceBonus = -5;
      else if (h.runningStyle === "先行") paceBonus = -2;
      else if (h.runningStyle === "差し") paceBonus = 5;
      else if (h.runningStyle === "追込") paceBonus = 8;
    }

    const adjustedScore =
      scores.odds * ow +
      scores.form * fw +
      scores.distance * otherWeight * (0.30 / 0.70) +
      scores.course * otherWeight * (0.30 / 0.70) +
      scores.jockey * otherWeight * (0.20 / 0.70) +
      scores.going * otherWeight * (0.20 / 0.70) +
      paceBonus;

    return {
      ...h,
      scores,
      total: adjustedScore
    };
  });

  /// 確率変換（極端な勝率を抑える調整）
const temperature = 30;

const maxTotal = Math.max(...analyzed.map(h => h.total));

const strengths = analyzed.map(h =>
  Math.exp((h.total - maxTotal) / temperature)
);

  const sum = strengths.reduce((a, b) => a + b, 0);

  const placeRates = simulatePlaces(analyzed, strengths);

  const results = analyzed.map((h, i) => {
    const winRate = strengths[i] / sum * 100;
    const expectedValue = (winRate / 100) * h.odds;

    return {
      ...h,
      winRate,
      placeRate: placeRates[i],
      expectedValue,
      edge: (expectedValue - 1) * 100
    };
  });

  return results.sort((a, b) => b.total - a.total)
    .map((h, i) => ({
      ...h,
      rank: i + 1
    }));
}

// 予想結果を画面に表示
function renderPrediction() {
  try {
    lastPrediction = calculatePrediction();

    $("predictionError").textContent = "";

    const rows = lastPrediction.map(h => {
      const label =
        h.rank === 1 ? "本命" :
        h.rank === 2 ? "対抗" :
        h.rank <= 4 ? "有力" : "候補";

      return `
        <tr>
          <td><span class="rank-badge">${h.rank}</span></td>
          <td>
            ${esc(h.no)} ${esc(h.name)}
            <br><small>${label}</small>
          </td>
          <td>${h.total.toFixed(1)}</td>
          <td>${h.winRate.toFixed(2)}%</td>
          <td>${h.placeRate.toFixed(1)}%</td>
          <td>${h.odds.toFixed(1)}倍</td>
          <td>${h.expectedValue.toFixed(3)}</td>
        </tr>
      `;
    }).join("");

    $("predictionResults").innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>順位</th>
              <th>馬名・評価</th>
              <th>総合点</th>
              <th>推定勝率</th>
              <th>推定複勝率</th>
              <th>オッズ</th>
              <th>期待値指数</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="hint">
        勝率はモデル内の相対確率。複勝率は順位シミュレーションによる推定値。
        いずれも実測校正前の参考値です。
      </p>
    `;

    renderBetCandidates();

  } catch (error) {
    lastPrediction = [];
    $("predictionError").textContent = error.message;
    $("predictionResults").innerHTML =
      '<div class="empty">入力内容を確認してください。</div>';
    $("predictionBets").innerHTML =
      '<div class="empty">有効なデータがありません。</div>';
  }
}

// 買い目候補
function renderBetCandidates() {
  const top = [...lastPrediction]
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  const type = $("predBetType").value;

  let bets = [];

  if (type === "wide" || type === "umaren") {
    for (let i = 0; i < Math.min(3, top.length); i++) {
      for (let j = i + 1; j < Math.min(3, top.length); j++) {
        bets.push(`${top[i].no}-${top[j].no}`);
      }
    }
  } else if (top.length >= 3) {
    bets.push(
      `${top[0].no}-${top[1].no}-${top[2].no}`
    );
  }

  $("predictionBets").innerHTML = `
    <p><strong>${
      type === "wide" ? "ワイド" :
      type === "umaren" ? "馬連" : "3連複"
    }候補</strong></p>
    <p>${bets.map(esc).join(" ／ ")}</p>
    <p class="hint">
      上位評価馬の組み合わせです。
      券種ごとの払戻期待値は未計算です。
    </p>
  `;
}

// 馬追加
$("addHorse").onclick = () => {
  const current = $("horseInput").value.trim();

  $("horseInput").value =
    current +
    (current ? "\n" : "") +
    "7,追加ホース,10.0,3,3,3,3,3";
};

// 重みスライダー
$("oddsWeight").addEventListener("input", () => {
  $("oddsWeightLabel").textContent =
    $("oddsWeight").value + "%";

  $("formWeight").value =
    100 - Number($("oddsWeight").value);

  $("formWeightLabel").textContent =
    $("formWeight").value + "%";
});

$("formWeight").addEventListener("input", () => {
  $("formWeightLabel").textContent =
    $("formWeight").value + "%";

  $("oddsWeight").value =
    100 - Number($("formWeight").value);

  $("oddsWeightLabel").textContent =
    $("oddsWeight").value + "%";
});

// 予想実行
$("runPrediction").onclick = renderPrediction;

// 保存
$("savePredictionRace").onclick = () => {
  if (!lastPrediction.length) {
    renderPrediction();
  }

  if (!lastPrediction.length) return;

  const raceName =
    $("predRaceName").value.trim() || "自動予想レース";

  const top = lastPrediction
    .slice(0, 3)
    .map(h =>
      `${h.rank}位 ${h.no} ${h.name} ` +
      `(勝率 ${h.winRate.toFixed(2)}%)`
    )
    .join(" / ");

  const r = {
    id: uid(),
    date: new Date().toISOString().slice(0, 10),
    venue: "未入力",
    raceNo: "未入力",
    raceName,
    course: "",
    going: "",
    prediction: top,
    predictedHorses: lastPrediction.map(h => h.no).join(","),
    modelVersion: "AI予想 v3",
    stake: 0,
    payout: 0,
    settled: false,
    notes:
      "券種候補: " +
      $("predBetType").selectedOptions[0].textContent +
      "\n出走馬:\n" +
      $("horseInput").value +
      "\n予想順位・勝率・複勝率:\n" +
      lastPrediction.map(h =>
        `${h.rank}位 ${h.no} ${h.name} ` +
        `勝率${h.winRate.toFixed(2)}% ` +
        `複勝率${h.placeRate.toFixed(1)}%`
      ).join("\n")
  };

  races.push(r);
  save();
  showView("races");

  alert("AI予想 v3をレース管理に保存しました。");
};

// 初期表示
renderPrediction();
// レースデータのバックアップ・復元
window.exportRaceBackup = function() {
  const data = JSON.stringify(races, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

a.href = url;
a.download = "keiba-backup.json";
document.body.appendChild(a);
a.click();
a.remove();

setTimeout(() => URL.revokeObjectURL(url), 1000);
  URL.revokeObjectURL(url);
};

window.importRaceBackup = function(file) {
  const reader = new FileReader();

  reader.onload = function() {
    try {
      const imported = JSON.parse(reader.result);

      if (!Array.isArray(imported)) {
        throw new Error("ファイル形式が違います");
      }

      if (!confirm("現在のレース記録を置き換えて復元しますか？")) {
        return;
      }

      races = imported;
      save();
      alert("レース記録を復元しました！");
    } catch (e) {
      alert("復元できませんでした。バックアップファイルを確認してください。");
    }
  };

  reader.readAsText(file);
};
// 過去GⅠ一括検証：予想上位3頭の3着以内的中率を計算
const bulkTestButton = document.getElementById("runBulkTest");
const bulkTestFile = document.getElementById("bulkTestFile");
const bulkTestStatus = document.getElementById("bulkTestStatus");
const bulkTestResults = document.getElementById("bulkTestResults");
const BUILTIN_TEST_CSV = `raceName,horseNo,horseName,odds,form,distance,course,jockey,going,runningStyle,pace,actualRank
有馬記念2025,1,エキサイトバイオ,3,,,,3,,,,8
有馬記念2025,2,シンエンペラー,3,,,,3,,,,14
有馬記念2025,3,ジャスティンパレス,3,,,,3,,,,7
有馬記念2025,4,ミュージアムマイル,3,,,,3,,,,1
有馬記念2025,5,レガレイラ,3,,,,3,,,,4
有馬記念2025,6,メイショウタバル,3,,,,3,,,,13
有馬記念2025,7,サンライズジパング,3,,,,3,,,,5
有馬記念2025,8,シュヴァリエローズ,3,,,,3,,,,10
有馬記念2025,9,ダノンデサイル,3,,,,3,,,,3
有馬記念2025,10,コスモキュランダ,3,,,,3,,,,2
有馬記念2025,11,ミステリーウェイ,3,,,,3,,,,16
有馬記念2025,12,マイネルエンペラー,3,,,,3,,,,9
有馬記念2025,13,アドマイヤテラ,3,,,,3,,,,11
有馬記念2025,14,アラタ,3,,,,3,,,,15
有馬記念2025,15,エルトンバローズ,3,,,,3,,,,12
有馬記念2025,16,タスティエーラ,3,,,,3,,,,6
ジャパンカップ2025,1,ジャスティンパレス,3,,,,3,,,,5
ジャパンカップ2025,2,クロワデュノール,3,,,,3,,,,4
ジャパンカップ2025,3,コスモキュランダ,3,,,,3,,,,9
ジャパンカップ2025,4,ディープモンスター,3,,,,3,,,,11
ジャパンカップ2025,5,サンライズアース,3,,,,3,,,,15
ジャパンカップ2025,6,ホウオウビスケッツ,3,,,,3,,,,16
ジャパンカップ2025,7,ダノンベルーガ,3,,,,3,,,,13
ジャパンカップ2025,8,カランダガン,3,,,,3,,,,1
ジャパンカップ2025,9,セイウンハーデス,3,,,,3,,,,12
ジャパンカップ2025,10,シュトルーヴェ,3,,,,3,,,,10
ジャパンカップ2025,12,ヨーホーレイク,3,,,,3,,,,14
ジャパンカップ2025,13,ブレイディヴェーグ,3,,,,3,,,,6
ジャパンカップ2025,14,ダノンデサイル,3,,,,3,,,,3
ジャパンカップ2025,15,マスカレードボール,3,,,,3,,,,2
ジャパンカップ2025,16,シンエンペラー,3,,,,3,,,,8
ジャパンカップ2025,18,タスティエーラ,3,,,,3,,,,7
`;


if (bulkTestButton && bulkTestFile) {
  bulkTestButton.addEventListener("click", async function () {
    const file = bulkTestFile.files[0];
const useSample = this.dataset.useSample === "true";

if (!file && !useSample) {
  bulkTestStatus.textContent =
    "CSVファイルを選ぶか、内蔵データボタンを押してください。";
  return;
}

try {
  const csvText = (useSample
    ? BUILTIN_TEST_CSV
    : await file.text()
  ).replace(/^\uFEFF/, "");

  this.dataset.useSample = "false";

      // カンマ区切りを解析（ダブルクォート内のカンマにも対応）
      function parseCSVLine(line) {
        const values = [];
        let value = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              value += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            values.push(value.trim());
            value = "";
          } else {
            value += char;
          }
        }

        values.push(value.trim());
        return values;
      }

      const lines = csvText
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

      if (lines.length < 2) {
        throw new Error("CSVにデータ行がありません。");
      }

      const headers = parseCSVLine(lines[0]).map(h =>
        h.trim().toLowerCase()
      );

      const required = [
        "racename",
        "horseno",
        "horsename",
        "odds",
        "form",
        "distance",
        "course",
        "jockey",
        "going",
        "runningstyle",
        "pace",
        "actualrank"
      ];

      const missing = required.filter(h => !headers.includes(h));

      if (missing.length > 0) {
        throw new Error(
          "CSVに必要な列がありません：" + missing.join(", ")
        );
      }

      const column = name => headers.indexOf(name);

      const races = new Map();

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);

        if (row.length !== headers.length) {
          throw new Error(
            `${i + 1}行目：列の数がヘッダーと一致しません。`
          );
        }

        const raceName = row[column("racename")];
        const no = row[column("horseno")];
        const name = row[column("horsename")];
        const odds = Number(row[column("odds")]);
        const actualRank = Number(row[column("actualrank")]);

        if (!raceName || !no || !name) {
          throw new Error(`${i + 1}行目：レース名・馬番・馬名が必要です。`);
        }

        if (!Number.isFinite(odds) || odds <= 0) {
          throw new Error(`${i + 1}行目：オッズは0より大きい数にしてください。`);
        }

        if (!Number.isInteger(actualRank) || actualRank < 1) {
          throw new Error(`${i + 1}行目：実際の着順を確認してください。`);
        }

        const ratingKeys = ["form", "distance", "course", "jockey", "going"];

const ratings = ratingKeys.map(key => {
  const value = row[column(key)];
  if (value === undefined || String(value).trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 1 || number > 5) {
    throw new Error(`${i + 1}行目：評価は空欄、または1〜5で入力してください。`);
  }

  return number;
});

       const runningStyle = row[column("runningstyle")];
const pace = row[column("pace")];

if (runningStyle && !["逃げ", "先行", "差し", "追込"].includes(runningStyle)) {
  throw new Error(
    `${i + 1}行目：脚質は「逃げ・先行・差し・追込」のいずれかにしてください。`
  );
}

if (pace && !["slow", "fast"].includes(pace)) {
  throw new Error(
    `${i + 1}行目：ペースは slow または fast にしてください。`
  );
}
        const horse = {
          no,
          name,
          odds,
          form: ratings[0],
          distance: ratings[1],
          course: ratings[2],
          jockey: ratings[3],
          going: ratings[4],
          runningStyle,
          pace,
          actualRank
        };

        if (!races.has(raceName)) {
          races.set(raceName, []);
        }

        races.get(raceName).push(horse);
      }

      // 通常の予想画面と同じ重みを使用
      let ow = Number(document.getElementById("oddsWeight")?.value ?? 50);
      let fw = Number(document.getElementById("formWeight")?.value ?? 50);

      const weightTotal = ow + fw || 1;
      ow /= weightTotal;
      fw /= weightTotal;

      let checkedRaces = 0;
      let predictedCount = 0;
      let hitCount = 0;
      const details = [];

      for (const [raceName, horses] of races) {
        if (horses.length < 3) {
          details.push(
            `<p>${raceName}：出走馬が3頭未満のため検証対象外</p>`
          );
          continue;
        }

        const pace = horses[0].pace;

        if (horses.some(h => h.pace !== pace)) {
          throw new Error(
            `${raceName}：同じレースのペース設定を統一してください。`
          );
        }

        const market = marketProbabilities(horses);
        const maxMarket = Math.max(...market);

        const analyzed = horses.map((h, i) => {
          const scores = {
  form: h.form == null ? 50 : ratingScore(h.form),
  distance: h.distance == null ? 50 : ratingScore(h.distance),
  course: h.course == null ? 50 : ratingScore(h.course),
  jockey: h.jockey == null ? 50 : ratingScore(h.jockey),
  odds: market[i] / maxMarket * 100,
  going: h.going == null ? 50 : ratingScore(h.going)
};

          const otherWeight = 0.30;
          let paceBonus = 0;

          if (pace === "slow") {
            if (h.runningStyle === "逃げ") paceBonus = 8;
            else if (h.runningStyle === "先行") paceBonus = 5;
            else if (h.runningStyle === "差し") paceBonus = -2;
            else if (h.runningStyle === "追込") paceBonus = -4;
          } else if (pace === "fast") {
            if (h.runningStyle === "逃げ") paceBonus = -5;
            else if (h.runningStyle === "先行") paceBonus = -2;
            else if (h.runningStyle === "差し") paceBonus = 5;
            else if (h.runningStyle === "追込") paceBonus = 8;
          }

          const total =
            scores.odds * ow +
            scores.form * fw +
            scores.distance * otherWeight * (0.30 / 0.70) +
            scores.course * otherWeight * (0.30 / 0.70) +
            scores.jockey * otherWeight * (0.20 / 0.70) +
            scores.going * otherWeight * (0.20 / 0.70) +
            paceBonus;

          return { ...h, total };
        });

        // 予想スコア順に並べ、上位3頭を予想馬とする
        const ranked = analyzed.sort((a, b) => b.total - a.total);
        const predicted = ranked.slice(0, 3);
        const hits = predicted.filter(h => h.actualRank <= 3);

        checkedRaces++;
        predictedCount += predicted.length;
        hitCount += hits.length;

        details.push(
          `<p><strong>${raceName}</strong>：予想上位3頭のうち` +
          `${hits.length}頭が3着以内` +
          `<br>予想馬：${predicted.map(h =>
            `${h.no}番 ${h.name}`
          ).join("、")}</p>`
        );
      }

      if (checkedRaces === 0) {
        throw new Error(
          "検証できるレースがありません。各レースに3頭以上の出走馬を入力してください。"
        );
      }

      const hitRate = hitCount / predictedCount * 100;

      bulkTestStatus.textContent =
        `検証完了：${checkedRaces}レースを計算しました。`;

      bulkTestResults.innerHTML = `
        <h2>一括検証結果</h2>
        <p>検証レース数：${checkedRaces}レース</p>
        <p>予想馬の合計：${predictedCount}頭分</p>
        <p>3着以内に入った予想馬：${hitCount}頭分</p>
        <p><strong>予想馬の3着以内的中率：${hitRate.toFixed(1)}%</strong></p>
        <hr>
        <h3>レース別結果</h3>
        ${details.join("")}
      `;

    } catch (error) {
      console.error("一括検証エラー:", error);

      bulkTestStatus.textContent =
        "一括検証に失敗しました：" + error.message;

      bulkTestResults.textContent = "";
    }
  });
}
// 内蔵サンプルデータ読み込みボタン
const loadSampleTestButton = document.getElementById("loadSampleTest");

if (loadSampleTestButton && bulkTestButton) {
  loadSampleTestButton.addEventListener("click", function () {
    bulkTestButton.dataset.useSample = "true";
    bulkTestButton.click();
  });
}
console.log("サンプルボタンの処理を読み込みました");
// フェブラリーS過去データ分析
async function loadFebAnalysis() {
  const status = document.getElementById("febDataStatus");
  const summary = document.getElementById("febSummary");
  const popularity = document.getElementById("febPopularity");
  const corner = document.getElementById("febCorner");
  const positionChange = document.getElementById("febPositionChange");

  if (!status || status.dataset.loaded === "true") return;

  status.textContent = "CSVを読み込んでいます...";

  try {
    const response = await fetch("./feb_results_clean.csv");
    if (!response.ok) {
      throw new Error("CSVファイルが見つかりません");
    }

    const csv = (await response.text()).replace(/^\uFEFF/, "");
    const lines = csv.trim().split(/\r?\n/);

    function parseLine(line) {
      const result = [];
      let value = "";
      let quoted = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (quoted && line[i + 1] === '"') {
            value += '"';
            i++;
          } else {
            quoted = !quoted;
          }
        } else if (char === "," && !quoted) {
          result.push(value.trim());
          value = "";
        } else {
          value += char;
        }
      }

      result.push(value.trim());
      return result;
    }

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = parseLine(line);
      const item = {};
      headers.forEach((header, index) => {
        item[header] = values[index] ?? "";
      });
      return item;
    });

    const number = value => {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    };

    const total = rows.length;
    const years = new Set(rows.map(row => row["年"])).size;

    summary.innerHTML = `
      <p>収録頭数：<strong>${total}頭</strong></p>
      <p>収録年数：<strong>${years}年分</strong></p>
    `;

    function makeTable(title, data) {
      if (!data.length) return "<p>データがありません。</p>";

      return `
        <h3>${title}</h3>
        <table>
          <thead>
            <tr>${Object.keys(data[0]).map(key => `<th>${key}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>${Object.values(item).map(value => `<td>${value}</td>`).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    function makeStats(key, label) {
      const groups = {};

      rows.forEach(row => {
        const value = number(row[key]);
        const rank = number(row["着順"]);

        if (value === null || rank === null) return;

        const name = label(value);
        if (!groups[name]) {
          groups[name] = { count: 0, wins: 0, top3: 0, rankTotal: 0 };
        }

        groups[name].count++;
        groups[name].rankTotal += rank;
        if (rank === 1) groups[name].wins++;
        if (rank <= 3) groups[name].top3++;
      });

      return Object.entries(groups)
        .map(([name, stat]) => ({
          [key]: name,
          頭数: stat.count,
          平均着順: (stat.rankTotal / stat.count).toFixed(2),
          優勝: stat.wins,
          "3着以内": stat.top3
        }));
    }

    const popularityStats = makeStats("単勝人気", value => `${value}番人気`);
    popularity.innerHTML = makeTable("単勝人気別の成績", popularityStats);

    const cornerStats = makeStats("4コーナー位置", value => `${value}番手グループ`);
    corner.innerHTML = makeTable("4コーナー位置別の成績", cornerStats);

    const changes = {};
    rows.forEach(row => {
      const three = number(row["3コーナー位置"]);
      const four = number(row["4コーナー位置"]);
      const rank = number(row["着順"]);

      if (three === null || four === null || rank === null) return;

      const diff = three - four;
      if (!changes[diff]) {
        changes[diff] = { count: 0, wins: 0, top3: 0 };
      }

      changes[diff].count++;
      if (rank === 1) changes[diff].wins++;
      if (rank <= 3) changes[diff].top3++;
    });

    const changeStats = Object.entries(changes)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([diff, stat]) => ({
        位置変化: Number(diff) > 0 ? `前進 +${diff}` :
          Number(diff) < 0 ? `後退 ${diff}` : "変化なし",
        頭数: stat.count,
        優勝: stat.wins,
        "3着以内": stat.top3
      }));

    positionChange.innerHTML = makeTable("3コーナーから4コーナーへの位置変化", changeStats);

    status.textContent = "読み込み完了！";
    status.dataset.loaded = "true";

  } catch (error) {
    console.error("フェブラリーS分析エラー:", error);
    status.textContent = "読み込み失敗：" + error.message;
  }
}

document.querySelectorAll('[data-view="febAnalysis"]').forEach(button => {
  button.addEventListener("click", loadFebAnalysis);
});

console.log("フェブラリーS分析機能を読み込みました");
