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

  // Carica dati utente e auto
  useEffect(() => {
    fetch("https://concessionario-fivem.onrender.com/api/user", { credentials: "include" })
      .then(res => res.json())
      .then(setUser)
      .catch(console.error);

    fetch("https://concessionario-fivem.onrender.com/api/cars", { credentials: "include" })
      .then(res => res.json())
      .then(setCars)
      .catch(console.error);
  }, []);

  // Se non sei loggato mostra login Discord
  if (!user) {
    return (
      <div style={{ color: "white", background: "#111", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <a
          href="https://concessionario-fivem.onrender.com/auth/discord"
          style={{ color: "cyan", fontSize: "24px", textDecoration: "none", border: "2px solid cyan", padding: "10px 20px", borderRadius: "8px" }}
        >
          Login con Discord
        </a>
      </div>
    );
  }

  // Aggiungi auto
  const addCar = async () => {
    if (!form.persona || !form.tipo_macchina || !form.costo || !form.targa) return alert("Compila tutti i campi");
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

  // Elimina auto
  const deleteCar = async (id) => {
    await fetch(`https://concessionario-fivem.onrender.com/api/cars/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    setCars(cars.filter(c => c.id !== id));
  };

  return (
    <div style={{ padding: "20px", color: "white", background: "#111", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "10px" }}>Dashboard Concessionario</h1>
      <p style={{ marginBottom: "20px" }}>Benvenuto, <strong>{user.username}</strong></p>

      <div style={{ marginBottom: "30px", padding: "15px", background: "#222", borderRadius: "10px" }}>
        <h2 style={{ marginBottom: "10px" }}>Aggiungi Auto</h2>
        <input placeholder="Persona" value={form.persona} onChange={e => setForm({ ...form, persona: e.target.value })} style={inputStyle}/>
        <input placeholder="Macchina" value={form.tipo_macchina} onChange={e => setForm({ ...form, tipo_macchina: e.target.value })} style={inputStyle}/>
        <input placeholder="Costo" type="number" value={form.costo} onChange={e => setForm({ ...form, costo: e.target.value })} style={inputStyle}/>
        <input placeholder="Targa" value={form.targa} onChange={e => setForm({ ...form, targa: e.target.value })} style={inputStyle}/>
        <button onClick={addCar} style={buttonStyle}>Aggiungi Auto</button>
      </div>

      <div style={{ padding: "15px", background: "#222", borderRadius: "10px" }}>
        <h2 style={{ marginBottom: "10px" }}>Lista Auto</h2>
        {cars.length === 0 && <p>Nessuna auto registrata.</p>}
        {cars.map(c => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", padding: "8px 0" }}>
            <span>{c.tipo_macchina} - {c.costo}€ - {c.targa} - Inserito da: {c.inserito_da}</span>
            <button onClick={() => deleteCar(c.id)} style={deleteButtonStyle}>Elimina</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stili
const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #444",
  background: "#111",
  color: "white"
};

const buttonStyle = {
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  background: "cyan",
  color: "#111",
  fontWeight: "bold",
  cursor: "pointer"
};

const deleteButtonStyle = {
  padding: "5px 10px",
  border: "none",
  borderRadius: "5px",
  background: "red",
  color: "white",
  cursor: "pointer"
};
