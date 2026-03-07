import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';

export class GuestLoginDto {
  @IsString()
  @MinLength(1)
  deviceId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  nickname!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest-login')
  guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto.deviceId, dto.nickname);
  }
}
