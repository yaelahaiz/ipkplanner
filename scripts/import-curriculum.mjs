import ExcelJS from "exceljs";
import nextEnv from "@next/env";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const { loadEnvConfig } = nextEnv; loadEnvConfig(process.cwd());
const file = process.argv[2];
if (!file) { console.error('Pakai: node scripts/import-curriculum.mjs "C:\\path\\kurikulum.xlsx"'); process.exit(1); }
const privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
const credential=privateKey&&process.env.FIREBASE_CLIENT_EMAIL?cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey}):applicationDefault();
const app=initializeApp({credential,projectId:process.env.FIREBASE_PROJECT_ID}); const db=getFirestore(app);
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile(file);
const text=(v)=>String(v?.text??v?.result??v??"").replace(/\s+/g," ").trim();

const profileSheet=wb.getWorksheet("1. Profil Lulusan");
const profiles=[3,4,5].map(r=>{const raw=text(profileSheet.getCell(r,3).value);const split=raw.match(/^\d+\.\s*([^-(]+)(?:\s*-\s*([^()]+))?\s*\((.*)\)$/);return {code:`PEO${r-2}`,title:(split?.[2]||split?.[1]||raw).trim(),description:(split?.[3]||raw).trim()}});
const cplSheet=wb.getWorksheet("3. CPL Prodi");
const cpls=[];for(let r=3;r<=12;r++)cpls.push({code:text(cplSheet.getCell(r,2).value).replace("CPL0","CPL"),description:text(cplSheet.getCell(r,3).value),keyword:text(cplSheet.getCell(r,4).value),profileCodes:[]});

const mapSheet=wb.getWorksheet("5. CPL-PEO");
for(let r=1;r<=Math.min(mapSheet.rowCount,100);r++){const row=mapSheet.getRow(r);const code=text(row.getCell(2).value).replace("CPL0","CPL");const cpl=cpls.find(x=>x.code===code);if(!cpl)continue;for(let c=3;c<=5;c++)if(text(row.getCell(c).value))cpl.profileCodes.push(`PEO${c-2}`)}

const courseSheet=wb.getWorksheet("10. Susunan Mata Kuliah"); const courses=[];
for(let r=3;r<=52;r++){const name=text(courseSheet.getCell(r,3).value);if(!name)continue;let semester=null;for(let c=5;c<=12;c++)if(text(courseSheet.getCell(r,c).value)){semester=c-4;break}courses.push({name,sks:Number(courseSheet.getCell(r,4).value)||0,semester,cplCodes:[]})}
const cplMk=wb.getWorksheet("9. CPL-MK");
for(let r=6;r<=64;r++){const name=text(cplMk.getCell(r,2).value);if(!name)continue;const found=courses.find(x=>x.name.toLowerCase()===name.toLowerCase())||courses.find(x=>x.name.toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(x.name.toLowerCase()));if(!found)continue;for(let c=3;c<=12;c++)if(text(cplMk.getCell(r,c).value))found.cplCodes.push(`CPL${c-2}`)}

const cpmkSheet=wb.getWorksheet("12b. Pemetaan CPL-CPMK-MK (2)"); const cpmks=[];let currentCpl="";
for(let r=4;r<=Math.min(cpmkSheet.rowCount,300);r++){const row=cpmkSheet.getRow(r);const rawCpl=text(row.getCell(2).value)||text(row.getCell(1).value);if(/^CPL\s*0?\d+$/i.test(rawCpl))currentCpl=`CPL${Number(rawCpl.match(/\d+/)[0])}`;const code=text(row.getCell(4).value),description=text(row.getCell(5).value),course=text(row.getCell(6).value);if(code&&description&&currentCpl)cpmks.push({code,description,course,cplCode:currentCpl})}

const curriculum={programCode:"TE",programName:"Teknik Elektro",target:70,profiles,cpls,courses,cpmks,source:"03_Template KurSarjanaTE - EL UAI-REV 2-8 - FINAL (1).xlsx",updatedAt:FieldValue.serverTimestamp()};
await db.collection("curricula").doc("teknik-elektro").set(curriculum);
console.log(`Kurikulum Teknik Elektro tersimpan: ${profiles.length} profil, ${cpls.length} CPL, ${courses.length} mata kuliah, ${cpmks.length} CPMK.`); process.exit(0);
