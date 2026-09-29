import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { PaymentMethod, SubscriptionType } from "../../../../generated/prisma/enums.js"



export class SubscriptionDto {

  @ApiProperty({
    enum: ['CARD', 'BKASH'],
    example: 'BKASH',
    description: 'CARD = Stripe checkout, BKASH = bKash payment URL',
  })
  @IsEnum(PaymentMethod, {
    message: "Method must be either CARD/BKASH"
  })
  method: PaymentMethod

  @ApiProperty({
    enum: ['MONTHLY', 'HALF_YEARLY', 'YEARLY'],
    example: 'MONTHLY',
  })
  @IsEnum(SubscriptionType, {
    message: 'Subscription must be MONTHLY/HALF_YEARLY/YEARLY'
  })
  readonly billingCycle: SubscriptionType
}
