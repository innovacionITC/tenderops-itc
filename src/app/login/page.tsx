import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>Acceso privado</CardTitle>
            <CardDescription>Intelecto · xRM — sistema de uso interno</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          Acceso autorizado únicamente
        </p>
      </div>
    </div>
  );
}
