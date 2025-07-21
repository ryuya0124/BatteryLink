import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { useAuthContext } from "../hooks/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthContext();
  return <AuthForm onAuthSuccess={async (user, password) => {
    await login(user.email, password);
    navigate("/");
  }} />;
} 