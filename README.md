# ⚡ Centauro Cloud - Frontend & Gateway (Render.com)

Este projeto contém a interface web (Frontend) e o Gateway de ligação para colocar no **Render.com**, permitindo aceder à tua nuvem e aos teus ficheiros de 1 TB a partir de um link fixo e seguro na internet.

---

## 🚀 Como Colocar no Render (Passo a Passo em 2 Minutos)

### Passo 1: Criar Repositório no GitHub
1. Entra no teu GitHub: [github.com](https://github.com)
2. Cria um novo repositório (pode ser Público ou Privado), por exemplo com o nome: `centauro-cloud`.
3. No teu computador, nesta pasta `Z:\Centauro_Render`, envia os ficheiros para o GitHub com os comandos:
   ```bash
   git init
   git add .
   git commit -m "Centauro Cloud para Render"
   git branch -M main
   git remote add origin https://github.com/josecenturio/centauro-cloud.git
   git push -u origin main
   ```

---

### Passo 2: Criar o Serviço no Render
1. Entra na tua conta no Render: [dashboard.render.com](https://dashboard.render.com)
2. Clica no botão azul **"New +"** (canto superior direito) e escolhe **"Web Service"**.
3. Seleciona o teu repositório `centauro-cloud` do GitHub.
4. Preenche os dados:
   * **Name:** `centauro` (ou `centauro-cloud` ou o nome que quiseres)
   * **Language:** `Node`
   * **Region:** Frankfurt (Europa) ou qualquer uma
   * **Build Command:** *(podes deixar em branco ou `npm install`)*
   * **Start Command:** `node server.js`
   * **Instance Type:** `Free` (Gratuito)

---

### Passo 3: Configurar o Endereço do Teu PC (Environment Variables)
Na mesma página (ou no menu **Environment** do serviço no Render), adiciona uma variável:
* **Key:** `BACKEND_URL`
* **Value:** `http://centaurocloud.duckdns.org` (ou o link do teu PC de casa)

Clica em **"Deploy Web Service"**!

---

### 📱 O Teu Link Fixo
O Render vai criar o teu link fixo HTTPS gratuito, por exemplo:
👉 **`https://centauro-jose.onrender.com`**

Podes abrir no teu telemóvel a qualquer momento!
