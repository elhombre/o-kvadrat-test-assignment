export interface NumberRecord {
  value: number;
  date: string;
}

export interface Result {
  timeSpent: number;
  numbersGenerated: NumberRecord[];
}
