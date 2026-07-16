import { useEffect, useState } from "react";
import { Wrench, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function Login() {
  const { signIn, signUp, profile } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile && !profile.active) {
      toast.error("Sua conta foi desativada. Contate um administrador.");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
        toast.success("Login realizado");
      } else {
        await signUp(email.trim(), password, name.trim());
        toast.success("Conta criada! Verifique seu e-mail se necessário.");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha na autenticação";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app-bg px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent text-app-bg">
            <Wrench size={32} strokeWidth={2.5} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white">ToolsLoc</h1>
            <p className="text-sm text-app-muted">Gestão de Ferramentas e Ativos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[14px] border-[0.5px] border-app-separator bg-app-card p-5">
          <div className="flex gap-2 rounded-xl bg-app-elevated p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "login" ? "bg-app-accent text-app-bg" : "text-app-muted"}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-app-accent text-app-bg" : "text-app-muted"}`}
            >
              Cadastrar
            </button>
          </div>

          {mode === "signup" && (
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[10px] border-[0.5px] border-app-separator bg-app-elevated py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-app-muted/60 outline-none focus:border-app-accent"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-app-separator bg-app-elevated py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-app-muted/60 outline-none focus:border-app-accent"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[10px] border-[0.5px] border-app-separator bg-app-elevated py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-app-muted/60 outline-none focus:border-app-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-app-accent py-3 text-sm font-bold text-app-bg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar Conta"}
          </button>
        </form>

        <p className="text-center text-xs text-app-muted">
          {mode === "login"
            ? "Novo colaborador? Toque em Cadastrar para criar sua conta."
            : "Já tem conta? Toque em Entrar para acessar."}
        </p>
      </div>
    </div>
  );
}
