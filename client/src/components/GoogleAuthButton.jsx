import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function GoogleAuthButton({ onSuccess, onError }) {
  const controlRef = useRef(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const control = controlRef.current;
    if (!control) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(200, Math.min(400, Math.floor(entry.contentRect.width))));
    });
    observer.observe(control);
    return () => observer.disconnect();
  }, []);

  return <div className="google-auth-control" ref={controlRef}>
    <GoogleLogin
      locale="id"
      onSuccess={({ credential }) => {
        if (credential) onSuccess(credential);
        else onError("Google tidak mengembalikan credential yang valid.");
      }}
      onError={() => onError("Autentikasi Google gagal. Silakan coba lagi.")}
      theme="outline"
      size="large"
      shape="rectangular"
      text="continue_with"
      width={width}
    />
  </div>;
}
