// server/api/jwt.js
// RS256 JWT生成・検証ユーティリティ

// PEM→CryptoKey変換
async function importPrivateKey(pem) {
    const binary = str2ab(pemToBase64(pem));
    return crypto.subtle.importKey(
      "pkcs8",
      binary,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
  }
  async function importPublicKey(pem) {
    const binary = str2ab(pemToBase64(pem));
    return crypto.subtle.importKey(
      "spki",
      binary,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  }
  function pemToBase64(pem) {
    return pem.replace(/-----(BEGIN|END) [\w ]+-----/g, "").replace(/\s+/g, "");
  }
  function str2ab(str) {
    const b = atob(str);
    const buf = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) buf[i] = b.charCodeAt(i);
    return buf.buffer;
  }
  function ab2b64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }
  function b64url(str) {
    return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlEncode(obj) {
    return b64url(btoa(JSON.stringify(obj)));
  }
  function b64urlDecode(str) {
    return JSON.parse(atob(str.replace(/-/g, "+").replace(/_/g, "/")));
  }
  
  // JWT生成
  export async function signJWT(payload, privateKeyPem, { expiresIn = 900, jti } = {}) {
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      jti: jti || crypto.randomUUID(),
    };
    const unsigned = `${b64urlEncode(header)}.${b64urlEncode(claims)}`;
    const key = await importPrivateKey(privateKeyPem);
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
    return `${unsigned}.${b64url(ab2b64(sig))}`;
  }
  
  // JWT検証
  export async function verifyJWT(token, publicKeyPem) {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) throw new Error("Invalid JWT");
    const key = await importPublicKey(publicKeyPem);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
      new TextEncoder().encode(`${h}.${p}`)
    );
    if (!valid) throw new Error("Invalid signature");
    const payload = b64urlDecode(p);
    if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Expired");
    return payload;
  }