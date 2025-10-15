
export interface Choice {
  text: string;
}

export interface GameScene {
  story: string;
  choices: Choice[];
  gameOver: boolean;
  gameWin: boolean;
  imageUrl?: string;
}

export interface StoryLog {
  role: 'user' | 'model';
  text: string;
}
