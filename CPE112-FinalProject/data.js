// ============================================================
//  PROVINCE DATA  (name → code, name → [lat, lng])
// ============================================================
const PROVINCE_CODES = {
  "กทม":"BKK","กระบี่":"KBI","กาญจนบุรี":"KAN","กาฬสินธุ์":"KAL",
  "กำแพงเพชร":"KPT","ขอนแก่น":"KKC","จันทบุรี":"CTI","ฉะเชิงเทรา":"CCO",
  "ชลบุรี":"CHB","ชัยนาท":"CNT","ชัยภูมิ":"CPM","ชุมพร":"CJM",
  "เชียงราย":"CEI","เชียงใหม่":"CNX","ตรัง":"TST","ตราด":"TDX",
  "ตาก":"TAK","นครนายก":"NYK","นครปฐม":"NPT","นครพนม":"KOP",
  "นครราชสีมา":"NAK","นครศรีธรรมราช":"NST","นครสวรรค์":"NWN",
  "นนทบุรี":"NBI","นราธิวาส":"NAW","น่าน":"NNT","บึงกาฬ":"BKN",
  "บุรีรัมย์":"BFV","ปทุมธานี":"PTE","ประจวบคีรีขันธ์":"PKN",
  "ปราจีนบุรี":"PRI","ปัตตานี":"PTN","พระนครศรีอยุธยา":"AYA",
  "พะเยา":"PYO","พังงา":"PNA","พัทลุง":"PLG","พิจิตร":"PCT",
  "พิษณุโลก":"PHS","เพชรบุรี":"PBI","เพชรบูรณ์":"PHY","แพร่":"PRH",
  "ภูเก็ต":"HKT","มหาสารคาม":"MKM","มุกดาหาร":"MDH","แม่ฮ่องสอน":"HGN",
  "ยโสธร":"YST","ยะลา":"YLA","ร้อยเอ็ด":"ROI","ระนอง":"UNN",
  "ระยอง":"RYG","ราชบุรี":"RBR","ลพบุรี":"LRI","ลำปาง":"LPT",
  "ลำพูน":"LPN","เลย":"LOE","ศรีสะเกษ":"SSK","สกลนคร":"SNO",
  "สงขลา":"SGZ","สตูล":"SAT","สมุทรปราการ":"SPK","สมุทรสงคราม":"SKM",
  "สมุทรสาคร":"SKN","สระแก้ว":"SKW","สระบุรี":"SRI","สิงห์บุรี":"SBR",
  "สุโขทัย":"THS","สุพรรณบุรี":"SPB","สุราษฎร์ธานี":"URT",
  "สุรินทร์":"SRN","หนองคาย":"NKI","หนองบัวลำภู":"NBP",
  "อ่างทอง":"ATG","อำนาจเจริญ":"ACR","อุดรธานี":"UTH",
  "อุตรดิตถ์":"UTD","อุทัยธานี":"UTI","อุบลราชธานี":"UBP"
};

// Approximate geographic coordinates [lat, lng]
const PROVINCE_COORDS = {
  "กทม":[13.75,100.52],"กระบี่":[8.09,98.91],"กาญจนบุรี":[14.00,99.55],
  "กาฬสินธุ์":[16.43,103.50],"กำแพงเพชร":[16.48,99.52],"ขอนแก่น":[16.43,102.84],
  "จันทบุรี":[12.61,102.10],"ฉะเชิงเทรา":[13.69,101.08],"ชลบุรี":[13.36,100.99],
  "ชัยนาท":[15.19,100.12],"ชัยภูมิ":[15.81,102.03],"ชุมพร":[10.49,99.18],
  "เชียงราย":[19.91,99.83],"เชียงใหม่":[18.79,98.99],"ตรัง":[7.56,99.62],
  "ตราด":[12.24,102.52],"ตาก":[16.88,99.13],"นครนายก":[14.20,101.21],
  "นครปฐม":[13.82,100.06],"นครพนม":[17.39,104.78],"นครราชสีมา":[14.98,102.10],
  "นครศรีธรรมราช":[8.43,99.96],"นครสวรรค์":[15.70,100.13],"นนทบุรี":[13.86,100.51],
  "นราธิวาส":[6.43,101.82],"น่าน":[18.78,100.78],"บึงกาฬ":[18.36,103.65],
  "บุรีรัมย์":[14.99,103.10],"ปทุมธานี":[14.02,100.53],"ประจวบคีรีขันธ์":[11.82,99.80],
  "ปราจีนบุรี":[14.05,101.37],"ปัตตานี":[6.87,101.25],"พระนครศรีอยุธยา":[14.36,100.59],
  "พะเยา":[19.16,100.20],"พังงา":[8.45,98.53],"พัทลุง":[7.62,100.07],
  "พิจิตร":[16.44,100.35],"พิษณุโลก":[16.82,100.27],"เพชรบุรี":[13.11,99.94],
  "เพชรบูรณ์":[16.42,101.16],"แพร่":[18.14,100.14],"ภูเก็ต":[7.89,98.40],
  "มหาสารคาม":[16.18,103.30],"มุกดาหาร":[16.54,104.72],"แม่ฮ่องสอน":[19.30,97.97],
  "ยโสธร":[15.79,104.14],"ยะลา":[6.55,101.28],"ร้อยเอ็ด":[16.05,103.65],
  "ระนอง":[9.97,98.63],"ระยอง":[12.68,101.27],"ราชบุรี":[13.54,99.82],
  "ลพบุรี":[14.80,100.65],"ลำปาง":[18.29,99.49],"ลำพูน":[18.58,98.97],
  "เลย":[17.49,101.73],"ศรีสะเกษ":[15.12,104.32],"สกลนคร":[17.15,104.15],
  "สงขลา":[7.19,100.60],"สตูล":[6.63,100.07],"สมุทรปราการ":[13.60,100.60],
  "สมุทรสงคราม":[13.41,99.99],"สมุทรสาคร":[13.55,100.27],"สระแก้ว":[13.82,102.06],
  "สระบุรี":[14.53,100.91],"สิงห์บุรี":[14.89,100.40],"สุโขทัย":[17.01,99.82],
  "สุพรรณบุรี":[14.47,100.12],"สุราษฎร์ธานี":[9.14,99.33],"สุรินทร์":[14.88,103.49],
  "หนองคาย":[17.88,102.74],"หนองบัวลำภู":[17.21,102.44],"อ่างทอง":[14.59,100.46],
  "อำนาจเจริญ":[15.87,104.63],"อุดรธานี":[17.41,102.79],"อุตรดิตถ์":[17.62,100.10],
  "อุทัยธานี":[15.38,100.03],"อุบลราชธานี":[15.23,104.85]
};

// Transport style mapping
const TRANSPORT_STYLE = {
  "เครื่องบิน":{ cls:"t-air",  emoji:"✈️" },
  "รถไฟ":     { cls:"t-train",emoji:"🚆" },
  "รถบัส":    { cls:"t-bus",  emoji:"🚌" },
  "รถยนต์":   { cls:"t-car",  emoji:"🚗" },
  "เรือ":     { cls:"t-boat", emoji:"⛴️" },
};
function getTS(transport){
  if(!transport) return {cls:"t-def",emoji:"🚏",label:"ไม่ระบุ"};
  for(const k of Object.keys(TRANSPORT_STYLE)){
    if(transport.includes(k)){
      return {...TRANSPORT_STYLE[k], label:transport};
    }
  }
  return {cls:"t-def",emoji:"🚏",label:transport};
}

// ============================================================
//  GRAPH
// ============================================================
class Graph{
  constructor(){this.adj=new Map()}
  addVertex(v){if(!this.adj.has(v))this.adj.set(v,[])}
  addEdge(s,d,t,dist,time,price){
    if(!this.adj.has(s))this.addVertex(s);
    this.adj.get(s).push({destination:d,transport:t,distance:dist,time,price});
  }
  neighbors(v){return this.adj.get(v)||[]}
  vertices(){return[...this.adj.keys()]}
}

// ============================================================
//  DIJKSTRA
// ============================================================
function dijkstra(graph,start,end,useDist,useTime,usePrice){
  const INF=Infinity, dist={}, prev={};
  for(const v of graph.vertices()) dist[v]=INF;
  dist[start]=0;

  // Simple priority queue using array+sort (fine for ~77 nodes)
  const pq=[{node:start,w:0}];

  while(pq.length){
    pq.sort((a,b)=>a.w-b.w);
    const {node:cur,w:cw}=pq.shift();
    if(cur===end) break;
    if(cw>dist[cur]) continue;
    for(const e of graph.neighbors(cur)){
      let ew=0;
      if(useDist) ew+=e.distance;
      if(useTime)  ew+=e.time;
      if(usePrice) ew+=e.price;
      const nw=cw+ew;
      if(nw<dist[e.destination]){
        dist[e.destination]=nw;
        prev[e.destination]={prevNode:cur,edge:e};
        pq.push({node:e.destination,w:nw});
      }
    }
  }

  if(!(end in prev)&&start!==end) return null;

  const path=[],edges=[];
  let cur=end;
  while(cur in prev){
    path.push(cur);
    edges.push(prev[cur].edge);
    cur=prev[cur].prevNode;
  }
  path.push(start);
  path.reverse();edges.reverse();
  return{path,edges};
}

// ============================================================
//  LOAD GRAPH
// ============================================================
async function loadGraph(){
  // Try multiple paths to handle different server setups
  const paths=['/data/weight_data.json','../data/weight_data.json','data/weight_data.json'];
  let data=null;
  for(const p of paths){
    try{
      const r=await fetch(p);
      if(r.ok){data=await r.json();break}
    }catch(e){}
  }
  if(!data) throw new Error('Cannot load weight_data.json. Run: python3 -m http.server 8765 from project root');
  const g=new Graph();
  for(const v of data.vertices) g.addVertex(v);
  for(const e of data.edges){
    g.addEdge(e.source,e.destination,e.transport,e.weights.distance,e.weights.time,e.weights.price);
  }
  return g;
}

// Map projection helpers (SVG viewBox 0 0 400 720)
const MAP_W=400, MAP_H=720;
const GEO_LAT_MIN=5.5, GEO_LAT_MAX=20.5;
const GEO_LNG_MIN=97.5, GEO_LNG_MAX=105.8;
function project(lat,lng){
  const x=(lng-GEO_LNG_MIN)/(GEO_LNG_MAX-GEO_LNG_MIN)*MAP_W;
  const y=(GEO_LAT_MAX-lat)/(GEO_LAT_MAX-GEO_LAT_MIN)*MAP_H;
  return[x,y];
}
