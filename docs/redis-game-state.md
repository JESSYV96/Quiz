# Migration du GameStateService vers Redis

## Pourquoi Redis ?

### Le probleme actuel

Le `GameStateService` stocke les sessions de jeu dans un `Map` JavaScript — c'est-a-dire directement dans la memoire du processus Node.js.

```
Serveur NestJS
└── GameStateService
    └── Map<string, GameSession>   ← vit dans la memoire du processus
```

Ca pose deux problemes :

1. **Perte de donnees au redemarrage** : si le serveur s'arrete (crash, deploiement, mise a jour), toutes les parties en cours disparaissent.

2. **Impossible de scaler** : si on lance 2 instances du serveur (pour gerer plus de joueurs), chacune a son propre `Map`. Un joueur connecte a l'instance A ne voit pas les rooms creees sur l'instance B.

### Ce qu'est Redis

Redis est une **base de donnees en memoire**. Pour comprendre ce que ca veut dire, faisons une analogie.

#### L'analogie du restaurant

**Une base de donnees classique** (PostgreSQL, MySQL), c'est comme la **reserve en sous-sol** du restaurant. Quand le serveur a besoin d'un ingredient, il doit descendre les escaliers, chercher dans les etageres, et remonter. C'est fiable (les ingredients sont bien ranges, etiquetes), mais ca prend du temps a chaque aller-retour.

**Redis**, c'est comme le **plan de travail** juste a cote du chef. Les ingredients les plus utilises sont poses la, a portee de main. Le chef tend le bras et il a ce qu'il faut instantanement. Pas besoin de descendre au sous-sol.

**Notre `Map` JavaScript actuel**, c'est comme si le chef gardait les ingredients **dans sa poche**. Rapide, mais si le chef change (serveur redemarre), tout est perdu, et un autre chef (autre instance) ne peut pas y acceder.

#### Pourquoi c'est si rapide ?

La difference technique : une base de donnees classique lit/ecrit sur le **disque dur** (le sous-sol). Redis lit/ecrit dans la **RAM** (la memoire vive — le plan de travail). La RAM est environ **100 000 fois plus rapide** que le disque.

#### Pourquoi ne pas tout mettre en RAM ?

- La RAM est **limitee et couteuse** (8-64 Go en general) vs le disque (des To)
- Si le serveur s'eteint, la RAM est **videe** (Redis peut sauvegarder periodiquement sur disque, mais ce n'est pas sa vocation premiere)
- Redis est donc ideal pour des donnees **temporaires et frequemment accedees** — exactement nos sessions de quiz

### Redis vs notre Map : comparaison

```
                        Map JS              Redis
Vitesse                 Instantane          ~0.1ms (reseau local)
Persistence             Non (perdu au       Oui (survit au
                        redemarrage)        redemarrage serveur)
Partage multi-instance  Non                 Oui
Expiration auto (TTL)   Non                 Oui
Scalabilite             1 processus         Illimite
```

---

## Architecture cible

### Avant (memoire locale)

```
┌─────────────────────────────┐
│      Serveur NestJS         │
│                             │
│  GameStateService           │
│  └── Map<string, Session>   │  ← tout est ICI, dans le processus
│                             │
│  MultiplayerGateway         │
│  └── utilise GameStateService│
└─────────────────────────────┘
```

Si le serveur redemarre → tout est perdu.

### Apres (Redis externe)

```
┌─────────────────────────────┐     ┌──────────────┐
│      Serveur NestJS         │     │    Redis      │
│                             │     │              │
│  GameStateService           │────>│  quiz:session:room1 = {...} │
│  └── ioredis client         │     │  quiz:session:room2 = {...} │
│                             │     │  quiz:player:sock1 = room1  │
│  MultiplayerGateway         │     │  quiz:player:sock2 = room1  │
│  └── utilise GameStateService│     └──────────────┘
└─────────────────────────────┘
                                    ↑ externe, persiste, partageable
```

Si le serveur redemarre → Redis a toujours les sessions.
Si on ajoute un 2e serveur → il se connecte au meme Redis.

---

## Structure des donnees dans Redis

### Cles et valeurs

Redis stocke des **paires cle/valeur**. Les cles sont des chaines de caracteres, et on utilise une convention avec `:` comme separateur (comme des dossiers) :

```
quiz:session:{roomName}   →  JSON de la session complete
quiz:player:{socketId}    →  nom de la room du joueur
```

#### Exemple concret

Apres que "Alice" cree la room "ROOM_TEST" et que "Bob" la rejoigne :

```
redis> GET quiz:session:ROOM_TEST
{
  "roomName": "ROOM_TEST",
  "adminId": "socket_alice_123",
  "status": "lobby",
  "players": {
    "socket_alice_123": { "id": "socket_alice_123", "score": 0, "hasAnswered": false },
    "socket_bob_456":   { "id": "socket_bob_456",   "score": 0, "hasAnswered": false }
  },
  "questions": [],
  "currentQuestionIndex": 0,
  "answersReceived": {}
}

redis> GET quiz:player:socket_alice_123
"ROOM_TEST"

redis> GET quiz:player:socket_bob_456
"ROOM_TEST"
```

### L'index inverse `quiz:player:{socketId}`

Quand un joueur se deconnecte, on recoit son `socketId` mais on ne sait pas dans quelle room il etait. Sans index, il faudrait scanner TOUTES les sessions pour le trouver — comme chercher dans tous les tiroirs de la maison pour retrouver ses cles.

L'index `quiz:player:{socketId} → roomName` c'est comme un post-it sur le frigo : "mes cles sont dans le tiroir de la cuisine". Recherche instantanee.

### TTL (Time-To-Live)

Chaque cle a une duree de vie de **1 heure**. Si une partie est abandonnee (joueurs partis sans faire le menage), Redis supprime automatiquement les donnees. C'est comme un minuteur sur le plan de travail : si personne ne revient chercher l'ingredient en 1h, on le range.

---

## Serialisation : le defi technique

### Le probleme des Map

JavaScript a un type `Map` tres pratique pour stocker des paires cle/valeur. Mais Redis ne comprend que des chaines de caracteres. On doit donc convertir nos donnees en JSON.

Or, `JSON.stringify` ne sait pas gerer les `Map` :

```js
const map = new Map([['alice', { score: 10 }]])

JSON.stringify(map)
// → "{}"   ← VIDE ! Ca ne marche pas.

// Solution : convertir en objet d'abord
JSON.stringify(Object.fromEntries(map))
// → '{"alice":{"score":10}}'   ← OK
```

A la lecture, on fait l'inverse :

```js
const obj = JSON.parse('{"alice":{"score":10}}')
const map = new Map(Object.entries(obj))
// → Map(1) { 'alice' => { score: 10 } }
```

### Le probleme des timers

Le `questionTimer` (le setTimeout de 30s pour chaque question) est un objet JavaScript vivant — il ne peut pas etre stocke dans Redis. On le garde donc dans un `Map` local en memoire.

Si le serveur redemarre, les timers sont perdus. Ce n'est pas grave : la prochaine action d'un joueur (reponse, reconnexion) declenchera la logique de progression.

### Type serialisable

On definit un type qui represente ce qu'on stocke reellement dans Redis :

```ts
// Ce qu'on stocke dans Redis (pas de Map, pas de Timer)
type RedisGameSession = {
  roomName: string
  adminId: string
  status: 'lobby' | 'in-progress' | 'finished'
  players: Record<string, Player>         // objet plat au lieu de Map
  questions: Question[]
  currentQuestionIndex: number
  answersReceived: Record<string, string> // objet plat au lieu de Map
}
```

---

## Impact sur le code existant

### Tout devient asynchrone

Avant (Map = synchrone) :
```ts
const session = this.sessions.get(roomName)  // instantane
```

Apres (Redis = asynchrone) :
```ts
const session = await this.getSession(roomName)  // attend la reponse Redis
```

C'est comme la difference entre regarder dans sa poche (instantane) et envoyer un message au plan de travail (il faut attendre la reponse). En pratique, Redis repond en ~0.1ms, donc c'est imperceptible pour l'utilisateur — mais le code doit quand meme utiliser `async/await`.

### Le Gateway doit s'adapter

Toutes les methodes du gateway qui appellent le service doivent ajouter `await`. C'est un changement mecanique mais necessaire pour eviter des bugs silencieux : sans `await`, le code continue sans attendre la reponse Redis.

---

## Lancer Redis en dev

On utilise Docker Compose pour lancer Redis sans l'installer sur la machine :

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

```bash
docker compose up -d     # demarre Redis en arriere-plan
docker compose down      # arrete Redis
redis-cli KEYS "quiz:*"  # voir les sessions stockees
```

---

## Tests

Les tests n'ont pas besoin de Redis. On mocke le client avec un simple `Map` en memoire qui simule `get`, `set`, `del` et `keys`. Les tests verifient la logique metier (scoring, progression des questions, etc.), pas la connexion Redis.
