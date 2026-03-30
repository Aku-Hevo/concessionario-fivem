import { useEffect, useState } from "react";

export default function App() {
  const [user,setUser] = useState(null);
  const [cars,setCars] = useState([]);
  const [form,setForm] = useState({tipo:"acquisto",persona:"",tipo_macchina:"",costo:"",targa:""});

  useEffect(()=>{
    fetch("https://concessionario-fivem.onrender.com/api/user",{credentials:"include"})
      .then(res=>res.json()).then(setUser).catch(console.error);
    fetch("https://concessionario-fivem.onrender.com/api/cars",{credentials:"include"})
      .then(res=>res.json()).then(setCars).catch(console.error);
  },[]);

  if(!user){
    return (
      <div style={{color:"white",background:"#111",height:"100vh",display:"flex",justifyContent:"center",alignItems:"center"}}>
        <a href="https://concessionario-fivem.onrender.com/auth/discord" style={{color:"cyan",fontSize:"24px",padding:"10px 20px",border:"2px solid cyan",borderRadius:"8px",textDecoration:"none"}}>
          Login con Discord
        </a>
      </div>
    );
  }

  const addCar=async()=>{
    if(!form.persona||!form.tipo_macchina||!form.costo||!form.targa) return alert("Compila tutti i campi");
    await fetch("https://concessionario-fivem.onrender.com/api/cars",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify(form)});
    setForm({tipo:"acquisto",persona:"",tipo_macchina:"",costo:"",targa:""});
    setCars(await (await fetch("https://concessionario-fivem.onrender.com/api/cars",{credentials:"include"})).json());
  };

  const deleteCar=async(id)=>{
    await fetch(`https://concessionario-fivem.onrender.com/api/cars/${id}`,{method:"DELETE",credentials:"include"});
    setCars(cars.filter(c=>c.id!==id));
  };

  const totale = cars.reduce((sum,c)=>sum+(c.tipo==="vendita"?parseInt(c.costo):0),0);

  return (
    <div style={{padding:"20px",color:"white",background:"#111",minHeight:"100vh",fontFamily:"Arial"}}>
      <h1>Dashboard Concessionario</h1>
      <p>Benvenuto {user.username} - Ruolo: {user.role}</p>
      <p>Totale guadagni: {totale}€</p>

      <div style={{margin:"20px 0",padding:"15px",background:"#222",borderRadius:"10px"}}>
        <h2>Aggiungi Auto</h2>
        <input placeholder="Persona" value={form.persona} onChange={e=>setForm({...form,persona:e.target.value})} style={inputStyle}/>
        <input placeholder="Macchina" value={form.tipo_macchina} onChange={e=>setForm({...form,tipo_macchina:e.target.value})} style={inputStyle}/>
        <input placeholder="Costo" type="number" value={form.costo} onChange={e=>setForm({...form,costo:e.target.value})} style={inputStyle}/>
        <input placeholder="Targa" value={form.targa} onChange={e=>setForm({...form,targa:e.target.value})} style={inputStyle}/>
        <button onClick={addCar} style={buttonStyle}>Aggiungi</button>
      </div>

      <div style={{padding:"15px",background:"#222",borderRadius:"10px"}}>
        <h2>Lista Auto</h2>
        {cars.map(c=>(
          <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #333",padding:"8px 0"}}>
            <span>{c.tipo_macchina} - {c.costo}€ - {c.targa} - Inserito da {c.inserito_da}</span>
            {(user.role==="Admin"||c.inserito_da===user.username)&&<button onClick={()=>deleteCar(c.id)} style={deleteButtonStyle}>Elimina</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle={display:"block",width:"100%",padding:"8px",marginBottom:"10px",borderRadius:"5px",border:"1px solid #444",background:"#111",color:"white"};
const buttonStyle={padding:"10px 20px",border:"none",borderRadius:"8px",background:"cyan",color:"#111",fontWeight:"bold",cursor:"pointer"};
const deleteButtonStyle={padding:"5px 10px",border:"none",borderRadius:"5px",background:"red",color:"white",cursor:"pointer"};
