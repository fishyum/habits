import esbuild from "esbuild";
import fs from "fs";

async function buildHTML() {
  console.log("Compiling code with esbuild...");
  try {
    const result = await esbuild.build({
      entryPoints: ["src/main.tsx"],
      bundle: true,
      write: false,
      format: "esm",
      target: "es2022",
      minify: false,
      loader: {
        ".css": "empty",
        ".png": "dataurl",
        ".jpg": "dataurl",
        ".svg": "dataurl"
      },
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "motion/react",
        "lucide-react",
        "firebase/app",
        "firebase/auth",
        "firebase/firestore"
      ]
    });

    const jsCode = result.outputFiles[0].text;

    // Process global CSS contents safely by taking only the custom cyberpunk classes
    const indexCss = fs.readFileSync("src/index.css", "utf8");
    const startIndex = indexCss.indexOf(".grain-overlay");
    const cleanCss = startIndex !== -1 ? indexCss.substring(startIndex) : indexCss;
    
    // Extrapolate custom Tailwind configs from the theme
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>COURIER Terminal - Subconscious Decryption System</title>
  
  <!-- Font Integrations -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS Engine -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
            mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
            headline: ["Inter", "sans-serif"],
            display: ["Inter", "sans-serif"],
            body: ["Inter", "sans-serif"],
            label: ["Inter", "sans-serif"]
          },
          colors: {
            "slate-950": "#020617",
            "zinc-550": "#52525b",
            "primary-custom": "#3b82f6",
            "secondary-custom": "#6366f1",
            "background-custom": "#0c0c0c",
            "surface-custom": "#111111",
            "tertiary-container": "#1a1a1a",
            "surface-variant": "#161616",
            "error-container": "#450a0a",
            "on-secondary-fixed": "#e0e7ff",
            "on-secondary": "#c7d2fe",
            "on-primary-fixed": "#dbeafe",
            "on-tertiary-container": "#9ca3af",
            "on-error-container": "#fee2e2",
            "surface-container-high": "#1e1e1e",
            "secondary-fixed": "#e0e7ff",
            "on-primary-fixed-variant": "#2563eb",
            "on-error": "#f87171",
            "on-surface-variant": "#9ca3af",
            "on-tertiary-fixed-variant": "#6b7280",
            "on-primary-container": "#eff6ff",
            "on-background": "#f3f4f6",
            "outline-variant-custom": "#27272a",
            "surface-container-low": "#0c0c0c",
            "surface-container-lowest": "#050505",
            "tertiary-custom": "#1f2937",
            "secondary-container-custom": "#1e1b4b",
            "on-primary-custom": "#ffffff",
            "on-secondary-fixed-variant": "#4f46e5",
            "surface-tint-custom": "#3b82f6",
            "inverse-on-surface": "#111111",
            "secondary-fixed-dim": "#818cf8",
            "surface-bright": "#1c1c1c",
            "on-surface-custom": "#f3f4f6",
            "on-tertiary-fixed": "#f9fafb",
            "surface-dim": "#0c0c0c",
            "outline-custom": "#3f3f46",
            "inverse-surface": "#f3f4f6",
            "error-custom": "#ef4444",
            "primary-fixed": "#eff6ff",
            "on-tertiary-custom": "#ffffff",
            "primary-fixed-dim": "#60a5fa",
            "on-secondary-container": "#c7d2fe",
            "tertiary-fixed": "#1e2937",
            "tertiary-fixed-dim": "#111827",
            "surface-container": "#161616",
            "inverse-primary": "#1d4ed8",
            "surface-container-highest": "#222222",
            "primary-container-custom": "#1d4ed8"
          }
        }
      }
    };
  </script>
  
  <style>
    /* Injected Global Custom CSS */
    ${cleanCss}
  </style>

  <!-- Import Map for CDNs -->
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@19?dev",
      "react-dom": "https://esm.sh/react-dom@19?dev",
      "react-dom/client": "https://esm.sh/react-dom@19/client?dev",
      "motion/react": "https://esm.sh/motion/react@12?dev",
      "lucide-react": "https://esm.sh/lucide-react@0.468.0",
      "firebase/app": "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js",
      "firebase/auth": "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js",
      "firebase/firestore": "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js"
    }
  }
  </script>
</head>
<body class="bg-[#050505] text-slate-100 min-h-screen overflow-x-hidden select-none selection:bg-cyan-500/20">
  <div id="root"></div>

  <!-- Main Single-File React Bundle -->
  <script type="module">
    ${jsCode}
  </script>
</body>
</html>`;

    fs.writeFileSync("index.html", html);
    console.log("Successfully built unified index.html!");
  } catch (err) {
    console.error("Compilation failed:", err);
    process.exit(1);
  }
}

buildHTML();
