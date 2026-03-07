import { Module } from '@nestjs/common';
import { DeckService } from './deck.service';
import { EvaluatorService } from './evaluator.service';
import { PotService } from './pot.service';
import { GameEngineService } from './game-engine.service';

@Module({
  providers: [DeckService, EvaluatorService, PotService, GameEngineService],
  exports: [DeckService, EvaluatorService, PotService, GameEngineService],
})
export class GameModule {}
