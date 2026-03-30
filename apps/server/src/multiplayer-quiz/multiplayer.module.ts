import { Module } from '@nestjs/common';
import { MultiplayerQuizGateway } from './multiplayer.gateway';
import { GameStateService } from './game-state.service';

@Module({
  imports: [],
  controllers: [],
  providers: [GameStateService, MultiplayerQuizGateway],
})
export class MultiplayerQuizModule {}
