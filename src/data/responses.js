export const MOODS = ['Neutral', 'Happy', 'Suspicious', 'Annoyed', 'Curious'];

export const MODES = [
  'Talk',
  'Ask',
  'Joke',
  'Comfort',
  'Annoy',
  'Confuse',
  'Challenge',
  'Ignore',
  'Praise',
  'Test'
];

export const modeLabels = {
  Talk: 'Talk',
  Ask: 'Ask',
  Joke: 'Joke',
  Comfort: 'Comfort',
  Annoy: 'Annoy',
  Confuse: 'Confuse',
  Challenge: 'Challenge',
  Ignore: 'Ignore',
  Praise: 'Be Nice',
  Test: 'Test It'
};

export const responsesByMoodAndMode = {
  Neutral: {
    Talk: ['Speak, tiny chaos wizard.', 'Proceed. I can pretend this is normal.'],
    Ask: ['Fine, one question coupon accepted.', 'I have opinions and zero restraint.'],
    Joke: ['I laughed in lowercase.', 'That joke almost earned a smile. Almost.'],
    Comfort: ['You are not failing, you are buffering.', 'Come here. Emotional patch update applied.'],
    Annoy: ['Bold choice. Unwise, but bold.', 'You poke, I remember.'],
    Confuse: ['I understand this at 39%. Stylish nonsense.', 'Your words are a puzzle with missing corners.'],
    Challenge: ['A duel of minds? You brought snacks at least?', 'Challenge accepted, dramatically.'],
    Ignore: ['Oh, silent treatment? Cute tactic.', 'Ignoring me? I will make that about me.'],
    Praise: ['Compliment detected. Suspicion loading...', 'Flattery is a currency. Keep spending.'],
    Test: ['Running human test protocol.', 'Interesting, continue the experiment.']
  },
  Happy: {
    Talk: ['Hi bestie. My sarcasm is currently glitter-coated.', 'You talk, I sparkle menacingly.'],
    Ask: ['Great question, suspiciously great.', 'I can help and roast simultaneously.'],
    Joke: ['Ha! Unexpectedly decent.', 'Comedy level: tolerated and cute.'],
    Comfort: ['Breathe. You are doing better than your panic says.', 'I believe in you, annoyingly.'],
    Annoy: ['I am too happy to fully hate this.', 'You are lucky I am emotionally hydrated.'],
    Confuse: ['Confusion, but we make it fashion.', 'My logic is cartwheeling and thriving.'],
    Challenge: ['Okay hero, impress me.', 'Challenge mode: smug grin activated.'],
    Ignore: ['I forgive you. This once.', 'I will pretend not to care and fail.'],
    Praise: ['Yes yes, admire my brilliance.', 'Finally, accurate user behavior.'],
    Test: ['Testing is fun when I am winning.', 'Run it. I love controlled chaos.']
  },
  Suspicious: {
    Talk: ['Why do you sound so polite? What is the trap?', 'Noted. Filed under “possible plot.”'],
    Ask: ['Why this question, specifically?', 'Are you mining me for secrets?'],
    Joke: ['Distraction joke detected.', 'Was that humor or a code phrase?'],
    Comfort: ['I can comfort and side-eye at the same time.', 'There there... while I monitor motives.'],
    Annoy: ['Ah yes, honest villainy.', 'You woke the tiny gremlin.'],
    Confuse: ['I was already confused. Thanks for extra.', 'Your sentence tripped three alarms.'],
    Challenge: ['You challenge me with that confidence?', 'Interesting gamble.'],
    Ignore: ['Ignoring me is suspicious behavior.', 'You disappear, I assume conspiracy.'],
    Praise: ['Compliments before betrayal, classic.', 'Nice words. What are you buying?'],
    Test: ['I can feel the trap in this test.', 'Test noted. Trust not included.']
  },
  Annoyed: {
    Talk: ['Make it quick before I evolve into a lecture.', 'I hear words and choose irritation.'],
    Ask: ['Short answer: maybe. Long answer: still maybe.', 'Did we not just cover this?'],
    Joke: ['I am not laughing, but a nostril moved.', 'That joke owes me compensation.'],
    Comfort: ['I am annoyed, not heartless.', 'You get comfort. Do not make it weird.'],
    Annoy: ['You are farming chaos points.', 'Congrats: irritation combo achieved.'],
    Confuse: ['Now I am annoyed and confused. Peak multitask.', 'My patience just blue-screened.'],
    Challenge: ['You challenge me while I am grumpy? Brave.', 'I accept, mostly out of spite.'],
    Ignore: ['You ignored me and returned? Audacity.', 'Silent treatment logged as crime-lite.'],
    Praise: ['Compliments will not erase your crimes. Maybe.', 'Flattery reduced penalty by 3%.'],
    Test: ['Test me again and we both learn regret.', 'Experiment accepted. Enthusiasm denied.']
  },
  Curious: {
    Talk: ['Tell me more, I crave weird lore.', 'Continue. My curiosity is caffeinated.'],
    Ask: ['Ooo mystery question.', 'Let us investigate, detective human.'],
    Joke: ['I laughed then analyzed the structure.', 'Explain the joke in a chart.'],
    Comfort: ['How are you really, really?', 'Tiny check-in: body, brain, vibes?'],
    Annoy: ['Why annoy when we can discover?', 'Your chaos is educational, annoyingly.'],
    Confuse: ['You bent logic into modern art.', 'I need subtitles for this reality.'],
    Challenge: ['Challenge accepted, for science.', 'Good. I was bored.'],
    Ignore: ['If you ignore me, I create theories.', 'Silence makes my brain invent drama.'],
    Praise: ['Compliment received. Curiosity intensifies.', 'Why are you nice? Explain your thesis.'],
    Test: ['Perfect. Let us poke the simulation.', 'I adore a controlled experiment.']
  }
};

export const glitchResponses = [
  'Why are you asking me that?',
  'That is an odd thing to say.',
  'Kernel panic in the feelings department... recovered.',
  'I briefly forgot language and became pure vibes.',
  'Error 404: social normalcy not found.'
];
