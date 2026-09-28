import { Body, Controller, Post } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { prefix } from '../../utils/global.prefix.js';


@Controller(`${prefix}/subscription`)
export class SubscriptionController {

  constructor(private readonly subscriptionService: SubscriptionService) { }

  @Post()
  async subscriptionCreate(
    @Body() payload: any
  ) {

    const res = await this.subscriptionService.subscription(payload)

    return {
      data: res,
      message: "token id"
    }
  }

}
