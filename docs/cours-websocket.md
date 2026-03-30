# Cours : Les WebSockets

## Schema global : HTTP vs WebSocket

```
 ┌─── HTTP (classique) ──────────────────────────────────────────────────┐
 │                                                                       │
 │   Client                         Serveur                              │
 │   ══════                         ═══════                              │
 │                                                                       │
 │   ── Requête "Donne-moi la page" ───────────────────►                 │
 │   ◄── Réponse (HTML) ──────────────────────────────                   │
 │   ✂️ connexion coupée                                                 │
 │                                                                       │
 │   ── Requête "Nouveaux messages ?" ─────────────────►                 │
 │   ◄── Réponse "Non" ───────────────────────────────                   │
 │   ✂️ connexion coupée                                                 │
 │                                                                       │
 │   ── Requête "Nouveaux messages ?" ─────────────────►                 │
 │   ◄── Réponse "Oui, 1 nouveau message" ────────────                   │
 │   ✂️ connexion coupée                                                 │
 │                                                                       │
 └───────────────────────────────────────────────────────────────────────┘

 ┌─── WebSocket (temps réel) ────────────────────────────────────────────┐
 │                                                                       │
 │   Client                         Serveur                              │
 │   ══════                         ═══════                              │
 │      │                              │                                 │
 │      │── Handshake (ouverture) ────►│                                 │
 │      │◄─────────── OK ─────────────│                                 │
 │      │                              │                                 │
 │      │  ~~~~ connexion ouverte ~~~~ │                                 │
 │      │                              │                                 │
 │      │◄── "nouveau message" ───────│  (le serveur push quand il veut)│
 │      │── "j'envoie un message" ───►│  (le client push quand il veut) │
 │      │◄── "Alice est en train      │                                 │
 │      │     d'écrire..." ──────────│                                 │
 │      │                              │                                 │
 │      │  ~~~~ connexion ouverte ~~~~ │                                 │
 │                                                                       │
 └───────────────────────────────────────────────────────────────────────┘
```

## Le problème : HTTP est un serveur de restaurant impatient

Imagine un restaurant classique (HTTP) :

1. Tu vas au comptoir, tu passes commande ("Donne-moi un café")
2. Le serveur te donne ton café
3. **Le serveur t'oublie immédiatement**. Tu n'existes plus pour lui.

Si tu veux savoir si ton ami est arrivé, tu dois **retourner au comptoir toutes les 2 secondes** pour demander "Mon ami est là ?". C'est ce qu'on appelle le **polling** — et c'est épuisant pour tout le monde.

```
HTTP classique (polling) :

Client: "Mon ami est là ?" → Serveur: "Non."
Client: "Mon ami est là ?" → Serveur: "Non."
Client: "Mon ami est là ?" → Serveur: "Non."
Client: "Mon ami est là ?" → Serveur: "Oui, il vient d'arriver."
Client: "Mon ami est là ?" → Serveur: "... tu le sais déjà."
```

## La solution : WebSocket, un talkie-walkie

Un WebSocket, c'est comme si le serveur et toi aviez chacun un **talkie-walkie**. Une fois connectés, vous pouvez parler **dans les deux sens, à tout moment**, sans raccrocher.

```
WebSocket :

Client ←→ Serveur (connexion ouverte en permanence)

Serveur: "Hey, ton ami vient d'arriver !"
Serveur: "Nouveau message de Alice !"
Client: "J'envoie un message à Alice."
Serveur: "Alice a lu ton message."
```

**Personne ne demande rien** — le serveur **pousse** l'info dès qu'elle est disponible.

## Socket.IO : une surcouche au-dessus de WebSocket

Socket.IO est une librairie qui simplifie les WebSockets. Elle gère :
- La reconnexion automatique si la connexion tombe
- Les "rooms" (des groupes de connexions)
- Le fallback HTTP si le WebSocket ne marche pas

### Côté client

```ts
import { io } from 'socket.io-client'

const socket = io('ws://localhost:3000')  // ← On ouvre le talkie-walkie
```

`io('ws://localhost:3000')` crée une connexion persistante vers le serveur. Cette connexion reste ouverte tant que l'app tourne.

### Côté serveur (NestJS)

```ts
@WebSocketGateway(3000, { cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server   // ← Le serveur Socket.IO, peut parler à tous les clients
}
```

Le `@WebSocketGateway(3000)` dit à NestJS : "Ouvre un serveur WebSocket sur le port 3000, accepte les connexions."

## Schema : Architecture Socket.IO

```
┌─────────────────────────────────┐      ┌──────────────────────────────────┐
│         APPLICATION              │      │        SERVEUR                   │
│                                 │      │                                  │
│  ┌───────────────────────────┐  │      │  ┌────────────────────────────┐  │
│  │    UI (React / Vue / RN)  │  │      │  │   Gateway                  │  │
│  │    Composants             │  │      │  │   @WebSocketGateway        │  │
│  └────────────┬──────────────┘  │      │  │                            │  │
│               │ state change    │      │  │  @SubscribeMessage(...)    │  │
│               │                 │      │  │  handleConnection()        │  │
│  ┌────────────▼──────────────┐  │      │  │  handleDisconnect()        │  │
│  │   State Management        │  │      │  └─────────────┬──────────────┘  │
│  │   (Redux, Pinia, etc.)    │  │      │                │                 │
│  │                           │  │      │  ┌─────────────▼──────────────┐  │
│  │  Listeners → dispatch()   │  │      │  │  Service métier            │  │
│  └────────────┬──────────────┘  │      │  │  (BDD, logique, etc.)      │  │
│               │                 │      │  └────────────────────────────┘  │
│  ┌────────────▼──────────────┐  │      │                                  │
│  │   Socket Client           │  │      │                                  │
│  │                           │  │      │                                  │
│  │   socket = io(:3000)      │◄─┼──────┼─► WebSocket (connexion ouverte) │
│  │   socket.emit(...)        │──┼──────┼─► @SubscribeMessage             │
│  │   socket.on(...)          │◄─┼──────┼── server.to(room).emit(...)     │
│  └───────────────────────────┘  │      │                                  │
│                                 │      │                                  │
└─────────────────────────────────┘      └──────────────────────────────────┘
```

## Les 3 opérations fondamentales

```
┌─────────────────────────────────────────────────────────────────┐
│                   Les 3 opérations                              │
│                                                                 │
│  1. emit        Client ──── "send-message" ───► Serveur         │
│     (envoyer)   (fire & forget, pas de réponse attendue)        │
│                                                                 │
│  2. on          Client ◄─── "new-message" ────── Serveur        │
│     (écouter)   (le callback se déclenche à chaque event)       │
│                                                                 │
│  3. emitWithAck Client ──── "get-history" ──────► Serveur       │
│     (req/res)   Client ◄─── [Message, Message] ── Serveur       │
│                 (attend la réponse, comme un await)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. `emit` — Envoyer un message

Comme parler dans le talkie-walkie.

```ts
// Client → Serveur : "J'envoie un message"
socket.emit('send-message', { text: 'Salut !', room: 'general' })

// Serveur → Tous les clients d'une room :
this.server.to('general').emit('new-message', { author: 'Alice', text: 'Salut !' })

// Serveur → TOUT LE MONDE (broadcast global) :
this.server.emit('user-count-updated', 42)
```

### 2. `on` — Écouter un message

Comme garder l'oreille collée au talkie-walkie.

```ts
// Le client écoute quand le serveur dit "new-message"
socket.on('new-message', (message) => {
  console.log(`${message.author}: ${message.text}`)
})
```

### 3. `emitWithAck` — Envoyer et attendre une réponse

Comme dire dans le talkie-walkie : "Donne-moi l'historique, j'attends ta réponse."

```ts
// Client envoie et attend la réponse du serveur
const messages = await socket.emitWithAck('get-history', 'general')
```

Côté serveur, il suffit de **retourner une valeur** dans le handler :

```ts
@SubscribeMessage('get-history')
async getHistory(@MessageBody() room: string): Promise<Message[]> {
  return this.chatService.getMessages(room)  // ← La valeur retournée est la "réponse"
}
```

## Les Rooms : des groupes de talkie-walkies

Imagine un serveur Discord avec 500 utilisateurs connectés, mais répartis dans différents salons. Tu ne veux pas que **tout le monde** reçoive chaque message — seulement les gens du bon salon.

```ts
// Un utilisateur rejoint un salon
client.join('general')    // ← L'utilisateur entre dans le groupe

// Le serveur parle UNIQUEMENT aux utilisateurs de ce salon
this.server.to('general').emit('new-message', message)

// Un utilisateur quitte le salon
client.leave('general')
```

C'est comme des **canaux radio** : chaque room est un canal, et seuls ceux branchés sur le bon canal entendent le message.

```
┌──────────────────── SERVEUR ────────────────────────────────┐
│                                                             │
│   server.emit(...)           ──► TOUS les clients connectés │
│   server.to('general').emit(...)  ──► Seulement 'general'  │
│   client.emit(...)           ──► Un seul client             │
│                                                             │
│   ┌──── #general ────┐    ┌──── #random ─────┐              │
│   │                   │    │                  │              │
│   │  Alice (socket1)  │    │  Charlie (sock3) │              │
│   │  Bob   (socket2)  │    │  Diana  (sock4)  │              │
│   │                   │    │                  │              │
│   └───────────────────┘    └──────────────────┘              │
│                                                             │
│   server.to('general').emit('new-message', msg)             │
│     → Alice reçoit msg  ✅                                   │
│     → Bob reçoit msg    ✅                                   │
│     → Charlie           ❌ (pas dans #general)               │
│     → Diana             ❌ (pas dans #general)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Exemple côté serveur :

```ts
// Quand un utilisateur rejoint un salon :
@SubscribeMessage('join-room')
async joinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
  client.join(room)
  this.server.to(room).emit('user-joined', { userId: client.id })
}

// Quand un utilisateur envoie un message :
@SubscribeMessage('send-message')
async sendMessage(@MessageBody() data: { room: string, text: string }, @ConnectedSocket() client: Socket) {
  this.server.to(data.room).emit('new-message', {
    author: client.id,
    text: data.text
  })
}
```

## Le cycle de vie d'une connexion

```
  Client                                          Serveur
    │                                                │
    │  ①  io('ws://localhost:3000')                   │
    │ ─────────── SYN (handshake) ──────────────────►│
    │◄──────────── ACK ──────────────────────────────│
    │                                                │
    │              handleConnection(client)           │
    │              console.log("Nouvel utilisateur")  │
    │                                                │
    │  ② Le client rejoint un salon                   │
    │ ─────── "join-room: general" ─────────────────►│
    │◄──────── { userId, room } ────────────────────│
    │                                                │
    │  ③ Échanges en temps réel                       │
    │ ─────── "send-message: Salut" ───────────────►│
    │◄──────── "new-message" ───────────────────────│
    │◄──────── "user-joined" ───────────────────────│
    │◄──────── "typing: Alice" ─────────────────────│
    │                                                │
    │  ④ Déconnexion (ferme l'app / perte réseau)     │
    │ ──────── FIN ────────────────────────────────►│
    │                                                │
    │              handleDisconnect(client)           │
    │              → retirer de tous les salons      │
    │              → prévenir les autres utilisateurs│
    │              → mettre à jour le compteur       │
    │                                                │
```

Dans le code :

```ts
handleConnection(client: Socket) {
  console.log('Nouvel utilisateur', client.id)    // Chaque client a un ID unique
}

async handleDisconnect(client: Socket) {
  // Retirer l'utilisateur de ses salons
  // Prévenir les autres
  this.server.emit('user-left', { userId: client.id })
}
```

## Résumé visuel : un chat complet

```
 Alice                         Serveur                      Bob
     │                            │                          │
     │── join-room: general ─────►│                          │
     │◄── user-joined: Alice ────│                          │
     │                            │                          │
     │                            │◄── join-room: general ───│
     │◄── user-joined: Bob ─────│──► user-joined: Bob ────►│
     │                            │                          │
     │── send-message: "Salut" ─►│                          │
     │                            │──► new-message ─────────►│
     │                            │   {author: Alice,        │
     │                            │    text: "Salut"}        │
     │                            │                          │
     │                            │◄── send-message: "Hey!" ─│
     │◄── new-message ──────────│                          │
     │   {author: Bob,            │                          │
     │    text: "Hey!"}           │                          │
     │                            │                          │
     │── leave-room: general ───►│                          │
     │                            │──► user-left: Alice ────►│
     │                            │                          │
```

## HTTP vs WebSocket — Quand utiliser quoi ?

| Situation | Utilise |
|---|---|
| Charger une page web | HTTP — une requête, une réponse |
| Chat en direct | WebSocket — messages bidirectionnels |
| Authentification / Login | HTTP — action ponctuelle |
| Notifications en temps réel | WebSocket — le serveur pousse les events |
| Télécharger un fichier | HTTP — transfert unique |
| Jeu multijoueur | WebSocket — synchronisation temps réel |
| API REST classique | HTTP — CRUD standard |
| Collaboration en direct (Google Docs) | WebSocket — curseurs, édition live |
