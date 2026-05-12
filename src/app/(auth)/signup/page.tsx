import Link from "next/link";
import Card, { CardBody } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;

  // Estado: email enviado
  if (params.sent === "1") {
    return (
      <Card>
        <CardBody>
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Confirma o teu email
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              Enviámos um link de confirmação para o teu email.
              Clica no link para activar a tua conta.
            </p>
            <Link
              href="/login"
              className="text-sky-600 font-medium hover:text-sky-700 text-sm"
            >
              Voltar ao login
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>
          <p className="text-sm text-slate-500 mt-1">
            Começa a gerir a tua escola de surf em minutos
          </p>
        </div>

        <form action={signup} className="space-y-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="nome@escola.pt"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            required
            hint="Usa pelo menos 8 caracteres"
          />

          <Button type="submit" fullWidth size="lg">
            Criar conta
          </Button>
        </form>

        <p className="text-sm text-slate-600 text-center mt-6">
          Já tens conta?{" "}
          <Link
            href="/login"
            className="text-sky-600 font-medium hover:text-sky-700"
          >
            Entrar
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}