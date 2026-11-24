# Wire SiteHeader di App.jsx (1 menit)

Setelah pull branch `feat/floating-nav-lenis-gsap`:

1. Di `client/src/App.jsx`, tambah import:

```js
import SiteHeader from "./components/SiteHeader";
```

(letakkan dekat import `GoogleAuthButton` / `HeroSection`)

2. Ganti **seluruh** fungsi `Header` menjadi:

```js
function Header() {
  return <SiteHeader />;
}
```

3. Install dependency baru:

```bash
cd client
npm install
npm run dev
```

Navbar floating pill (desktop) + bottom tab (mobile) + Lenis smooth scroll akan aktif.
