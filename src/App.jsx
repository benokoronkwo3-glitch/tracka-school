import { useState, useEffect, useCallback } from "react";

const SB_URL = "https://saxtkbtmszkqstdoamvv.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheHRrYnRtc3prcXN0ZG9hbXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNDU0MzAsImV4cCI6MjA5NjYyMTQzMH0.uXpzhMg_QJR1Ewj5OfFlAwStDrP0gvolCqBrDE1mIqE";

const SCHOOLS = {
  noble_trail: {
    id:"noble_trail", name:"Noble Trail College",
    address:"16 Residency Drive GRA, Onitsha, Anambra State",
    state:"Anambra State", owner:"Dcn Nonye Okafor", phone:"07035331256",
    logo:"NTC", type:"Secondary School",
    classes:["JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"],
    terms:["First Term","Second Term","Third Term"],
    feeTypes:["Tuition Fee","PTA Levy","Exam Fee","Lab Fee","Library Fee","Development Levy","ICT Fee","Miscellaneous"],
    expCats:["Staff Salary","Utilities","Maintenance","Teaching Materials","Exam Costs","Generator/Fuel","Feeding","Security","Miscellaneous"],
    theme:{primary:"#b45309",dark:"#78350f",light:"#fffbeb",mid:"#fef3c7",border:"#fde68a",login:"linear-gradient(135deg,#78350f,#b45309,#fbbf24)",logo:"linear-gradient(135deg,#b45309,#fbbf24)"},
  },
  // ADD NEW SCHOOL HERE
};

const PERM={owner:{fin:true,del:true,usr:true},principal:{fin:true,del:false,usr:false},bursar:{fin:true,del:false,usr:false},teacher:{fin:false,del:false,usr:false}};

async function dbCall(path,opts={}){
  const{headers:xh={},...rest}=opts;
  try{
    const r=await fetch(`${SB_URL}/rest/v1/${path}`,{...rest,headers:{apikey:SB_KEY,Authorization:`Bearer ${SB_KEY}`,"Content-Type":"application/json",Prefer:"return=representation",...xh}});
    if(r.status===204)return{data:[],error:null};
    const j=await r.json();
    return r.ok?{data:j,error:null}:{data:null,error:j};
  }catch(e){return{data:null,error:{message:e.message}};}
}

const db={
  get:(t,cid,q="")=>dbCall(`${t}?client_id=eq.${cid}${q?"&"+q:""}`),
  post:(t,b)=>dbCall(t,{method:"POST",body:JSON.stringify(b)}),
  patch:(t,id,b)=>dbCall(`${t}?id=eq.${id}`,{method:"PATCH",body:JSON.stringify(b)}),
  remove:(t,id)=>dbCall(`${t}?id=eq.${id}`,{method:"DELETE"}),
};

const fmt=n=>"N"+Number(n||0).toLocaleString("en-NG");
const genId=()=>Date.now()+"_"+Math.random().toString(36).slice(2,6);
const tod=()=>new Date().toISOString().split("T")[0];

export default function App(){
  const p=new URLSearchParams(window.location.search);
  const fromUrl=p.get("school");
  if(fromUrl&&SCHOOLS[fromUrl]){localStorage.setItem("tracka_school_client",fromUrl);window.history.replaceState({},"",window.location.pathname);}
  const key=fromUrl||localStorage.getItem("tracka_school_client");
  const school=SCHOOLS[key];
  const[user,setUser]=useState(null);
  if(!school)return(
    <div style={{minHeight:"100vh",background:"#78350f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:22,fontWeight:800,marginBottom:8}}>Tracka School</div>
        <div style={{fontSize:14,color:"#fde68a",marginBottom:4}}>Invalid Access Link</div>
        <div style={{fontSize:12,color:"#fef3c7"}}>Contact your school administrator for the correct link.</div>
      </div>
    </div>
  );
  if(!user)return<LoginScreen school={school} onLogin={setUser}/>;
  return<MainApp school={school} user={user} onLogout={()=>setUser(null)}/>;
}

function LoginScreen({school,onLogin}){
  const T=school.theme;
  const[users,setUsers]=useState([]);
  const[email,setEmail]=useState("");
  const[pin,setPin]=useState("");
  const[err,setErr]=useState("");
  const[loading,setLoading]=useState(true);
  const[dbOk,setDbOk]=useState(null);
  useEffect(()=>{
    (async()=>{
      const res=await db.get("users",school.id,"order=name.asc");
      if(res.error){setDbOk(false);setLoading(false);return;}
      setDbOk(true);
      const rows=Array.isArray(res.data)?res.data:[];
      if(rows.length===0){
        const owner={id:genId(),client_id:school.id,name:school.owner,role:"owner",branch:null,pin:"0000",email:school.id+"@tracka.ng",active:true};
        await db.post("users",owner);setUsers([owner]);
      }else setUsers(rows);
      setLoading(false);
    })();
  },[school.id]);
  const go=()=>{
    const u=users.find(x=>x.email.toLowerCase()===email.toLowerCase().trim()&&x.pin===pin.trim());
    if(!u){setErr("Email or PIN incorrect.");return;}
    if(!u.active){setErr("Account disabled.");return;}
    onLogin(u);
  };
  const inp={width:"100%",background:T.light,border:`1px solid ${T.border}`,borderRadius:7,padding:"10px 12px",color:T.dark,fontSize:14,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:11,fontWeight:700,color:T.primary,marginBottom:5,textTransform:"uppercase",letterSpacing:.5};
  return(
    <div style={{minHeight:"100vh",background:T.login,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans','Segoe UI',sans-serif",padding:20}}>
      <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"40px 36px",width:"100%",maxWidth:420}}>
        <div style={{width:60,height:60,borderRadius:16,background:T.logo,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",margin:"0 auto 14px"}}>{school.logo}</div>
        <div style={{textAlign:"center",fontWeight:900,fontSize:13,color:T.primary,marginBottom:2}}>TRACKA SCHOOL</div>
        <div style={{textAlign:"center",fontWeight:800,fontSize:18,color:T.dark,marginBottom:4}}>{school.name}</div>
        <div style={{textAlign:"center",fontSize:12,color:"#64748b",marginBottom:2}}>{school.type}</div>
        <div style={{textAlign:"center",fontSize:12,color:"#64748b",marginBottom:20}}>{school.address}</div>
        <div style={{height:1,background:T.border,marginBottom:20}}/>
        {dbOk===false&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:14,marginBottom:16,color:"#dc2626",fontSize:13}}>Cannot connect to database</div>}
        <label style={lbl}>Email Address</label>
        <input style={{...inp,marginBottom:14}} placeholder="your@email.ng" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        <label style={lbl}>PIN</label>
        <input style={inp} type="password" maxLength={8} placeholder="Enter your PIN" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}/>
        {err&&<div style={{color:"#dc2626",fontSize:13,marginTop:8}}>{err}</div>}
        <button style={{width:"100%",background:T.logo,border:"none",borderRadius:10,color:"#fff",padding:"13px",fontWeight:800,fontSize:15,cursor:"pointer",marginTop:16}} onClick={go} disabled={loading}>{loading?"Connecting...":"Enter Tracka School"}</button>
        <div style={{fontSize:11,color:T.primary,marginTop:14,textAlign:"center"}}>{school.owner} - Change PIN after first login</div>
      </div>
    </div>
  );
}

function MainApp({school,user,onLogout}){
  const T=school.theme,CID=school.id;
  const[tab,setTab]=useState("dashboard");
  const[dbOk,setDbOk]=useState(null);
  const[loading,setLoading]=useState(true);
  const[toast,setToast]=useState(null);
  const[confirm,setConfirm]=useState(null);
  const[users,setUsers]=useState([]);
  const[students,setStudents]=useState([]);
  const[fees,setFees]=useState([]);
  const[expenses,setExpenses]=useState([]);
  const[session,setSession]=useState("2024/2025");
  const[term,setTerm]=useState("First Term");
  const t2=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const ask=(msg,fn)=>setConfirm({msg,fn});
  const loadAll=useCallback(async()=>{
    setLoading(true);
    try{
      const[u,st,fe,ex]=await Promise.all([
        db.get("users",CID,"order=name.asc"),
        db.get("people",CID,"system_type=eq.school&order=name.asc"),
        db.get("transactions",CID,"system_type=eq.school&order=date.desc"),
        db.get("expenses",CID,"order=date.desc"),
      ]);
      setDbOk(!u.error);
      if(u.data?.length)setUsers(u.data);
      if(st.data?.length)setStudents(st.data);
      if(fe.data?.length)setFees(fe.data);
      if(ex.data?.length)setExpenses(ex.data);
    }catch{setDbOk(false);}
    setLoading(false);
  },[CID]);
  useEffect(()=>{loadAll();},[loadAll]);
  const isOwner=user?.role==="owner"||user?.role==="principal";
  const P=PERM[user?.role]||{};
  const totalFees=fees.reduce((s,r)=>s+ +(r.paid||0),0);
  const totalOwing=fees.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);
  const totalExp=expenses.reduce((s,r)=>s+ +r.amount,0);
  const doAddStudent=async d=>{const row={client_id:CID,system_type:"school",person_type:"student",...d,id:genId(),joined_date:tod(),active:true};const{error}=await db.post("people",row);if(error){t2("Error","error");return;}setStudents(p=>[...p,row]);t2(d.name+" enrolled");};
  const doAddFee=async d=>{const row={client_id:CID,system_type:"school",transaction_type:"fee",...d,id:genId(),date:tod(),status:+d.paid>=+d.amount?"Paid":+d.paid>0?"Part Paid":"Pending"};const{error}=await db.post("transactions",row);if(error){t2("Error","error");return;}setFees(p=>[row,...p]);t2("Fee recorded");};
  const doPayFee=async(id,amt)=>{const f=fees.find(x=>x.id===id);if(!f)return;const np=+(f.paid||0)+amt;const ns=np>=+f.amount?"Paid":"Part Paid";await db.patch("transactions",id,{paid:np,status:ns});setFees(p=>p.map(x=>x.id===id?{...x,paid:np,status:ns}:x));t2("Payment of "+fmt(amt)+" recorded");};
  const doAddExp=async d=>{const row={client_id:CID,...d,id:genId(),addedBy:user.id};const{error}=await db.post("expenses",row);if(error){t2("Error","error");return;}setExpenses(p=>[row,...p]);t2("Expense saved");};
  const doDel=async(type,id)=>{const tbl={student:"people",fee:"transactions",expense:"expenses"};await db.remove(tbl[type],id);if(type==="student")setStudents(p=>p.filter(x=>x.id!==id));if(type==="fee")setFees(p=>p.filter(x=>x.id!==id));if(type==="expense")setExpenses(p=>p.filter(x=>x.id!==id));setConfirm(null);t2("Deleted","info");};
  const doAddUser=async d=>{const row={client_id:CID,...d,id:genId(),active:true};const{error}=await db.post("users",row);if(error){t2("Error","error");return;}setUsers(p=>[...p,row]);t2(d.name+" added");};
  const doToggle=async uid=>{const u=users.find(x=>x.id===uid);if(!u)return;await db.patch("users",uid,{active:!u.active});setUsers(p=>p.map(x=>x.id===uid?{...x,active:!x.active}:x));t2(u.name+" "+(u.active?"disabled":"enabled"));};
  const doPin=async(uid,pin)=>{await db.patch("users",uid,{pin});setUsers(p=>p.map(u=>u.id===uid?{...u,pin}:u));t2("PIN updated");};
  const nav=[{id:"dashboard",label:"Dashboard"},{id:"students",label:"Students"},{id:"fees",label:"Fees"},{id:"expenses",label:"Expenses"},{id:"reports",label:"Reports"},...(isOwner?[{id:"users",label:"Users & Access"}]:[])];
  const S={inp:{width:"100%",background:T.light,border:`1px solid ${T.border}`,borderRadius:7,padding:"9px 10px",color:T.dark,fontSize:13,outline:"none",boxSizing:"border-box"},lbl:{display:"block",fontSize:10,fontWeight:700,color:T.primary,marginBottom:5,textTransform:"uppercase",letterSpacing:.5},btn:{display:"flex",alignItems:"center",gap:7,background:T.logo,color:"#fff",border:"none",borderRadius:8,padding:"9px 15px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0},gBtn:{display:"flex",alignItems:"center",gap:7,background:T.light,border:`1px solid ${T.border}`,color:T.primary,borderRadius:8,padding:"9px 15px",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0},save:{flex:2,background:T.logo,border:"none",borderRadius:7,color:"#fff",padding:"10px",fontWeight:700,cursor:"pointer",fontSize:14},canc:{flex:1,background:T.mid,border:"none",borderRadius:7,color:T.primary,padding:"10px",fontWeight:700,cursor:"pointer"},pay:{display:"flex",alignItems:"center",gap:4,background:T.mid,color:T.primary,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"},del:{display:"flex",alignItems:"center",gap:3,background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11},th:{textAlign:"left",fontSize:10,fontWeight:700,color:T.primary,padding:"8px 10px",borderBottom:`1px solid ${T.border}`,textTransform:"uppercase",letterSpacing:.5,whiteSpace:"nowrap"},td:{padding:"10px",fontSize:13,borderBottom:`1px solid ${T.mid}`,color:"#374151",verticalAlign:"middle"},fc:{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:17,marginBottom:16},fg:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:12},mbox:{background:"#fff",border:`1px solid ${T.border}`,borderRadius:13,width:"100%",maxWidth:460},chip:(bg,tc)=>({background:bg||T.mid,color:tc||T.primary,fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:99,whiteSpace:"nowrap"}),pill:a=>({background:a?T.primary:T.light,color:a?"#fff":T.primary,border:`1px solid ${T.border}`,borderRadius:99,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:700})};
  const Btn=({children,onClick,ghost})=><button onClick={onClick} style={ghost?S.gBtn:S.btn}>{children}</button>;
  const Del=({onClick})=><button onClick={onClick} style={S.del}>Del</button>;
  const Tag=({children,bg,tc})=><span style={S.chip(bg,tc)}>{children}</span>;
  const FL=({l,children})=><div><label style={S.lbl}>{l}</label>{children}</div>;
  const FG=({children})=><div style={S.fg}>{children}</div>;
  const FC=({title,children})=><div style={S.fc}><div style={{fontWeight:700,fontSize:11,color:T.primary,marginBottom:14,textTransform:"uppercase",letterSpacing:.5}}>{title}</div>{children}</div>;
  const TH=({title,sub,sc,children})=><div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}><div><div style={{fontWeight:800,fontSize:18,color:T.dark}}>{title}</div>{sub&&<div style={{fontSize:13,color:sc||"#374151",fontWeight:700}}>{sub}</div>}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div></div>;
  const KV=({l,v,c})=><div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13,color:"#374151"}}><span>{l}</span><strong style={{color:c||"#374151"}}>{v}</strong></div>;
  function Grid({cols,rows}){return<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{cols.map(c=><th key={c} style={S.th}>{c}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={cols.length} style={{...S.td,textAlign:"center",color:"#94a3b8",padding:32}}>No records yet</td></tr>:rows.map((row,i)=><tr key={i} style={{background:i%2===0?"transparent":T.light}}>{row.map((cell,j)=><td key={j} style={S.td}>{cell}</td>)}</tr>)}</tbody></table></div>;}
  function Modal({onClose,title,children}){return<div style={{position:"fixed",inset:0,background:"#00000060",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={onClose}><div style={S.mbox} onClick={e=>e.stopPropagation()}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><span style={{fontWeight:800,color:T.dark}}>{title}</span><button onClick={onClose} style={{background:"transparent",border:"none",cursor:"pointer",color:"#374151",fontSize:18}}>x</button></div><div style={{padding:20,maxHeight:"70vh",overflowY:"auto"}}>{children}</div></div></div>;}
  const printSummary=()=>{const now=new Date();const f=n=>"N"+Number(n||0).toLocaleString("en-NG");const html=`<html><head><title>${school.name}</title><style>body{font-family:sans-serif;padding:24px}h1{font-size:18px}h2{font-size:13px;color:#555;margin:16px 0 6px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f5f5f5;padding:8px 12px;text-align:left;font-size:11px;border:1px solid #ddd;text-transform:uppercase}td{padding:8px 12px;border:1px solid #ddd;font-size:13px}.g{color:#16a34a;font-weight:700}.r{color:#dc2626;font-weight:700}.o{color:#f59e0b;font-weight:700}</style></head><body><h1>${school.name}</h1><p>${school.address} - ${school.phone}<br/>Session: ${session} - ${term}<br/>Printed: ${now.toLocaleString("en-NG")}</p><hr/><h2>Summary</h2><table><tr><th>Students</th><th>Fees Collected</th><th>Fees Owing</th><th>Expenses</th><th>Net</th></tr><tr><td>${students.length}</td><td class="g">${f(totalFees)}</td><td class="o">${f(totalOwing)}</td><td class="r">${f(totalExp)}</td><td class="${totalFees-totalExp>=0?"g":"r"}">${f(totalFees-totalExp)}</td></tr></table><h2>By Class</h2><table><thead><tr><th>Class</th><th>Students</th><th>Collected</th><th>Owing</th></tr></thead><tbody>${school.classes.map(cls=>{const cs=students.filter(s=>s.class===cls).length;const cf=fees.filter(f=>f.category===cls);const cc=cf.reduce((s,r)=>s+ +(r.paid||0),0);const co=cf.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);return`<tr><td>${cls}</td><td>${cs}</td><td class="g">${f(cc)}</td><td class="o">${f(co)}</td></tr>`;}).join("")}</tbody></table><h2>Defaulters</h2><table><thead><tr><th>Student</th><th>Class</th><th>Fee</th><th>Balance</th></tr></thead><tbody>${fees.filter(f=>+f.amount- +(f.paid||0)>0).map(f=>`<tr><td>${f.reference_name}</td><td>${f.category||"-"}</td><td>${f.description}</td><td class="o">${fmt(+f.amount- +(f.paid||0))}</td></tr>`).join("")}</tbody></table></body></html>`;const w=window.open("","_blank");w.document.write(html);w.document.close();w.print();};
  return(
    <div style={{display:"flex",height:"100vh",background:T.light,color:T.dark,fontFamily:"'DM Sans','Segoe UI',sans-serif",overflow:"hidden"}}>
      <aside style={{width:232,background:"#fff",borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"16px 13px 14px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{width:38,height:38,borderRadius:10,background:T.logo,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0}}>{school.logo}</div>
          <div style={{minWidth:0}}><div style={{fontWeight:800,fontSize:11,color:T.dark,lineHeight:1.3}}>{school.name}</div><div style={{fontSize:10,color:T.primary}}>Tracka School</div></div>
        </div>
        <div style={{padding:"10px 11px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:10,color:"#374151",fontWeight:700,marginBottom:5,textTransform:"uppercase"}}>Session and Term</div>
          <input style={{...S.inp,marginBottom:6,fontSize:12}} placeholder="e.g. 2024/2025" value={session} onChange={e=>setSession(e.target.value)}/>
          <select style={{...S.inp,fontSize:12}} value={term} onChange={e=>setTerm(e.target.value)}>{school.terms.map(t=><option key={t}>{t}</option>)}</select>
        </div>
        <nav style={{flex:1,padding:"10px 7px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
          {nav.map(({id,label})=><button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:8,border:"none",background:tab===id?T.mid:"transparent",color:tab===id?T.primary:"#374151",fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left",width:"100%"}}>{label}</button>)}
        </nav>
        <div style={{padding:"10px 10px 14px",borderTop:`1px solid ${T.border}`}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:6,color:dbOk?"#16a34a":"#ef4444"}}>{dbOk?"Live":"Offline"}</div>
          <div style={{fontSize:11,fontWeight:700,marginBottom:8,padding:"4px 8px",background:T.light,borderRadius:6,border:`1px solid ${T.border}`,color:T.primary}}>{user?.role==="owner"?"Owner":user?.role==="principal"?"Principal":user?.role==="bursar"?"Bursar":"Teacher"}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><div style={{width:32,height:32,borderRadius:"50%",background:T.mid,color:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,flexShrink:0}}>{user?.name?.[0]}</div><div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.dark}}>{user?.name}</div><div style={{fontSize:10,color:"#374151"}}>{user?.email}</div></div></div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={loadAll} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",border:`1px solid ${T.border}`,borderRadius:7,background:T.light,color:T.primary,fontSize:12,cursor:"pointer"}}>Refresh</button>
            <button onClick={onLogout} style={{flex:1,display:"flex",alignItems:"center",gap:6,padding:"7px 10px",border:`1px solid ${T.border}`,borderRadius:7,background:T.light,color:"#374151",fontSize:12,cursor:"pointer"}}>Sign Out</button>
          </div>
        </div>
      </aside>
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0,background:"#fff"}}>
          <div><div style={{fontSize:18,fontWeight:800,color:T.dark}}>{tab==="dashboard"?"Good day, "+user?.name?.split(" ")[0]:nav.find(n=>n.id===tab)?.label}</div><div style={{fontSize:11,color:T.primary,marginTop:2}}>{school.name} - {session} - {term}</div></div>
          <div style={{textAlign:"right",fontSize:11,color:"#374151",lineHeight:1.7}}>
            <div style={{fontWeight:700,color:T.primary}}>{school.owner}</div>
            <div>{school.phone}</div>
            {isOwner&&<button onClick={printSummary} style={{marginTop:6,background:T.logo,border:"none",borderRadius:6,color:"#fff",padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Print Summary</button>}
          </div>
        </div>
        {loading&&<div style={{height:3,background:T.logo,flexShrink:0}}/>}
        <div style={{flex:1,overflow:"auto",padding:"18px 20px",background:T.light}}>
          {tab==="dashboard"&&<div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:12,marginBottom:16}}>
              {[{label:"Total Students",value:students.length,color:T.primary},{label:"Fees Collected",value:fmt(totalFees),color:"#16a34a"},{label:"Fees Owing",value:fmt(totalOwing),color:"#f59e0b"},{label:"Total Expenses",value:fmt(totalExp),color:"#ef4444"},{label:"Net Position",value:fmt(totalFees-totalExp),color:totalFees-totalExp>=0?"#16a34a":"#ef4444"}].map(k=><div key={k.label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:"15px 15px 15px 11px",display:"flex",alignItems:"center",gap:12,borderLeft:`4px solid ${k.color}`}}><div><div style={{fontSize:12,color:"#374151",marginBottom:3}}>{k.label}</div><div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.value}</div></div></div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:16}}>
              {school.classes.map(cls=>{const cs=students.filter(s=>s.class===cls).length;const cf=fees.filter(f=>f.category===cls);const cc=cf.reduce((s,r)=>s+ +(r.paid||0),0);const co=cf.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);return<div key={cls} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:14}}><div style={{fontWeight:700,color:T.primary,marginBottom:10,fontSize:13}}>{cls}</div><KV l="Students" v={cs} c={T.primary}/><KV l="Collected" v={fmt(cc)} c="#16a34a"/><KV l="Owing" v={fmt(co)} c="#f59e0b"/></div>;})}
            </div>
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:15}}>
              <div style={{fontWeight:800,fontSize:12,color:"#f59e0b",marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Fee Defaulters</div>
              <Grid cols={["Student","Class","Fee","Amount","Paid","Balance"]} rows={fees.filter(f=>+f.amount- +(f.paid||0)>0).slice(0,10).map(f=>[<strong style={{color:T.dark}}>{f.reference_name}</strong>,<Tag>{f.category||"-"}</Tag>,f.description,fmt(f.amount),<span style={{color:"#16a34a"}}>{fmt(f.paid||0)}</span>,<strong style={{color:"#f59e0b"}}>{fmt(+f.amount- +(f.paid||0))}</strong>])}/>
            </div>
          </div>}
          {tab==="students"&&<StudentsPage students={students} school={school} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddStudent} onDelete={id=>ask("Remove student?",()=>doDel("student",id))} P={P}/>}
          {tab==="fees"&&<FeesPage fees={fees} students={students} school={school} session={session} term={term} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} Modal={Modal} onAdd={doAddFee} onPay={doPayFee} onDelete={id=>ask("Delete fee?",()=>doDel("fee",id))} P={P} showToast={t2}/>}
          {tab==="expenses"&&<ExpensesPage expenses={expenses} school={school} T={T} S={S} Btn={Btn} Del={Del} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} onAdd={doAddExp} onDelete={id=>ask("Delete expense?",()=>doDel("expense",id))} P={P} showToast={t2}/>}
          {tab==="reports"&&<ReportsPage fees={fees} expenses={expenses} students={students} school={school} session={session} term={term} T={T} S={S} Btn={Btn} Tag={Tag} TH={TH} Grid={Grid} KV={KV}/>}
          {tab==="users"&&isOwner&&<UsersPage users={users} T={T} S={S} Btn={Btn} Tag={Tag} FL={FL} FG={FG} FC={FC} TH={TH} Grid={Grid} Modal={Modal} onAdd={doAddUser} onToggle={id=>ask("Toggle?",()=>doToggle(id))} onPin={doPin} showToast={t2}/>}
        </div>
      </main>
      {toast&&<div style={{position:"fixed",bottom:18,right:18,color:"#fff",padding:"11px 16px",borderRadius:9,fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:8,zIndex:300,boxShadow:"0 8px 24px #0009",maxWidth:360,background:toast.type==="error"?"#dc2626":toast.type==="info"?"#2563eb":"#16a34a"}}>{toast.msg}</div>}
      {confirm&&<div style={{position:"fixed",inset:0,background:"#00000060",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setConfirm(null)}><div style={{background:"#fff",border:"1px solid #fca5a5",borderRadius:13,padding:24,maxWidth:350,width:"90%"}} onClick={e=>e.stopPropagation()}><div style={{fontWeight:700,fontSize:15,marginBottom:18,color:T.dark}}>{confirm.msg}</div><div style={{display:"flex",gap:10}}><button style={S.canc} onClick={()=>setConfirm(null)}>Cancel</button><button style={{...S.save,background:"#dc2626"}} onClick={confirm.fn}>Yes Delete</button></div></div></div>}
    </div>
  );
}

function StudentsPage({students,school,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P}){
  const[open,setOpen]=useState(false);
  const[filter,setFilter]=useState("all");
  const[form,setForm]=useState({name:"",class:school.classes[0],gender:"Male",parent_name:"",parent_phone:"",address:""});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const shown=filter==="all"?students:students.filter(s=>s.class===filter);
  return<div>
    <TH title="Students" sub={students.length+" enrolled"}><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Enroll Student"}</Btn></TH>
    {open&&<FC title="New Student Enrollment"><FG>
      <FL l="Full Name *"><input style={S.inp} placeholder="Student full name" value={form.name} onChange={e=>F("name",e.target.value)}/></FL>
      <FL l="Class *"><select style={S.inp} value={form.class} onChange={e=>F("class",e.target.value)}>{school.classes.map(c=><option key={c}>{c}</option>)}</select></FL>
      <FL l="Gender"><select style={S.inp} value={form.gender} onChange={e=>F("gender",e.target.value)}>{["Male","Female"].map(g=><option key={g}>{g}</option>)}</select></FL>
      <FL l="Parent Name"><input style={S.inp} placeholder="Parent/Guardian name" value={form.parent_name} onChange={e=>F("parent_name",e.target.value)}/></FL>
      <FL l="Parent Phone"><input style={S.inp} placeholder="08012345678" value={form.parent_phone} onChange={e=>F("parent_phone",e.target.value)}/></FL>
      <FL l="Address"><input style={S.inp} placeholder="Home address" value={form.address} onChange={e=>F("address",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.name){alert("Enter student name");return;}onAdd(form);setForm({name:"",class:school.classes[0],gender:"Male",parent_name:"",parent_phone:"",address:""});setOpen(false);}}>Enroll Student</button></FC>}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {["all",...school.classes].map(c=><button key={c} onClick={()=>setFilter(c)} style={S.pill(filter===c)}>{c==="all"?"All Classes":c}</button>)}
    </div>
    <Grid cols={["Name","Class","Gender","Parent","Parent Phone","Enrolled",...(P.del?["Del"]:[])]} rows={shown.map(s=>[<strong style={{color:T.dark}}>{s.name}</strong>,<Tag bg={T.mid} tc={T.primary}>{s.class}</Tag>,s.gender,s.parent_name||"-",s.parent_phone||"-",s.joined_date,...(P.del?[<Del onClick={()=>onDelete(s.id)}/>]:[])])}/>
  </div>;
}

function FeesPage({fees,students,school,session,term,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,Modal,onAdd,onPay,onDelete,P,showToast}){
  const[open,setOpen]=useState(false);
  const[modal,setModal]=useState(null);
  const[payAmt,setPayAmt]=useState("");
  const[filter,setFilter]=useState("all");
  const[form,setForm]=useState({reference_id:"",reference_name:"",description:school.feeTypes[0],category:school.classes[0],amount:"",paid:0,notes:session+" "+term});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const shown=filter==="all"?fees:filter==="owing"?fees.filter(f=>+f.amount- +(f.paid||0)>0):filter==="paid"?fees.filter(f=>+f.amount- +(f.paid||0)<=0):fees.filter(f=>f.category===filter);
  const collected=shown.reduce((s,r)=>s+ +(r.paid||0),0);
  const owing=shown.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);
  const statusColor=s=>s==="Paid"?"#16a34a":s==="Part Paid"?"#f59e0b":"#64748b";
  const exportCSV=()=>{const rows=[["Student","Class","Fee Type","Amount","Paid","Balance","Status","Date"],...shown.map(f=>[f.reference_name,f.category,f.description,f.amount,f.paid||0,+f.amount- +(f.paid||0),f.status,f.date])];const csv=rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="tracka_fees_"+term.replace(/ /g,"_")+".csv";a.click();URL.revokeObjectURL(url);};
  return<div>
    <TH title="School Fees" sub={"Collected: "+fmt(collected)+" | Owing: "+fmt(owing)} sc="#f59e0b">
      <div style={{display:"flex",gap:8}}><Btn ghost onClick={exportCSV}>Export CSV</Btn><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Record Fee"}</Btn></div>
    </TH>
    {open&&<FC title="Record School Fee"><FG>
      <FL l="Student *"><select style={S.inp} value={form.reference_id} onChange={e=>{const st=students.find(s=>s.id===e.target.value);F("reference_id",e.target.value);F("reference_name",st?.name||"");F("category",st?.class||school.classes[0]);}}><option value="">-- select student --</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select></FL>
      <FL l="Fee Type *"><select style={S.inp} value={form.description} onChange={e=>F("description",e.target.value)}>{school.feeTypes.map(f=><option key={f}>{f}</option>)}</select></FL>
      <FL l="Class"><select style={S.inp} value={form.category} onChange={e=>F("category",e.target.value)}>{school.classes.map(c=><option key={c}>{c}</option>)}</select></FL>
      <FL l="Total Amount (N) *"><input style={S.inp} type="number" value={form.amount} onChange={e=>F("amount",e.target.value)}/></FL>
      <FL l="Amount Paid Now (N)"><input style={S.inp} type="number" value={form.paid} onChange={e=>F("paid",e.target.value)}/></FL>
      <FL l="Term/Session"><input style={S.inp} value={form.notes} onChange={e=>F("notes",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.reference_id||!form.amount){showToast("Select student and enter amount","error");return;}onAdd({...form,amount:+form.amount,paid:+form.paid||0});setForm({reference_id:"",reference_name:"",description:school.feeTypes[0],category:school.classes[0],amount:"",paid:0,notes:session+" "+term});setOpen(false);}}>Save Fee Record</button></FC>}
    {modal&&<Modal onClose={()=>setModal(null)} title={"Record Payment - "+modal.reference_name}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:18}}>{[["Total",fmt(modal.amount),"#374151"],["Paid",fmt(modal.paid||0),"#16a34a"],["Balance",fmt(+modal.amount- +(modal.paid||0)),"#f59e0b"]].map(([l,v,c])=><div key={l} style={{background:T.light,borderRadius:8,padding:10,textAlign:"center"}}><div style={{fontSize:11,color:T.primary}}>{l}</div><div style={{fontWeight:800,color:c,fontSize:14}}>{v}</div></div>)}</div>
      <label style={S.lbl}>Payment Amount (N)</label>
      <input style={S.inp} type="number" value={payAmt} onChange={e=>setPayAmt(e.target.value)} autoFocus placeholder={"Max: "+fmt(+modal.amount- +(modal.paid||0))}/>
      <div style={{display:"flex",gap:10,marginTop:16}}><button style={S.canc} onClick={()=>setModal(null)}>Cancel</button><button style={S.save} onClick={()=>{const a=+payAmt;if(!a||a<=0){showToast("Enter valid amount","error");return;}if(a>+modal.amount- +(modal.paid||0)){showToast("Exceeds balance","error");return;}onPay(modal.id,a);setModal(null);setPayAmt("");}}>Record Payment</button></div>
    </Modal>}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {[["all","All"],["owing","Owing"],["paid","Paid"],...school.classes.map(c=>[c,c])].map(([f,l])=><button key={f} onClick={()=>setFilter(f)} style={S.pill(filter===f)}>{l}</button>)}
    </div>
    <Grid cols={["Student","Class","Fee Type","Total","Paid","Balance","Status","Date","Pay",...(P.del?["Del"]:[])]}
      rows={shown.map(f=>{const bal=+f.amount- +(f.paid||0);return[<strong style={{color:T.dark}}>{f.reference_name}</strong>,<Tag bg={T.mid} tc={T.primary}>{f.category}</Tag>,f.description,fmt(f.amount),<span style={{color:"#16a34a"}}>{fmt(f.paid||0)}</span>,<strong style={{color:bal>0?"#f59e0b":"#16a34a"}}>{fmt(bal)}</strong>,<Tag bg={statusColor(f.status)+"20"} tc={statusColor(f.status)}>{f.status}</Tag>,f.date,bal>0?<button onClick={()=>{setModal(f);setPayAmt("");}} style={S.pay}>Pay</button>:<span style={{fontSize:11,color:"#16a34a"}}>Cleared</span>,...(P.del?[<Del onClick={()=>onDelete(f.id)}/>]:[])];})}/>
  </div>;
}

function ExpensesPage({expenses,school,T,S,Btn,Del,Tag,FL,FG,FC,TH,Grid,onAdd,onDelete,P,showToast}){
  const[open,setOpen]=useState(false);
  const[form,setForm]=useState({desc:"",category:school.expCats[0],amount:"",date:tod()});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const total=expenses.reduce((s,r)=>s+ +r.amount,0);
  return<div>
    <TH title="Expenses" sub={"Total: "+fmt(total)} sc="#ef4444"><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Add Expense"}</Btn></TH>
    {open&&<FC title="Record Expense"><FG>
      <FL l="Description *"><input style={S.inp} placeholder="e.g. Generator Diesel 20L" value={form.desc} onChange={e=>F("desc",e.target.value)}/></FL>
      <FL l="Category *"><select style={S.inp} value={form.category} onChange={e=>F("category",e.target.value)}>{school.expCats.map(c=><option key={c}>{c}</option>)}</select></FL>
      <FL l="Amount (N) *"><input style={S.inp} type="number" value={form.amount} onChange={e=>F("amount",e.target.value)}/></FL>
      <FL l="Date"><input style={S.inp} type="date" value={form.date} onChange={e=>F("date",e.target.value)}/></FL>
    </FG><button style={{...S.save,marginTop:16}} onClick={()=>{if(!form.desc||!form.amount){showToast("Fill description and amount","error");return;}onAdd({...form,amount:+form.amount});setForm({desc:"",category:school.expCats[0],amount:"",date:tod()});setOpen(false);}}>Save Expense</button></FC>}
    <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>{[...new Set(expenses.map(e=>e.category))].map(c=>{const t=expenses.filter(e=>e.category===c).reduce((s,r)=>s+ +r.amount,0);return<div key={c} style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:99,padding:"4px 12px",fontSize:12,color:"#ef4444"}}>{c}: <strong>{fmt(t)}</strong></div>;})}</div>
    <Grid cols={["Description","Category","Amount","Date",...(P.del?["Del"]:[])]} rows={expenses.map(e=>[e.desc,<Tag bg="#fef2f2" tc="#ef4444">{e.category}</Tag>,<strong style={{color:"#ef4444"}}>{fmt(e.amount)}</strong>,e.date,...(P.del?[<Del onClick={()=>onDelete(e.id)}/>]:[])])}/>
  </div>;
}

function ReportsPage({fees,expenses,students,school,session,term,T,S,Btn,Tag,TH,Grid,KV}){
  const[classFilter,setClassFilter]=useState("all");
  const fFees=classFilter==="all"?fees:fees.filter(f=>f.category===classFilter);
  const totalCollected=fFees.reduce((s,r)=>s+ +(r.paid||0),0);
  const totalOwing=fFees.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);
  const totalExp=expenses.reduce((s,r)=>s+ +r.amount,0);
  const feeByType={};fFees.forEach(f=>{feeByType[f.description]=(feeByType[f.description]||0)+ +(f.paid||0);});
  const expByCat={};expenses.forEach(e=>{expByCat[e.category]=(expByCat[e.category]||0)+ +e.amount;});
  const defaulters=fFees.filter(f=>+f.amount- +(f.paid||0)>0);
  const exportCSV=()=>{const rows=[["Student","Class","Fee Type","Total","Paid","Balance","Status"],...fFees.map(f=>[f.reference_name,f.category,f.description,f.amount,f.paid||0,+f.amount- +(f.paid||0),f.status])];const csv=rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="tracka_school_report.csv";a.click();URL.revokeObjectURL(url);};
  const doPrint=()=>{const f=n=>"N"+Number(n||0).toLocaleString("en-NG");const html=`<html><head><title>${school.name}</title><style>body{font-family:sans-serif;padding:20px;font-size:13px}h1{font-size:18px}h2{font-size:13px;color:#555;margin:16px 0 6px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f5f5f5;text-align:left;padding:7px 10px;font-size:11px;border:1px solid #ddd}td{padding:7px 10px;border:1px solid #ddd}.g{color:#16a34a;font-weight:700}.r{color:#dc2626;font-weight:700}.o{color:#f59e0b;font-weight:700}</style></head><body><h1>${school.name}</h1><p>${school.address} - ${school.phone}<br/>Session: ${session} - ${term}<br/>Printed: ${new Date().toLocaleString("en-NG")}</p><hr/><h2>Summary</h2><table><tr><th>Students</th><th>Collected</th><th>Owing</th><th>Expenses</th><th>Net</th></tr><tr><td>${students.length}</td><td class="g">${f(totalCollected)}</td><td class="o">${f(totalOwing)}</td><td class="r">${f(totalExp)}</td><td class="${totalCollected-totalExp>=0?"g":"r"}">${f(totalCollected-totalExp)}</td></tr></table><h2>Class Performance</h2><table><thead><tr><th>Class</th><th>Students</th><th>Collected</th><th>Owing</th></tr></thead><tbody>${school.classes.map(cls=>{const cs=students.filter(s=>s.class===cls).length;const cf=fees.filter(f=>f.category===cls);const cc=cf.reduce((s,r)=>s+ +(r.paid||0),0);const co=cf.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);return`<tr><td>${cls}</td><td>${cs}</td><td class="g">${f(cc)}</td><td class="o">${f(co)}</td></tr>`;}).join("")}</tbody></table><h2>Defaulters (${defaulters.length})</h2><table><thead><tr><th>Student</th><th>Class</th><th>Fee</th><th>Balance</th></tr></thead><tbody>${defaulters.map(d=>`<tr><td>${d.reference_name}</td><td>${d.category}</td><td>${d.description}</td><td class="o">${f(+d.amount- +(d.paid||0))}</td></tr>`).join("")}</tbody></table></body></html>`;const w=window.open("","_blank");w.document.write(html);w.document.close();w.print();};
  const card={background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16,marginBottom:16};
  return<div>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div><div style={{fontWeight:800,fontSize:18,color:T.dark}}>Reports</div><div style={{fontSize:13,color:"#374151",fontWeight:700}}>{session} - {term} - {classFilter==="all"?"All Classes":classFilter}</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={exportCSV} style={{...S.gBtn,fontSize:12,padding:"7px 12px"}}>Export CSV</button><button onClick={doPrint} style={{...S.btn,fontSize:12,padding:"7px 12px"}}>Print Report</button></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:12,color:"#374151",fontWeight:700}}>Class:</span>
      <select style={{...S.inp,width:"auto",padding:"6px 10px"}} value={classFilter} onChange={e=>setClassFilter(e.target.value)}><option value="all">All Classes</option>{school.classes.map(c=><option key={c} value={c}>{c}</option>)}</select>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:18}}>
      {[{label:"Total Students",value:students.length,color:T.primary},{label:"Fees Collected",value:fmt(totalCollected),color:"#16a34a"},{label:"Fees Owing",value:fmt(totalOwing),color:"#f59e0b"},{label:"Total Expenses",value:fmt(totalExp),color:"#ef4444"},{label:"Net Position",value:fmt(totalCollected-totalExp),color:totalCollected-totalExp>=0?"#16a34a":"#ef4444"},{label:"Defaulters",value:defaulters.length,color:"#f59e0b"}].map(k=><div key={k.label} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:11,padding:16,borderLeft:`4px solid ${k.color}`}}><div style={{fontSize:11,color:"#374151",marginBottom:4}}>{k.label}</div><div style={{fontSize:18,fontWeight:800,color:k.color}}>{k.value}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div style={card}><div style={{fontWeight:800,color:"#16a34a",fontSize:13,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Fees by Type</div>{Object.entries(feeByType).sort((a,b)=>b[1]-a[1]).map(([type,amt])=><div key={type} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13}}><span>{type}</span><strong style={{color:"#16a34a"}}>{fmt(amt)}</strong></div>)}</div>
      <div style={card}><div style={{fontWeight:800,color:"#ef4444",fontSize:13,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Expenses by Category</div>{Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=><div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.mid}`,fontSize:13}}><span>{cat}</span><strong style={{color:"#ef4444"}}>{fmt(amt)}</strong></div>)}</div>
    </div>
    <div style={card}><div style={{fontWeight:800,color:"#f59e0b",fontSize:13,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Class Performance</div><Grid cols={["Class","Students","Collected","Owing","Defaulters"]} rows={school.classes.map(cls=>{const cs=students.filter(s=>s.class===cls).length;const cf=fees.filter(f=>f.category===cls);const cc=cf.reduce((s,r)=>s+ +(r.paid||0),0);const co=cf.reduce((s,r)=>s+(+r.amount- +(r.paid||0)),0);const cd=cf.filter(f=>+f.amount- +(f.paid||0)>0).length;return[<strong style={{color:T.dark}}>{cls}</strong>,cs,<span style={{color:"#16a34a"}}>{fmt(cc)}</span>,<span style={{color:"#f59e0b"}}>{fmt(co)}</span>,<span style={{color:cd>0?"#ef4444":"#16a34a"}}>{cd}</span>];})}/>
    </div>
    {defaulters.length>0&&<div style={card}><div style={{fontWeight:800,color:"#ef4444",fontSize:13,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Defaulters List ({defaulters.length})</div><Grid cols={["Student","Class","Fee Type","Total","Paid","Balance"]} rows={defaulters.map(f=>[<strong style={{color:T.dark}}>{f.reference_name}</strong>,<Tag bg={T.mid} tc={T.primary}>{f.category}</Tag>,f.description,fmt(f.amount),<span style={{color:"#16a34a"}}>{fmt(f.paid||0)}</span>,<strong style={{color:"#f59e0b"}}>{fmt(+f.amount- +(f.paid||0))}</strong>])}/></div>}
  </div>;
}

function UsersPage({users,T,S,Btn,Tag,FL,FG,FC,TH,Grid,Modal,onAdd,onToggle,onPin,showToast}){
  const[open,setOpen]=useState(false);const[pm,setPm]=useState(null);const[np,setNp]=useState("");
  const[form,setForm]=useState({name:"",email:"",pin:"",role:"teacher"});
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const RC={owner:"#b45309",principal:"#0369a1",bursar:"#16a34a",teacher:"#7c3aed"};
  return<div>
    <TH title="Users and Access Control"><Btn onClick={()=>setOpen(v=>!v)}>{open?"Cancel":"Add User"}</Btn></TH>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12,marginBottom:20}}>
      {[{role:"owner",title:"Owner",desc:"Full access - Delete - Manage users"},{role:"principal",title:"Principal",desc:"All records - Reports - No delete"},{role:"bursar",title:"Bursar",desc:"Fees - Expenses - Financial reports"},{role:"teacher",title:"Teacher",desc:"View students only"}].map(r=><div key={r.role} style={{background:T.light,border:`1px solid ${RC[r.role]}40`,borderRadius:11,padding:14}}><div style={{fontWeight:800,color:RC[r.role],marginBottom:6,fontSize:13}}>{r.title}</div><div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{r.desc}</div></div>)}
    </div>
    {open&&<FC title="Add New User"><FG>
      <FL l="Full Name *"><input style={S.inp} value={form.name} onChange={e=>F("name",e.target.value)} placeholder="e.g. Mr Emeka"/></FL>
      <FL l="Email *"><input style={S.inp} value={form.email} onChange={e=>F("email",e.target.value)} placeholder="emeka@school.ng"/></FL>
      <FL l="PIN (4-8 digits) *"><input style={S.inp} maxLength={8} value={form.pin} onChange={e=>F("pin",e.target.value)} placeholder="e.g. 1234"/></FL>
      <FL l="Role"><select style={S.inp} value={form.role} onChange={e=>F("role",e.target.value)}>{["teacher","bursar","principal"].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select></FL>
    </FG><button style={{...S.save,marginTop:14}} onClick={()=>{if(!form.name||!form.email||!form.pin){showToast("Fill all fields","error");return;}onAdd(form);setForm({name:"",email:"",pin:"",role:"teacher"});setOpen(false);}}>Create User</button></FC>}
    {pm&&<Modal onClose={()=>setPm(null)} title={"Change PIN - "+pm.name}>
      <label style={S.lbl}>New PIN (4-8 digits)</label>
      <input style={S.inp} maxLength={8} value={np} onChange={e=>setNp(e.target.value)} autoFocus/>
      <div style={{display:"flex",gap:10,marginTop:16}}><button style={S.canc} onClick={()=>setPm(null)}>Cancel</button><button style={S.save} onClick={()=>{if(!np||np.length<4){showToast("PIN must be 4+ digits","error");return;}onPin(pm.id,np);setPm(null);setNp("");}}>Update PIN</button></div>
    </Modal>}
    <Grid cols={["Name","Email","Role","PIN","Status","Actions"]} rows={users.map(u=>[<strong style={{color:u.active?T.dark:"#94a3b8"}}>{u.name}</strong>,<span style={{fontSize:12}}>{u.email}</span>,<Tag bg={RC[u.role]+"20"} tc={RC[u.role]}>{u.role}</Tag>,<code style={{background:T.mid,padding:"2px 8px",borderRadius:4,color:T.primary,fontSize:12}}>{u.pin}</code>,<Tag bg={u.active?T.mid:"#fef2f2"} tc={u.active?T.primary:"#ef4444"}>{u.active?"Active":"Disabled"}</Tag>,<div style={{display:"flex",gap:6}}>{u.role!=="owner"&&<button onClick={()=>onToggle(u.id)} style={{background:u.active?"#fef2f2":T.mid,color:u.active?"#ef4444":T.primary,border:`1px solid ${u.active?"#fca5a5":T.border}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:11}}>{u.active?"Disable":"Enable"}</button>}<button onClick={()=>{setPm(u);setNp("");}} style={{background:T.mid,color:T.primary,border:`1px solid ${T.border}`,borderRadius:6,padding:"5px 9px",fontSize:12,cursor:"pointer",fontWeight:700}}>PIN</button></div>])}/>
  </div>;
  }
