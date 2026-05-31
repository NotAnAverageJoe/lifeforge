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
//
// Branching structure (all paths hit exactly 3 choice screens):
//
//  intro → choice_1
//    A/B pass, C, D  → choice_2_standing
//    A/B fail        → choice_2_wounded
//  choice_2_standing
//    A/B pass        → choice_3_evidence
//    A/B fail, C     → choice_3_cornered
//  choice_2_wounded
//    B pass          → choice_3_evidence
//    A pass, C       → choice_3_cornered
//    A/B fail        → choice_3_desperate
//  choice_3_evidence
//    A/B pass        → ending_triumph
//    A/B fail, C     → ending_victory
//  choice_3_cornered
//    A/B pass        → ending_victory
//    A/B fail, C     → ending_escape
//  choice_3_desperate
//    A pass          → ending_escape
//    A fail, B       → ending_barely

const FORGOTTEN_FLAGON: CampaignDefinition = {
  id: 'forgotten_flagon',
  title: 'The Forgotten Flagon',
  subtitle: 'Demo Campaign  ·  Chapter I',
  description: "A routine stop at a roadside tavern turns into a night you won't forget. Brawlers, shadows, and secrets lurk within its smoke-stained walls. Will your hero walk away victorious — or stumble into something far darker?",
  icon: 'glass-mug-variant',
  startScene: 'intro',
  totalChoiceScreens: 3,
  scenes: {

    // ── Intro ────────────────────────────────────────────────────────────────

    intro: {
      type: 'intro',
      id: 'intro',
      title: 'A Night Remembered',
      prose: `The road from Westmere has been unkind. Your boots are waterlogged, your coin purse lighter than you'd like, and the last hot meal you had was two days ago.

Then, through a curtain of cold drizzle, a lantern-lit sign swings into view — a battered pewter mug carved above a door that leaks warmth and the smell of stew.

The Forgotten Flagon.

Inside, the tavern hums with low conversation. You find a stool at the bar and order something dark and hot. The barkeep — a stout, unsmiling woman named Maren — slides your cup across without looking up.

Halfway through your drink, you notice it: a hooded figure near the merchant's table, fingers quick as a sparrow, lifting a coin purse from the man's belt. The thief's eyes meet yours for just a moment — something deliberate in that look — and then they vanish into the crowd.

A shadow falls across you.

"Oi. You eyein' me?"

You turn. The man filling your vision is enormous — a brawler named Gorak, built like a siege engine and twice as slow to forgive. He's decided your glance was a challenge. The whole tavern goes quiet.`,
      nextScene: 'choice_1',
    },

    // ── Choice 1: The Brawler ────────────────────────────────────────────────

    choice_1: {
      type: 'choice',
      id: 'choice_1',
      title: "The Brawler's Challenge",
      prose: `Gorak cracks his knuckles. His friends in the corner are already grinning. Maren sets down her rag and reaches for something beneath the bar. You have a heartbeat to decide.`,
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

From that moment on, no one at the Forgotten Flagon gives you trouble. When you settle back at the bar, you notice a sharp-featured figure in a dark hood watching from across the room — and the look on their face is something like interest.`,
      nextScene: 'choice_2_standing',
    },

    r1_a_f: {
      type: 'result',
      id: 'r1_a_f',
      title: 'Not Quite Enough',
      prose: `You stand your ground — but Gorak moves faster than his size suggests. His fist clips your jaw and you stagger back into the bar rail, vision briefly sideways. Maren steps between you before it goes further.

"That's enough, Gorak."

You find your stool again, jaw aching, pride following somewhere behind. The room resumes its conversation, carefully not looking at you. A hooded figure in the far corner watched the whole thing and has made no visible judgement. They're still watching now.`,
      nextScene: 'choice_2_wounded',
    },

    r1_b_s: {
      type: 'result',
      id: 'r1_b_s',
      title: 'Light on Your Feet',
      prose: `You wait. His haymaker comes — and you drop. Your shoulder catches his knee and Gorak topples like a felled tree, hitting the floor with a sound like a dropped saddlebag.

He blinks at the ceiling for a long moment. Then he grins.

"Where'd you learn that?"

The crisis passes in laughter rather than blood. A hooded figure near the back of the tavern has straightened slightly, watching you with an expression that wasn't there before.`,
      nextScene: 'choice_2_standing',
    },

    r1_b_f: {
      type: 'result',
      id: 'r1_b_f',
      title: 'Almost',
      prose: `You try to duck — but Gorak anticipated it. He shifts mid-swing and clips you across the ear. The world tilts. You catch yourself on the bar and manage not to fall.

Maren's voice cuts through the ringing. "Outside, or I fetch the watch." Gorak grumbles and returns to his table.

Your ear is still ringing when a hooded figure slides into the peripheral. They look unsurprised by everything that just happened. That, somehow, is the most unnerving part.`,
      nextScene: 'choice_2_wounded',
    },

    r1_c: {
      type: 'result',
      id: 'r1_c',
      title: 'A Measured Peace',
      prose: `You slide the cup over without breaking eye contact. Gorak stares at it. Stares at you. The whole tavern holds its breath.

Then he picks it up and drinks.

He doesn't apologize, but he doesn't hit you either. The crowd exhales and goes back to its business. Across the room, a hooded figure has been watching the exchange very closely — and something in their expression shifts when the cup changes hands.`,
      nextScene: 'choice_2_standing',
    },

    r1_d: {
      type: 'result',
      id: 'r1_d',
      title: 'Discretion',
      prose: `You melt off the stool and disappear into a cluster of off-duty soldiers before Gorak can get a fix on you. He sweeps the room, snorts, and returns to his table having decided the stranger wasn't worth his time.

You find a quieter corner near the back. The exit is two steps away if you need it. Not a glorious solution — but effective.

A hooded figure arrives at the seat across from you moments later. The fact that they found you this quickly tells you they were tracking you the entire time.`,
      nextScene: 'choice_2_standing',
    },

    // ── Choice 2A: The Agent's Request (standing, credible) ──────────────────

    choice_2_standing: {
      type: 'choice',
      id: 'choice_2_standing',
      title: "The Crown's Request",
      prose: `The hooded figure sits across from you without invitation. Sharp-featured and watchful — the kind of person paid to notice things.

"Renn," she says, without further introduction. "Revenue Watch. The man in the merchant's coat has been running contraband through this tavern for three months. The evidence is in Maren's cellar — a ledger, coded but legible. I need someone to get inside while I keep eyes on Maren."

She glances toward the hallway. "You handled yourself tonight. That's useful. The back passage is twenty feet away. How do you want to play this?"`,
      choices: [
        {
          id: 'A',
          label: 'Study the pattern first.',
          flavorText: "Watch Maren's routine and find the gap before you move.",
          check: { ability: 'intelligence', requiredLevel: 4, successScene: 'r2s_a_s', failScene: 'r2s_a_f' },
        },
        {
          id: 'B',
          label: 'Take the lock directly.',
          flavorText: 'Slip down the hall and quietly work the cellar door open.',
          check: { ability: 'dexterity', requiredLevel: 3, successScene: 'r2s_b_s', failScene: 'r2s_b_f' },
        },
        {
          id: 'C',
          label: 'Create a distraction.',
          flavorText: 'Knock something over. Move while all eyes turn.',
          scene: 'r2s_c',
        },
      ],
    },

    r2s_a_s: {
      type: 'result',
      id: 'r2s_a_s',
      title: 'Pattern Recognition',
      prose: `You spend ten minutes watching Maren. She checks the back hallway every time she pours a drink — never in between. You wait for the next pour and move.

The cellar door is unlocked. Inside, stacked among barrels, you find it: a leather ledger stuffed with coded entries. Dates, weights, names.

You're back at your table before Maren looks up again. Renn's expression when you slide the ledger across is the closest she comes to impressed. "That's everything we need," she says quietly. "Now we just need to get it out."`,
      nextScene: 'choice_3_evidence',
    },

    r2s_a_f: {
      type: 'result',
      id: 'r2s_a_f',
      title: 'Misjudged',
      prose: `You think you've cracked her pattern — but Maren's rotation is irregular tonight. She catches you halfway down the hall.

"The privies are the other way," she says, flat and cold.

You pivot smoothly, apologize, return empty-handed. Renn absorbs the setback in silence. Outside, you can hear the building creak. A door slams from the upper floor — someone moving with urgency. "We're out of time," Renn says, jaw tightening. "Stay close and be ready."`,
      nextScene: 'choice_3_cornered',
    },

    r2s_b_s: {
      type: 'result',
      id: 'r2s_b_s',
      title: 'Silent Work',
      prose: `The hall is short and dark. The cellar lock is an older pin tumbler — your fingers find the tumblers by feel and the door swings open without a sound.

Inside: barrels, crates, and a battered leather ledger packed with coded entries. Months of records.

You're back at your table in under two minutes. Renn holds the ledger up to the candlelight and exhales slowly. "Good," she says. "Very good. Now we just have to leave with it."`,
      nextScene: 'choice_3_evidence',
    },

    r2s_b_f: {
      type: 'result',
      id: 'r2s_b_f',
      title: 'Stubborn Lock',
      prose: `The lock resists you. Your pick catches on something and you're still crouched in the hall when you hear footsteps — you manage to get upright just before Maren rounds the corner, but barely.

No ledger. You return with nothing and the look on Maren's face lingers in memory — suspicious, calculating.

A door opens from the upper floor. Heavy footsteps on the stairs. Renn is already scanning the room. "Someone tipped them," she says. "Or the timing is very bad luck. Either way — we deal with it."`,
      nextScene: 'choice_3_cornered',
    },

    r2s_c: {
      type: 'result',
      id: 'r2s_c',
      title: 'Controlled Chaos',
      prose: `You "accidentally" send a full tray of cups clattering to the floor. Every head in the tavern turns — including Maren's.

You move fast. The cellar is unlocked. No ledger — but the crates hold shipping manifests with dates and quantities Renn confirms match the ring's known routes.

"It's partial," she says, pocketing the papers. "But it may be enough — if we play the next part carefully." A door slams from the upper floor. The manifests go inside her coat. "Here we go."`,
      nextScene: 'choice_3_cornered',
    },

    // ── Choice 2B: The Agent's Request (wounded, compromised) ────────────────

    choice_2_wounded: {
      type: 'choice',
      id: 'choice_2_wounded',
      title: "The Crown's Request",
      prose: `The hooded figure finds your corner without difficulty — which means they were watching you before you knew they existed.

"Renn." She sets a small Crown seal on the table between you. "Revenue Watch. There's evidence in this tavern's cellar that can break a three-month smuggling operation. I came here for a particular kind of help tonight." She looks you over with professional detachment. "You're not what I planned for. But the night doesn't wait."

Her voice stays low. "You're hurt. I know. What can you still do?"`,
      choices: [
        {
          id: 'A',
          label: '"I can still move."',
          flavorText: 'Push through the injury. Get into the cellar the hard way.',
          check: { ability: 'constitution', requiredLevel: 4, successScene: 'r2w_a_s', failScene: 'r2w_a_f' },
        },
        {
          id: 'B',
          label: '"Forget the cellar — I go to Maren."',
          flavorText: 'Skip infiltration. Put the Crown seal on the bar and see what she does.',
          check: { ability: 'charisma', requiredLevel: 3, successScene: 'r2w_b_s', failScene: 'r2w_b_f' },
        },
        {
          id: 'C',
          label: '"There is a back way."',
          flavorText: 'A servants\' passage you noticed when you came in. Lower risk, lower reward.',
          scene: 'r2w_c',
        },
      ],
    },

    r2w_a_s: {
      type: 'result',
      id: 'r2w_a_s',
      title: 'Through the Pain',
      prose: `You grit your teeth and move. The injury slows you — but the cellar door is unlocked, sloppy tradecraft from whoever manages this place, and inside you find shipping manifests tucked beneath a barrel. Not the ledger Renn wanted. But records. Evidence.

You're back at the table before Maren checks the hall. "Not everything," Renn says, taking the manifests. "But something." She tucks them inside her coat and goes very still. A door opens above you. Footsteps on the stairs. "Brace yourself."`,
      nextScene: 'choice_3_cornered',
    },

    r2w_a_f: {
      type: 'result',
      id: 'r2w_a_f',
      title: 'The Body Refuses',
      prose: `Your injury turns against you at the worst moment — your hands unsteady, the lock resisting longer than it should. Maren rounds the corner before you get the door open. She doesn't call for anyone, just looks at you with flat recognition.

You retreat with nothing. When you return to the table, Renn is already standing. "He knows," she says quietly. "Someone just came down the stairs and Voss does not look surprised. We are out of time."`,
      nextScene: 'choice_3_desperate',
    },

    r2w_b_s: {
      type: 'result',
      id: 'r2w_b_s',
      title: 'The Unexpected Angle',
      prose: `You walk to the bar and lean on it like you own the building. You set the Crown seal on the wood and look at Maren until she looks at you.

"The Revenue Watch would like a conversation about what's in your cellar."

Maren goes the color of old flour. She doesn't open the cellar — but she tells you enough. Routes, names, a contact in Greyvale. Renn arrives at your shoulder moments later and listens without expression. "That," she says afterward, "was not the plan. And it worked considerably better than the plan."`,
      nextScene: 'choice_3_evidence',
    },

    r2w_b_f: {
      type: 'result',
      id: 'r2w_b_f',
      title: 'She Doesn\'t Scare',
      prose: `You misjudge Maren. She doesn't scare. The Crown seal goes into her apron pocket and she calls for Gorak before you've finished your sentence. You're back in your corner before the situation becomes irreversible — but the damage is done.

Renn appears from a side passage. Her expression is controlled but her voice has an edge. "She'll have word to Voss inside three minutes. Whatever happens next, we're doing it without cover." She checks the room quickly. "Get ready."`,
      nextScene: 'choice_3_desperate',
    },

    r2w_c: {
      type: 'result',
      id: 'r2w_c',
      title: 'The Servants\' Way',
      prose: `You take the kitchen route — through the scullery, along a low passage, to a broken latch on the cellar door you noted when you first came in. Old habit, reading exits on arrival.

The passage is tight and you're moving slowly with your injury — but you get in and out with a single water-stained manifest before the kitchen girl notices. Renn takes it with two fingers and studies it. "Partial," she says. "Enough to be dangerous. Not enough to be decisive." She tucks it away. "Stay close."`,
      nextScene: 'choice_3_cornered',
    },

    // ── Choice 3A: The Confrontation (evidence in hand) ──────────────────────

    choice_3_evidence: {
      type: 'choice',
      id: 'choice_3_evidence',
      title: 'The Reckoning',
      prose: `Harren Voss descends the stairs before you reach the door — broad-shouldered, gold rings, travelling leathers that have seen real roads. He sees you. He sees what Renn is holding. His hand moves to his belt and two men take shape at his flanks.

"I see," he says, very quietly. "Someone has been thorough tonight."

The common room has emptied. You have the ledger. Voss has three men and a calculating look. The question is how you use what you have.`,
      choices: [
        {
          id: 'A',
          label: 'Read the room and speak.',
          flavorText: "Name what you know. Find the pressure point and push it.",
          check: { ability: 'wisdom', requiredLevel: 4, successScene: 'r3e_a_s', failScene: 'r3e_a_f' },
        },
        {
          id: 'B',
          label: 'Name his allies.',
          flavorText: "Threaten to expose specific names from the ledger — make it personal.",
          check: { ability: 'charisma', requiredLevel: 4, successScene: 'r3e_b_s', failScene: 'r3e_b_f' },
        },
        {
          id: 'C',
          label: 'Walk past him.',
          flavorText: "Don't engage. Move like you own the night and don't stop.",
          scene: 'r3e_c',
        },
      ],
    },

    r3e_a_s: {
      type: 'result',
      id: 'r3e_a_s',
      title: 'The Pressure Point',
      prose: `You hold Voss's gaze for five full seconds. Then:

"Your Greyvale contact was arrested fourteen days ago. The Pellworth route is burned. Your name is in that ledger — and so is the Warden's. Step aside, or everything in it reaches the magistrate by morning."

You're guessing at half of it. But Voss's jaw tightens. His hand moves away from his belt. His men watch him for a signal that doesn't come. "Get out," he says at last. The words cost him something.

You and Renn walk out the front door into the cold night air, evidence and lives intact.`,
      nextScene: 'ending_triumph',
    },

    r3e_a_f: {
      type: 'result',
      id: 'r3e_a_f',
      title: 'Not Quite Right',
      prose: `You try the direct approach — reading Voss for the crack in his composure. You find one: he flinches when you mention Greyvale. But you push the wrong direction and he recovers faster than you expect. His smile returns.

"You don't know enough," he says.

You change tactics without hesitation — shoulder-first through the gap between his men before anyone's set. Renn is right behind you. Cold air, then running. The ledger stays in Renn's coat and neither of you stops until the lantern-light has gone.`,
      nextScene: 'ending_victory',
    },

    r3e_b_s: {
      type: 'result',
      id: 'r3e_b_s',
      title: 'Named and Known',
      prose: `You pull the ledger just far enough out of Renn's coat to let Voss see the cover. "Fourteen months of records," you say. "Every name. Every route. Everyone who would rather this never saw a courtroom." You meet his eyes. "I wonder how much they would pay to ensure that."

The implication lands exactly where you intended. Voss stares at you for a very long time. His men look at him. He gives them a small, precise shake of his head.

"Get out of my tavern." The fury in his voice is carefully managed. It will outlast tonight. But tonight, you walk.`,
      nextScene: 'ending_triumph',
    },

    r3e_b_f: {
      type: 'result',
      id: 'r3e_b_f',
      title: 'He Moves First',
      prose: `You try to leverage the ledger — but Voss lunges before you finish the sentence. He's faster than a man his size has any right to be. There's a scuffle. Renn is already moving; she's through the side door before you've fully understood what's happening.

You follow, clutching the ledger. Outside, cold air and the sound of voices behind the door. Renn appears from the shadow beside you, breathing hard. "Not elegant," she says. "But the evidence is intact. That's what matters."`,
      nextScene: 'ending_victory',
    },

    r3e_c: {
      type: 'result',
      id: 'r3e_c',
      title: 'Move Like the Night',
      prose: `You don't posture. You don't speak. You look at Harren Voss for exactly one second — long enough that he knows you've measured him and found him worth walking past — and then you move.

He doesn't stop you. A man in possession of a ledger in public is a problem. A man who walks without hesitation is a different kind of problem entirely, and Voss is already calculating what that costs him.

You're on the road before the door swings shut.`,
      nextScene: 'ending_victory',
    },

    // ── Choice 3B: The Confrontation (cornered, partial evidence) ────────────

    choice_3_cornered: {
      type: 'choice',
      id: 'choice_3_cornered',
      title: 'The Reckoning',
      prose: `Harren Voss descends the stairs just as you reach the common room. He doesn't look surprised. Either someone tipped him, or men like Voss simply always arrive at the worst possible moment.

Three men behind him. The room has cleared itself. Renn is tight-jawed at your shoulder, and whatever she has — partial evidence, manifests, Maren's confession — it may not be enough to stop what's standing between you and the door.

"Leave," Voss says, with the flat certainty of a man who believes the word will work. "Walk out right now and this ends here."`,
      choices: [
        {
          id: 'A',
          label: 'Go through them.',
          flavorText: 'Three against two. Force the door before they\'re set.',
          check: { ability: 'strength', requiredLevel: 4, successScene: 'r3c_a_s', failScene: 'r3c_a_f' },
        },
        {
          id: 'B',
          label: 'Find the gap.',
          flavorText: "Read the room for the exit they're not watching.",
          check: { ability: 'wisdom', requiredLevel: 3, successScene: 'r3c_b_s', failScene: 'r3c_b_f' },
        },
        {
          id: 'C',
          label: 'Take the deal.',
          flavorText: "Walk out now. Alive is a different kind of win.",
          scene: 'r3c_c',
        },
      ],
    },

    r3c_a_s: {
      type: 'result',
      id: 'r3c_a_s',
      title: 'Through the Line',
      prose: `Three against two — but you move first, and that's the whole plan. Your shoulder hits the nearest man before he's set, driving him into his companion. Renn handles the third, faster and more precise than anything in her slight frame suggested.

Voss steps back rather than engage. You don't verify — you're through the door and into the cold before he recovers.

Whatever Renn has in her coat is coming with you. You don't stop until the lantern-light is well behind.`,
      nextScene: 'ending_victory',
    },

    r3c_a_f: {
      type: 'result',
      id: 'r3c_a_f',
      title: 'Outnumbered',
      prose: `Three is three. The second man gets hold of you before you clear the first, and it takes everything you have just to break free. Renn hauls you through a side door by the collar and shoves you into the alley.

You're out. You're breathing hard. Whatever Renn has is still in her pocket. "Alive," she says, which is either reassurance or a very low bar. "That's what matters tonight."`,
      nextScene: 'ending_escape',
    },

    r3c_b_s: {
      type: 'result',
      id: 'r3c_b_s',
      title: 'The Invisible Door',
      prose: `Voss is watching Renn. His men are watching the front. No one is watching the scullery entrance — the kitchen passage you noted when you arrived, or the same one in your peripheral as you scan the room.

You touch Renn's arm. She follows without a word, reading the same exit.

The cook has fled; the passage is dark and empty. You're through the alley and into the street before Voss finishes his sentence.`,
      nextScene: 'ending_victory',
    },

    r3c_b_f: {
      type: 'result',
      id: 'r3c_b_f',
      title: 'Half a Step Late',
      prose: `You read the gap — but Voss reads it a half-second before you do. He angles to cut off the kitchen exit just as you commit to it. You feint, bolt right, and nearly get a hand on your collar before you're through the door and into cold air.

Renn appears at your shoulder from somewhere else. You don't ask how. You run.`,
      nextScene: 'ending_escape',
    },

    r3c_c: {
      type: 'result',
      id: 'r3c_c',
      title: 'Walking Away',
      prose: `Voss is offering you a way out. You take it.

Renn's jaw tightens, but she says nothing — not here, not in front of three men with blades. You walk to the door with deliberate calm and step out into the rain. It closes behind you with the quiet certainty of a chapter ending.

"We start again," Renn says, after a long silence. "Different approach. The evidence doesn't disappear just because we didn't get it tonight." She sounds like she means it. She sounds like she has done this many times before.`,
      nextScene: 'ending_escape',
    },

    // ── Choice 3C: The Confrontation (desperate, exposed) ────────────────────

    choice_3_desperate: {
      type: 'choice',
      id: 'choice_3_desperate',
      title: 'Last Move',
      prose: `Harren Voss appears at the bottom of the stairs with the unhurried movement of someone who already knows how this ends. Two men at his flanks. Maren watching from behind the bar with her hands out of sight.

You're in poor shape. The evidence, if you have any, is thin. Renn is beside you with the stillness of someone who has run out of options and is waiting for you to name one.

"I almost feel bad," Voss says. He doesn't.`,
      choices: [
        {
          id: 'A',
          label: 'Move now.',
          flavorText: 'Pure instinct. Find the gap and trust your body to know the way.',
          check: { ability: 'dexterity', requiredLevel: 3, successScene: 'r3d_a_s', failScene: 'r3d_a_f' },
        },
        {
          id: 'B',
          label: 'Burn the evidence.',
          flavorText: 'Throw whatever you have into the hearth. No evidence, no reason to chase.',
          scene: 'r3d_b',
        },
      ],
    },

    r3d_a_s: {
      type: 'result',
      id: 'r3d_a_s',
      title: 'Instinct',
      prose: `No plan. No speech. You move the moment Voss stops talking — through the gap between his men on pure reflex, trusting that they're not quite set yet. You're right. The door frame catches your shoulder and you spin through it, sprint until your lungs give out, until the shouts behind you are swallowed by distance and rain.

Renn appears from a side alley two minutes later, breathing hard, saying nothing for a long time.

"What happened in there?" she finally asks. You don't have an answer that makes sense. But you're standing.`,
      nextScene: 'ending_escape',
    },

    r3d_a_f: {
      type: 'result',
      id: 'r3d_a_f',
      title: 'Caught',
      prose: `You lunge for the gap — but one of Voss's men anticipated it. His hand closes on your arm before you clear the first table. For a long moment you think this is how it ends.

Then Gorak, of all people, stands up from his corner. "Let them go." His voice carries the flat authority of someone who has decided. It isn't about you. Maren doesn't want the watch called tonight.

Voss releases you with visible contempt. The door opens. The rain outside is cold and relentless. Renn isn't waiting for you.`,
      nextScene: 'ending_barely',
    },

    r3d_b: {
      type: 'result',
      id: 'r3d_b',
      title: 'Burning the Evidence',
      prose: `You cross to the hearth and drop whatever you're carrying — manifests, partial notes, anything that ties you to tonight — into the fire. The flames take them quickly.

Voss watches. His expression shifts from threat to something colder: calculation. No evidence, no crime he can name. He waves his men back.

You walk out the front door into the rain. He lets you go. The cold is immediate and total. You walk for a long time before you find a wall to put your back against and figure out what you still have.`,
      nextScene: 'ending_barely',
    },

    // ── Endings ──────────────────────────────────────────────────────────────

    ending_triumph: {
      type: 'completion',
      id: 'ending_triumph',
      title: 'The Road Out of Westmere',
      proseByChecks: [
        `Every move tonight was instinct and fortune in equal measure — but the ledger is in the right hands, and Harren Voss is not running tonight. Some nights the world gives you more than you earned. The road out of Westmere feels different than the road in.`,

        `One check paid off when it counted most, and the rest you navigated on nerve and judgment that you didn't know you had until the moment demanded it. The evidence is in Renn's hands. Voss's network is cracking open. The Crown will know your name after tonight, and not because of the bruises.`,

        `Two moments of precise calculation, both landed exactly right. The Forgotten Flagon will be investigated, Harren Voss will be questioned, and somewhere a magistrate's clerk is opening a coded ledger and reading the names of people who believed they were untouchable. You did that.`,

        `Three checks, three passing grades — strength or dexterity or intelligence or wisdom, whatever the night demanded, you had it. Renn says nothing for most of the walk. Then, at the crossroads outside Westmere: "I know people who would pay well for someone like you." You don't answer. But you're listening.`,
      ],
      epilogue: `The lantern above the Forgotten Flagon is still burning when you crest the hill above Westmere. Somewhere in that amber glow, a ledger has changed hands and a network of names is coming apart at the joints. The road ahead is yours.`,
      baseXp: 200,
      bonusXpPerCheck: 40,
    },

    ending_victory: {
      type: 'completion',
      id: 'ending_victory',
      title: 'Out of the Dark',
      proseByChecks: [
        `Not the cleanest night you've ever had. But the evidence reached Renn, and Renn's word is worth something to the people who matter. Voss is running. The ring is exposed and knows it. That's not nothing — and it didn't require a clean victory to be true.`,

        `One moment where it could have gone badly and didn't. You carry that with you into the grey morning. Renn will do what she can with what you gave her. The rest is the Crown's problem, and the Crown's problem is considerably larger than it was before you walked into that tavern.`,

        `Two clean moments in an ugly night. Renn has what she came for, and Harren Voss left through the back door rather than face a direct accounting. You won tonight. Just not quietly. That was never the option on offer.`,

        `Three checks in your favor, and still it wasn't clean — which tells you something about how deep this operation runs. But the evidence is out of the building, Renn has routes and names, and Voss is somewhere in the dark counting his remaining allies. The advantage has changed hands.`,
      ],
      epilogue: `The Forgotten Flagon fades into the drizzle. The evidence is moving toward whoever needs to see it. There will be a follow-up — there always is, with rings this size. For now, the road is yours and the night owes you nothing more.`,
      baseXp: 120,
      bonusXpPerCheck: 30,
    },

    ending_escape: {
      type: 'completion',
      id: 'ending_escape',
      title: 'Cold Road, Empty Hands',
      proseByChecks: [
        `Nothing to show for the night. No ledger. No testimony. Just the cold road and the sound of the Forgotten Flagon receding behind you. But you're standing. That's more than some get, and tonight it was genuinely in question.`,

        `One moment it clicked — one choice that landed right — and then the rest of the night swallowed it whole. The mission failed. You didn't. Renn will find another angle, another night, another tavern. You'll decide later whether you want to be there for it.`,

        `Two clean moments and still the night turned against you. Renn is somewhere making new calculations. You're somewhere finding dry ground and deciding what comes next. The Forgotten Flagon keeps its secrets for one more night. It won't keep them forever.`,

        `Three checks passed and you still walked out empty-handed. That's a certain kind of night — the kind that reminds you that competence and outcomes aren't the same thing. You're alive. You're wiser. The road is a long teacher, and tonight was one of its better lessons.`,
      ],
      epilogue: `The rain hasn't let up. The road back is long and dark and the only light is what you carry. That's been true before. It'll be true again. You've walked worse roads in worse weather to get somewhere worth getting to.`,
      baseXp: 60,
      bonusXpPerCheck: 20,
    },

    ending_barely: {
      type: 'completion',
      id: 'ending_barely',
      title: 'Still Breathing',
      proseByChecks: [
        `The Forgotten Flagon took everything you brought in and kept most of it. You've got your life, some new bruises, and a night you'll be working to understand for a while. The road is long and the next one starts here, with what you have left.`,

        `One moment of clarity in a night of bad calls. It almost counted. Almost. You're on a cold road with nothing, and the only productive thing you can do with that is decide what comes next. So decide.`,

        `Two checks landed and the night still broke against you. Some nights are like that. The Forgotten Flagon doesn't give up its secrets cheaply, and tonight it decided you hadn't paid the full price. Tomorrow you'll figure out what that means.`,

        `Three checks passed. Three moments where you were exactly as capable as you needed to be — and it still wasn't enough. That's the Forgotten Flagon. Older than the road, meaner than the rain. But you are still here, and that is not a small thing. Start from there.`,
      ],
      epilogue: `You find a doorway a few streets from the tavern and stop there, listening to the water run down the cobblestones. You take inventory of what you still have. The list is shorter than you'd like. But it's a list, not an epitaph.`,
      baseXp: 30,
      bonusXpPerCheck: 10,
    },
  },
};

export const CAMPAIGNS_MAP: Record<string, CampaignDefinition> = {
  forgotten_flagon: FORGOTTEN_FLAGON,
};
