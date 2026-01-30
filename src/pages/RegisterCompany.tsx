import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, functions } from "../firebase/firebase";
import "./register-company.css";

type FormState = {
  companyName: string;
  cnpj: string;
  adminEmail: string;
  adminPassword: string;
  createMaster: boolean;
  masterEmail: string;
  masterPassword: string;
};

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function isValidCnpj(raw: string) {
  // validação simples (tamanho). Se quiser, depois colocamos validação completa.
  const d = onlyDigits(raw);
  return d.length === 14;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterCompany() {
  const [form, setForm] = useState<FormState>({
    companyName: "",
    cnpj: "",
    adminEmail: "",
    adminPassword: "",
    createMaster: false,
    masterEmail: "",
    masterPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canSubmit = useMemo(() => {
    if (!form.companyName.trim()) return false;
    if (!isValidCnpj(form.cnpj)) return false;
    if (!isValidEmail(form.adminEmail)) return false;
    if (form.adminPassword.length < 6) return false;

    if (form.createMaster) {
      if (!isValidEmail(form.masterEmail)) return false;
      if (form.masterPassword.length < 6) return false;
    }
    return true;
  }, [form]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAdd() {
    setMsg(null);

    if (!canSubmit) {
      setMsg({ type: "error", text: "Preencha todos os campos corretamente." });
      return;
    }

    setLoading(true);
    try {
      // 1) cria a empresa (Firestore gera o ID)
      const companyRef = await addDoc(collection(db, "companies"), {
        name: form.companyName.trim(),
        cnpj: onlyDigits(form.cnpj),
        status: "ACTIVE",
        classification: "INVENTORY_CONTRACTOR",
        createdAt: serverTimestamp(),
      });

      const companyId = companyRef.id;

      // 2) chama Cloud Function para criar usuários no Auth + inserir members
      // (ela retorna os uids criados)
      const createCompanyWithUsers = httpsCallable(functions, "createCompanyWithUsers");

      const result = await createCompanyWithUsers({
        companyId,
        admin: {
          email: form.adminEmail.trim().toLowerCase(),
          password: form.adminPassword,
        },
        master: form.createMaster
          ? {
              email: form.masterEmail.trim().toLowerCase(),
              password: form.masterPassword,
            }
          : null,
      });

      // 3) feedback
      setMsg({
        type: "success",
        text: `Empresa criada com sucesso! CompanyId: ${companyId}`,
      });

      // opcional: reset form
      setForm({
        companyName: "",
        cnpj: "",
        adminEmail: "",
        adminPassword: "",
        createMaster: false,
        masterEmail: "",
        masterPassword: "",
      });

      console.log("Function result:", result.data);
    } catch (e: any) {
      console.error(e);
      setMsg({
        type: "error",
        text:
          e?.message ??
          "Erro ao criar empresa. Verifique permissões (Firestore Rules) e a Cloud Function.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rc-page">
      <div className="wrap">
        <div className="brand">
          <div className="logo">NV</div>
          <div className="brand-text">
            <h1>NexusVerde • Admin</h1>
            <p>Criar empresa e usuários</p>
          </div>
        </div>

        <div className="card">
          <h2 className="title">Cadastrar empresa</h2>
          <p className="subtitle">
            Preencha os dados abaixo para criar a empresa, o admin e (opcionalmente) o usuário master.
          </p>

          <div className="grid">
            <div className="field">
              <label>Nome da empresa</label>
              <input
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
                placeholder="Ex.: Nexus Verde LTDA"
              />
            </div>

            <div className="field">
              <label>CNPJ</label>
              <input
                value={form.cnpj}
                onChange={(e) => setField("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
              />
              <small>{form.cnpj && !isValidCnpj(form.cnpj) ? "CNPJ deve ter 14 dígitos." : " "}</small>
            </div>

            <div className="separator" />

            <div className="section-title">Usuário Admin da empresa</div>

            <div className="field">
              <label>E-mail (Admin)</label>
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setField("adminEmail", e.target.value)}
                placeholder="admin@empresa.com"
              />
            </div>

            <div className="field">
              <label>Senha (Admin)</label>
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setField("adminPassword", e.target.value)}
                placeholder="mínimo 6 caracteres"
              />
            </div>

            <div className="separator" />

            <div className="switch-row">
              <div>
                <div className="section-title">Adicionar usuário Master</div>
                <div className="hint">
                  Master tem acesso total (visualização completa), conforme sua regra de negócio.
                </div>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.createMaster}
                  onChange={(e) => setField("createMaster", e.target.checked)}
                />
                <span className="slider" />
              </label>
            </div>

            {form.createMaster && (
              <>
                <div className="field">
                  <label>E-mail (Master)</label>
                  <input
                    type="email"
                    value={form.masterEmail}
                    onChange={(e) => setField("masterEmail", e.target.value)}
                    placeholder="master@empresa.com"
                  />
                </div>

                <div className="field">
                  <label>Senha (Master)</label>
                  <input
                    type="password"
                    value={form.masterPassword}
                    onChange={(e) => setField("masterPassword", e.target.value)}
                    placeholder="mínimo 6 caracteres"
                  />
                </div>
              </>
            )}
          </div>

          {msg && (
            <div className={`status ${msg.type === "success" ? "success" : "error"}`}>
              {msg.text}
            </div>
          )}

          <div className="actions">
            <button className="btn primary" disabled={loading || !canSubmit} onClick={handleAdd}>
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          <div className="footer">
            Dica: crie senhas temporárias e peça para o usuário redefinir depois.
          </div>
        </div>
      </div>
    </div>
  );
}
