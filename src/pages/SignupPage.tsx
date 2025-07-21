import React from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";

export default function SignupPage() {
  const navigate = useNavigate();
  return <AuthForm onAuthSuccess={() => navigate("/")} />;
} 