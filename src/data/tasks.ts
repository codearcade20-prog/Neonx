export type Difficulty = 'easy' | 'crazy' | 'dare' | 'impossible';

export interface Task {
  id: string;
  difficulty: Difficulty;
  content: string;
  points: number;
}

export const tasks: Task[] = [
  { id: 't1', difficulty: 'easy', content: 'Give someone in the room a genuine compliment.', points: 10 },
  { id: 't2', difficulty: 'easy', content: 'Do 10 jumping jacks.', points: 10 },
  { id: 't3', difficulty: 'easy', content: 'Name 3 movies starring Tom Cruise in 10 seconds.', points: 10 },
  { id: 't4', difficulty: 'crazy', content: 'Dance without music for 15 seconds.', points: 30 },
  { id: 't5', difficulty: 'crazy', content: 'Take the funniest group selfie and show it.', points: 30 },
  { id: 't6', difficulty: 'crazy', content: 'Act like a monkey until someone gives you a high five.', points: 30 },
  { id: 't7', difficulty: 'dare', content: 'Act like your manager/teacher for 30 seconds.', points: 50 },
  { id: 't8', difficulty: 'dare', content: 'Sing a song loudly for 20 seconds.', points: 50 },
  { id: 't9', difficulty: 'dare', content: 'Let the person to your left send a text from your phone.', points: 50 },
  { id: 't10', difficulty: 'impossible', content: 'Give a 30-second convincing speech on "Why I\'m the CEO".', points: 100 },
  { id: 't11', difficulty: 'impossible', content: 'Hold a plank for 1 minute while telling a joke.', points: 100 }
];

export const getRandomTask = (): Task => {
  return tasks[Math.floor(Math.random() * tasks.length)];
};
