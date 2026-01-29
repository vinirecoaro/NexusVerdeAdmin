import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import "./login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/register-company");
        } catch (err: any) {
            if (err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found") {
                setError("E-mail ou senha inválidos");
            } else {
                setError("Erro ao entrar. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="wrap">
                <div className="brand">
                    <div className="logo">NV</div>
                    <h1>NexusVerde • Admin</h1>
                </div>

                <div className="card">
                    <h2 className="title">Acesso administrativo</h2>
                    <p className="subtitle">
                        Entre com seu e-mail corporativo para gerenciar empresas.
                    </p>

                    <form onSubmit={handleSubmit} className="form">
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <div className="status error">{error}</div>}

                        <button className="btn primary" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <div className="footer">
                        Acesso restrito aos administradores do sistema.
                    </div>
                </div>
            </div>
        </div>
    );
}
