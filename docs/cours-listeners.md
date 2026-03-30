# Cours : Les Listeners (Écouteurs d'événements)

## L'analogie : un système d'alarmes dans un restaurant

Imagine un restaurant avec des **sonnettes** partout :
- Une sonnette "commande prête" en cuisine
- Une sonnette "nouveau client" à l'entrée
- Une sonnette "table libérée" en salle

Un **listener**, c'est le fait de **brancher quelqu'un sur une sonnette**. La sonnette ne sonne pas tout le temps — mais quand ça sonne, la bonne personne réagit immédiatement.

## Schema : le principe d'un listener

```
  SANS LISTENER (polling)                 AVEC LISTENER (event-driven)
  ═══════════════════════                 ════════════════════════════

  Client          Serveur                 Client          Serveur
    │                │                      │                │
    │── du nouveau? ►│                      │                │
    │◄── non ───────│                      │  (on attend)    │
    │── du nouveau? ►│                      │       .         │
    │◄── non ───────│                      │       .         │
    │── du nouveau? ►│                      │       .         │
    │◄── non ───────│                      │                │
    │── du nouveau? ►│                      │◄── event! ─────│
    │◄── OUI! ──────│                      │  callback()     │
    │── du nouveau? ►│                      │                │
    │◄── non ───────│                      │       .         │
    │                │                      │       .         │
                                            │◄── event! ─────│
  Épuisant, lent,                           │  callback()     │
  gaspille des requêtes                     │                │

                                           Instantané, efficace,
                                           zéro requête inutile
```

## Le pattern : on / emit

Un listener repose sur deux acteurs :
- **L'émetteur** (`emit`) — celui qui sonne la sonnette
- **L'écouteur** (`on`) — celui qui réagit quand ça sonne

```ts
// Brancher un écouteur sur l'événement "new-message"
socket.on('new-message', (message) => {
  console.log('Message reçu :', message.text)
})

// Quelque part ailleurs, déclencher l'événement
server.emit('new-message', { author: 'Alice', text: 'Salut !' })
```

Le `on` ne bloque rien. Il dit juste : **"quand cet événement arrivera, exécute cette fonction"**. En attendant, le reste du code continue de tourner normalement.

## Concrètement : les 3 niveaux de listeners

Dans une architecture propre, les listeners sont séparés en couches. Prenons l'exemple d'une **app de chat**.

### Schema : les 3 couches

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  DOMAIN (couche métier pure)                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  enum ChatListeners                 interface ChatPort       │   │
│  │  ══════════════════                 ═════════════════        │   │
│  │  NewMessage = 'new-message'         onNewMessage(cb): void   │   │
│  │  UserJoined = 'user-joined'         onUserJoined(cb): void   │   │
│  │  UserLeft = 'user-left'             onUserLeft(cb): void     │   │
│  │  Typing = 'typing'                  onTyping(cb): void       │   │
│  │                                                              │   │
│  │  "QUOI écouter"                     "COMMENT écouter"        │   │
│  │  (noms des événements)              (signature des méthodes) │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         ▲                                       ▲                   │
│         │ utilise                                │ implémente        │
│         │                                       │                   │
│  INFRASTRUCTURE (implémentation technique)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  class ChatSocket implements ChatPort                        │   │
│  │  ════════════════════════════════════                         │   │
│  │                                                              │   │
│  │  onNewMessage(callback) {                                    │   │
│  │    this.socket.on(ChatListeners.NewMessage, callback)        │   │
│  │  }                                                           │   │
│  │                                                              │   │
│  │  "BRANCHEMENT CONCRET sur Socket.IO"                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│         ▲                                                           │
│         │ utilise                                                   │
│         │                                                           │
│  APPLICATION (logique métier / state management)                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  setupChatListeners()                                        │   │
│  │  ════════════════════                                        │   │
│  │                                                              │   │
│  │  chatSocket.onNewMessage((message) => {                      │   │
│  │    dispatch(addMessage(message))                              │   │
│  │  })                                                          │   │
│  │                                                              │   │
│  │  "QUE FAIRE quand l'événement arrive"                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Niveau 1 — Domain : le contrat (quels événements existent ?)

```ts
// Enum : la liste des sonnettes disponibles
export enum ChatListeners {
  NewMessage = 'new-message',
  UserJoined = 'user-joined',
  UserLeft = 'user-left',
  Typing = 'typing',
}

// Port : le contrat des méthodes d'écoute
export interface ChatPort {
  onNewMessage(callback: (data: Message) => void): void
  onUserJoined(callback: (data: { userId: string }) => void): void
  onUserLeft(callback: (data: { userId: string }) => void): void
  onTyping(callback: (data: { userId: string }) => void): void
}
```

C'est le **menu des sonnettes disponibles**. Rien de technique ici — juste une liste de noms. Le domain ne sait pas comment ça marche, il sait juste **ce qui peut arriver**.

Remarque la convention : les méthodes `on...` prennent un **callback** en paramètre. Ce callback, c'est **la fonction qui sera exécutée quand l'événement arrive**.

### Niveau 2 — Infrastructure : le branchement réel

```ts
export class ChatSocket implements ChatPort {
  socket = io('ws://localhost:3000')

  onNewMessage(callback: (data: Message) => void): void {
    this.socket.on(ChatListeners.NewMessage, callback)
  }

  onUserJoined(callback: (data: { userId: string }) => void): void {
    this.socket.on(ChatListeners.UserJoined, callback)
  }

  onTyping(callback: (data: { userId: string }) => void): void {
    this.socket.on(ChatListeners.Typing, callback)
  }
}
```

Chaque méthode `on...` fait une seule chose : **brancher le callback sur le bon événement Socket.IO**. C'est l'implémentation concrète du contrat défini dans le domain.

### Niveau 3 — Application : la logique métier (que faire quand ça sonne ?)

```ts
const setupChatListeners = createAsyncThunk(
  'chat/setupListeners',
  async (_, thunkApi) => {
    const chatSocket = thunkApi.extra.services.chatSocket

    chatSocket.onNewMessage((message) => {
      thunkApi.dispatch(addMessage(message))   // → ajouter au state
    })

    chatSocket.onUserJoined(({ userId }) => {
      thunkApi.dispatch(userJoined(userId))     // → mettre à jour la liste
    })

    chatSocket.onTyping(({ userId }) => {
      thunkApi.dispatch(setTyping(userId))      // → afficher "... est en train d'écrire"
    })
  }
)
```

C'est ici que **chaque sonnette est reliée à une action**. Quand le serveur émet `'new-message'`, ça déclenche le dispatch de `addMessage`, qui met à jour le state, qui met à jour l'UI.

## Le flux complet : de l'émission à l'écran

Suivons l'événement `new-message` de bout en bout :

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ① SERVEUR                                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ this.server.to('general').emit('new-message', {               │  │
│  │   author: 'Alice', text: 'Salut !'                            │  │
│  │ })                                                            │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
│                               │                                      │
│                    WebSocket  │  { author: 'Alice', text: 'Salut' }  │
│                               ▼                                      │
│  ② INFRASTRUCTURE (ChatSocket)                                       │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ socket.on('new-message', callback)                            │  │
│  │                      ↓                                        │  │
│  │              callback(payload)  ← se déclenche !              │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
│                               │                                      │
│                               ▼                                      │
│  ③ APPLICATION (setupChatListeners)                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ callback = (message) =>                                       │  │
│  │   dispatch(addMessage(message))                               │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
│                               │                                      │
│                               ▼                                      │
│  ④ STATE (Reducer)                                                   │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ addMessage(state, action) {                                   │  │
│  │   state.messages.push(action.payload)                         │  │
│  │   // { author: 'Alice', text: 'Salut !' }                    │  │
│  │ }                                                             │  │
│  └────────────────────────────┬───────────────────────────────────┘  │
│                               │                                      │
│                     useSelector détecte le changement                │
│                               ▼                                      │
│  ⑤ UI (Composant Chat)                                              │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ const messages = useSelector(messagesSelector)                │  │
│  │ // → re-render avec le nouveau message affiché                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Quand les listeners sont-ils branchés ?

C'est important : tu ne branches pas les listeners **dès le lancement de l'app**. Tu les branches **au bon moment**.

### Schema : cycle de vie des listeners

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NAVIGATION DE L'APP                             │
│                                                                     │
│  Login ──► Liste des salons ──► Salon de chat                       │
│                  │                    │                              │
│                  │                    │                              │
│           setupRoomsListener    setupChatListeners                   │
│           on('rooms-updated')   on('new-message')                   │
│                  │              on('user-joined')                    │
│                  │              on('user-left')                      │
│                  │              on('typing')                         │
│                  │                    │                              │
│           Quitte l'écran ?           │                              │
│           ──► removeRoomsListener    │                              │
│               off('rooms-updated')   Quitte le salon ?              │
│                                      ──► removeChatListeners        │
│                                          off('new-message')         │
│                                          off('user-joined')         │
│                                          off('typing')              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Branchement au montage du composant

```ts
// Écran de chat
useEffect(() => {
  dispatch(setupChatListeners())   // ← Branche toutes les sonnettes

  return () => {
    dispatch(removeChatListeners())  // ← Débranche en quittant l'écran
  }
}, [])
```

Quand l'utilisateur entre dans le salon, on branche les listeners. Pas avant — sinon on recevrait des événements qui ne nous concernent pas.

Le `return` dans le `useEffect` est le **cleanup** — quand on quitte l'écran, on débranche la sonnette. Sinon, on accumulerait des listeners inutiles qui consomment de la mémoire.

## Débrancher un listener : `off`

```ts
// Débrancher un listener spécifique
socket.off('new-message')

// Débrancher tous les listeners d'un coup
Object.values(ChatListeners).forEach((event) => {
  socket.off(event)
})
```

- `socket.off('event')` — débranche un listener spécifique
- Boucle sur `Object.values(...)` — débranche tout d'un coup

C'est comme éteindre les sonnettes quand le restaurant ferme.

## Events vs Listeners

```
┌──────────────── CLIENT ──────────────────────── SERVEUR ─────────────┐
│                                                                      │
│         Events (le client agit)                                      │
│         ═══════════════════════                                      │
│                                                                      │
│  Clic "Envoyer" ─► emit('send-message')  ─────────► handleMessage() │
│  Clic "Rejoindre"► emit('join-room')  ────────────► handleJoinRoom() │
│  Frappe clavier ──► emit('typing')  ──────────────► handleTyping()   │
│                                                                      │
│                          ─── ─── ─── ───                             │
│                                                                      │
│         Listeners (le client réagit)                                 │
│         ════════════════════════════                                  │
│                                                                      │
│  dispatch(addMessage)  ◄──── on('new-message')  ◄── serveur dit     │
│  dispatch(userJoined)  ◄──── on('user-joined')  ◄── "Alice a rejoint│
│  dispatch(userLeft)    ◄──── on('user-left')    ◄── le salon"       │
│  dispatch(setTyping)   ◄──── on('typing')       ◄──                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

| | Events | Listeners |
|---|---|---|
| Direction | Client → Serveur | Serveur → Client |
| Utilisé avec | `socket.emit(Event)` | `socket.on(Listener)` |
| Analogie | Commander au comptoir | Écouter la sonnette |
| Qui déclenche ? | L'utilisateur (clic, frappe) | Le serveur (logique métier) |

## Les 3 pièges courants

### Schema des pièges

```
  PIÈGE 1 : Listeners dupliqués              PIÈGE 2 : Listener jamais off
  ════════════════════════════                ═══════════════════════════

  setupChatListeners() ← 1er appel           Salon de chat (écran)
  on('new-message', cb1)                     ┌──────────────────────┐
                                             │ useEffect:           │
  setupChatListeners() ← 2ème appel !        │   on('new-message')  │
  on('new-message', cb2)                     └──────────────────────┘
                                                      │
  Event 'new-message' arrive →                        │ quitte l'écran
  cb1() déclenché ✅                                   │ SANS off() ❌
  cb2() déclenché ✅ ← DOUBLON !                       ▼
                                             Le callback tourne encore
  → dispatch() appelé 2 fois                 en mémoire, reçoit des
  → message affiché 2 fois                   events pour rien


  PIÈGE 3 : Stale closure
  ════════════════════════

  const [username, setUsername] = useState('Anonyme')

  useEffect(() => {
    socket.on('ping', () => {
      console.log(username)    ← capture username = 'Anonyme'
    })                            pour toujours !
  }, [])

  setUsername('Alice')
  // event 'ping' arrive → affiche 'Anonyme', pas 'Alice' !

  ✅ Solution : dispatcher une action
     au lieu de lire le state dans le callback
```

### 1. Listeners dupliqués
Si tu appelles `setupChatListeners()` deux fois, tu auras **deux callbacks** pour le même événement → chaque message sera ajouté deux fois.

**Solution** : n'appeler qu'une seule fois, ou `off` avant de `on`.

### 2. Listeners qui ne sont jamais débranchés
Si tu quittes un écran sans `off`, le callback existe toujours en mémoire et continue de réagir.

**Solution** : cleanup dans le `useEffect` → `return () => dispatch(removeListeners())`.

### 3. Callback qui capture un vieux state (stale closure)
Le callback passé à `on` capture les variables au moment du branchement. Si le state change après, le callback a toujours l'ancienne valeur.

**Solution** : dans le callback, dispatcher une action plutôt que lire le state directement. Le reducer aura toujours le state à jour.
