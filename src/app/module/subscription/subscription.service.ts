import { Injectable } from '@nestjs/common';
import { getBkashIdToken } from '../../lib/bkash.js';

@Injectable()
export class SubscriptionService {

  async subscription(payload: any) {

    console.log('bKash id_token', getBkashIdToken())
    return getBkashIdToken()
  }
}
