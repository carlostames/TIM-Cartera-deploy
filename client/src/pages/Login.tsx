import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Step = "email" | "sending" | "sent" | "error";

export default function Login() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStep("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep("sent");
      } else {
        setErrorMsg(data.error || "Error al enviar el enlace");
        setStep("error");
      }
    } catch {
      setErrorMsg("Error de conexión. Intenta de nuevo.");
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/25 mb-4">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            TIM Cartera
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistema de Gestión de Cartera Vencida
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200/60 dark:border-slate-700/60 p-8">
          
          {step === "email" && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Iniciar Sesión
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Ingresa tu correo y te enviaremos un enlace de acceso
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="tu.correo@leasingtim.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl"
                    required
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
                >
                  Enviar enlace de acceso
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
                Solo correos <strong>@leasingtim.mx</strong> y <strong>@bpads.mx</strong>
              </p>
            </>
          )}

          {step === "sending" && (
            <div className="text-center py-8">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Enviando enlace...
              </p>
            </div>
          )}

          {step === "sent" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                ¡Revisa tu correo!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                Enviamos un enlace de acceso a:
              </p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">
                {email}
              </p>
              <p className="text-xs text-slate-400">
                El enlace expira en 15 minutos
              </p>
              <Button
                variant="ghost"
                onClick={() => { setStep("email"); setEmail(""); }}
                className="mt-4 text-sm"
              >
                Usar otro correo
              </Button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Error
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {errorMsg}
              </p>
              <Button
                variant="outline"
                onClick={() => setStep("email")}
                className="rounded-xl"
              >
                Intentar de nuevo
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Leasing TIM
        </p>
      </div>
    </div>
  );
}
