import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {knex} from '../../db';

@Service()
export class WhisperRepository {

  constructor(private db: Db) {}

  public async create(
    sender: number,
    message: string,
    place: number,
    recipient: number,
  ): Promise<any> {
    await this.db.whisper
      .insert({
        place_id: place,
        sender_member_id: sender,
        recipient_member_id: recipient,
        message: message,
      });
  }
  
}
