import Link from "next/link";
import Card, { CardBody } from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { login } from "./actions";

export default function LoginPage() {
  return (
    <Card>
      <CardBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
          <p className="text-sm text-slate-500 mt-1">
            Entra na tua conta para gerir a escola
          </p>
        </div>

        <form action={login} className="space-y-4">
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
            placeholder="••••••••"
            required
          />

          <Button type="submit" fullWidth size="lg">
            Entrar
          </Button>
        </form>

        <p className="text-sm text-slate-600 text-center mt-6">
          Ainda não tens conta?{" "}
          <Link
            href="/signup"
            className="text-sky-600 font-medium hover:text-sky-700"
          >
            Criar conta
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}