export type PaytableItem = {
  value: string
  name: string
  code?: string
}

export type GameVariant = {
  displayName: string
  gameName: string
  paytables: PaytableItem[]
}

export type GameGroup = {
  gameType: string
  isDeuces?: boolean
  variants: GameVariant[]
}

// pt = item.code ?? (gameName + '_' + value.replace(/\//g, '_'))

export const GAME_GROUPS: GameGroup[] = [
  {
    gameType: 'Bonus Poker',
    variants: [
      {
        displayName: 'Bonus Poker',
        gameName: 'Bonus',
        paytables: [
          { value: '9/6', name: '9/6  99.64%', code: 'Bonus_9_6' },
          { value: '8/6', name: '8/6  98.49%', code: 'Bonus_8_6' },
          { value: '8/5', name: '8/5  97.40%', code: 'Bonus_8_5' },
          { value: '7/5', name: '7/5  96.25%', code: 'Bonus_7_5' },
          { value: '6/5', name: '6/5  95.36%', code: 'Bonus_6_5' },
        ],
      },
      {
        displayName: 'Bonus Poker Deluxe',
        gameName: 'BonusDeluxe',
        paytables: [
          { value: '9/6', name: '9/6  99.64%', code: 'BonusDeluxe_9_6' },
          { value: '9/5', name: '9/5  98.54%', code: 'BonusDeluxe_9_5' },
          { value: '8/6', name: '8/6  98.49%', code: 'BonusDeluxe_8_6' },
          { value: '8/5', name: '8/5  97.40%', code: 'BonusDeluxe_8_5' },
          { value: '7/5', name: '7/5  96.25%', code: 'BonusDeluxe_7_5' },
          { value: '6/5', name: '6/5  95.36%', code: 'BonusDeluxe_6_5' },
        ],
      },
      {
        displayName: 'Double Bonus',
        gameName: 'DoubleBonus',
        paytables: [
          { value: '50/10/7/5', name: '50/10/7/5  100.17%', code: 'DoubleBonus_50_10_7_5' },
          { value: '50/9/7/5',  name: '50/9/7/5   99.11%',  code: 'DoubleBonus_50_9_7_5' },
          { value: '40/10/7/5', name: '40/10/7/5  98.57%',  code: 'DoubleBonus_40_10_7_5' },
          { value: '50/9/6/5',  name: '50/9/6/5   97.81%',  code: 'DoubleBonus_50_9_6_5' },
          { value: '50/9/7/4',  name: '50/9/7/4   97.74%',  code: 'DoubleBonus_50_9_7_4' },
          { value: '50/9/6/4',  name: '50/9/6/4   96.38%',  code: 'DoubleBonus_50_9_6_4' },
          { value: '50/8/6/5',  name: '50/8/6/5   96.23%',  code: 'DoubleBonus_50_8_6_5' },
          { value: '50/9/5/4',  name: '50/9/5/4   95.27%',  code: 'DoubleBonus_50_9_5_4' },
          { value: '50/8/5/4',  name: '50/8/5/4   94.18%',  code: 'DoubleBonus_50_8_5_4' },
          { value: '50/7/5/4',  name: '50/7/5/4   93.10%',  code: 'DoubleBonus_50_7_5_4' },
        ],
      },
      {
        displayName: 'Super Double Bonus',
        gameName: 'SuperDblBonus',
        paytables: [
          { value: '9/5', name: '9/5  99.69%', code: 'SuperDblBonus_9_5' },
          { value: '8/5', name: '8/5  98.68%', code: 'SuperDblBonus_8_5' },
          { value: '7/5', name: '7/5  97.77%', code: 'SuperDblBonus_7_5' },
          { value: '6/5', name: '6/5  96.87%', code: 'SuperDblBonus_6_5' },
        ],
      },
    ],
  },
  {
    gameType: 'Double Double Bonus',
    variants: [
      {
        displayName: 'Double Double Bonus',
        gameName: 'DDBonus',
        paytables: [
          { value: '10/6', name: '10/6  100.07%', code: 'DDBonus_10_6' },
          { value: '9/6',  name: '9/6   98.98%',  code: 'DDBonus_9_6' },
          { value: '8/6',  name: '8/6   97.89%',  code: 'DDBonus_8_6' },
          { value: '9/5',  name: '9/5   97.87%',  code: 'DDBonus_9_5' },
          { value: '8/5',  name: '8/5   96.79%',  code: 'DDBonus_8_5' },
          { value: '7/5',  name: '7/5   95.71%',  code: 'DDBonus_7_5' },
          { value: '6/5',  name: '6/5   94.66%',  code: 'DDBonus_6_5' },
        ],
      },
      {
        displayName: 'Dbl Dbl Bonus Plus',
        gameName: 'DDBonusPlus',
        paytables: [
          { value: '9/6',  name: '9/6   99.44%',  code: 'DDBonusPlus_9_6' },
          { value: '10/5', name: '10/5  99.42%',  code: 'DDBonusPlus_10_5' },
          { value: '9/5',  name: '9/5   98.33%',  code: 'DDBonusPlus_9_5' },
          { value: '8/5',  name: '8/5   97.24%',  code: 'DDBonusPlus_8_5' },
          { value: '7/5',  name: '7/5   96.17%',  code: 'DDBonusPlus_7_5' },
          { value: '6/5',  name: '6/5   95.11%',  code: 'DDBonusPlus_6_5' },
        ],
      },
      {
        displayName: 'Super Dbl Dbl Bonus',
        gameName: 'SDDBonus',
        paytables: [
          { value: '50/8/6',  name: '50/8/6   100.79%', code: 'SDDBonus_50_8_6' },
          { value: '50/7/6',  name: '50/7/6    99.71%', code: 'SDDBonus_50_7_6' },
          { value: '50/8/5',  name: '50/8/5    99.69%', code: 'SDDBonus_50_8_5' },
          { value: '100/7/5', name: '100/7/5   99.17%', code: 'SDDBonus_100_7_5' },
          { value: '50/7/5',  name: '50/7/5    98.61%', code: 'SDDBonus_50_7_5' },
          { value: '100/6/5', name: '100/6/5   98.25%', code: 'SDDBonus_100_6_5' },
          { value: '50/6/5',  name: '50/6/5    97.69%', code: 'SDDBonus_50_6_5' },
        ],
      },
    ],
  },
  {
    gameType: 'Triple Bonus Poker',
    variants: [
      {
        displayName: 'Triple Bonus Poker',
        gameName: 'TripleBonus',
        paytables: [
          { value: '10/7/5', name: '10/7/5  99.93%' },
          { value: '11/7/4', name: '11/7/4  99.58%' },
          { value: '10/7/4', name: '10/7/4  98.51%' },
          { value: '9/7/4',  name: '9/7/4   97.45%' },
          { value: '9/6/4',  name: '9/6/4   95.87%' },
          { value: '9/5/4',  name: '9/5/4   94.53%' },
        ],
      },
      {
        displayName: 'Triple Double Bonus',
        gameName: 'TripleDblBonus',
        paytables: [
          { value: '400/50/9/7/4', name: '400/50/9/7/4  99.57%' },
          { value: '500/55/9/6/4', name: '500/55/9/6/4  98.75%' },
          { value: '400/50/9/6/4', name: '400/50/9/6/4  98.15%' },
          { value: '400/50/9/5/5', name: '400/50/9/5/5  98.49%' },
          { value: '400/50/9/7/3', name: '400/50/9/7/3  98.46%' },
          { value: '400/55/9/6/4', name: '400/55/9/6/4  98.20%' },
          { value: '400/50/8/6/4', name: '400/50/8/6/4  97.10%' },
          { value: '400/55/9/5/4', name: '400/55/9/5/4  97.07%' },
          { value: '400/50/9/5/4', name: '400/50/9/5/4  97.02%' },
          { value: '400/50/8/5/4', name: '400/50/8/5/4  95.96%' },
          { value: '500/55/7/5/4', name: '500/55/7/5/4  95.52%' },
          { value: '400/50/7/5/4', name: '400/50/7/5/4  94.91%' },
          { value: '400/50/6/5/4', name: '400/50/6/5/4  93.86%' },
        ],
      },
      {
        displayName: 'Triple Bonus Plus',
        gameName: 'TripleBonusPlus',
        paytables: [
          { value: '9/5', name: '9/5  99.80%' },
          { value: '8/5', name: '8/5  98.72%' },
          { value: '7/5', name: '7/5  97.67%' },
          { value: '6/5', name: '6/5  96.61%' },
        ],
      },
    ],
  },
  {
    gameType: 'Deuces Wild Poker',
    isDeuces: true,
    variants: [
      {
        displayName: 'Deuces Wild Poker',
        gameName: 'Deuces',
        paytables: [
          { value: 'FPDW',           name: 'Full Pay  100.76%',    code: 'Deuces_FPDW' },
          { value: 'IGTNSU',         name: 'IGT Not So Ugly 99.96%', code: 'Deuces_IGTNSU' },
          { value: 'NSUDW',          name: 'Not So Ugly  99.74%',  code: 'Deuces_NSUDW' },
          { value: 'PNSUDW',         name: 'pNSU  98.91%',         code: 'Deuces_PNSUDW' },
          { value: '20/12/10/4/4/3', name: '20/12/10/4/4/3  97.58%' },
          { value: '20/12/9/4/4/3',  name: '20/12/9/4/4/3   97.06%' },
          { value: '25/16/13/4/3/2', name: '25/16/13/4/3/2  96.77%' },
          { value: '20/10/8/4/4/3',  name: '20/10/8/4/4/3   95.96%' },
          { value: '25/15/10/4/3/2', name: '25/15/10/4/3/2  94.82%' },
        ],
      },
      {
        displayName: 'Deuces Wild Bonus',
        gameName: 'DeucesBonus',
        paytables: [
          { value: '10/4/3', name: '10/4/3  99.86%' },
          { value: '9/4/3',  name: '9/4/3   99.45%' },
          { value: '8/4/3',  name: '8/4/3   99.06%' },
          { value: '13/3/3', name: '13/3/3  98.80%' },
          { value: '7/4/3',  name: '7/4/3   98.69%' },
          { value: '12/3/3', name: '12/3/3  98.28%' },
          { value: '11/3/3', name: '11/3/3  97.80%' },
          { value: '10/3/3', name: '10/3/3  97.36%' },
          { value: '13/3/2', name: '13/3/2  96.71%' },
          { value: '12/3/2', name: '12/3/2  96.22%' },
          { value: '11/3/2', name: '11/3/2  95.76%' },
          { value: '10/3/2', name: '10/3/2  95.34%' },
          { value: '9/3/2',  name: '9/3/2   94.94%' },
        ],
      },
      {
        displayName: 'Super Deuces Bonus',
        gameName: 'SDeucesBonus',
        paytables: [
          { value: '160/25/16/10', name: '160/25/16/10  100.40%' },
          { value: '160/25/15/10', name: '160/25/15/10  100.12%' },
          { value: '160/25/15/9',  name: '160/25/15/9    99.66%' },
          { value: '160/25/10/9',  name: '160/25/10/9    98.28%' },
          { value: '160/25/10/8',  name: '160/25/10/8    97.87%' },
          { value: '160/25/10/7',  name: '160/25/10/7    97.48%' },
          { value: '100/25/12/10', name: '100/25/12/10   97.25%' },
          { value: '160/20/10/8',  name: '160/20/10/8    96.94%' },
          { value: '100/25/12/9',  name: '100/25/12/9    96.78%' },
          { value: '100/25/12/8',  name: '100/25/12/8    96.36%' },
          { value: '160/20/8/6',   name: '160/20/8/6     95.61%' },
        ],
      },
      {
        displayName: 'Loose Deuces Wild',
        gameName: 'LooseDeuces',
        paytables: [
          { value: '500/17/10', name: '500/17/10  101.60%' },
          { value: '500/15/10', name: '500/15/10  100.97%' },
          { value: '500/12/11', name: '500/12/11  100.47%' },
          { value: '500/12/10', name: '500/12/10  100.02%' },
          { value: '500/15/7',  name: '500/15/7    99.78%' },
          { value: '400/16/11', name: '400/16/11   99.62%' },
          { value: '500/15/6',  name: '500/15/6    99.42%' },
          { value: '500/12/8',  name: '500/12/8    99.20%' },
          { value: '500/15/5',  name: '500/15/5    99.07%' },
        ],
      },
      {
        displayName: 'Double Deuces Wild',
        gameName: 'DblDeuces',
        paytables: [
          { value: '16/11', name: '16/11  99.62%', code: 'DblDeuces_16_11' },
          { value: '16/10', name: '16/10  99.17%', code: 'DblDeuces_16_10' },
          { value: '15/10', name: '15/10  99.85%', code: 'DblDeuces_15_10' },
          { value: '15/9',  name: '15/9   98.43%', code: 'DblDeuces_15_9' },
        ],
      },
      {
        displayName: 'Double Deuces Bonus',
        gameName: 'DblDeucesBonus',
        paytables: [
          { value: '25/12', name: '25/12  99.81%' },
          { value: '25/9',  name: '25/9   98.61%' },
          { value: '20/9',  name: '20/9   97.68%' },
        ],
      },
    ],
  },
  {
    gameType: 'Other Poker Games',
    variants: [
      {
        displayName: 'Jacks or Better',
        gameName: 'Jacks',
        paytables: [
          { value: '9/6', name: '9/6  99.54%', code: 'Jacks_9_6' },
          { value: '9/5', name: '9/5  98.45%', code: 'Jacks_9_5' },
          { value: '8/6', name: '8/6  98.39%', code: 'Jacks_8_6' },
          { value: '8/5', name: '8/5  97.30%', code: 'Jacks_8_5' },
          { value: '7/5', name: '7/5  96.15%', code: 'Jacks_7_5' },
          { value: '6/5', name: '6/5  95.00%', code: 'Jacks_6_5' },
        ],
      },
      {
        displayName: 'USA Poker',
        gameName: 'USA',
        paytables: [
          { value: '7/7', name: '7/7  96.26%' },
        ],
      },
    ],
  },
]

export function ptFromVariantPaytable(gameName: string, item: PaytableItem): string {
  return item.code ?? (gameName + '_' + item.value.replace(/\//g, '_'))
}

export const DENOM_LABELS = ['25c', '50c', '$1', '$2', '$5']
export const DENOM_VALUES = ['0.25', '0.50', '1', '2', '5']

export const BET_OPTIONS = ['1', '2', '3', '4', '5']
