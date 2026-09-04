const fs = require('fs');

const difficulties = ['easy', 'crazy', 'dare', 'impossible'];

const easyTemplates = [
  "Give a genuine compliment to the person on your right.",
  "Name 5 fruits in 10 seconds.",
  "Do 10 jumping jacks.",
  "High five the person across from you.",
  "Spin around 3 times.",
  "Say the alphabet backward from Z to T.",
  "Name 3 colors that start with the letter B.",
  "Touch your toes for 10 seconds.",
  "Hum your favorite song.",
  "Make a funny face."
];

const crazyTemplates = [
  "Dance without music for 15 seconds.",
  "Take the funniest group selfie and show it.",
  "Act like a monkey until someone gives you a high five.",
  "Speak in a fake accent for the next 3 rounds.",
  "Pretend you are an airplane for 20 seconds.",
  "Walk backward around the room once.",
  "Talk without opening your mouth for your next turn.",
  "Try to juggle 3 invisible items.",
  "Act like a robot.",
  "Meow like a cat."
];

const dareTemplates = [
  "Act like your manager/teacher for 30 seconds.",
  "Sing a song loudly for 20 seconds.",
  "Let the person to your left send a text from your phone.",
  "Call a friend and tell them you love them.",
  "Do 10 pushups.",
  "Hold a wall sit for 30 seconds.",
  "Let someone draw on your hand with a pen.",
  "Post a silly photo on your social media story.",
  "Eat a spoonful of hot sauce or something spicy.",
  "Do your best impression of a famous celebrity."
];

const impossibleTemplates = [
  "Give a 30-second convincing speech on 'Why I'm the CEO'.",
  "Hold a plank for 1 minute while telling a joke.",
  "Recite a poem you make up on the spot.",
  "Do 20 burpees in one go.",
  "Convince the group that you are actually a time traveler.",
  "Do a handstand or attempt one for 10 seconds.",
  "Pitch a terrible business idea convincingly.",
  "Sing a high note and hold it for 15 seconds.",
  "Perform a dramatic monologue from a movie.",
  "Stay completely silent for the next 5 rounds."
];

const tasks = [];
let idCounter = 1;

for (let i = 0; i < 25; i++) {
  tasks.push({ id: idCounter++, difficulty: 'easy', content: easyTemplates[i % easyTemplates.length], points: 10 });
  tasks.push({ id: idCounter++, difficulty: 'crazy', content: crazyTemplates[i % crazyTemplates.length], points: 30 });
  tasks.push({ id: idCounter++, difficulty: 'dare', content: dareTemplates[i % dareTemplates.length], points: 50 });
  tasks.push({ id: idCounter++, difficulty: 'impossible', content: impossibleTemplates[i % impossibleTemplates.length], points: 100 });
}

fs.writeFileSync('src/data/tasks.json', JSON.stringify(tasks, null, 2));
console.log('Generated tasks.json with ' + tasks.length + ' tasks.');
