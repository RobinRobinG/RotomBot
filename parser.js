const fs = require('fs');
const cheerio = require('cheerio');
const file = fs.readFileSync('./data/pokemon.xml', 'utf-8');
const xml = cheerio.load(file);

function getData(entities) {
    if (entities != null) {
        let subject = entities['subject'];
        if (subject != null) {
            let result = getSessionBySubject((subject instanceof Array) ? subject[0] : subject);
            return result;
        }
    }
    return [];
}
module.exports.getData = getData;

function getSessionBySubject(subject) {
    return writePoke(getPokeNodes('species', subject));
}

function getPokeNodes(s, t) {
    let pokemon = [];
    xml(s).each((idx, elem) => {
        if (xml(elem).text().toLowerCase().indexOf(t.toLowerCase()) > -1) {
            pokemon.push(elem.parent);
        }
    });
    return pokemon;
}

function writePoke(pokemon) {
    let results = [];
    for (let i = 0; i < pokemon.length; i++) {
        let elem = xml(pokemon[i]);
        let r = {
            species: elem.find('species').text(),
            dex: elem.find('dex').text(),
            types: elem.find('type').text().toLowerCase(),
            abilities: elem.find('ability').text().toLowerCase(),
            hiddenability: elem.find('dream').text(),
            HP: elem.find('HP').text(),
            attack: elem.find('ATK').text(),
            defense: elem.find('DEF').text(),
            speed: elem.find('SPD').text(),
            spattack: elem.find('SATK').text(),
            spdefense: elem.find('SDEF').text(),
            experience: elem.find('experience').text(),
            ratetype: elem.find('rateType').text().toLowerCase()
        };
        results.push(r);
    }
    return results;
}
