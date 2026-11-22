import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk" };

export default function Login() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
