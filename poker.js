// Augment the built-in Array object to use Math.max and Math.min
Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};

// Models of phsyical card stacks
var deck = new Array();
var hand = new Array();
var burn = new Array();

// Lokup tables to turn numerical values into ranks and suits
var ranks = new Array('.','.','2','3','4','5','6','7','8','9','10','J','Q','K','A');
var suits = new Array('&spades;','&clubs;','&diams;','&hearts;');

// Variables for evaluations
var sorted_hand  = new Array();
var hand_by_rank = new Array();
var hand_by_run  = new Array();
var hand_by_suit = new Array();
var hands = new Array();
var best_hand = -1;

// Odds: all hands and their respective payouts
var odds = new Array();

// Nothing: 0
odds.push({ name: 'Nothing',
            payout: 0,
            made: function () {
                return true;
            }
          });

// Nothing - low pair: 0
odds.push({ name: 'Nothing - low pair',
            payout: 0,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(2) <= 10);
            }
          });

// Nothing - 4 legs of straight with outside draws: 0
odds.push({ name: 'Nothing - 4 legs of straight with outside draws',
            payout: 0,
            made: function () {
                return (hand_by_run.indexOf(4) > -1)
            }
          });

// Nothing - 4 legs of flush: 0
odds.push({ name: 'Nothing - 4 legs of flush',
            payout: 0,
            made: function () {
                return (hand_by_suit.max() == 4);
            }
          });

// Jacks or Better: 1
odds.push({ name: 'Jacks or Better',
            payout: 1,
            made: function () {
                return (hand_by_rank.indexOf(2) >= 11);
            }
          });

// Two Pair	2
odds.push({ name: 'Two Pair',
            payout: 2,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(2) != hand_by_rank.lastIndexOf(2));
            }
          });

// Three of a Kind: 3
odds.push({ name: 'Three of a Kind',
            payout: 3,
            made: function () {
                return (hand_by_rank.indexOf(3) > -1);
            }
          });

// Straight: 4
odds.push({ name: 'Straight',
            payout: 6,
            made: function () {
                var hasNormal = ((hand_by_rank.lastIndexOf(1) - hand_by_rank.indexOf(1)) == 4 && hand_by_rank.max() == 1);
                var hasWheel  = (hand_by_rank[2] == 1 && hand_by_rank[3] == 1 && hand_by_rank[4] == 1 && hand_by_rank[5] == 1 && hand_by_rank[14] == 1);
                return (hasNormal || hasWheel);
            }
          });

// Flush: 6
odds.push({ name: 'Flush',
            payout: 6,
            made: function () {
                return (hand_by_suit.max() == 5);
            }
          });

// Full House: 8
odds.push({ name: 'Full House',
            payout: 8,
            made: function () {
                return (hand_by_rank.indexOf(2) > -1 && hand_by_rank.indexOf(3) > -1);
            }
          });

// Four 5s thru Ks: 25
odds.push({ name: 'Four 5s thru Ks',
            payout: 25,
            made: function () {
                return (hand_by_rank.indexOf(4) >= 5 && hand_by_rank.indexOf(4) <= 13);
            }
          });

// Four 2s, 3s, 4s: 40
odds.push({ name: 'Four 2s, 3s, 4s',
            payout: 40,
            made: function () {
                return (hand_by_rank.indexOf(4) >= 2 && hand_by_rank.indexOf(4) <= 4);
            }
          });

// Four Aces: 80
odds.push({ name: 'Four Aces',
            payout: 80,
            made: function () {
                return (hand_by_rank.indexOf(4) == 14);
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
            }
          });

// Royal Flush: 800
odds.push({ name: 'Royal Flush',
            payout: 800,
            made: function () {
                var hasStraight = ((hand_by_rank.lastIndexOf(1) - hand_by_rank.indexOf(1)) == 4 && hand_by_rank.max() == 1);
                var hasFlush    = (hand_by_suit.max() == 5);
                return (hasStraight && hasFlush && (hand_by_rank.lastIndexOf(1) == 14));
            }
          });


function buildDeck() {
    for (var s = 0; s <= 3; s++){
        for (var v = 2; v <= 14; v++){
            var c = { rank: v, suit: s }
            deck.push(c);
        }
    }
}

function shuffle(o){
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function resetHand(){
    resetEvaluations();
    // Burn whatever's in the hand
    if (hand.length){
        var len = hand.length;
        for (var h = 0; h < len; h++){
            burn.push(hand.pop());
        }
    }
}

function resetEvaluations(){
    sorted_hand  = new Array();
    hand_by_rank = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    hand_by_run  = new Array(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    hand_by_suit = new Array(0,0,0,0);
    hands = new Array();
    hands[0]  = 0;
    best_hand = 0;
}

function deal(){
    resetHand();
/*
    hand.push({ rank: 4, suit: 0 });
    hand.push({ rank: 3, suit: 0 });
    hand.push({ rank: 2, suit: 3 });
    hand.push({ rank: 11, suit: 2 });
    hand.push({ rank: 5, suit: 0 });
*/
    // Fill the hand. If the deck runs empty shuffle the discard and continue.
    for (var h = 0; h < 5; h++){
        if (!deck.length){
            deck = burn;
            burn = new Array();
            shuffle(deck);
        }
        hand.push(deck.pop());
    }
}

function displayCard(card){
    return '<font color="' + (card.suit < 2 ? 'black' : 'red') + '"><b>'
           + ranks[card.rank]
           + suits[card.suit]
           + '</b></font>';
}

function evaluateHand(){
    resetEvaluations();
    // First sort the hand by rank ascending
    sorted_hand = hand;
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
