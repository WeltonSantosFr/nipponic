# 🚀 Guia de Deploy na Oracle Cloud (OCI) com Docker

Este guia orienta o passo a passo completo para hospedar a **API** (e opcionalmente a versão **Web**) do Nipponic em uma máquina virtual (Compute Instance) na **Oracle Cloud Infrastructure (OCI)** utilizando Docker e Docker Compose.

---

## 📋 Índice
1. [Criando a Máquina Virtual na OCI](#1-criando-a-máquina-virtual-na-oci)
2. [Liberando as Portas na OCI (Security List)](#2-liberando-as-portas-na-oci-security-list)
3. [Liberando as Portas no Firewall do Linux](#3-liberando-as-portas-no-firewall-do-linux)
4. [Instalando Docker e Docker Compose](#4-instalando-docker-e-docker-compose)
5. [Clonando o Repositório e Configurando o Ambiente](#5-clonando-o-repositório-e-configurando-o-ambiente)
6. [Subindo os Containers](#6-subindo-os-containers)
7. [Comandos Úteis de Manutenção e Logs](#7-comandos-úteis-de-manutenção-e-logs)
8. [Configurando HTTPS com Domínio (Caddy ou Nginx)](#8-configurando-https-com-domínio-caddy-ou-nginx)

---

## 1. Criando a Máquina Virtual na OCI

Ao criar a instância no console da Oracle Cloud:
- **Imagem recomendada:** Ubuntu 24.04 LTS ou Ubuntu 22.04 LTS (ou Oracle Linux 9).
- **Shape recomendada:**
  - **Ampere A1 (ARM):** *Always Free* até 4 OCPU e 24 GB de RAM (excelente custo-benefício e performance).
  - **VM.Standard.E2.1.Micro (x86_64):** *Always Free* 1 OCPU e 1 GB de RAM.
- **Rede:** Atribua um **endereço IPv4 público** à máquina.
- **Chave SSH:** Salve a chave privada `.key` no seu computador para acessar a máquina.

Acesse a máquina via terminal:
```bash
ssh -i /caminho/para/sua-chave.key ubuntu@<IP_PUBLICO_DA_VM>
```

---

## 2. Liberando as Portas na OCI (Security List)

Por padrão, a rede virtual (VCN) da Oracle Cloud bloqueia portas que não sejam a 22 (SSH).

1. No painel da Oracle Cloud, acesse: **Networking** > **Virtual Cloud Networks (VCN)**.
2. Clique na sua VCN e depois em **Security Lists** (geralmente *Default Security List*).
3. Clique em **Add Ingress Rules**:
   - **Source Type:** CIDR
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `3001` (API) e/ou `3000` (Web) ou `80,443` (se for usar proxy reverso com SSL).
   - **Description:** `Permitir trafego API Nipponic`
4. Clique em **Add Ingress Rules**.

---

## 3. Liberando as Portas no Firewall do Linux

> [!IMPORTANT]
> **Ponto Crítico na Oracle Cloud:** Mesmo liberando a porta no painel da Oracle, a imagem do sistema operacional da OCI possui um firewall ativo que descarta conexões por padrão. Você deve liberar a porta no sistema:

### No Ubuntu / Debian:
Execute os comandos abaixo para permitir a porta 3001 (API) e salvar a regra:
```bash
# Permitir a porta 3001 no iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT

# (Opcional) Se também for expor a porta 3000 da Web diretamente:
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# Instalar o utilitário para persistir regras entre reboots
sudo apt-get update && sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save
sudo netfilter-persistent reload
```

### No Oracle Linux:
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 4. Instalando Docker e Docker Compose

Na máquina virtual, instale o Docker oficial com o script de instalação automatizado:

```bash
# Baixar e instalar Docker
curl -fsSL https://get.docker.com | sh

# Adicionar seu usuário ao grupo docker (para não precisar usar sudo toda vez)
sudo usermod -aG docker $USER

# Aplicar o novo grupo na sessão atual
newgrp docker

# Verificar a instalação
docker --version
docker compose version
```

---

## 5. Clonando o Repositório e Configurando o Ambiente

### 5.1. Clonar o projeto
```bash
git clone https://github.com/WeltonSantosFr/nipponic.git
cd nipponic
```

Se for testar na branch de Docker:
```bash
git checkout feat/docker-oracle-cloud
```

### 5.2. Configurar as Variáveis de Ambiente da API
Copie o arquivo de exemplo para criar seu `.env` real:
```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```

Preencha com seus dados reais:
```env
# URL de conexão com o PostgreSQL / Supabase
DATABASE_URL="postgresql://usuario:senha@host:5432/banco"

# Porta da API (padrão 3001)
PORT=3001

# Segredo JWT para autenticação (gere uma string aleatória com ao menos 32 caracteres)
JWT_SECRET="sua-chave-secreta-jwt-super-segura-de-pelo-menos-32-chars"

# Origens permitidas no CORS (endereço do seu frontend na Vercel ou IP/domínio)
FRONTEND_URL="https://nipponic-web.vercel.app,http://localhost:3000"
```

> [!TIP]
> **Dica Supabase / IPv6:**
> A API está configurada com `dns.setDefaultResultOrder('ipv4first')` por padrão, evitando falhas de rota IPv6 (`ENETUNREACH`) ao conectar ao Supabase ou Neon.

### 5.3. (Opcional) Configurar Variáveis da Web
Se desejar rodar a versão Web também na VM:
```bash
cp apps/web/.env.example apps/web/.env
nano apps/web/.env
```

Preencha:
```env
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://<IP_PUBLICO_DA_VM>:3001
DEEPL_AUTH_KEY=sua-chave-deepl-opcional
```

---

## 6. Subindo os Containers

### Opção A: Subir apenas a API (Recomendado se o Web estiver na Vercel)
```bash
docker compose up --build -d api
```

### Opção B: Subir API e Web juntos
```bash
docker compose up --build -d
```

### 6.1. Testando o Funcionamento
Teste localmente na VM ou pelo navegador do seu computador:
```bash
curl -i http://localhost:3001/
```
A resposta esperada é um JSON `200 OK`:
```json
{"message":"hello from create-prisma + nest"}
```

---

## 7. Comandos Úteis de Manutenção e Logs

| Ação | Comando |
| :--- | :--- |
| **Ver logs da API em tempo real** | `docker compose logs -f api` |
| **Ver status e integridade (Health)** | `docker compose ps` |
| **Reiniciar a API** | `docker compose restart api` |
| **Parar os containers** | `docker compose down` |
| **Atualizar a aplicação com novas alterações** | `git pull && docker compose up --build -d api` |
| **Rodar migrações do banco (Prisma)** | `docker compose exec api pnpm run migrate` |

---

## 8. Configurando HTTPS com Domínio (Caddy ou Nginx)

Para usar um domínio próprio com HTTPS (ex.: `api.meudominio.com`) sem expor a porta 3001 diretamente:

### Usando Caddy (Mais simples, SSL 100% automático):
1. Instale o Caddy:
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update && sudo apt install caddy
   ```

2. Edite `/etc/caddy/Caddyfile`:
   ```caddy
   api.meudominio.com {
       reverse_proxy localhost:3001
   }
   ```

3. Reinicie o Caddy:
   ```bash
   sudo systemctl reload caddy
   ```
O Caddy provisionará e renovará os certificados SSL Let's Encrypt automaticamente.
