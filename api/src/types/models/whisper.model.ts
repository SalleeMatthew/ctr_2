import { Model } from './model';

/** Defines a whisper object as stored in the db */
export interface Whisper extends Model {
  sender_member_id: number;
  message: string;
  place_id: number;
  recipient_member_id: number;
}
