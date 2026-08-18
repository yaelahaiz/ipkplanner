"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { db } from "@/lib/firebase";
import { cumulativeStats, grades, semesterStats } from "@/lib/calculations";
import type { AcademicData, Course, Grade } from "@/lib/types";
import { FiPlus, FiTrash2, FiZap } from "react-icons/fi";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
const initialData = (): AcademicData => ({ targetSks: 144, semesters: Array.from({length:8},(_,i)=>({id:i+1,courses:[]})) });
const newCourse = (): Course => ({ id: crypto.randomUUID(), name:"", sks:"", grade:"A" });

export default function Planner({ uid, theme }: { uid:string; theme:string }) {
  const [data,setData] = useState<AcademicData>(initialData); const [active,setActive] = useState(1); const [loaded,setLoaded] = useState(false); const [saved,setSaved] = useState(false); const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{ getDoc(doc(db,"academicData",uid)).then(s=>{if(s.exists()) setData(s.data() as AcademicData); setLoaded(true);}); },[uid]);
  useEffect(()=>{if(!loaded)return; if(saveTimer.current)clearTimeout(saveTimer.current); saveTimer.current=setTimeout(async()=>{await setDoc(doc(db,"academicData",uid),data);setSaved(true);setTimeout(()=>setSaved(false),1400)},500);return()=>{if(saveTimer.current)clearTimeout(saveTimer.current)}},[data,loaded,uid]);
  const current=data.semesters.find(s=>s.id===active) || data.semesters[0]; const currentStats=semesterStats(current?.courses||[]); const global=cumulativeStats(data.semesters);
  const chartData=useMemo(()=>{let running:typeof data.semesters=[];return {labels:data.semesters.map(s=>`Sem ${s.id}`),datasets:[{label:"IPS (Per Sem)",data:data.semesters.map(s=>{const r=semesterStats(s.courses);return r.attemptedSks?r.ips:null}),borderColor:"#6366f1",backgroundColor:"rgba(99,102,241,.1)",fill:true,tension:.4},{label:"IPK (Kumulatif)",data:data.semesters.map(s=>{running=[...running,s];const r=cumulativeStats(running);return r.attemptedSks?r.ipk:null}),borderColor:"#10b981",borderDash:[5,5],tension:.2}]};},[data]);
  const updateCourse=useCallback((index:number,field:keyof Course,value:string)=>setData(d=>({...d,semesters:d.semesters.map(s=>s.id===active?{...s,courses:s.courses.map((c,i)=>i===index?{...c,[field]:field==="sks"?(value===""?"":Math.max(0,Number(value))):value}:c)}:s)})),[active]);
  const addCourse=()=>setData(d=>({...d,semesters:d.semesters.map(s=>s.id===active?{...s,courses:[...s.courses,newCourse()]}:s)}));
  const removeCourse=(index:number)=>setData(d=>({...d,semesters:d.semesters.map(s=>s.id===active?{...s,courses:s.courses.filter((_,i)=>i!==index)}:s)}));
  const addSemester=()=>{const id=data.semesters.length+1;setData(d=>({...d,semesters:[...d.semesters,{id,courses:[]}]}));setActive(id)};
  const deleteSemester=()=>{if(data.semesters.length<=1||active!==data.semesters.length)return;if(confirm(`Hapus Semester ${active}?`)){setData(d=>({...d,semesters:d.semesters.slice(0,-1)}));setActive(active-1)}};
  const reset=()=>{if(confirm("Hapus semua data akademik dan mulai dari awal?"))setData(initialData())};
  const fillExample=()=>setData(d=>({...d,semesters:d.semesters.map(s=>s.id===active?{...s,courses:[...s.courses,{...newCourse(),name:`Matkul A (Sem ${active})`,sks:3,grade:"A"},{...newCourse(),name:"Matkul B",sks:2,grade:"B+"},{...newCourse(),name:"Praktikum",sks:1,grade:"A"}]}:s)}));
  if(!loaded)return <div className="card">Memuat data akademik...</div>;
  return <>
    <div className="stats-bar"><Stat label="Total SKS Lulus" value={global.sks}/><Stat label="IPK Saat Ini" value={global.ipk.toFixed(2)} color="var(--success)"/><div className="stat-box"><div className="stat-label">Target Lulus</div><div className="flex"><input aria-label="Target SKS" type="number" min="1" value={data.targetSks} onChange={e=>setData({...data,targetSks:Number(e.target.value)||144})} style={{width:65,padding:"3px 5px",textAlign:"center"}}/><span className="muted">SKS</span></div></div><Stat label="Sisa SKS" value={Math.max(0,data.targetSks-global.sks)} color="var(--accent)"/></div>
    <div className="grid"><aside className="sem-nav">{data.semesters.map(s=>{const stat=semesterStats(s.courses);return <button key={s.id} className={`sem-btn ${active===s.id?"active":""}`} onClick={()=>setActive(s.id)}><span>Semester {s.id}</span><span className="mini-stat">{stat.attemptedSks?`${stat.sks} SKS lulus | IPS: ${stat.ips.toFixed(2)}`:"Kosong"}</span></button>})}<button className="sem-btn add-sem" onClick={addSemester}><FiPlus/> Tambah Semester</button></aside>
      <section className="stack"><div className="card chart"><Line key={theme} data={chartData} options={{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:theme==="light"?"#64748b":"#94a3b8"}}},scales:{y:{min:0,max:4,ticks:{color:theme==="light"?"#64748b":"#94a3b8"},grid:{color:theme==="light"?"#e2e8f0":"#334155"}},x:{ticks:{color:theme==="light"?"#64748b":"#94a3b8"},grid:{display:false}}}}}/></div>
      <div className="card"><div className="flex between section-head"><div><div className="flex"><h2>Semester {active}</h2>{active===data.semesters.length&&data.semesters.length>1&&<button className="btn danger" onClick={deleteSemester}><FiTrash2/> Hapus</button>}</div><p className="muted">D berbobot 1 dan E berbobot 0 dalam IPS/IPK, tetapi tidak menambah SKS lulus.</p></div><div className="ips"><span className="muted">IPS Sem Ini</span><strong>{currentStats.ips.toFixed(2)}</strong></div></div>
      <div className="table-wrap planner-table-wrap"><table className="planner-table"><thead><tr><th>Mata Kuliah</th><th style={{width:80}}>SKS</th><th style={{width:90}}>Nilai</th><th style={{width:45}}/></tr></thead><tbody>{current.courses.map((c,i)=><tr key={c.id}><td data-label="Mata Kuliah"><input value={c.name} onChange={e=>updateCourse(i,"name",e.target.value)} placeholder="Nama Matkul"/>{(c.grade==="D"||c.grade==="E")&&<span className="warning">Masuk IPS/IPK, tidak masuk SKS lulus</span>}</td><td data-label="SKS"><input type="number" min="0" value={c.sks} onChange={e=>updateCourse(i,"sks",e.target.value)}/></td><td data-label="Nilai"><select value={c.grade} onChange={e=>updateCourse(i,"grade",e.target.value as Grade)}>{grades.map(g=><option key={g}>{g}</option>)}</select></td><td className="row-delete"><button aria-label="Hapus mata kuliah" className="btn ghost icon" onClick={()=>removeCourse(i)}><FiTrash2/></button></td></tr>)}</tbody></table></div>
      <div className="flex course-actions" style={{marginTop:15}}><button className="btn primary" onClick={addCourse}><FiPlus/> Tambah Matkul</button><button className="btn ghost" onClick={fillExample}><FiZap/> Isi Contoh</button><button className="btn danger" onClick={reset}><FiTrash2/> Reset</button></div></div></section></div>{saved&&<div className="notice">Data tersimpan!</div>}
  </>;
}
function Stat({label,value,color}:{label:string;value:string|number;color?:string}){return <div className="stat-box"><div className="stat-label">{label}</div><div className="stat-val" style={{color}}>{value}</div></div>}
