
const readline = require('readline');
const axios = require('axios');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const drawCard = async () => {
    try {
        const response = await axios.get(`https://localhost:9090/get-card`);
        const card = response;
        return card;
    } catch (error) {
        console.error('Error drawing card:', error);
        return null;
    }
};

const deal = async() => {

    let player = [];
    let dealer = [];

    for(let i = 0; i < 2 ; i++ ){

        player.push(await drwaCard());
        dealer.push(await drwaCard());
    }
}

function calculateHandTotal(hand) {
    let total = 0;
    let aceCount = 0;

    // Loop through each card to calculate its value.
    hand.forEach(card => {
        // Extract the rank from the card string.
        let rank = card.slice(0, card.length - 1); // For '10H' this returns '10', for 'AS' returns 'A'

        if (['J', 'Q', 'K'].includes(rank)) {
            // Face cards are worth 10.
            total += 10;
        } else if (rank === 'A') {
            // Count Ace as 11 for now and increment ace counter.
            total += 11;
            aceCount++;
        } else {
            // For numeric cards, convert the rank to a number.
            total += parseInt(rank);
        }
    });

    // Adjust for Aces if total is greater than 21.
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount--;
    }

    return total;
}