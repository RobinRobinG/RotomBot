const { MessageFactory, CardFactory, ActionTypes } = require('botbuilder');

function createCard(data) {
    const heroCards = [];
    for (let i = 0; i < data.length; i++) {
        heroCards.push(createHeroCard(data[i]));
    }
    return MessageFactory.carousel(heroCards);
}
module.exports.createCard = createCard;

function createHeroCard(data) {
    let dex = lpad(data['id'], 3);
    let types = pokeType(data.type);

    let img = `https://db.pokemongohub.net/images/official/detail/${ dex }.png`;
    let button = {
        type: ActionTypes.OpenUrl,
        title: 'Learn more...',
        value: `https://db.pokemongohub.net/pokemon/${ dex }`
    };
    let title = data.name.english;
    let text = `HP: ${ data.base.HP } | ATK: ${ data.base.Attack } | DEF: ${ data.base.Defense }
                Types: ${ types }
                Speed: ${ data.base.Speed }
                Sp Attack: ${ data.base['Sp.Atk'] } | Sp Defense: ${ data.base['Sp.Def'] }`;
    return CardFactory.thumbnailCard(title, text, [img], CardFactory.actions([button]));
}

function lpad(value, padding) {
    var zeroes = new Array(padding + 1).join('0');
    return (zeroes + value).slice(-padding);
}

function pokeType(types) {
    let results = [];
    for (let i of types) {
        results.push(i);
    }
    return results.join(' ');
}
