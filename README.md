Video Poker Sim
===============

At the casino the other night I learned my parents-in-law's video poker strategy.

I won't explain the rules of 5 card draw poker here but here's the basis of video poker in a casino setting: Money goes in to earn credits (where a credit is the size of one bet). You get odds, or payouts, for various hands and depending on the size of one credit and on how many credits you're betting on a single hand. For this exercise a player can bet up to five credits on one hand to generate better payouts.

The strategy goes like this:
 * Make sure you have a payout of at least 2 for two pair and 1 (your money back) for jacks or better
 * Play single bet until you get paid (two pair or better)
 * Max bet immediately after getting paid for one hand, then return to single betting
 * End the session when hitting four of a kind or better, regardless of bankroll

This stategy is not designed to make any serious money. The intent is to preserve one's bankroll and steadily build to a set breaking point, thus allowing one to just have fun playing some poker for a while. The anecdotal evidence is that this works reasonably well over time.

In playing three sessions by the rules it worked for me to turn the $20 I put in to $35 in about an hour. That positive data point was enough to try again sometime, as well as to model basic video poker to run simulated sessions for a bit of analysis.

Current Status
--------------

Loading the index page seeds the bankroll with 100 credits. It then runs 10,000 hands but will quit when bankrupt (obviously) or when a double-digit payout hand hits (per the strategy). It's also currently tuned to max bet (flat 5x bet) only on hands immediately after hands that payout 2 or more, and will always revert back to a single bet after one max bet regardless of hand.

One can now reload the index a bunch of times to see a scenario play out in full. Final bankroll and hands played are reported at the top. Multiple runs show plenty of bankruptcies but a very favorable amount of winning scenarios.

TODO
----

 * Automatically run multiple sessions in sucsession.
 * Log and plot multiple sessions to analyze statistical probability of outcomes.
 * Create a profiler to operate on a set of sessions for a given strategy to report on areas of interest.
 * Verify payouts with video poker machines accessible in the real world.

Areas of Interest
-----------------

 * What is the distribution of final bankrolls?
   * As a function of starting bankroll?
 * What is the distribution of hands played for all outcomes?
   * For bankruptcy vs. partial loss vs. payout?
   * Is there a cutoff point (function of bankroll relative to start and/or hands played) at which it makes sense to end?
 * For sessions that end in bankruptcy what is the distribution of maximum bankroll achieved during the session?
 * For sessions that end in payout what is the distribution of minimum bankroll achieved during the session?
