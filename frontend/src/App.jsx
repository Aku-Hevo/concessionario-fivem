import { useState, useEffect } from "react";

export default function App() {
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({
    tipo: "acquisto",
    persona: "",
    tipo_macchina: "",
    costo: "",
    targa: "",
  });

  useEffect(() => {
    fetch("https://concessionario-fivem.onrender.com/api/user", { credentials: "include" })
      .then(res => res.json())
      .then(setUser);

    fetch("https://concessionario-fivem.onrender.com/api/cars")
      .then(res => res.json())
      .then(setCars);
  }, []);

  if (!user) {
    return (
      <div style={{color:"white", background:"#111", height:"100vh", display:"flex", justifyContent:"center", alignItems:"center"}}>
        <a href="https://concessionario-fivem.onrender.com/auth/discord" style={{color:"cyan", fontSize:"24px"}}>
          Login con Discord
        </a>
      </div>
    );
  }

  const addCar = async () => {
    await fetch("https://concessionario-fivem.onrender.com/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    setForm({ tipo: "acquisto", persona: "", tipo_macchina: "", costo: "", targa: "" });
    fetch("https://concessionario-fivem.onrender.com/api/cars", { credentials: "include" })
      .then(res => res.json())
      .then(setCars);
  };

  const deleteCar = async (id) => {
    await fetch(`https://concessionario-fivem.onrender.com/api/cars/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setCars(cars.filter(c => c.id !== id));
  };

  return (
    <div style={{padding:"20px", color:"white", background:"#111", minHeight:"100vh"}}>
      <h1>Dashboard</h1>
      <p>Benvenuto {user.username}</p>

      <h2>Aggiungi Auto</h2>
      <input placeholder="Persona" value={form.persona} onChange={e => setForm({...form, persona:e.target.value})}/>
      <input placeholder="Macchina" value={form.tipo_macchina} onChange={e => setForm({...form, tipo_macchina:e.target.value})}/>
      <input placeholder="Costo" type="number" value={form.costo} onChange={e => setForm({...form, costo:e.target.value})}/>
      <input placeholder="Targa" value={form.targa} onChange={e => setForm({...form, targa:e.target.value})}/>
      <button onClick={addCar} style={{marginTop:"10px"}}>Aggiungi</button>

      <h2>Lista Auto</h2>
      {cars.map(c => (
        <div key={c.id} style={{borderBottom:"1px solid #333", marginBottom:"5px", paddingBottom:"5px"}}>
          <strong>{c.tipo_macchina}</strong> - {c.costo}€ - {c.targa} - Inserito da: {c.inserito_da}
          <button onClick={() => deleteCar(c.id)} style={{marginLeft:"10px"}}>Elimina</button>
        </div>
      ))}
    </div>
  );
}
