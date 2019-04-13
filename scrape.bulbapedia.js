
// https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number
// https://bulbapedia.bulbagarden.net/wiki/List_of_Japanese_Pok%C3%A9mon_names
// https://bulbapedia.bulbagarden.net/wiki/List_of_Chinese_Pok%C3%A9mon_names

// remind Ehtesh

const repl = require('repl');
const cheerio = require('cheerio');
const request = require('request');
const pretty = require('pretty');
// TODO run npm install pretty request --save

const englishPokedex = 'https://bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_by_National_Pok%C3%A9dex_number';

request(englishPokedex, function(error, response, body) {
    console.error('error:', error);
    console.log('statusCode:', response && response.statusCode);
    const parsed = cheerio.load(body);
    const pokemonMatches = parsed('#mw-content-text > table:nth-child(7) > tbody > tr');
    const pokemons = [];

    pokemonMatches.each(function(i, elem) {
        pokemons.push(parsed(this));
    });

    console.log(pretty(pokemons[1].html()));

    const r = repl.start('node > ');
    r.context.body = body;
    r.context.parsed = parsed;
    r.context.pokemons = pokemons;
});
// const rp = require('request-promise');
// const options = {
//   uri: englishPokedex,
//   transform: function (body) {
//       return cheerio.load(body);
//   }
// };
// const result = await rp(options);
