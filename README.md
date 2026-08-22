# BaroneGalaxy

Plataforma moderna de publicação de projetos e fórum tech, inspirada em comunidades de desenvolvimento como XDA.

## Stack principal
- Next.js App Router
- Tailwind CSS
- Firebase Auth + Firestore
- Vercel
- Lucide React

## Configuração do Firebase
1. Acesse [Firebase Console](https://console.firebase.google.com/) e crie um projeto.
2. Em **Authentication > Sign-in method**, ative **Email/Password** e **Google**.
3. Em **Firestore Database**, crie o banco em modo de produção e escolha a região.
4. Em **Configurações do projeto > Seus apps**, registre um app Web (`</>`).
5. Copie `.env.example` para `.env.local` e cole os valores do objeto `firebaseConfig`:

```powershell
Copy-Item .env.example .env.local
```

6. No arquivo `.env.local`, preencha `NEXT_PUBLIC_FIREBASE_API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `MESSAGING_SENDER_ID` e `APP_ID`. `STORAGE_BUCKET` pode permanecer vazio.
7. Instale o Firebase CLI e faça login:

```powershell
npm install -g firebase-tools
firebase login
firebase use --add
```

8. Selecione o projeto criado e publique as regras e índices:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

10. Inicie o projeto:

```bash
npm install
npm run dev
```

## Estrutura principal
- `app/` — páginas e rotas do app
- `lib/` — integrações com Firebase e helpers de auth/projetos
- `firestore.rules` — regras de segurança do banco
- `firestore.indexes.json` — índice da consulta de projetos do usuário
- `firebase.json` — configuração do Firebase CLI
- `next.config.ts` — imagens externas permitidas para Firebase e Interserver

## Primeiro usuário owner
O cadastro cria usuários com a função `user`. Para transformar a sua conta em administrador, abra **Firestore > users > seu UID** e altere `role` para `owner`. O email `@baronegalaxy.com` também é reconhecido pelo helper de frontend, mas as regras de segurança usam o campo `role` salvo no Firestore.

## Plano gratuito
O app não exige Firebase Storage. As capas são comprimidas no navegador e salvas como imagem no Firestore, evitando o upgrade para o plano Blaze. Arquivos grandes, vídeos e áudios exigem armazenamento externo ou o Storage pago.

## Verificação local
Depois de preencher `.env.local`, reinicie o servidor para o Next.js carregar as variáveis:

```powershell
npm run dev
```

Teste nesta ordem: criar conta, publicar projeto com imagem, abrir o projeto, comentar, curtir e acessar o perfil público do autor.
