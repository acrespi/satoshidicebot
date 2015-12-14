secretBox = document.getElementById("SecretBox");
maxLossStreak = document.getElementById("MaxLossStreak");
balanceForStop = document.getElementById("BalanceForStop");
betBox = document.getElementById("BetBox");
bankrollArea = document.getElementById("Bankroll");
earningsArea = document.getElementById("Earnings");
rollCountArea = document.getElementById("Rollcount");
maxLossStreakArea = document.getElementById("MaxLossStreakArea");
rollBelow = document.getElementById("RollBelow");
multiplier = document.getElementById("Multiplier");
probability = document.getElementById("Probability");
earningsArea.value = 0;
rollCountArea.value = 0;
maxLossStreakArea.value = 0;
roundId = "empty";
roundHash = "empty";
lossStreak = 0;
maxStreak = 0;
userBalance = 1000000;
forceStop = 0;
rollCount = 0;
totalWagered = 0;
earnings = 0;
	
function getBalance() {

secretVal = secretBox.value;

    $.getJSON('https://session.satoshidice.com/userapi/userbalance/?secret='+secretVal+'&callback=?', function(data) {
        bankrollArea.value = data.balanceInSatoshis;

    });  //data is the JSON string
}

function placeBet() {

    roundId = "empty";
    roundHash = "empty";
	betAmount = Math.round(betBox.value);
	secretVal = secretBox.value;	

    $.getJSON('https://session.satoshidice.com/userapi/startround.php?secret='+secretVal+'&callback=?',
              function(data) {
                  roundId = data.id;
                  roundHash = data.hash;

                  $.getJSON('https://session.satoshidice.com/userapi/placebet.php?secret='+secretVal+'&betInSatoshis='+betAmount+'&id='+roundId+'&serverHash='+roundHash+'&clientRoll=3245&belowRollToWin='+rollBelow.value+'&callback=?',
                            function(round) {
                                
							if ( round.bet.result == "loss" ) {
								color = 'red';
                            } else {
								color = 'green';
                            }
                            $("ul").prepend("<li id='" + roundId + "'> <font color="+ color +"> Single bet: " + round.bet.result + " , Payout: "+round.bet.payoutInSatoshis+" , Streak: "+round.bet.streak+" , Result: "+round.resultingRoll+"</li>");

                            bankrollArea.value = round.userBalanceInSatoshis;
                            });
              });

}

function runBot() {

    betAmount = Math.round(betBox.value);
	secretVal = secretBox.value;	

	roundId = "empty";
    roundHash = "empty";
    lossStreak = 0;
    userBalance = bankrollArea.value;
    forceStop = 0;
    rollCount = 0;

    $.getJSON('https://session.satoshidice.com/userapi/startround.php?secret='+secretVal+'&callback=?',
              function(data) {
                  roundId = data.id;
                  roundHash = data.hash;

                    $.getJSON('https://session.satoshidice.com/userapi/placebet.php?secret='+secretVal+'&betInSatoshis='+betAmount+'&id='+roundId+'&serverHash='+roundHash+'&clientRoll=3245&belowRollToWin='+rollBelow.value+'&callback=?',
                                    function(round) {

                                        rollCount++;
                                        roundId = round.nextRound.id;
                                        roundHash = round.nextRound.hash;

                                        if ( round.bet.result == "loss" ) {
                                            lossStreak++;
                                            betAmount = Math.round(betAmount * multiplier.value);
											color = 'red';
                                        } else {
                                            lossStreak = 0;
                                            betAmount = Math.round(betBox.value);
											color = 'green';
                                        }

                                        $("ul").prepend("<li id='" + roundId + "'> <font color="+ color +">"+ rollCount + ":" + round.bet.result + " , Next bet: "+betAmount+" , Payout: "+round.bet.payoutInSatoshis+" , Streak: "+round.bet.streak+" , Result: "+round.resultingRoll+"</font></li>");
                                          

                                        bankrollArea.value = round.userBalanceInSatoshis;
                                        userBalance = round.userBalanceInSatoshis;
										totalWagered = totalWagered + round.bet.betInSatoshis;
										earnings = earnings + round.bet.payoutInSatoshis;
										updateScore();
										runBotInternal();
                                    });
              });

}

function runBotInternal() {

secretVal = secretBox.value;	
                    if ((forceStop != 1) && ( lossStreak < maxLossStreak.value ) && (userBalance < balanceForStop.value) && (userBalance > betAmount)) {
                      
                          $.getJSON('https://session.satoshidice.com/userapi/placebet.php?secret='+secretVal+'&betInSatoshis='+betAmount+'&id='+roundId+'&serverHash='+roundHash+'&clientRoll=3245&belowRollToWin='+rollBelow.value+'&callback=?',
                                    function(round) {

                                        rollCount++;
                                        roundId = round.nextRound.id;
                                        roundHash = round.nextRound.hash;

                                        if ( round.bet.result == "loss" ) {
                                            lossStreak++;
											if (lossStreak > maxStreak ) {
												maxStreak = lossStreak;
											}
                                            betAmount = Math.round(betAmount * multiplier.value);
											color = 'red';
                                        } else {
                                            lossStreak = 0;
                                            betAmount = Math.round(betBox.value);
											color = 'green';
                                        }

                                        $("ul").prepend("<li id='" + roundId + "'> <font color="+ color +">"+ rollCount + ":" + round.bet.result + " , Next bet: "+betAmount+" , Payout: "+round.bet.payoutInSatoshis+" , Streak: "+round.bet.streak+" , Result: "+round.resultingRoll+"</font></li>");
                                         

                                        bankrollArea.value = round.userBalanceInSatoshis;
                                        userBalance = round.userBalanceInSatoshis;
										totalWagered = totalWagered + round.bet.betInSatoshis;
										earnings = earnings + round.bet.payoutInSatoshis;
										updateScore();
										if ( lossStreak >= maxLossStreak.value ) {
											runBot();
										} else {
											runBotInternal();
										}
                                    });
					}
                      
}

function updateScore() {
	earningsArea.value = earnings - totalWagered;
	rollCountArea.value = rollCount;
	maxLossStreakArea.value = maxStreak;
}

function calculateMultiplier() {

	multiplier.value = 1/(1 - (rollBelow.value/64000));
	probability.value = (rollBelow.value/65535)*100;

}

function calculateRollBelow() {

	rollBelow.value = (64000-64000*multiplier.value)/(-multiplier.value);
	probability.value = (rollBelow.value/65535)*100;
}

function calculateProbability() {

	probability.value = (rollBelow.value/65535)*100;
}

function stopBot() {

	forceStop = 1;
}


betAmount = betBox.value;
secretVal = secretBox.value;	
getBalance();
