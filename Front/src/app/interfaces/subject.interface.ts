export interface Subject {
  _id?: string; // MongoDB ID
  user_id: string;
  name: string;
  credits: number;
  schedule: string[];
}
