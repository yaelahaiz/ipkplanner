import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const [nim,name,password]=process.argv.slice(2);
if(!nim||!name||!password||password.length<6){console.error('Pakai: node scripts/create-admin.mjs <NIM> "<Nama>" <password-min-6>');process.exit(1)}
const privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
let credential;
if(process.env.FIREBASE_PROJECT_ID&&process.env.FIREBASE_CLIENT_EMAIL&&privateKey){credential=cert({projectId:process.env.FIREBASE_PROJECT_ID,clientEmail:process.env.FIREBASE_CLIENT_EMAIL,privateKey})}
else if(process.env.GOOGLE_APPLICATION_CREDENTIALS){credential=applicationDefault()}
else{console.error("Firebase Admin environment variables belum lengkap.");process.exit(1)}
const app=initializeApp({credential,projectId:process.env.FIREBASE_PROJECT_ID});
const auth=getAuth(app),db=getFirestore(app),email=`${nim.trim().toLowerCase()}@student.ipk.local`;
let user;try{user=await auth.getUserByEmail(email);await auth.updateUser(user.uid,{password,displayName:name,disabled:false})}catch(e){if(e.code!=="auth/user-not-found")throw e;user=await auth.createUser({email,password,displayName:name})}
await db.collection("users").doc(user.uid).set({nim:nim.trim().toLowerCase(),name:name.trim(),role:"admin",active:true,createdAt:new Date()},{merge:true});console.log(`Admin ${nim} siap digunakan.`);process.exit(0);
