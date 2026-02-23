import { useState, useMemo } from "react";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const generateContractNumber = () => {
  const y = new Date().getFullYear();
  const n = Math.floor(10000 + Math.random() * 90000);
  return `POU-${y}-${n}`;
};
const generateEAN = () => {
  let n = "200";
  for (let i = 0; i < 9; i++) n += Math.floor(Math.random() * 10);
  let s = 0;
  for (let i = 0; i < 12; i++) s += parseInt(n[i]) * (i % 2 === 0 ? 1 : 3);
  n += (10 - (s % 10)) % 10;
  return n;
};
const fmtDate = (d) => new Date(d).toLocaleDateString("cs-CZ");
const fmtCur = (v) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);
const addMonths = (d, m) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r.toISOString().split("T")[0];
};

const SCONTO_YELLOW = "#FFD000";

const INIT_USERS = [
  { id: 1, username: "admin",    password: "admin123", name: "Jana Nováková",   role: "admin",    active: true },
  { id: 2, username: "operator", password: "op123",    name: "Tomáš Marek",     role: "operator", active: true },
  { id: 3, username: "viewer",   password: "view123",  name: "Petra Horáčková", role: "viewer",   active: true },
];

const STATUS = {
  Aktivní:    { bg:"bg-emerald-50",  text:"text-emerald-700", dot:"bg-emerald-500", border:"border-emerald-200" },
  Uplatněná:  { bg:"bg-gray-100",    text:"text-gray-500",    dot:"bg-gray-400",    border:"border-gray-200"   },
  Expirovaná: { bg:"bg-red-50",      text:"text-red-600",     dot:"bg-red-400",     border:"border-red-200"    },
  Stornovaná: { bg:"bg-orange-50",   text:"text-orange-600",  dot:"bg-orange-400",  border:"border-orange-200" },
};

const ROLE_STYLE = {
  admin:    "bg-yellow-50 text-yellow-800 border-yellow-200",
  operator: "bg-blue-50  text-blue-700   border-blue-200",
  viewer:   "bg-gray-100 text-gray-600   border-gray-200",
};
const ROLE_LABEL = { admin:"Admin", operator:"Operátor", viewer:"Viewer" };

const DEMO_VOUCHERS = (() => {
  const names = ["Karel Dvořák","Lucie Marková","Pavel Horák","Věra Procházková","Martin Kovář","Eva Bláhová","Jiří Šimánek","Lenka Fišerová","Ondřej Blažek","Alena Kopecká","Radek Pospíšil","Hana Čermáková","Michal Vlček","Zuzana Benešová","Jakub Pokorný"];
  const emails = names.map(n => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(" ",".")+"@email.cz");
  const phones = names.map(()=>`+420 ${Math.floor(600+Math.random()*200)} ${Math.floor(100+Math.random()*900)} ${Math.floor(100+Math.random()*900)}`);
  const statuses = ["Aktivní","Aktivní","Aktivní","Aktivní","Aktivní","Aktivní","Aktivní","Uplatněná","Uplatněná","Uplatněná","Expirovaná","Expirovaná","Stornovaná","Aktivní","Aktivní"];
  const types = ["Obojí","Obchodní dům","E-shop","Obojí","Obchodní dům","E-shop","Obojí","Obojí","Obchodní dům","E-shop","Obojí","Obchodní dům","E-shop","Obojí","E-shop"];
  const values = [500,1000,1500,2000,500,1000,3000,750,2500,1000,500,1500,2000,1000,500];
  const issuers = ["Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková","Tomáš Marek","Jana Nováková"];
  return names.map((name, i) => {
    const issued = new Date(2024, Math.floor(i/2), 10+i).toISOString().split("T")[0];
    const validTo = statuses[i]==="Expirovaná" ? "2024-06-01" : addMonths(issued, 12);
    return { id: i+1, contractNumber: generateContractNumber(), ean: generateEAN(), value: values[i], name, email: emails[i], phone: phones[i], issuedAt: issued, validFrom: issued, validTo, status: statuses[i], type: types[i], note: i%3===0?"Narozeninový dárek":"", issuedBy: issuers[i], emailSentAt: issued };
  });
})();

// ─── BARCODE ──────────────────────────────────────────────────────────────────
const Barcode = ({ value }) => {
  const bars = useMemo(() => {
    const a = [];
    for (let i=0;i<80;i++) a.push({x:i*2.4, w:Math.random()>0.5?1.2:2.4, fill:Math.random()>0.3});
    return a;
  }, [value]);
  return (
    <svg width="190" height="56" viewBox="0 0 195 60">
      {bars.map((b,i)=>b.fill?<rect key={i} x={b.x} y={0} width={b.w} height={50} fill="#1a1a1a"/>:null)}
      <text x="97.5" y="60" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#888">{value}</text>
    </svg>
  );
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({status}) => {
  const c = STATUS[status]||STATUS["Aktivní"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>{status}
    </span>
  );
};

// ─── FORM HELPERS ─────────────────────────────────────────────────────────────
const Field = ({label, children}) => (
  <div>
    {label&&<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
    {children}
  </div>
);
const TextInput = ({label,...p}) => (
  <Field label={label}>
    <input {...p} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition bg-white"/>
  </Field>
);
const Sel = ({label,children,...p}) => (
  <Field label={label}>
    <select {...p} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-white transition appearance-none">
      {children}
    </select>
  </Field>
);

// ─── MODAL WRAPPER ────────────────────────────────────────────────────────────
const Modal = ({onClose, children, wide=false}) => (
  <div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide?"max-w-2xl":"max-w-lg"} max-h-[92vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({title,onClose,extra}) => (
  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    <div className="flex items-center gap-3">
      {extra}
      <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">✕</button>
    </div>
  </div>
);

// ─── VOUCHER DETAIL ───────────────────────────────────────────────────────────
const VoucherModal = ({voucher, onClose, onStatusChange, role}) => {
  const [stornoNote, setStornoNote] = useState("");
  const [showStorno, setShowStorno] = useState(false);
  const canEdit = role==="admin"||role==="operator";
  return (
    <Modal onClose={onClose} wide>
      <ModalHeader title={voucher.contractNumber} onClose={onClose} extra={<StatusBadge status={voucher.status}/>}/>
      <div className="px-6 pt-5 pb-3">
        {/* Voucher visual */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{background:`linear-gradient(135deg, ${SCONTO_YELLOW} 0%, #FFE85A 100%)`}}>
          <div className="p-6">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] text-yellow-900/50 uppercase mb-1">Sconto nábytek</p>
                <p className="text-5xl font-black text-gray-900">{fmtCur(voucher.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-yellow-900/50 font-semibold tracking-wider uppercase mb-1">Uplatnění</p>
                <p className="text-sm font-bold text-gray-900">{voucher.type}</p>
              </div>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold text-gray-900">{voucher.name}</p>
                <p className="text-yellow-900/50 text-sm">Platí do <span className="font-semibold text-gray-900">{fmtDate(voucher.validTo)}</span></p>
              </div>
              <div className="bg-white/80 rounded-xl p-2.5 shadow-sm"><Barcode value={voucher.ean}/></div>
            </div>
          </div>
        </div>
        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[["E-mail",voucher.email],["Telefon",voucher.phone],["Vystaveno",fmtDate(voucher.issuedAt)],["Platnost do",fmtDate(voucher.validTo)],["EAN kód",voucher.ean],["Vystavil",voucher.issuedBy],["E-mail odeslán",fmtDate(voucher.emailSentAt)],["Poznámka",voucher.note||"—"]].map(([l,v])=>(
            <div key={l} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{l}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{v}</p>
            </div>
          ))}
        </div>
        {/* Actions */}
        {canEdit && voucher.status==="Aktivní" && !showStorno && (
          <div className="flex gap-2 pb-6">
            <button onClick={()=>{onStatusChange(voucher.id,"Uplatněná","");onClose();}} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition">✓ Uplatnit</button>
            <button onClick={()=>setShowStorno(true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition">✕ Stornovat</button>
            <button onClick={()=>alert("E-mail znovu odeslán na "+voucher.email)} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition">📧</button>
          </div>
        )}
        {canEdit && showStorno && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 space-y-3">
            <p className="text-sm font-semibold text-red-700">Důvod storna <span className="text-red-400">*</span></p>
            <input value={stornoNote} onChange={e=>setStornoNote(e.target.value)} className="w-full border border-red-200 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-red-400" placeholder="Zadejte důvod…"/>
            <div className="flex gap-2">
              <button onClick={()=>{if(stornoNote.trim()){onStatusChange(voucher.id,"Stornovaná",stornoNote);onClose();}}} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition">Potvrdit</button>
              <button onClick={()=>setShowStorno(false)} className="px-5 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition">Zpět</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── CREATE WIZARD ────────────────────────────────────────────────────────────
const CreateWizard = ({onClose, onCreate, user}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({name:"",email:"",phone:"",value:1000,validMonths:12,type:"Obojí",note:""});
  const [preview, setPreview] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid1 = form.name.trim()&&form.email.trim()&&form.phone.trim();
  const valid2 = form.value>0;
  const buildPreview = () => {
    const now = new Date().toISOString().split("T")[0];
    return {id:Date.now(),contractNumber:generateContractNumber(),ean:generateEAN(),...form,issuedAt:now,validFrom:now,validTo:addMonths(now,form.validMonths),status:"Aktivní",issuedBy:user.name,emailSentAt:now};
  };
  const BtnPill = ({active,onClick,children}) => (
    <button onClick={onClick} className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${active?"border-yellow-400 text-gray-900":"border-gray-200 text-gray-500 hover:border-yellow-300"}`} style={active?{background:SCONTO_YELLOW}:{}}>{children}</button>
  );

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Nová poukázka" onClose={onClose} extra={
        <div className="flex items-center gap-1.5">
          {[1,2,3].map(n=>(
            <div key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition" style={step>=n?{background:SCONTO_YELLOW,color:"#1a1a1a"}:{background:"#f3f4f6",color:"#9ca3af"}}>{n}</div>
          ))}
        </div>
      }/>
      <div className="p-6">
        {step===1 && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400 mb-4">Krok 1 ze 3 — Zákaznické údaje</p>
            <TextInput label="Jméno zákazníka *" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Karel Novák"/>
            <TextInput label="E-mail *" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="novak@email.cz"/>
            <TextInput label="Telefon *" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+420 777 000 000"/>
            <button disabled={!valid1} onClick={()=>setStep(2)} className="w-full py-3 rounded-xl font-bold text-sm transition mt-1 disabled:opacity-40" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>Pokračovat →</button>
          </div>
        )}
        {step===2 && (
          <div className="space-y-5">
            <p className="text-xs text-gray-400">Krok 2 ze 3 — Nastavení poukázky</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Hodnota v Kč *</label>
              <div className="flex gap-2 mb-2">{[500,1000,1500,2000,3000].map(v=><BtnPill key={v} active={form.value===v} onClick={()=>set("value",v)}>{v}</BtnPill>)}</div>
              <TextInput value={form.value} type="number" onChange={e=>set("value",parseInt(e.target.value)||0)} placeholder="Vlastní hodnota"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Platnost</label>
              <div className="flex gap-2">{[3,6,12,24].map(m=><BtnPill key={m} active={form.validMonths===m} onClick={()=>set("validMonths",m)}>{m} měs.</BtnPill>)}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Typ uplatnění</label>
              <div className="flex gap-2">{["Obojí","Obchodní dům","E-shop"].map(t=><BtnPill key={t} active={form.type===t} onClick={()=>set("type",t)}>{t}</BtnPill>)}</div>
            </div>
            <TextInput label="Poznámka (volitelné)" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Narozeninový dárek…"/>
            <div className="flex gap-3">
              <button onClick={()=>setStep(1)} className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition">← Zpět</button>
              <button disabled={!valid2} onClick={()=>{setPreview(buildPreview());setStep(3);}} className="flex-1 py-3 rounded-xl font-bold text-sm transition disabled:opacity-40" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>Náhled →</button>
            </div>
          </div>
        )}
        {step===3 && preview && (
          <div>
            <p className="text-xs text-gray-400 mb-4">Krok 3 ze 3 — Náhled a potvrzení</p>
            <div className="rounded-2xl overflow-hidden mb-5" style={{background:`linear-gradient(135deg, ${SCONTO_YELLOW} 0%, #FFE85A 100%)`}}>
              <div className="p-5">
                <p className="text-[10px] font-black tracking-[0.15em] text-yellow-900/50 uppercase mb-1">Sconto nábytek</p>
                <div className="flex justify-between items-start mb-4">
                  <p className="text-4xl font-black text-gray-900">{fmtCur(preview.value)}</p>
                  <StatusBadge status="Aktivní"/>
                </div>
                <p className="font-bold text-gray-900">{preview.name}</p>
                <p className="text-yellow-900/50 text-sm">{preview.email}</p>
                <div className="flex justify-between items-end mt-3">
                  <p className="text-sm text-yellow-900/50">Platí do <span className="font-bold text-gray-900">{fmtDate(preview.validTo)}</span><br/>Typ: <span className="font-bold text-gray-900">{preview.type}</span></p>
                  <div className="bg-white/80 rounded-xl p-2 shadow-sm"><Barcode value={preview.ean}/></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
              <span className="text-xl">📧</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">E-mail bude odeslán zákazníkovi</p>
                <p className="text-gray-400 text-xs mt-0.5">{preview.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setStep(2)} className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 transition">← Zpět</button>
              <button onClick={()=>{onCreate(preview);onClose();}} className="flex-1 py-3 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition">✓ Vytvořit a odeslat</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── USER FORM MODAL ──────────────────────────────────────────────────────────
const UserFormModal = ({user: editUser, onClose, onSave}) => {
  const isNew = !editUser;
  const [form, setForm] = useState(editUser
    ? {name:editUser.name, username:editUser.username, password:"", role:editUser.role}
    : {name:"", username:"", password:"", role:"operator"}
  );
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.name.trim()&&form.username.trim()&&(isNew?form.password.trim():true);

  const save = () => {
    if (!valid) return;
    onSave({
      ...(editUser||{id:Date.now(),active:true}),
      name: form.name.trim(), username: form.username.trim(),
      password: form.password.trim()||(editUser?.password||""),
      role: form.role,
    });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={isNew?"Přidat uživatele":"Upravit uživatele"} onClose={onClose}/>
      <div className="p-6 space-y-4">
        <TextInput label="Celé jméno *" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Jana Nováková"/>
        <TextInput label="Uživatelské jméno *" value={form.username} onChange={e=>set("username",e.target.value)} placeholder="jnovakova"/>
        <TextInput label={isNew?"Heslo *":"Nové heslo (prázdné = beze změny)"} type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder={isNew?"Zadejte heslo":"••••••••"}/>
        <Sel label="Role *" value={form.role} onChange={e=>set("role",e.target.value)}>
          <option value="admin">Admin</option>
          <option value="operator">Operátor</option>
          <option value="viewer">Viewer</option>
        </Sel>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
          <p><span className="font-bold text-gray-700">Admin</span> — plný přístup, správa uživatelů</p>
          <p><span className="font-bold text-gray-700">Operátor</span> — vytváření a správa poukázek</p>
          <p><span className="font-bold text-gray-700">Viewer</span> — pouze čtení, bez úprav</p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition">Zrušit</button>
          <button disabled={!valid} onClick={save} className="flex-1 py-3 rounded-xl text-sm font-bold transition disabled:opacity-40" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>
            {isNew?"Přidat uživatele":"Uložit změny"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const LoginPage = ({onLogin, users}) => {
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState("");
  const submit = e => {
    e.preventDefault();
    const found = users.find(x=>x.username===u&&x.password===p&&x.active!==false);
    if(found) onLogin(found); else setErr("Nesprávné přihlašovací údaje.");
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" style={{fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-sm" style={{background:SCONTO_YELLOW}}>
            <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-gray-900">VoucherPro</h1>
          <p className="text-gray-400 text-sm mt-1">Sconto nábytek · Správa poukázek</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-7">
          <form onSubmit={submit} className="space-y-4">
            <TextInput label="Uživatelské jméno" value={u} onChange={e=>setU(e.target.value)} placeholder="username"/>
            <TextInput label="Heslo" type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="••••••••"/>
            {err&&<p className="text-red-500 text-xs font-medium">{err}</p>}
            <button type="submit" className="w-full py-3 rounded-xl font-black text-sm transition mt-1" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>Přihlásit se</button>
          </form>
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center mb-3 font-bold uppercase tracking-widest">Demo přihlášení</p>
            <div className="grid grid-cols-3 gap-2">
              {[["admin","Admin"],["operator","Operátor"],["viewer","Viewer"]].map(([un,label])=>(
                <button key={un} onClick={()=>{const f=users.find(x=>x.username===un);if(f)onLogin(f);}} className="py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:border-yellow-400 hover:bg-yellow-50 transition">{label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(INIT_USERS);
  const [user, setUser] = useState(null);
  const [vouchers, setVouchers] = useState(DEMO_VOUCHERS);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Vše");
  const [filterType, setFilterType] = useState("Vše");
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState(null);
  const [sortCol, setSortCol] = useState("issuedAt");
  const [sortDir, setSortDir] = useState("desc");
  const [editingUser, setEditingUser] = useState(undefined); // undefined=closed, null=new, obj=edit

  const showToast = (msg,type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const handleStatusChange = (id,status,note) => {
    setVouchers(vs=>vs.map(v=>v.id===id?{...v,status,note:note||v.note}:v));
    showToast(`Stav poukázky změněn na „${status}".`);
  };
  const handleCreate = (v) => {
    setVouchers(vs=>[v,...vs]);
    showToast(`Poukázka ${v.contractNumber} vytvořena a e-mail odeslán. 🎉`);
  };
  const handleSaveUser = (saved) => {
    setUsers(us=>{
      const ex=us.find(u=>u.id===saved.id);
      if(ex) return us.map(u=>u.id===saved.id?saved:u);
      return [...us,saved];
    });
    showToast(editingUser===null?"Uživatel přidán.":"Uživatel upraven.");
  };
  const handleDeactivate = (uid) => {
    setUsers(us=>us.map(u=>u.id===uid?{...u,active:!u.active}:u));
    showToast("Stav uživatele změněn.");
  };

  const filtered = useMemo(()=>{
    let r=vouchers.filter(v=>{
      const q=search.toLowerCase();
      if(q&&!v.name.toLowerCase().includes(q)&&!v.email.toLowerCase().includes(q)&&!v.contractNumber.toLowerCase().includes(q)&&!v.ean.includes(q)) return false;
      if(filterStatus!=="Vše"&&v.status!==filterStatus) return false;
      if(filterType!=="Vše"&&v.type!==filterType) return false;
      return true;
    });
    r.sort((a,b)=>{
      let av=a[sortCol],bv=b[sortCol];
      if(typeof av==="number") return sortDir==="asc"?av-bv:bv-av;
      return sortDir==="asc"?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
    });
    return r;
  },[vouchers,search,filterStatus,filterType,sortCol,sortDir]);

  const stats = useMemo(()=>({
    total: vouchers.length,
    active: vouchers.filter(v=>v.status==="Aktivní").length,
    totalValue: vouchers.filter(v=>v.status==="Aktivní").reduce((a,v)=>a+v.value,0),
    expiringSoon: vouchers.filter(v=>v.status==="Aktivní"&&new Date(v.validTo)<=new Date(Date.now()+30*86400000)).length,
  }),[vouchers]);

  if(!user) return <LoginPage onLogin={setUser} users={users}/>;

  const canCreate = user.role==="admin"||user.role==="operator";
  const sortToggle = col => { if(sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortCol(col);setSortDir("asc");} };
  const SortIco = ({col}) => <span className="text-gray-300 ml-1 text-xs">{sortCol===col?(sortDir==="asc"?"↑":"↓"):"↕"}</span>;

  const navItems = [
    {id:"dashboard",label:"Přehled",icon:"⊞"},
    {id:"vouchers",label:"Poukázky",icon:"🎟"},
    ...(user.role==="admin"?[{id:"users",label:"Uživatelé",icon:"👥"}]:[]),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      {/* Toast */}
      {toast&&(
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 ${toast.type==="success"?"bg-gray-900 text-white":"bg-red-500 text-white"}`}>
          {toast.type==="success"?"✓":"!"} {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:SCONTO_YELLOW}}>
              <svg width="18" height="18" fill="none" stroke="#1a1a1a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-none">VoucherPro</p>
              <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide">Sconto nábytek</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition" style={tab===n.id?{background:SCONTO_YELLOW,color:"#1a1a1a"}:{color:"#6b7280"}}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        {canCreate&&(
          <div className="p-3">
            <button onClick={()=>setShowCreate(true)} className="w-full py-2.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition hover:opacity-80" style={{background:"#1a1a1a"}}>
              ＋ Nová poukázka
            </button>
          </div>
        )}
        {/* User */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-gray-900 shrink-0" style={{background:SCONTO_YELLOW}}>{user.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{ROLE_LABEL[user.role]}</p>
            </div>
            <button onClick={()=>setUser(null)} title="Odhlásit" className="text-gray-300 hover:text-gray-600 transition">⇥</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div className="p-8 max-w-5xl">
            <h1 className="text-2xl font-black text-gray-900 mb-0.5">Přehled</h1>
            <p className="text-gray-400 text-sm mb-8">Aktuální stav všech poukázek</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {l:"Celkem",v:stats.total,icon:"🎟"},
                {l:"Aktivní",v:stats.active,icon:"✅"},
                {l:"Hodnota aktivních",v:fmtCur(stats.totalValue),icon:"💰"},
                {l:"Expiruje do 30 dní",v:stats.expiringSoon,icon:"⚠️"},
              ].map(s=>(
                <div key={s.l} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.l}</p>
                    <span className="text-lg">{s.icon}</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{s.v}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <h2 className="font-bold text-gray-900 mb-5">Rozložení stavů</h2>
              <div className="space-y-3">
                {["Aktivní","Uplatněná","Expirovaná","Stornovaná"].map(s=>{
                  const cnt=vouchers.filter(v=>v.status===s).length;
                  const pct=Math.round(cnt/vouchers.length*100);
                  const cs={Aktivní:"#10b981",Uplatněná:"#9ca3af",Expirovaná:"#ef4444",Stornovaná:"#f97316"};
                  return (
                    <div key={s} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-28 shrink-0">{s}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:cs[s]}}></div>
                      </div>
                      <span className="text-sm font-bold text-gray-700 w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Posledních 10 poukázek</h2>
              <div className="divide-y divide-gray-50">
                {vouchers.slice(0,10).map(v=>(
                  <div key={v.id} onClick={()=>setSelectedVoucher(v)} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-xl cursor-pointer transition">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={v.status}/>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{v.name}</p>
                        <p className="text-xs text-gray-400">{v.contractNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">{fmtCur(v.value)}</p>
                      <p className="text-xs text-gray-400">{fmtDate(v.issuedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VOUCHERS ── */}
        {tab==="vouchers"&&(
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Poukázky</h1>
                <p className="text-gray-400 text-sm mt-0.5">{filtered.length} z {vouchers.length} záznamů</p>
              </div>
              {canCreate&&(
                <button onClick={()=>setShowCreate(true)} className="px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition hover:opacity-80" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>
                  ＋ Nová poukázka
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-56">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Jméno, e-mail, EAN, číslo smlouvy…" className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder-gray-300 text-gray-700 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 bg-white transition"/>
              </div>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-yellow-400 transition appearance-none">
                {["Vše","Aktivní","Uplatněná","Expirovaná","Stornovaná"].map(s=><option key={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:border-yellow-400 transition appearance-none">
                {["Vše","Obojí","Obchodní dům","E-shop"].map(t=><option key={t}>{t}</option>)}
              </select>
              {(search||filterStatus!=="Vše"||filterType!=="Vše")&&(
                <button onClick={()=>{setSearch("");setFilterStatus("Vše");setFilterType("Vše");}} className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-700 border border-gray-200 bg-white transition">Zrušit filtry</button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[["contractNumber","Číslo smlouvy"],["name","Zákazník"],["value","Hodnota"],["status","Stav"],["type","Typ"],["validTo","Platnost do"],["issuedAt","Vystaveno"]].map(([col,label])=>(
                        <th key={col} onClick={()=>sortToggle(col)} className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition select-none">
                          {label}<SortIco col={col}/>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length===0?(
                      <tr><td colSpan={7} className="text-center py-16 text-gray-300 text-sm">Žádné poukázky nenalezeny</td></tr>
                    ):filtered.map(v=>(
                      <tr key={v.id} onClick={()=>setSelectedVoucher(v)} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold" style={{color:"#b08a00"}}>{v.contractNumber}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-gray-800">{v.name}</p>
                          <p className="text-gray-400 text-xs">{v.email}</p>
                        </td>
                        <td className="px-5 py-3.5 font-black text-gray-900">{fmtCur(v.value)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={v.status}/></td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{v.type}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{fmtDate(v.validTo)}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs">{fmtDate(v.issuedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length>0&&(
                <div className="px-5 py-3.5 border-t border-gray-50 flex justify-between text-xs text-gray-400">
                  <span>{filtered.length} záznamů</span>
                  <span>Celková hodnota: <strong className="text-gray-700">{fmtCur(filtered.reduce((a,v)=>a+v.value,0))}</strong></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==="users"&&user.role==="admin"&&(
          <div className="p-8 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900">Uživatelé</h1>
                <p className="text-gray-400 text-sm mt-0.5">{users.length} účtů · {users.filter(u=>u.active!==false).length} aktivních</p>
              </div>
              <button onClick={()=>setEditingUser(null)} className="px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition hover:opacity-80" style={{background:SCONTO_YELLOW,color:"#1a1a1a"}}>
                ＋ Přidat uživatele
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Uživatel","Role","Stav","Akce"].map(h=>(
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/60 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-gray-900 shrink-0" style={{background:u.active!==false?SCONTO_YELLOW:"#e5e7eb"}}>{u.name[0]}</div>
                          <div>
                            <p className={`font-semibold ${u.active===false?"text-gray-400 line-through":"text-gray-800"}`}>{u.name}</p>
                            <p className="text-gray-400 text-xs">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                      </td>
                      <td className="px-5 py-4">
                        {u.active!==false
                          ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Aktivní</span>
                          : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>Deaktivován</span>
                        }
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setEditingUser(u)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition">Upravit</button>
                          {u.id!==user.id&&(
                            <button onClick={()=>handleDeactivate(u.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${u.active!==false?"border-red-100 text-red-500 hover:bg-red-50":"border-emerald-100 text-emerald-600 hover:bg-emerald-50"}`}>
                              {u.active!==false?"Deaktivovat":"Aktivovat"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Role legend */}
            <div className="grid grid-cols-3 gap-4">
              {[["Admin","Plný přístup, správa uživatelů a nastavení"],["Operátor","Vytváření a správa poukázek, odesílání e-mailů"],["Viewer","Pouze čtení bez možnosti úprav a vytváření"]].map(([role,desc])=>(
                <div key={role} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${ROLE_STYLE[role.toLowerCase()]||ROLE_STYLE.viewer}`}>{role}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedVoucher&&<VoucherModal voucher={selectedVoucher} onClose={()=>setSelectedVoucher(null)} onStatusChange={handleStatusChange} role={user.role}/>}
      {showCreate&&<CreateWizard onClose={()=>setShowCreate(false)} onCreate={handleCreate} user={user}/>}
      {editingUser!==undefined&&<UserFormModal user={editingUser} onClose={()=>setEditingUser(undefined)} onSave={handleSaveUser}/>}
    </div>
  );
}
