import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import type { ReactNode } from "react";

type Props = { children: ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          setAllowed(false);
          return;
        }

        const snap = await getDoc(doc(db, "admins", user.uid));
        setAllowed(snap.exists());
      } catch (e) {
        // Se deu permission denied ou qualquer erro, trate como não permitido
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;
  if (!allowed) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
