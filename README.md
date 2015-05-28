# Contents <a name="contents"></a>
- [Introduction](#intro)
- [Core Knowledge](#core-knowledge)
    - [Attack Accuracy](#atk-accuracy)
    - [Hit or Miss: the impact of `randChance`](#hit-or-miss)
- [Toon-up](#toon-up)
    - [Did using Toon-up have any impact on other gag's damage or accuracy?](#tu-1)
- [Trap](#trap)
- [Lure](#lure)
    - [What was the impact of using multiple Lure gags?](#lure-1)
- [Sound](#sound)
- [Throw](#throw)
- [Squirt](#squirt)
- [Drop](#drop)
- [SOS Cards](#sos-cards)
    - [Did being Lureless impact the accuracy of Lure SOS cards?](#sos-1)
    - [Did being Lureless impact the number of rounds Lure SOS cards would hold for?](#sos-2)
- [V.P.](#vp)
- [C.F.O.](#cfo)
    - [How was the C.F.O. reward chosen?](#cfo-1)
- [C.J.](#cj)
- [C.E.O.](#ceo)
- [Misc](#misc)
    - [Do some Shopkeepers sell more accurate gags?](#misc-1)
- [Global Values](#global-values)
    - [Battle Constants](#battle-constants)
- [Credits](#credits)

# Introduction <a name="intro"></a>
[[back to top](#contents)]

# Core Knowledge <a name="core-knowledge"></a>
[[back to top](#contents)]

## Attack Accuracy <a name="atk-accuracy"></a>

`atkAcc` is a percentage which represents the likelihood of an attack performing to its highest degree. This is used in two ways:

1. For Lure SOS cards, it's used when calculating the odds that cogs "wake up early" each round.
2. It's used when calculating the value of `atkHit`, which is a boolean value that represents whether or not an attack hit.

### Special Cases

Fires, Trap and non-Drop/Lure SOS cards have 95%, 100% and 95% accuracy respectively. In addition, all three are always assigned an `atkHit` of 1, which means they are *guaranteed* to hit.

### Equation

A gag's overall accuracy is calculated using the following equation:

```python
atkAcc = propAcc + trackExp + tgtDef + bonus
```

#### `propAcc`

**AvPropAccuracy (Gag track vs. Gag level):**

|         |  1 |  2 |  3 |  4 |  5 |  6 |  7  |
|:---------:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| Toon-up |  - |  - |  - |  - |  - | 70 | 100 |
| Trap    |  - | -  | -  | -  | -  | -  |  0  |
| Lure    | 50 | 50 | 60 | 60 | 70 | 70 | 100 |
| Sound   | -  | -  | -  | -  | -  | -  | 95  |
| Throw   | -  | -  | -  | -  | -  | -  | 75  |
| Squirt  | -  | -  | -  | -  | -  | -  | 95  |
| Drop    | -  | -  | -  | -  | -  | -  | 50  |

**AvLureBonusAccuracy:**

|      |  1 |  2 |  3 |  4 |  5 |  6 |  7  |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:---:|
| Lure | 60 | 60 | 70 | 70 | 80 | 80 | 100 |

For all non-Lure gags, `propAcc` is simply the above pre-defined `AvPropAccuracy` value.

For Lure gags, `propAcc` is initially assigned its `AvPropAccuracy` value, then if the toon has Lure trees planted at a level greater than or equal to the gag level they're using **or** there's an active Lure interactive prop, `propAcc` is re-assigned a value from `AvLureBonusAccuracy`.

#### `trackExp`

`trackExp` is determined based on two factors: `toonExpLvl` and `exp`.

The following pseudocode outlines how `toonExpLvl` and `exp` are calculated:

<input type="text" id="name" name="name"/>

```python
AttackExpPerTrack = [0, 10, 20, 30, 40, 50, 60]

toonExpLvl = 0
for amount in Levels[track]: # Preset experience levels.
    if experience[track] >= amount: # The toon's experience level.
        toonExpLvl = Levels[track].index(amount) # A value between 0 and 6.

exp = AttackExpPerTrack[toonExpLvl]
if track == HEAL: # If the track is Toon-up, `exp` is halved.
    exp = exp * 0.5
trackExp = exp
```

Now, once the current attack's `trackExp` is calculated, every other slated attack is checked like so:

```python
for otherAtk in toonAtkOrder: # For each toon's ID...
    if otherAtk != attack[TOON_ID_COL]: # If `otherAtk` doesn't match the ID for the above attack...
        nextAttack = toonAttacks[currOtherAtk] 
        nextAtkTrack = getActualTrack(nextAttack) # The attack track (Lure, Drop, etc.)
        if atkTrack == nextAtkTrack and attack[TGT_COL] == nextAttack[TGT_COL]: # If the tracks and targets match...
            currTrackExp = toonTrackExp(nextAttack[TOON_ID_COL], atkTrack) # The `exp` for `nextAttack`.
            trackExp = max(currTrackExp, trackExp) # `trackExp` is assigned the largest `exp`.
```
So, if multiple toons use the same gag track on the same cog, the highest `trackExp` is used in the `atkAcc` calculations for all of them.

#### `tgtDef`

In Toon-up calculations, `tgtDef` is always 0. For the other tracks, it's assigned the defense value of the strongest cog in battle.

Here's a summary of all possible defense values:

| Cog Level |  Defense |
|:---------:|:--------:|
|     1     |     2    |
|     2     |     5    |
|     3     |    10    |
|     4     | 12/15* |
|     5     | 15/20* |
|     6     |    25    |
|     7     |    30    |
|     8     |    35    |
|     9     |    40    |
|     10    |    45    |
|     11    |    50    |
|     12    |    55    |

*Tier 1 cogs (i.e., Cold Callers and Flunkies) have the lower value.

#### `bonus`

There are two possible sources of bonus: multiple hits on the same cog and the Lured Ratio. 

The former is simply 20 * [number of previous hits in the current round], given that the previous attack hit, the previous was not the same track as the current and one of the following is true:

- the *previous* attack affected the group; or
- the *current* attack affects the group; or
- the *current* and *previous* attacks affect the same target.

The latter is calculated like so:

```python
luredRatio = [number of cogs lured] / [total cogs]
accAdjust = 100 * luredRatio
atkAcc += accAdjust
```
So, for example, if there are 4 cogs in battle and two of them are lured, the bonus is:

```python
luredRatio = 2 / 4 = 0.5
100 * luredRatio = 50
atkAcc = atkAcc + 50
```
(Note: The Lured Ratio bonus does not apply to Lure, Toon-up or Drop gags.)

## Hit or Miss: the impact of `randChance` <a name="hit-or-miss"></a>

Once we've calculated an attacks accuracy (`atkAcc`), we need to determine whether or not it will hit its intended target. This is decided by the value of `randChance`, which is simply a pseudorandom integer between 0 and 99 (0 <= x < 99, to be exact).

If `randChance` is less than `atkAcc`, the attack will hit. Otherwise, the attack will miss. It's important to note, however, that `atkAcc` is capped at 95 -- so, any gag which wasn't mentioned in the Special Cases section in [Attack Accuracy](#atk-accuracy) can miss.

### Special Cases

For all SOS Cards, `randChance` is assigned 0.

# Toon-up <a name="toon-up"></a>
[[back to top](#contents)]

## Did using Toon-up have any impact on other gag's damage or accuracy? <a name="tu-1"></a>

### Hypothesis

Yes, Toon-up added a multi-hit-same-target bonus to `atkAcc` subject to the conditions outlined in the [bonus section](#bonus).

### Interpretation

Considering the conditions outlined in the [bonus section](#bonus), Toon-up would increase another gag's accuracy when one of the following was true:

- The Toon-up gag affected the group; or
- The attack gag affected the group; or
- Both gags affected the group.

For example, there would be no bonus applied if there were two toons in battle, and they used Pixie Dust and Fruit Pie Slice because neither is a group attack.

(Note: it appears that needing Laff was not a prerequisite for a Toon-up accuracy bonus.)

### Battle Simulations

# Trap <a name="trap"></a>
[[back to top](#contents)]

# Lure <a name="lure"></a>
[[back to top](#contents)]

## What was the impact of using multiple Lure gags? <a name="lure-1"></a>

### Hypothesis

- When two lure gags were picked, the result of the weakest was calculated first.
- There were two different options for the second gag:
    + The first Lure's result was applied to the second. However, when calculating whether or not the first would hit, the `trackExp` of the strongest gag was used.
    + Each Lure gag was calculated independently; that is, it was possible for one to hit and the other to miss.

The first option was applied when these conditions were met:

- the gag tracks were the same and the target cog was the same; or
- the gag track was Lure and one of the following was true
    + the second Lure gag was single-cog and the first hit; or
    + the second Lure gag was multi-cog.

The second option would be applied when the second Lure gag was single-cog and the first missed.

### Interpretation

Using multiple Lure gags (of varying levels) was only beneficial in two situations:

- While training Lure, since the highest gag's `trackExp` would be applied to the weaker gag.
- If the weaker Lure was multi-cog and the stronger Lure was single-cog (i.e., Small Magnet and $10 Bill). In this case, there seemed to have been two options:
    + If the multi-cog Lure hit, the single-cog Lure did as well.
    + If the multi-cog Lure missed, the single-cog Lure was evaluated independently (so its accuracy wasn't lowered).

If multiple toons with the same experience level in Lure (i.e., maxed) used the same Lure gag, there was no impact on accuracy.

### Battle Simulations

- [$1 Bill & $10 Bill (same target)](http://pastebin.com/rzUCvWPs)
- [$1 Bill & Hypno Goggles (single target)](http://pastebin.com/yNUrv0h7)
- [$1 Bill & Presentation (single target)](http://pastebin.com/qGZdyJUB)
- [Small Magnet & $10 Bill (single target)](http://pastebin.com/wagzTZfp)
- [Small Magnet & Big Magnet (single target)](http://pastebin.com/Saw5PygN)
- [Small Magnet & Hypno Goggles (single target)](http://pastebin.com/D9f7HZrn)

# Sound <a name="sound"></a>
[[back to top](#contents)]

# Throw <a name="throw"></a>
[[back to top](#contents)]

# Squirt <a name="squirt"></a>
[[back to top](#contents)]

# Drop <a name="drop"></a>
[[back to top](#contents)] 

# SOS Cards <a name="sos-cards"></a>
[[back to top](#contents)]

## Did being Lureless impact the accuracy of Lure SOS cards? <a name="sos-1"></a>

### Hypothesis

To determine whether or not a gag will hit, variables `randChoice` and `atkAcc` are compared as follows:

```python
if randChoice < acc:
    # HIT            
else:
    # MISS
```

(See Core Knowledge for definitions of `atkAcc` and `randChoice`.)

When a Lureless toon uses Lil' Oldman, Nancy Gas or Stinky Ned, `atkAcc` has a minimum value of 15 (this occurs against a level 12 cog):

```
atkAcc = propAcc + trackExp + tgtDef + [optional bonus] -> attackAcc = 70 + 0 + (-55) + 0 = 15
```

This means that `randChoice` would have to exceed 15 for the SOS to miss; however, as seen in Core Knowledge, `randChoice` is always assigned 0 when an SOS card is used.

### Interpretation

3 - 5 star Lure SOS cards were guaranteed to hit.

### Battle Simulations

## Did being Lureless impact the number of rounds Lure SOS cards would hold for? <a name="sos-2"></a>

### Hypothesis

Yes, cogs were more likely to "wake up" early if the caller was Lureless. The probability associated with this event is called a cogs `wakeupChance`, which is calculated as follows:

```python
wakeupChance = 100 - attackAcc * 2
```

`attackAcc` is calculated according the following formula (see Core Knowledge):

```python
attackAcc = propAcc + trackExp + tgtDef
```

This means that there are essentially two constants: `propAcc` (which is 70 for Lil' Oldman, Nancy Gas and Stinky Ned) and `trackExp` (which is 0 for a Lureless toon). With this in mind, we can calculate base probabilities by the value of `tgtDef`.

Cog levels 1 - 5 have a maximum `tgtDef` of 20, which means that they also have a maximum `wakeupChance` of 0. So, Lil' Oldman, Nancy Gas and Stinky Ned should always hold for 4 rounds when the highest cog is less than or equal to level 5.

For cog levels 6 - 12, we can establish base probabilities as follows,

```
6: attackAcc = 70 + 0 + (-25) = 45; wakeupChance = 100 - 45 * 2 = 10
7: attackAcc = 70 + 0 + (-30) = 40; wakeupChance = 100 - 40 * 2 = 20
8: attackAcc = 70 + 0 + (-35) = 35; wakeupChance = 100 - 35 * 2 = 30

...

12: attackAcc = 70 + 0 + (-55) = 15; wakeupChance = 100 - 15 * 2 = 70
```

Since 3 - 5 star Lure SOS cards are guaranteed to hit, the above probabilities represent the chance that the cogs will wake up after one round. Now, to calculate probabilities for the subsequent rounds, we may apply the Rule of Multiplication:

>The probability that Events A and B both occur is equal to the probability that Event A occurs times the probability that Event B occurs, given that A has occurred: P(A ∩ B) = P(A) P(B|A)

However, given that each round is calculated independent of any prior results, we note that P(B|A) = P(B). Thus, the probabilities can summarized as the following (note that the chance a cog stays lured is the *complement* of its `wakeupChance`):

|   | 1 - 5 | 6     | 7     | 8     | 9     | 10    | 11    | 12    |
|---|-------|-------|-------|-------|-------|-------|-------|-------|
| 1 |       |       |       |       |       |       |       | 100%  |
| 2 |       | 90.0% | 80.0% | 70.0% | 60.0% | 50.0% | 40.0% | 30.0% |
| 3 |       | 81.0% | 64.0% | 49.0% | 36.0% | 25.0% | 16.0% | 9.00% |
| 4 | 100%  | 72.9% | 51.2% | 34.3% | 21.6% | 12.5% | 6.40% | 2.70% |

(Only applicable to 3 - 5 star Lure SOS cards.)

### Interpretation

Being Lureless significantly devalues Lure SOS cards.

### Battle Simulations

- [Maxed Lure; Lil' Oldman; Level 12 cog](http://pastebin.com/pr9LVZZ8)
- [Lureless; Lil' Oldman; Level 12 cog](http://pastebin.com/q8Q51Fm3)

# V.P. <a name="vp"></a>

# C.F.O. <a name="cfo"></a>

## How was the C.F.O. reward chosen? <a name="cfo-1"></a>

### Hypothesis

The reward was chosen like so:

```python
resistanceMenu = [RESISTANCE_TOONUP, RESISTANCE_RESTOCK, RESISTANCE_MONEY]
menuIndex = random.choice(resistanceMenu)
itemIndex = random.choice(getItems(menuIndex))
```
So, the overall type (i.e., Toon-up) of the Unite was picked at random, then the subtype (i.e., +80) was picked at random.

### Interpretation

The reward was entirely pseudorandom; there was no way to predict which Unite would be won.

# C.J. <a name="cj"></a>

# C.E.O. <a name="ceo"></a>

# Misc <a name="misc"></a>
[[back to top](#contents)]

## Do some Shopkeepers sell more accurate gags? <a name="misc-1"></a>

### Hypothesis

No, there's no evidence that Shopkeepers had any impact on gag accuracy.

# Global Values <a name="global-values"></a>
[[back to top](#contents)]

## Battle Constants <a name="battle-constants"></a>


# Credits <a name="credits"></a>
[[back to top](#contents)]


