import { IsEnum } from "class-validator"
import { PaymentMethod, SubscriptionType } from "../../../../generated/prisma/enums.js"



export class SubscriptionDto {

  @IsEnum(PaymentMethod, {
    message: "Method must be either CARD/BKASH"
  })
  method: string

  @IsEnum(SubscriptionType, {
    message: 'Subscription must be MONTHLY/HALF_YEARLY/YEARLY'
  })
  readonly billingCycle: SubscriptionType
}