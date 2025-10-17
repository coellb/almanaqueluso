# 🔐 Configuração de Secrets - Workaround para Bug do Replit

## 🐛 Problema Identificado
O Replit Secrets tem um bug que **corrompe variáveis de ambiente com underscores** (`_`). As chaves são trocadas entre si ou truncadas - **MESMO quando usas aliases sem underscores!**

## ✅ Solução: Auto-Correção Inteligente + Aliases

O sistema implementa **duas camadas de proteção**:

1. **Aliases sem underscores** (STRIPESECRETKEY em vez de STRIPE_SECRET_KEY)
2. **Auto-correção inteligente** que detecta chaves trocadas pelos prefixos:
   - `sk_` = Secret Key (chave privada)
   - `pk_` = Public Key (chave pública)

Se o Replit trocar as chaves, o sistema **corrige automaticamente** na inicialização! Verás esta mensagem nos logs:
```
[ENV] 🔄 Detected swapped Stripe keys, auto-correcting...
```

Siga os passos abaixo para configurar:

---

## 📋 Passo 1: Configurar Stripe Keys

```bash
# No terminal do Replit, execute:
replit secrets set STRIPESECRETKEY="sk_live_sua_chave_stripe_aqui"
replit secrets set STRIPEPUBLICKEY="pk_live_sua_chave_publica_stripe_aqui"
```

**Onde encontrar as chaves:**
1. Acesse https://dashboard.stripe.com/apikeys
2. **Secret Key**: Começa com `sk_live_...` (modo produção) ou `sk_test_...` (modo teste)
3. **Publishable Key**: Começa com `pk_live_...` (modo produção) ou `pk_test_...` (modo teste)

---

## 📋 Passo 2: Configurar VAPID Keys (Push Notifications)

```bash
# Gerar novas chaves VAPID (se ainda não tiver):
npx web-push generate-vapid-keys

# Depois configurar no Replit:
replit secrets set VAPIDPUBLICKEY="sua_chave_publica_vapid_aqui"
replit secrets set VAPIDPRIVATEKEY="sua_chave_privada_vapid_aqui"
```

**Características das chaves VAPID:**
- **Chave Pública**: 87 caracteres (começa com letras maiúsculas como `BD...` ou `BP...`)
- **Chave Privada**: 43 caracteres (mix de letras e números)

⚠️ **IMPORTANTE**: Se já tiver utilizadores com notificações push ativas, NÃO regenere as chaves VAPID! Use as existentes em `server/services/pushNotificationService.ts` (linhas 9-10).

**Chaves VAPID Atuais (já funcionais):**
```bash
replit secrets set VAPIDPUBLICKEY="BD58hkgWvX5JcQAkLosAmWc1YMCsYcKKG0Z5e1H98PQ2YeE3kxVVljuBkgUNu4s6ocGbBaAQ4ldR6MwuoFlV7C8"
replit secrets set VAPIDPRIVATEKEY="pTXiOx3tPdavzlwR3FLrJd2yg9FgzwPyWr7Ctl3w9YA"
```

---

## 📋 Passo 3: Configurar API Keys Opcionais

### WorldTides API (para dados de marés):
```bash
replit secrets set WORLDTIDESAPIKEY="sua_chave_worldtides_aqui"
```
**Onde obter**: https://www.worldtides.info/developer

### Football API (para jogos de futebol):
```bash
replit secrets set FOOTBALLAPIKEY="sua_chave_football_api_aqui"
```
**Onde obter**: https://www.api-football.com/

---

## 🔍 Passo 4: Validar Configuração

Após configurar os secrets, valide se estão corretos:

```bash
# Acesse o endpoint de diagnóstico:
curl http://localhost:5000/api/_diagnostics/env
```

**Saída esperada:**
```json
{
  "stripe_secret_key": "sk_live... (len:107)",     // ✅ Começa com sk_live
  "stripe_public_key": "pk_live... (len:107)",     // ✅ Começa com pk_live  
  "vapid_public_key": "BD58hkg... (len:87)",       // ✅ 87 caracteres
  "vapid_private_key": "pTXiOx3... (len:43)",      // ✅ 43 caracteres
  "jwt_secret": "xxxxxxx... (len:32+)",            // ✅ Qualquer tamanho
  "worldtides_api_key": "xxxxxxx... (len:varies)", // ✅ Se configurado
  "football_api_key": "xxxxxxx... (len:varies)"    // ✅ Se configurado
}
```

⚠️ **Sinais de Problema:**
- Chaves começam com prefixos errados (ex: `rk_live` em vez de `pk_live`)
- VAPID keys trocadas (pública com 43 chars, privada com 87 chars)
- Mesmos valores repetidos em chaves diferentes
- Chaves vazias quando deveriam ter valores

---

## 🔄 Passo 5: Reiniciar o Servidor

Após configurar todos os secrets:

1. **No Replit**: Clique no botão "Stop" e depois "Run" novamente
2. **Ou no terminal**: O servidor reinicia automaticamente quando edita ficheiros

---

## 📊 Como Funciona o Sistema ENV

O ficheiro `server/env.ts` implementa um sistema de **fallback em cascata**:

```typescript
// Tenta primeiro o alias sem underscore, depois a versão com underscore
STRIPE_SECRET_KEY: process.env.STRIPESECRETKEY || process.env.STRIPE_SECRET_KEY || ""
```

Isto garante que:
1. ✅ Se STRIPESECRETKEY existir → Usa (sem bug)
2. ✅ Se não existir → Tenta STRIPE_SECRET_KEY (pode ter bug)
3. ✅ Se nenhum existir → String vazia

---

## 🚀 Testar o Sistema de Pagamentos

Depois de configurar corretamente:

```bash
# 1. Criar um utilizador de teste
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123"}'

# 2. Copiar o token da resposta e testar pagamento
TOKEN="cole_o_token_aqui"

curl -X POST http://localhost:5000/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

**Resposta esperada:**
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx"
}
```

---

## ❓ Resolução de Problemas

### "Invalid API Key" no Stripe
- Verifique se a chave começa com `sk_live_` ou `sk_test_`
- Confirme que copiou a chave completa (sem espaços)
- Tente apagar e recriar o secret no Replit

### Push Notifications não funcionam
- Verifique se as chaves VAPID têm os tamanhos corretos (87 e 43 chars)
- Confirme que não estão trocadas (pública deve ter 87 chars)
- Use as chaves hardcoded em `pushNotificationService.ts` se o problema persistir

### Marés/Football não carregam
- Confirme que configurou WORLDTIDESAPIKEY e FOOTBALLAPIKEY
- Valide as chaves nos respetivos dashboards das APIs
- Verifique os logs para erros específicos

---

## 🛡️ Notas de Segurança

1. **NUNCA** commit secrets no git
2. **NUNCA** hardcode chaves do Stripe no código fonte
3. Use **modo teste** (`sk_test_` / `pk_test_`) durante desenvolvimento
4. Mude para **modo produção** (`sk_live_` / `pk_live_`) apenas quando estiver pronto

---

## 📞 Suporte

Se o problema persistir mesmo após seguir todos os passos:

1. Verifique os logs em `/tmp/logs/`
2. Acesse o endpoint `/api/_diagnostics/env` para validar
3. Contacte o suporte do Replit sobre o bug dos underscores
4. Como último recurso, considere migrar para variáveis de ambiente externas (AWS Secrets Manager, etc.)

---

**Última atualização**: 16 Outubro 2025  
**Status**: Workaround funcional implementado ✅
