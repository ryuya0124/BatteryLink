import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function SignupPage() {
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  return (
    <div>
      <button onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
        Auth0で新規登録
      </button>
    </div>
  );
} 