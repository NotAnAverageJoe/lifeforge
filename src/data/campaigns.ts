import type { AbilityScores } from '../types';

export type AbilityCheck = {
  ability: keyof AbilityScores;
  requiredLevel: number;
  successScene: string;
  failScene: string;
};

export type ChoiceOption = {
  id: string;
  label: string;
  flavorText: string;
  check?: AbilityCheck;
  scene?: string;
};

export type NarrativeScene = {
  type: 'intro' | 'result';
  id: string;
  title: string;
  prose: string;
  nextScene: string;
};

export type ChoiceScene = {
  type: 'choice';
  id: string;
  title: string;
  prose: string;
  choices: ChoiceOption[];
};

export type CompletionScene = {
  type: 'completion';
  id: string;
  title: string;
  proseByChecks: [string, string, string, string];
  epilogue: string;
  baseXp: number;
  bonusXpPerCheck: number;
};

export type CampaignScene = NarrativeScene | ChoiceScene | CompletionScene;

export type CampaignDefinition = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  startScene: string;
  totalChoiceScreens: number;
  scenes: Record<string, CampaignScene>;
};

// ─── The Forgotten Flagon ──────────────────────────────────────────────────

const FORGOTTEN_FLAGON: CampaignDefinition = {
  id: 'forgotten_flagon',
  title: 'The Forgotten Flagon',
  subtitle: 'Demo Campaign  ·  Chapter I',
  description: "A routine stop at a roadside tavern turns into a night you won't forget. Brawlers, shadows, and secrets lurk within its smoke-stained walls. Will your hero walk away victorious — or stumble into something far darker?",
  icon: 'glass-mug-variant',
  startScene: 'intro',
  totalChoiceScreens: 3,
  scenes: {

    intro: {
      type: 'intro',
      id: 'intro',
      title: 'A Night Remembered',
      prose: `The road from Westmere has been unkind. Your boots are waterlogged, your coin purse lighter than you'd like, and the last hot meal you had was two days ago.

Then, through a curtain of cold drizzle, a lantern-lit sign swings into view — a battered pewter mug carved above a door that leaks warmth and the smell of stew.

The Forgotten Flagon.

Inside, the tavern hums with low conversation. You find a stool at the bar and order something dark and hot. The barkeep — a stout, unsmiling woman named Maren — slides your cup across without looking up.

Halfway through your drink, you notice it: a hooded figure near the merchant's table, fingers quick as a sparrow, lifting a coin purse from the man's belt. The thief's eyes meet yours for just a moment — then they vanish.

A shadow falls across you.

"Oi. You eyein' me?"

You turn. The man filling your vision is enormous — a brawler named Gorak, built like a siege engine and twice as slow to forgive. He's decided your glance was a challenge. The whole tavern goes quiet.`,
      nextScene: 'choice_1',
    },

    // ── Choice Screen 1 ───────────────────────────────────────────────────

    choice_1: {
      type: 'choice',
      id: 'choice_1',
      title: 'The Brawler\'s Challenge',
      prose: `Gorak cracks his knuckles. His friends in the corner are already grinning. Maren sets down her rag and reaches for something under the bar. You have a heartbeat to decide.`,
      choices: [
        {
          id: 'A',
          label: 'Rise to meet him.',
          flavorText: 'Plant your feet and accept the challenge openly.',
          check: { ability: 'strength', requiredLevel: 5, successScene: 'r1_a_s', failScene: 'r1_a_f' },
        },
        {
          id: 'B',
          label: 'Let him swing first.',
          flavorText: 'Wait for the haymaker, then drop low and take his legs.',
          check: { ability: 'dexterity', requiredLevel: 4, successScene: 'r1_b_s', failScene: 'r1_b_f' },
        },
        {
          id: 'C',
          label: 'Slide your cup his way.',
          flavorText: 'Buy him a drink. A fight avoided is a fight won.',
          scene: 'r1_c',
        },
        {
          id: 'D',
          label: 'Vanish into the crowd.',
          flavorText: 'Slip off the stool before he can get a fix on you.',
          scene: 'r1_d',
        },
      ],
    },

    r1_a_s: {
      type: 'result',
      id: 'r1_a_s',
      title: 'Strength Prevails',
      prose: `You stand your ground. When Gorak's fist comes, you catch it in both hands, absorb the momentum, and drive your shoulder into his chest. He staggers back into his table, sending cups flying.

A long silence. Then Gorak shakes his head and extends a cracked-knuckle hand.

"Fair enough, stranger."

From that moment on, no one at the Forgotten Flagon gives you trouble. Across the room, a wiry figure in a dark hood catches your eye — and nods.`,
      nextScene: 'choice_2',
    },

    r1_a_f: {
      type: 'result',
      id: 'r1_a_f',
      title: 'Not Quite Enough',
      prose: `You stand your ground — but Gorak moves faster than his size suggests. His fist clips your jaw and you stagger back into the bar rail. Maren steps between you before it can go further.

"That's enough, Gorak."

You straighten your coat, jaw aching, and find your stool again. Across the room, a wiry figure in a dark hood has been watching the whole thing with an unreadable expression.`,
      nextScene: 'choice_2',
    },

    r1_b_s: {
      type: 'result',
      id: 'r1_b_s',
      title: 'Light on Your Feet',
      prose: `You wait. His haymaker comes — and you drop. Your shoulder catches his knee and Gorak topples like a felled tree, hitting the floor with a sound like a dropped saddlebag.

He blinks at the ceiling for a long moment. Then he grins.

"Where'd you learn that?"

The crisis passes. Across the room, a wiry figure in a dark hood looks genuinely impressed.`,
      nextScene: 'choice_2',
    },

    r1_b_f: {
      type: 'result',
      id: 'r1_b_f',
      title: 'Almost',
      prose: `You try to duck — but Gorak anticipated it. He shifts mid-swing and clips you across the ear. The world tilts. You catch yourself on the bar and manage not to fall.

Maren's voice cuts through the ringing: "Outside, or I fetch the watch." Gorak grumbles and returns to his seat.

Across the room, a wiry figure in a dark hood watches. They look unsurprised.`,
      nextScene: 'choice_2',
    },

    r1_c: {
      type: 'result',
      id: 'r1_c',
      title: 'A Narrow Peace',
      prose: `You slide the cup over without breaking eye contact. Gorak stares at it. Stares at you. A very long pause. Then he picks it up and drinks.

He doesn't sit down — but he doesn't hit you, either.

Across the room, a wiry figure in a dark hood watches the exchange and seems to make a decision.`,
      nextScene: 'choice_2',
    },

    r1_d: {
      type: 'result',
      id: 'r1_d',
      title: 'Discretion',
      prose: `You melt off the stool and disappear into a cluster of off-duty soldiers before Gorak can get a fix on you. He sweeps the room, snorts, and returns to his friends.

Crisis averted. Your pride takes the hit.

When the commotion dies down, you find a quieter spot near the back — and notice a wiry figure in a dark hood has followed you.`,
      nextScene: 'choice_2',
    },

    // ── Choice Screen 2 ───────────────────────────────────────────────────

    choice_2: {
      type: 'choice',
      id: 'choice_2',
      title: 'The Shadow\'s Request',
      prose: `The hooded figure sits across from you without invitation. Up close, they are sharp-featured and watchful — the kind of person paid to notice things.

"You saw me take that purse," they say quietly. "I work for the Crown's Revenue Watch. That merchant is part of a smuggling ring using this tavern for months. The evidence is in the innkeeper's private cellar — and I need someone to get inside while I keep eyes on Maren."

The back hallway is twenty feet away.`,
      choices: [
        {
          id: 'A',
          label: 'Study Maren\'s patterns.',
          flavorText: 'Watch her routine and find the perfect window to slip away unseen.',
          check: { ability: 'intelligence', requiredLevel: 4, successScene: 'r2_a_s', failScene: 'r2_a_f' },
        },
        {
          id: 'B',
          label: 'Go straight for the lock.',
          flavorText: 'Slip down the hall and quietly work the cellar door open.',
          check: { ability: 'dexterity', requiredLevel: 3, successScene: 'r2_b_s', failScene: 'r2_b_f' },
        },
        {
          id: 'C',
          label: 'Create a distraction.',
          flavorText: 'Knock something off the bar and move while all eyes turn.',
          scene: 'r2_c',
        },
        {
          id: 'D',
          label: 'Ask Maren directly.',
          flavorText: 'Show her the Crown\'s seal. Bold — but sometimes honesty cuts fastest.',
          scene: 'r2_d',
        },
      ],
    },

    r2_a_s: {
      type: 'result',
      id: 'r2_a_s',
      title: 'Pattern Recognition',
      prose: `You spend ten minutes watching Maren. She checks the back hallway every time she pours a drink — never in between. You wait for the next pour and move.

The cellar is unlocked. Inside, stacked among barrels, you find it: a leather ledger stuffed with coded entries. Dates, weights, names.

You're back at your table before Maren looks up again. The agent's eyes widen when you slide it across.`,
      nextScene: 'choice_3',
    },

    r2_a_f: {
      type: 'result',
      id: 'r2_a_f',
      title: 'Misjudged',
      prose: `You think you've timed it — but Maren's rotation is irregular tonight. She catches you halfway down the hall.

"The privies are the other way," she says, flat and suspicious.

You pivot smoothly and apologise. You return empty-handed. The agent's jaw tightens. "We'll have to try something else."`,
      nextScene: 'choice_3',
    },

    r2_b_s: {
      type: 'result',
      id: 'r2_b_s',
      title: 'Silent Work',
      prose: `The hall is short and dark. The cellar lock is an older pin tumbler — your fingers find the tumblers by feel and the door swings open without a whisper.

Inside: barrels, crates, and a battered leather ledger packed with coded entries.

You're back at your table in under two minutes. The agent exhales slowly when they see it.`,
      nextScene: 'choice_3',
    },

    r2_b_f: {
      type: 'result',
      id: 'r2_b_f',
      title: 'Stubborn Lock',
      prose: `The lock resists you. Your pick snags. You're still crouched in the hall when you hear footsteps — you manage to get upright before Maren rounds the corner, but barely.

No ledger. The agent looks at you for a long moment, then sets their jaw. "We improvise."`,
      nextScene: 'choice_3',
    },

    r2_c: {
      type: 'result',
      id: 'r2_c',
      title: 'Controlled Chaos',
      prose: `You "accidentally" send a full tray of cups clattering to the floor. Every head in the tavern turns — including Maren's.

You move fast. The cellar is unlocked. No ledger — but the crates hold shipping manifests with dates and quantities that match the agent's records.

"This may be enough," they murmur, pocketing the papers.`,
      nextScene: 'choice_3',
    },

    r2_d: {
      type: 'result',
      id: 'r2_d',
      title: 'Straight Steel',
      prose: `You walk up to Maren and set the Crown's seal on the bar.

"There are things in your cellar that don't belong to you."

She stares at the token for a long time. Then: "Get out of my tavern."

No weapon. No guards. The agent finds you outside. "She's frightened," they say quietly. "That's useful."`,
      nextScene: 'choice_3',
    },

    // ── Choice Screen 3 ───────────────────────────────────────────────────

    choice_3: {
      type: 'choice',
      id: 'choice_3',
      title: 'The Reckoning',
      prose: `A door slams from the upper floor. A broad man in travelling leathers descends the stairs — heavy-browed, gold rings on his fingers. He takes one look at you and the agent and his hand moves to his belt.

"I see," he says quietly. "Someone's been poking around."

This is Harren Voss — the ring's local coordinator. Two men appear at his flanks. The common room has emptied. You need to get out, and make what you've found count.`,
      choices: [
        {
          id: 'A',
          label: 'Take the fight to them.',
          flavorText: 'Three against two. Force your way through before they\'re set.',
          check: { ability: 'strength', requiredLevel: 4, successScene: 'r3_a_s', failScene: 'r3_a_f' },
        },
        {
          id: 'B',
          label: 'Read Harren Voss.',
          flavorText: 'Look for the leverage that makes him step aside willingly.',
          check: { ability: 'wisdom', requiredLevel: 4, successScene: 'r3_b_s', failScene: 'r3_b_f' },
        },
        {
          id: 'C',
          label: 'Make it public.',
          flavorText: 'Call out what you\'ve found — loudly — with any remaining witnesses.',
          scene: 'r3_c',
        },
        {
          id: 'D',
          label: 'Destroy the evidence and run.',
          flavorText: 'If they can\'t prove what you found, they have no reason to follow.',
          scene: 'r3_d',
        },
      ],
    },

    r3_a_s: {
      type: 'result',
      id: 'r3_a_s',
      title: 'Through the Line',
      prose: `You move first — that's your only advantage. Your shoulder hits the nearer guard before he's set, driving him into his companion. The agent handles Voss.

The scuffle is ugly and short. When it's over, Voss is on the floor and his men are reconsidering their employment.

You step over them and walk out into the cold night air, evidence in hand.`,
      nextScene: 'completion',
    },

    r3_a_f: {
      type: 'result',
      id: 'r3_a_f',
      title: 'Outnumbered',
      prose: `You charge — but three is three. The second guard gets hold of you and it takes everything you have just to break free. The agent hauls you through a side door before Voss can regroup.

You're out. Breathing hard. Whatever was secured is with the agent. You're alive, and that counts.`,
      nextScene: 'completion',
    },

    r3_b_s: {
      type: 'result',
      id: 'r3_b_s',
      title: 'The Pressure Point',
      prose: `You watch Voss for five seconds. He's watching the agent — not you. That means the agent's face is known to him.

"Your operation in Greyvale was shut down last winter," you say evenly. A gamble — but his jaw tightens. "The name Pellworth means something to you. Step aside, or it means something to the magistrate too."

Harren Voss stares at you for a very long time. Then he steps aside.`,
      nextScene: 'completion',
    },

    r3_b_f: {
      type: 'result',
      id: 'r3_b_f',
      title: 'Misread',
      prose: `You look for the angle — but Voss is harder to read than most. Your carefully chosen words land wrong. He smiles.

"You don't know anything." And he's right.

He lets you go anyway — starting a scene with witnesses would draw the watch, and whatever you have isn't enough to hurt him yet. You're out. Wiser.`,
      nextScene: 'completion',
    },

    r3_c: {
      type: 'result',
      id: 'r3_c',
      title: 'Open Record',
      prose: `"EVERYONE STILL HERE," you call out — three patrons haven't quite made the door — "is a WITNESS."

Voss's hand freezes. He can't silence a room. He can't make this disappear cleanly.

He steps back. "We'll meet again, stranger." You believe him.

You walk out into the night — alive, with the evidence, and at least two names on someone's very unhappy list.`,
      nextScene: 'completion',
    },

    r3_d: {
      type: 'result',
      id: 'r3_d',
      title: 'Empty Hands',
      prose: `You grab the papers from the agent's hands and cast them into the nearest hearth. The flames take them quickly.

Voss watches. His expression shifts from threat to something like relief.

You and the agent are through the door before he recovers. No pursuit. But no evidence either.

"We're alive," the agent says, after a long silence. "We start again tomorrow."`,
      nextScene: 'completion',
    },

    // ── Completion ────────────────────────────────────────────────────────

    completion: {
      type: 'completion',
      id: 'completion',
      title: 'Dawn on the Westmere Road',
      proseByChecks: [
        // 0 checks passed
        `The night tested you and found edges that need sharpening. But you made it out of the Forgotten Flagon in one piece — and that, tonight, is no small thing.

The road ahead is long. The challenges ahead are harder. But you are still standing.`,
        // 1 check passed
        `It wasn't a clean night. But one moment stood out — one choice that landed right when it mattered. You carry that with you into the grey morning.

You are not the same person who walked in through that door.`,
        // 2 checks passed
        `Two moments of clarity in a night full of noise. You found your edge when it counted and used it well. The Forgotten Flagon will talk about tonight for a while.

Whatever comes next, you're ready for it.`,
        // 3 checks passed
        `Three for three. Every ability check, every calculated gamble — it paid out. The Forgotten Flagon and everyone in it witnessed a hero at work tonight.

Harren Voss's operation is cracked open. The Crown's agent has what they need. And you, somehow, made it through without losing anything that mattered.

Not bad for a night in a roadside tavern.`,
      ],
      epilogue: `The road beyond the Forgotten Flagon stretches cold and empty in the pre-dawn grey. Behind you, a chain is broken. Somewhere ahead — the next adventure.`,
      baseXp: 100,
      bonusXpPerCheck: 30,
    },
  },
};

export const CAMPAIGNS_MAP: Record<string, CampaignDefinition> = {
  forgotten_flagon: FORGOTTEN_FLAGON,
};
