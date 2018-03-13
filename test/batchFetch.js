'use strict';

const TEST_PIPEFY_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjoxNDUwMTYsImVtYWlsIjoibWluZGd1dHRlckBnbWFpbC5jb20iLCJhcHBsaWNhdGlvbiI6NDc2NX19.adUu_ASSsoDj4sYXYgaVO9zT2p-Lbe-1GiuMhpV1G--MvcsSRgX5nKEAWTR6m3gdsVezBVsGp36TO8Bj7FdQbQ';

const expect = require('chai').expect;
const pipefy = require('../index')({
    accessToken: TEST_PIPEFY_TOKEN, logLevel: 'debug'
});

const randomWord = require('random-word');

const USER_ID = 145016;
const TEST_ORG_NAME = "Batch Fetch Test";
const TEST_PIPE_NAME = "FetchPipe";
const FIRST_PHASE_NAME = "FIRST";
const SECOND_PHASE_NAME = "SECOND";
const LAST_PHASE_NAME = "LAST";
const TEST_FIELD_NAME = "test-field";

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
            const cardTitle = "1." + i;
            const result = await pipefy.createCard({pipe_id:PIPE_ID, phase_id:FIRST_PHASE_ID, title:cardTitle, fields_attributes: [{field_id:TEST_FIELD_ID, field_value:randomWord()}]});
            //console.log(result.data.createCard.card.id + "-" + result.data.createCard.card.title);
            const cardString = result.data.createCard.card.id + "-" + result.data.createCard.card.title + " in phase: " + FIRST_PHASE_NAME;
            CARD_DECK[i]=cardString;
        }

        //put cards in the second phase of the pipe
        for (var i=0; i < SECOND_PHASE_CARD_COUNT; i++){
            const cardTitle = "2."+ i;
            const result = await pipefy.createCard({pipe_id:PIPE_ID, phase_id:SECOND_PHASE_ID, title:cardTitle});
            //console.log(result.data.createCard.card.id + "-" + result.data.createCard.card.title);
            const cardString = result.data.createCard.card.id + "-" + result.data.createCard.card.title + " in phase: " + SECOND_PHASE_NAME;
            CARD_DECK[FIRST_PHASE_CARD_COUNT+i]=cardString;
        }
    });

    after ( async () => {
        var result = await pipefy.deleteOrganization(ORGANIZATION_ID);
    });


    describe('#getCardCountFromPhase', () => {
        it('should return ' + FIRST_PHASE_CARD_COUNT + ' card count', async () => {
            const count = await pipefy.getCardCountFromPhase(FIRST_PHASE_ID);
            expect(count).to.equals(count,FIRST_PHASE_CARD_COUNT);
        });
    });

    describe('#getAllCardsFromFirsthPhase', () => {
        it('should return ' + FIRST_PHASE_CARD_COUNT + ' cards from phase ' + FIRST_PHASE_NAME + ' in pipe '+ TEST_PIPE_NAME, async () => {
            const cards = await pipefy.getAllCardsFromPhase(FIRST_PHASE_ID, CARDS_BATCH_SIZE);
            expect(cards.length).to.equals(FIRST_PHASE_CARD_COUNT,cards.length);
        });
    });

    describe('#getAllCardsFromSecondPhase', () => {
        it('should return ' + SECOND_PHASE_CARD_COUNT + ' cards from phase ' + SECOND_PHASE_NAME + ' in pipe '+ TEST_PIPE_NAME, async () => {
            const cards = await pipefy.getAllCardsFromPhase(SECOND_PHASE_ID, CARDS_BATCH_SIZE);
            expect(cards.length).to.equals(SECOND_PHASE_CARD_COUNT,cards.length);
        });
    });

    describe('#getCardCountFromPipe', () => {
        it('should return ' + TOTAL_CARD_COUNT  + ' card count', async () => {
            const count = await pipefy.getCardCountFromPipe(PIPE_ID);
            expect(count).to.equals(count,TOTAL_CARD_COUNT);
        });
    });

    describe('#getAllCardsFromPipe', () => {
        it('should return ' + TOTAL_CARD_COUNT + ' cards from pipe ' + TEST_PIPE_NAME, async () => {
            const cards = await pipefy.getAllCardsFromPipe(PIPE_ID, CARDS_BATCH_SIZE);
            const fetchDeck = [cards.length];
            for (var i=0; i < cards.length; i++){
                fetchDeck[i] = cards[i].node.id + "-" + cards[i].node.title + " in phase: " + cards[i].node.current_phase.name;
            }
            console.debug("==========RETURNED " + cards.length + " CARDS==================");
            console.debug(fetchDeck);
            console.debug("==========CREATED " + CARD_DECK.length + " CARDS=================");
            console.debug(CARD_DECK);

            expect(fetchDeck).to.have.deep.members(CARD_DECK);
            expect(cards.length).to.equals(TOTAL_CARD_COUNT);
        });
    });

});

