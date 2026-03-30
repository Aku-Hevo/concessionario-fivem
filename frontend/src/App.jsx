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
    fetch("https://concessionario.onrender.com/api/user", { credentials: "include" })
      .then(res => res.json())
      .then(setUser);

    fetch("https://concessionario.onrender.com/api/cars")
      .then(res => res.json())
      .then(setCars);
  }, []);

  if (!user) {
    return (
      <div style={{color:"white", background:"#111", height:"100vh", display:"flex", justifyContent:"center", alignItems:"center"}}>
        <a href="https://concessionario.onrender.com/auth/discord">
          Login con Discord
        </a>
      </div>
    );
  }

  const addCar = async () => {
    await fetch("https://concessionario.onrender.com/api/cars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    location.reload();
  };

  return (
    <div style={{padding:"20px", color:"white", background:"#111"}}>
      <h1>Dashboard</h1>

      <input placeholder="Persona" onChange={e => setForm({...form, persona:e.target.value})}/>
      <input placeholder="Macchina" onChange={e => setForm({...form, tipo_macchina:e.target.value})}/>
      <input placeholder="Costo" type="number" onChange={e => setForm({...form, costo:e.target.value})}/>
      <input placeholder="Targa" onChange={e => setForm({...form, targa:e.target.value})}/>

      <button onClick={addCar}>Aggiungi</button>

      <h2>Lista</h2>
      {cars.map(c => (
        <div key={c.id}>
          {c.tipo_macchina} - {c.costo}
        </div>
      ))}
    </div>
  );
}