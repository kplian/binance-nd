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
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { PxpEntity } from '@pxp-nd/common';


@Entity({ name: 'tbin_leaderboard_ranking' })
export default class LeaderBoardRanking extends PxpEntity {

  @PrimaryGeneratedColumn({ name: 'leaderboard_ranking_id' })
  leaderboardRankingId: number;

  @Column({ name: 'name', type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ name: 'uuid', type: 'varchar', length: 50, nullable: false })
  uuid: string;  

  @Column({ name: 'daily', type: 'numeric' })
  dailyRoi: number;  

  @Column({ name: 'seven_days', type: 'numeric' })
  weeklyRoi: number;

  @Column({ name: 'thirty_days', type: 'numeric' })
  monthlyRoi: number;

  @Column({ name: 'one_year', type: 'numeric' })
  yearlyRoi: number;

  @Column({ name: 'all_roi', type: 'numeric' })
  allRoi: number;

}