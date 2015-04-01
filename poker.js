/*************************************************************************

  VIDEO POKER SIM
  ===============

  This file contains the core JavaScript for basic five card draw poker.
  

*************************************************************************/

"use strict";

// Augment the built-in Array object to use Math.max and Math.min
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

// Augment Math object to have median and mean functions
Math.median = function(array) {
  for (var i = array.length-1; i >= 0; i--) {
    if (array[i] !== +array[i]) array[i] = Number.NEGATIVE_INFINITY;
  }
  var numA = function(a, b){ return (a-b); };
  array.sort(numA);
  while (array.length > 1 && !isFinite(array[0])) array.shift();
  return array[Math.floor(array.length/2)];
}

Math.mean = function(array) {
  if (!array.length) return 0;
  var sum = 0;
  for (var i = 0; i < array.length; i++) {
    sum += array[i];
  }
  return sum / array.length;
}

// Models of phsyical card stacks
var deck = new Array();
var hand = new Array();
var burn = new Array();

// Lookup tables to turn numerical values into ranks and suits
var ranks = new Array('.','.','2','3','4','5','6','7','8','9','10','J','Q','K','A');
var suits = new Array('&spades;','&clubs;','&diams;','&hearts;');

// Variables for state and evaluations
var state = 'deal';
var sorted_hand  = new Array();
var hand_by_rank = new Array();
var hand_by_run  = new Array();
var hand_by_suit = new Array();
var hands = new Array();
var hold  = new Array(0,0,0,0,0);
var best_hand = 0;

/******************************************************************************

  Odds: An array of objects representing all types of hands.
        Each hand has a name, a payout value (in credits), and two methods:

        * made() - given the current hand, can we make this type of hand?
        * hold() - hold the cards necessary to make this type of hand

  Note that ALL types of hands must be represented for a complete model of the
  game, including all types of incomplete hands (like four legs of a flush),
  and nothing entirely, so that all possible five card hands match one of the
  objects in the odds array.

******************************************************************************/
var odds = new Array();

// Nothing: 0
odds.push({ name: 'Nothing',
            payout: 0,
            made: function () {
                return true;
            },
            hold: function () {
                return;
            }
          });

// Nothing - high card: 0
odds.push({ name: 'Nothing - high card',
            payout: 0,
            made: function () {
                return (hand_by_rank.lastIndexOf(1) >= 11);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank >= 11) ? 1 : 0;
                }
            }
          });

// Nothing - low pair: 0
odds.push({ name: 'Nothing - low pair',
            payout: 0,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(2) <= 10);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(2)) ? 1 : 0;
                }
            }
          });

// Nothing - 4 grouped straight legs: 0
odds.push({ name: 'Nothing - 4 grouped straight legs',
            payout: 0,
            made: function () {
                return (hand_by_run.indexOf(4) > -1)
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand_by_run[hand[h].rank] == 4) ? 1 : 0;
                }
            }
          });

// Nothing - 4 legs of flush: 0
odds.push({ name: 'Nothing - 4 legs of flush',
            payout: 0,
            made: function () {
                return (hand_by_suit.max() == 4);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].suit == hand_by_suit.indexOf(4)) ? 1 : 0;
                }
            }
          });

// Jacks or Better: 1
odds.push({ name: 'Jacks or Better',
            payout: 1,
            made: function () {
                return (hand_by_rank.indexOf(2) >= 11);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(2)) ? 1 : 0;
                }
            }
          });

// Two Pair	2
odds.push({ name: 'Two Pair',
            payout: 2,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(2) != hand_by_rank.lastIndexOf(2));
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(2) || hand[h].rank == hand_by_rank.lastIndexOf(2)) ? 1 : 0;
                }
            }
          });

// Three of a Kind: 3
odds.push({ name: 'Three of a Kind',
            payout: 3,
            made: function () {
                return (hand_by_rank.indexOf(3) > -1);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(3)) ? 1 : 0;
                }
            }
          });

// Straight: 4
odds.push({ name: 'Straight',
            payout: 6,
            made: function () {
                var hasNormal = ((hand_by_rank.lastIndexOf(1) - hand_by_rank.indexOf(1)) == 4 && hand_by_rank.max() == 1);
                var hasWheel  = (hand_by_rank[2] == 1 && hand_by_rank[3] == 1 && hand_by_rank[4] == 1 && hand_by_rank[5] == 1 && hand_by_rank[14] == 1);
                return (hasNormal || hasWheel);
            },
            hold: function () {
                hold = new Array(1,1,1,1,1);
            }
          });

// Flush: 6
odds.push({ name: 'Flush',
            payout: 6,
            made: function () {
                return (hand_by_suit.max() == 5);
            },
            hold: function () {
                hold = new Array(1,1,1,1,1);
            }
          });

// Full House: 8
odds.push({ name: 'Full House',
            payout: 8,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(3) > -1);
            },
            hold: function () {
                hold = new Array(1,1,1,1,1);
            }
          });

// Four 5s thru Ks: 25
odds.push({ name: 'Four 5s thru Ks',
            payout: 25,
            made: function () {
                return (hand_by_rank.indexOf(4) >= 5 && hand_by_rank.indexOf(4) <= 13);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(4)) ? 1 : 0;
                }
            }
          });

// Four 2s, 3s, 4s: 40
odds.push({ name: 'Four 2s, 3s, 4s',
            payout: 40,
            made: function () {
                return (hand_by_rank.indexOf(4) >= 2 && hand_by_rank.indexOf(4) <= 4);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(4)) ? 1 : 0;
                }
            }
          });

// Four Aces: 80
odds.push({ name: 'Four Aces',
            payout: 80,
            made: function () {
                return (hand_by_rank.indexOf(4) == 14);
            },
            hold: function () {
                for (var h = 0; h < hand.length; h++){
                    hold[h] = (hand[h].rank == hand_by_rank.indexOf(4)) ? 1 : 0;
                }
            }
          });


// Straight Flush: 55
odds.push({ name: 'Straight Flush',
            payout: 55,
            made: function () {
                var hasNormalStraight = ((hand_by_rank.lastIndexOf(1) - hand_by_rank.indexOf(1)) == 4 && hand_by_rank.max() == 1);
                var hasWheelStraight  = (hand_by_rank[2] == 1 && hand_by_rank[3] == 1 && hand_by_rank[4] == 1 && hand_by_rank[5] == 1 && hand_by_rank[14] == 1);
                var hasFlush    = (hand_by_suit.max() == 5);
                return ((hasNormalStraight || hasWheelStraight) && hasFlush);
            },
            hold: function () {
                hold = new Array(1,1,1,1,1);
            }
          });

// Royal Flush: 800
odds.push({ name: 'Royal Flush',
            payout: 800,
            made: function () {
                var hasStraight = ((hand_by_rank.lastIndexOf(1) - hand_by_rank.indexOf(1)) == 4 && hand_by_rank.max() == 1);
                var hasFlush    = (hand_by_suit.max() == 5);
                return (hasStraight && hasFlush && (hand_by_rank.lastIndexOf(1) == 14));
            },
            hold: function () {
                hold = new Array(1,1,1,1,1);
            }
          });

// Reset all stacks (deck, hand, and burn) and fill the deck with 52 cards
function buildDeck() {
    deck = new Array();
    hand = new Array();
    burn = new Array();
    for (var s = 0; s <= 3; s++){
        for (var v = 2; v <= 14; v++){
            var c = { rank: v, suit: s }
            deck.push(c);
        }
    }
}

// Shuffle the deck
function shuffle(o){
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

// Flush evaluations, and if there are any cards in the hand then move them to the burn
function resetHand(){
    resetEvaluations();
    if (hand.length){
        var len = hand.length;
        for (var h = 0; h < len; h++){
            burn.push(hand.pop());
        }
    }
}

// Initialize all variables used in evaluating what's in the hand
function resetEvaluations(){
    sorted_hand  = new Array();
    hand_by_rank = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    hand_by_run  = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    hand_by_suit = new Array(0,0,0,0);
    hands = new Array();
    hands[0]  = 0;
    best_hand = 0;
    hold = new Array(0,0,0,0,0);
}

// Draw one card into the hand from the deck.
// If the deck is empty, shuffle the burn and make it the new deck.
function drawOne(){
    var card = deck.pop();
    if (!deck.length){
        deck = burn.slice(0);
        burn = new Array();
        shuffle(deck);
    }
    return card;
}

// Fill the hand with five drawn cards
function deal(){
    resetHand();
    /* Use this approach to force a given hand on a deal (e.g. or testing hand detection)
    hand.push({ rank: 4, suit: 1 });
    hand.push({ rank: 12, suit: 3 });
    hand.push({ rank: 10, suit: 3 });
    hand.push({ rank: 11, suit: 3 });
    hand.push({ rank: 5, suit: 3 });
    */
    // Fill the hand. If the deck runs empty shuffle the discard and continue.
    for (var h = 0; h < 5; h++){
        hand.push(drawOne());
    }

}

// Burn any cards in the hand not marked to be held and replace them with new cards from the deck
function draw(){
    for (var h = 0; h < hand.length; h++){
        if (!hold[h]){
            var card = hand.splice(h,1,drawOne());
            burn.push(card[0]);
        }
    }
}

// Render a card by rank, suit, and color
function displayCard(card){
    return '<font color="' + (card.suit < 2 ? 'black' : 'red') + '"><b>'
           + ranks[card.rank]
           + suits[card.suit]
           + '</b></font>';
}

// This function attempts to determine the best hand
function evaluateHand(){
    resetEvaluations();
    // First sort the hand by rank ascending
    sorted_hand = hand.slice(0);
    sorted_hand.sort(function(a, b) { return a.rank > b.rank; });
    // Walk sorted array to populate hand_by_rank and hand_by_suit lookup arrays
    for (var h = 0; h < hand.length; h++){
        hand_by_rank[hand[h].rank]++;
        hand_by_suit[hand[h].suit]++;
        hand_by_run[hand[h].rank]++;
    }
    // Walk hand_by_rank to populate hand_by_run lookup array
    var run_length = 0;
    for (var j = 0; j < hand_by_rank.length; j++){
        if (hand_by_run[j] > 0){
            run_length++;
        } else {
            run_length = 0;
        }
        hand_by_run[j] = run_length;
        for (var k = 1; k < run_length; k++){
            hand_by_run[j-k] = run_length;
        }
    }
    // Walk through the odds levels to find which hands we have and which one is the best
    for (var o = 1; o < odds.length; o++){
        if (odds[o].made()){
            hands[o] = 1;
            best_hand = o;
        } else {
            hands[o] = 0;
        }
    }
}

