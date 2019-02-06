'use strict';

const expect = require('chai').expect;
const pipefy = require('../index')({
    accessToken: TEST_PIPEFY_TOKEN, logLevel: 'debug'
});

const randomWord = require('random-word');

const config = require('../../config/local.js');

const pipefy = require('../index')({
    accessToken: config.pipefy.API_KEY, logLevel: 'debug'
});

const USER_ID = config.pipefy.USER_ID;

const TEST_ORG_NAME = randomWord();
const TEST_PIPE_NAME = randomWord();
const FIRST_PHASE_NAME = randomWord()+"_FIRST";
const SECOND_PHASE_NAME = randomWord()+"_SECOND";
const LAST_PHASE_NAME = randomWord()+"_LAST";
const TEST_FIELD_NAME = randomWord();

let ORGANIZATION_ID, PIPE_ID, FIRST_PHASE_ID, SECOND_PHASE_ID, LAST_PHASE_ID, TEST_FIELD_ID;

const FIRST_PHASE_CARD_COUNT = 6;
const SECOND_PHASE_CARD_COUNT = 6;
const TOTAL_CARD_COUNT = FIRST_PHASE_CARD_COUNT + SECOND_PHASE_CARD_COUNT;
const CARD_DECK = [TOTAL_CARD_COUNT];
const CARDS_BATCH_SIZE = 1;

describe('batches', () => {

    before ( async () => {
        var result = await pipefy.createOrganization({industry: 'technology', name: TEST_ORG_NAME});

        ORGANIZATION_ID = result.data.createOrganization.organization.id;

        result = await pipefy.createPipe({
            organization_id: ORGANIZATION_ID,
            name: TEST_PIPE_NAME,
            labels: [{
                name: 'Single Label',
                color: '#FF0044'
            }],
            members: [{
                user_id: USER_ID,
                role_name: 'admin'

            }],
            phases: [
                {name: FIRST_PHASE_NAME, done: false},
                {name: SECOND_PHASE_NAME, done: false},
                {name: LAST_PHASE_NAME, done:true}
            ],
            start_form_fields: [{
                label: TEST_FIELD_NAME,
                type_id: 'short_text'
            }]
        });
        PIPE_ID = result.data.createPipe.pipe.id;
        var phase;
        for (phase of result.data.createPipe.pipe.phases){
            if (phase.name == FIRST_PHASE_NAME) FIRST_PHASE_ID = phase.id;
            if (phase.name==SECOND_PHASE_NAME) SECOND_PHASE_ID = phase.id;
            if (phase.name==LAST_PHASE_NAME) LAST_PHASE_ID=phase.id;
        }

        TEST_FIELD_ID = result.data.createPipe.pipe.start_form_fields[0].id;

        //put cards in the first phase of the pipe
        for (var i=0; i < FIRST_PHASE_CARD_COUNT; i++){
            const result = await pipefy.createCard({pipe_id:PIPE_ID, phase_id:FIRST_PHASE_ID, title:randomWord(), fields_attributes: [{field_id:TEST_FIELD_ID, field_value:randomWord()}]});
            //console.log(result.data.createCard.card.id + "-" + result.data.createCard.card.title);
            const cardString = result.data.createCard.card.id + "-" + result.data.createCard.card.title + " in phase: " + FIRST_PHASE_NAME;
            CARD_DECK[i]=cardString;
        }

        //put cards in the second phase of the pipe
        for (var i=0; i < SECOND_PHASE_CARD_COUNT; i++){
            const result = await pipefy.createCard({pipe_id:PIPE_ID, phase_id:SECOND_PHASE_ID, title:randomWord()});
            //console.log(result.data.createCard.card.id + "-" + result.data.createCard.card.title);
            const cardString = result.data.createCard.card.id + "-" + result.data.createCard.card.title + " in phase: " + SECOND_PHASE_NAME;
            CARD_DECK[FIRST_PHASE_CARD_COUNT+i]=cardString;
        }
    });

    describe('#cloneCard', () => {
        it('should clone a card', async () => {
            const cards = await pipefy.getAllCardsFromPipe(PIPE_ID);
            //clone first card
            const CLONE_COUNT = 1;
            for (let i = 0; i < CLONE_COUNT; i++){
                const result = await pipefy.cloneCard(cards[i].node.id);
                expect(result).to.have.deep.property('data.createCard.card');
                expect(card[i]).to.have.deep.members(result.data.createCard.card);
            }
        });
    });

    after ( async () => {
        var result = await pipefy.deleteOrganization(ORGANIZATION_ID);
    });




});

