
const readline = require('readline');

const fetch = global.fetch || require('node-fetch');

const API_BASE_URL = 'http://localhost:9090';

function calculateHandTotal(hand) {
    let total = 0;
    let aceCount = 0;

    hand.forEach(card => {

        let rank = card.slice(0, card.length - 1);

        if (['J', 'Q', 'K'].includes(rank)) {
            total += 10;
        } else if (rank === 'A') {
            total += 11;
            aceCount++;
        } else {
            total += parseInt(rank);
        }
    });
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount--;
    }
    return total;
}

async function drawCard() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-card`);
        const data = await response.json();
        return data.card;
    } catch (error) {
        console.error('Error drawing card:', error);
        return null;
    }
}

async function shuffleDeck() {
    try {
        const response = await fetch(`${API_BASE_URL}/shuffle`);
        const data = await response.json();
        console.log(data.message);
    } catch (error) {
        console.error('Error shuffling deck:', error);
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => {
        rl.question(query, answer => {
            resolve(answer.trim());
        });
    });
}

async function playBlackjackFor2() {
    console.log('Welcome to Blackjack!');
    await shuffleDeck();

    let playerHand = [];
    let dealerHand = [];


    for (let i = 0; i < 2; i++) {
        const playerCard = await drawCard();
        if (playerCard) playerHand.push(playerCard);

        const dealerCard = await drawCard();
        if (dealerCard) dealerHand.push(dealerCard);
    }

    console.log(`Your cards: ${playerHand.join(', ')}`);
    console.log(`Dealer shows: ${dealerHand[0]}`); // Typically one dealer card is hidden.


    let playerTurn = true;
    while (playerTurn) {
        let playerTotal = calculateHandTotal(playerHand);
        console.log(`Your current total is: ${playerTotal}`);
    if (playerTotal > 21) {
            console.log('Bust! You exceed 21. You lose.');
            rl.close();
            return;
        }
        let choice = await askQuestion("Do you want to (h)it or (s)tand? ");
        if (choice.toLowerCase() === 'h' || choice.toLowerCase() === 'hit') {
            const card = await drawCard();
            if (card) {
                console.log(`You drew: ${card}`);
                playerHand.push(card);
            } else {
                console.log('No more cards available!');
                break;
            }
        } else if (choice.toLowerCase() === 's' || choice.toLowerCase() === 'stand') {

            playerTurn = false;
        } else {
            console.log('Invalid input. Please type "h" for hit or "s" for stand.');
        }
    }

    let playerTotal = calculateHandTotal(playerHand);
    console.log(`Your final total is: ${playerTotal}`);

    if (playerTotal <= 21) {
        console.log("Dealer's turn.");
        console.log(`Dealer's cards: ${dealerHand.join(', ')}`);

        let dealerTotal = calculateHandTotal(dealerHand);

        while (dealerTotal < 17) {
            console.log(`Dealer's total is ${dealerTotal}. Dealer hits.`);
            const card = await drawCard();
            if (card) {
                console.log(`Dealer drew: ${card}`);
                dealerHand.push(card);
            } else {
                console.log('No more cards available for the dealer!');
                break;
            }
            dealerTotal = calculateHandTotal(dealerHand);
        }
        console.log(`Dealer's final total is: ${dealerTotal}`);
        if (dealerTotal > 21) {
            console.log('Dealer busts! You win!');
        } else if (dealerTotal > playerTotal) {
            console.log('Dealer wins!');
        } else if (dealerTotal < playerTotal) {
            console.log('You win!');
        } else {
            console.log('Push (Draw)!');
        }
    }
    rl.close();
}

async function playBlackjack() {
    console.log('Welcome to Blackjack!');

    const numPlayers = parseInt(await askQuestion("Enter number of players (1-5): "));
    if (numPlayers < 1 || numPlayers > 5) {
        console.log('Invalid number of players. Please enter a number between 1 and 5.');
        rl.close();
        return;
    }

    await shuffleDeck();

    let players = [];
    for (let i = 0; i < numPlayers; i++) {
        const name = await askQuestion(`Enter name for player ${i + 1}: `);
        players.push({
            name,
            hand: [],
            score: 0
        });
    }

    let dealerHand = [];
    for (let i = 0; i < 2; i++) {
        // Draw a card for each player
        for (let player of players) {
            const card = await drawCard();
            if (card) player.hand.push(card);
        }

        // Draw a card for the dealer
        const dealerCard = await drawCard();
        if (dealerCard) dealerHand.push(dealerCard);
    }

    console.log(`Dealer's showing card: ${dealerHand[0]}`);

    // Each player's turn
    for (let player of players) {
        let playerTurn = true;
        console.log(`\n${player.name}'s turn:`);
        while (playerTurn) {
            let playerTotal = calculateHandTotal(player.hand);
            console.log(`${player.name}'s hand: ${player.hand.join(', ')} (Total: ${playerTotal})`);

            // If player busts, end their turn
            if (playerTotal > 21) {
                console.log(`${player.name} busts! Total exceeds 21.`);
                playerTurn = false;
                continue;
            }

            // Ask the player whether they want to hit or stand
            let choice = await askQuestion("Do you want to (h)it or (s)tand? ");
            if (choice.toLowerCase() === 'h' || choice.toLowerCase() === 'hit') {
                // Player chooses to hit
                const card = await drawCard();
                if (card) {
                    console.log(`${player.name} drew: ${card}`);
                    player.hand.push(card);
                } else {
                    console.log('No more cards available!');
                    break;
                }
            } else if (choice.toLowerCase() === 's' || choice.toLowerCase() === 'stand') {
                // Player stands
                playerTurn = false;
            } else {
                console.log('Invalid input. Please type "h" for hit or "s" for stand.');
            }
        }
    }

    console.log("\nDealer's turn:");
    let dealerTotal = calculateHandTotal(dealerHand);
    console.log(`Dealer's hand: ${dealerHand.join(', ')} (Total: ${dealerTotal})`);

    // Dealer must hit on less than 17
    while (dealerTotal < 17) {
        console.log(`Dealer hits!`);
        const card = await drawCard();
        if (card) {
            dealerHand.push(card);
            dealerTotal = calculateHandTotal(dealerHand);
            console.log(`Dealer drew: ${card}`);
        } else {
            console.log('No more cards available for the dealer!');
            break;
        }
    }
    console.log(`Dealer's final total: ${dealerTotal}`);

    // Determine the outcome for each player
    for (let player of players) {
        let playerTotal = calculateHandTotal(player.hand);
        console.log(`\n${player.name}'s final hand: ${player.hand.join(', ')} (Total: ${playerTotal})`);

        if (playerTotal > 21) {
            console.log(`${player.name} busts!`);
        } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
            console.log(`${player.name} wins!`);
        } else if (playerTotal < dealerTotal) {
            console.log(`${player.name} loses!`);
        } else {
            console.log(`${player.name} pushes (draw).`);
        }
    }

    rl.close();
}

playBlackjack();
