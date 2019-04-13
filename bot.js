// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes } = require('botbuilder');
// const Parser = require('./parser-csv');
const Card = require('./card');
const PokemonData = require('./data/pokemon.json');

class MyBot {
    /**
     * The LuisBot constructor requires one argument (`application`) which is used to create an instance of `LuisRecognizer`.
     * @param {LuisApplication} luisApplication The basic configuration needed to call LUIS. In this sample the configuration is retrieved from the .bot file.
     * @param {LuisPredictionOptions} luisPredictionOptions (Optional) Contains additional settings for configuring calls to LUIS.
     */
    constructor(qnaServices, luisRecognizer) {
        this._qna = qnaServices;
        this._luis = luisRecognizer;
    }
    /**
     * Every conversation turn calls this method.
     * There are no dialogs used, since it's "single turn" processing, meaning a single request and
     * response, with no stateful conversation.
     * @param {TurnContext} turnContext A TurnContext instance, containing all the data needed for processing the conversation turn.
     */
    async onTurn(turnContext) {
        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        if (turnContext.activity.type === ActivityTypes.Message && !turnContext.responded) {
            for (let i = 0; i < this._qna.length; i++) {
                const qnaResults = await this._qna[i].getAnswers(turnContext);
                // console.log(`qnaResults:`, qnaResults);
                if (qnaResults.length > 0 && qnaResults[0].score > 0.65) {
                    await turnContext.sendActivity(qnaResults[0].answer);
                    return;
                } else {
                    const luisResults = await this._luis.recognize(turnContext);
                    // console.log(luisResults.entities.subject[0]);
                    const topIntent = luisResults.luisResult.topScoringIntent;
                    // console.log('topIntent', topIntent);
                    let pokeData = await findPokemon(PokemonData, luisResults.entities.subject[0]);
                    // console.log('pokemonData', pokeData);
                    if (pokeData) {
                        if (topIntent.intent === 'Pokemon') {
                            await turnContext.sendActivity(Card.createCard([pokeData]));
                        } else if (topIntent.intent === 'Types') {
                            if (pokeData.type.length > 1) {
                                await turnContext.sendActivity(`${ luisResults.entities.subject }'s types are ${ pokeData.type[0] } and ${ pokeData.type[1] }.`);
                            } else {
                                await turnContext.sendActivity(`${ luisResults.entities.subject }'s type izzz ${ pokeData.type[0] }, zzzzt!`);
                            }
                        } else if (topIntent.intent === 'HP') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s HP izzz ${ pokeData.base.HP }.`);
                        } else if (topIntent.intent === 'Attack') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s attack izz ${ pokeData.base.Attack }, zzzz-zzt!`);
                        } else if (topIntent.intent === 'Defense') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s defense izzz ${ pokeData.base.Defense }`);
                        } else if (topIntent.intent === 'Speed') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s speed izzz ${ pokeData.base.Speed }.`);
                        } else if (topIntent.intent === 'SpAttack') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s special attack izz ${ pokeData.base['Sp.Atk'] }, zzzz-zzt`);
                        } else if (topIntent.intent === 'SpDefense') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s special defense izzz ${ pokeData.base['Sp.Def'] }.`);
                        } else if (topIntent.intent === 'Chinese') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s chinese name izzz ${ pokeData.name.chinese }. Zzzz-zzt!`);
                        } else if (topIntent.intent === 'Japanese') {
                            await turnContext.sendActivity(`${ luisResults.entities.subject }'s japanese name izzz ${ pokeData.name.japanese }. Zzzz-zzt!`);
                        } else if (topIntent.intent === 'Legendary') {
                            if (pokeData.Legendary === true) {
                                await turnContext.sendActivity(`Zzzz-zzt. ${ luisResults.entities.subject } izzz a legendary pokemon! Zz-zz-zz!`);
                            } else {
                                await turnContext.sendActivity(`I am sorry! ${ luisResults.entities.subject } izzz not a legendary pokemon. zzz-bzzzt.`);
                            }
                        } else {
                            await turnContext.sendActivity(`Bzzzz, sorry, I'm not a psychic type, I couldn't figure out what you meant.`);
                        }
                    } else {
                        // If the top scoring intent was "None" tell the user no valid intents were found and provide help.
                        await turnContext.sendActivity(`Bzzzz, sorry, I'm not a psychic type, I couldn't figure out what you meant.`);
                        return;
                    }
                }
            }

            // await turnContext('No QnA Maker answers were found. ' +
            // 'This example uses a QnA Maker Knowledge Base that focuses on smart light bulbs. ' +
            // `Ask the bot questions like "Why won't it turn on?" or "I need help."`);
        } else if (turnContext.activity.type === ActivityTypes.ConversationUpdate &&
            turnContext.activity.recipient.id !== turnContext.activity.membersAdded[0].id) {
            // If the Activity is a ConversationUpdate, send a greeting message to the user.
            await turnContext.sendActivity('Zzzzt..Alola!! Nice to meet you, pal! I am Rotom Pokedex! I know everything about pokemon. If you need some help, give me a little poke! Zz-zzt!');
        } else if (turnContext.activity.type !== ActivityTypes.ConversationUpdate) {
            // Respond to all other Activity types.
            await turnContext.sendActivity(`[${ turnContext.activity.type }]-type activity detected.`);
        }
    }
}
module.exports.MyBot = MyBot;

function findPokemon(arr, name) {
    let idx = arr.findIndex(val => val.name.english.toLowerCase() === name.toLowerCase());
    if (idx > -1) {
        return arr[idx];
    }
}
