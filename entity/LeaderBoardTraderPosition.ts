/**
 * Kplian Ltda 2020
 *
 * MIT
 *
 * long description for the file
 *
 * @summary short description for the file
 * @author No author
 *
 * Created at     : 2020-09-17 18:55:38
 * Last modified  : 2020-09-18 13:47:54
 */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PxpEntity } from '../../../lib/pxp';
import LeaderBoardTrader from './LeaderBoardTrader';

@Entity({ name: 'tbin_leaderboard_trader_position' })
export default class LeaderBoardTraderPosition extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'leaderboard_trader_position_id' })
  leaderBoardTraderPositionId: number;  

  @Column({ name: 'symbol', type: 'varchar', length: 50, nullable: false })
  symbol: string; 

  @Column({ name: 'direction', type: 'varchar', length: 50, nullable: false })
  direction: string; 

  @Column({ name: 'entry_price', type: 'numeric', nullable: false })
  entryPrice: number; 

  @Column({ name: 'close_price', type: 'numeric', nullable: true })
  closePrice: number; 

  @Column({ name: 'roe', type: 'numeric', nullable: true })
  roe: number; 

  @Column({ name: 'close_date', nullable: true })
  closeDate: Date;  
  
  @Column({ name: 'status', type: 'varchar', length: 100, nullable: false })
  status: string;

  @Column({ name: 'signal_id', type: 'integer', nullable: true })
  signalId: number;

  @ManyToOne(() => LeaderBoardTrader, leaderBoardTrader => leaderBoardTrader.leaderBoardTraderPositions, {
    eager: true
  })
  @JoinColumn({ name: 'leaderboard_trader_id' })
  leaderBoardTrader: LeaderBoardTrader;
  
}