import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import fondoImagen from "./../../Assets/imagen-fondo.png";

const SECRET_PHRASE = "tubebe";

function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [inputPhrase, setInputPhrase] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500)); // solo verificación

    if (inputPhrase.toLowerCase() === SECRET_PHRASE.toLowerCase()) {
      setEntrando(true); // dispara animación
      await new Promise((resolve) => setTimeout(resolve, 6500)); // duración total animación
      onLoginSuccess();
      navigate("/dashboard");
    } else {
      setError("¡Esa no es nuestra frase secreta! Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-container ${entrando ? "login-entrando" : ""}`}>
      <div
        className="login-background"
        style={{ backgroundImage: `url(${fondoImagen})` }}
      ></div>

      {entrando && (
        <div className="particulas-container">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`particula particula-${i % 5}`}></div>
          ))}
        </div>
      )}

      <div className={`login-content ${entrando ? "content-saliendo" : ""}`}>
        <h1 className="login-title">Portal M y S</h1>
        <p className="login-subtitle">
          Solo tus ojitos son capaces de ver mi alma
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            className="input-secreto"
            placeholder="Un Nuevo Amanecer"
            value={inputPhrase}
            onChange={(e) => setInputPhrase(e.target.value)}
            disabled={entrando}
          />
          {error && (
            <p className="error-message" style={{ color: "#ff4d4d" }}>
              {error}
            </p>
          )}
          <br />
          <button
            type="submit"
            className="btn-entrar"
            disabled={isLoading || entrando}
            style={{ marginTop: "20px", opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading && !entrando
              ? "Entrando..."
              : entrando
                ? "Bienvenida 💚"
                : "Bienvenida"}
          </button>
        </form>
      </div>

      {entrando && (
        <div className="bienvenida-overlay">
          <p className="bienvenida-texto">Bienvenida, Mis Ojitos 💚</p>
        </div>
      )}
    </div>
  );
}

export default Login;
