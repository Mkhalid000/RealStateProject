import {Type} from 'class-transformer';
import {IsEnum, IsInt, IsString, Max, Min} from 'class-validator';
import {SubscriptionPlan} from '@realreels/shared';

export class CreateBoostDto {
  @IsString()
  reelId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days: number;
}

export class ChangePlanDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
