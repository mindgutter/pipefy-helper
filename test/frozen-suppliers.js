'use strict';

const PIPEFY_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjoxNDI3MzQsImVtYWlsIjoicGllZHBpcGVyQHNzY3RhMS5jb20iLCJhcHBsaWNhdGlvbiI6NDc3N319.0cEQkFkUhO1bxHBcqLjauqL31d8bJYBHOmhgMGmOM9T09yN7OiFcyMtJ8UcWuLE6rQ1WBzxESIstrwC9PKrusw';

const Fuse = require('fuse-js-latest');
const fs = require('fs');
const parseFullName = require('parse-full-name').parseFullName;

const pipefy = require('../index')({
    accessToken: PIPEFY_TOKEN, logLevel: 'debug'
});

const SUPPLIER_TABLE_ID = 'XMv9yFAu';
const PARTNER_REP_TABLE_ID = 'vj30csjd';
const POC_CONNECTION_ID = 21356;
const TEAMING_PIPE = 378470;
const FROZEN_LABEL_ID = "1564232";
let SUPPLIERS, PIPEFY_SUPPLIERS, PIPEFY_REPS, TEAMING_CARDS, CANDIDATES, CONTRACTORS, FROZEN_SUPPLIERS;


const FROZEN_SEARCH_OPTIONS = {
    id: "node.id",
    findAllMatches: true,
    threshold: 0,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 5,
    keys: [
        "node.labels.id"
    ]
};

const SUPPLIER_SEARCH_OPTIONS = {
    id: "node.id",
    shouldSort: true,
    tokenize: true,
    matchAllTokens: true,
    findAllMatches: true,
    includeScore: true,
    includeMatches: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 52,
    minMatchCharLength: 1,
    keys: [
        "node.record_fields.value"
    ]
};

const COMPANY_SEARCH_OPTIONS = {
    shouldSort: true,
    tokenize: true,
    matchAllTokens: true,
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 52,
    minMatchCharLength: 1,
    keys: [
        "Company"
    ]
};

const REP_SEARCH_OPTIONS = {
    id: "node.id",
    threshold: 0,
    location: 0,
    distance: 1000,
    maxPatternLength: 100,
    minMatchCharLength: 5,
    keys: [
        "node.record_fields.value"
    ]
};

const CONTRACTOR_SEARCH_OPTIONS = {
    id: "node.id",
    findAllMatches: true,
    threshold: 0,
    location: 0,
    distance: 1000,
    maxPatternLength: 100,
    minMatchCharLength: 5,
    keys: [
        "node.record_fields.array_value"
    ]
};


function loadJson(fileName) {
    return JSON.parse(fs.readFileSync(fileName, 'utf8'));
}

async function init(){
    FROZEN_SUPPLIERS = loadJson('nda/data/frozen.json');
    PIPEFY_SUPPLIERS = await pipefy.getTableRecords(SUPPLIER_TABLE_ID);
    PIPEFY_REPS = await pipefy.getTableRecords(PARTNER_REP_TABLE_ID);
    TEAMING_CARDS = await pipefy.getAllCardsFromPipe(TEAMING_PIPE);
    console.log('loaded ' + FROZEN_SUPPLIERS.length + ' suppliers');
}


async function createTeamingCards(suppliers){
    for (let supplier of suppliers) {
        let supplier_id, repId;
        let emails=[];
        let reps = [];

        //create supplier in DB
        const supplierSearch = findMatchingSupplier(supplier.Company);

        if (!isFound(supplierSearch)) {
            supplier_id = await createNewSupplier(supplier);
        } else {
            supplier_id = supplierSearch[0].item;
        }
        supplier["supplier_record_id"] = supplier_id;

        if (supplier.Emails && supplier.Emails.constructor != Array){
            emails.push(supplier.Emails);
        }else{
            console.log("Array of emails");
            emails = supplier.Emails;
        }

        for (let email of emails) {
            const repSearch = findRepByEmail(email);

            if (!isFound(repSearch)) {
                //create POC in DB
                repId = await createRep(supplier);
                reps.push(repId);
            } else {
                repId = repSearch[0];
                reps.push(repId);
            }
        }
        console.log("Reps",JSON.stringify(reps));

        const cardSearch = findCompanyCard(supplier.Company);

        if (!isFound(cardSearch)) {
            //create Card
            const cardId = await createSupplierCard(supplier, reps);
        }
    }
}

async function deleteFrozenCards(suppliers){
    const ALTAIR_ID = 5282798;
    const fuse = new Fuse(TEAMING_CARDS, FROZEN_SEARCH_OPTIONS);
    const frozenIds = fuse.search(FROZEN_LABEL_ID);

    for (let id of frozenIds){
        if (id!=ALTAIR_ID){
            const result = await pipefy.deleteCard(id);
            console.log(result);
        }
    }
}

async function createSupplierCard(supplier, reps){
    let cardParams = {
        pipe_id:TEAMING_PIPE,
        label_ids: [FROZEN_LABEL_ID],
        fields_attributes:[
            {field_id:"company_legal_name_1", field_value:supplier.Company},
            {field_id:"current_status", field_value:"Inactive"},
            {field_id:"onboarding_status", field_value:"Invitation sent"},
            {field_id:"who_is_the_poc_s", field_value:[reps]},
            {field_id:"company_details", field_value:supplier.supplier_record_id}
        ]
    }
    const result = await pipefy.createCard(cardParams);
    console.log(result);


    if (reps.length > 1){
        console.log("Multiple Reps");
    }

    for (let repId of reps){
        //make sure POC connection is made
        const repResult = await pipefy.createCardRelation({
            parentId: result.data.createCard.card.id,
            childId: repId,
            sourceId: POC_CONNECTION_ID,
            sourceType: "PipeRelation"
        });

        console.log(repResult);
    }


    return result.data.createCard.card.id;
}


function isFound(result){
    return result.length > 0;
}

function fieldValue(card, fieldName){
    for (let field of card.node.fields){
        if (field.field.id === fieldName){
            return field.value;
        }
    }
    return undefined;
}

function findCompanyCard(name){
    const fuse = new Fuse(TEAMING_CARDS, SUPPLIER_SEARCH_OPTIONS);
    const company = fuse.search(name);
    return company;
}


function findRepByEmail(email){
    if (email == undefined) return undefined;

    console.log("Looking for: " + email);
    const fuse = new Fuse(PIPEFY_REPS, REP_SEARCH_OPTIONS);
    let result = fuse.search(email);

    return result;
}

function findMatchingSupplier(supplierName){
    const fuse = new Fuse(PIPEFY_SUPPLIERS, SUPPLIER_SEARCH_OPTIONS);
    const result = fuse.search(supplierName);
    return result;
}

async function createRep(supplier){
    let ids = [];
    let emails = [];
    let names = [];

    if (supplier["Emails"].constructor === Array){
        emails = supplier["Emails"];
    }else{
        emails.push(supplier["Emails"]);
    }

    if (supplier["POC Name"] && supplier["POC Name"].constructor === Array){
        names = supplier["POC Name"];
    }else{
        names.push(supplier["POC Name"]);
    }

    for (let i = 0; i < emails.length; i++){
        const fullName = parseFullName(names[i]);
        const newRep = {
            table_id: PARTNER_REP_TABLE_ID,
            title: names[i],
            fields_attributes: [
                {field_id: "full_name", field_value: names[i]},
                {field_id: "preferred_first_name", field_value: fullName.first},
                {field_id: "email", field_value: emails[i]},
                {field_id: "status", field_value: "Active"},
                {field_id: "title", field_value: supplier.Position},
                {field_id: "company", field_value: supplier["supplier_record_id"]}
            ]
        }
        console.log(newRep);
        console.log("creating company rep: " + names[i] + " for company " + supplier["Company"]);
        const result = await pipefy.createTableRecord(newRep);

        ids.push(result.data.createTableRecord.table_record.id);
    }

    return ids;
}

/* Creates a new record in supplier table*/
async function createNewSupplier(supplier){
    const newSupplier = {
        table_id: SUPPLIER_TABLE_ID,
        title: supplier.Company,
        fields_attributes: [
            {field_id: "what", field_value: supplier.Company},
            {field_id: "is_direct_supplier", field_value:"No"},
            {field_id: "ssc_status", field_value:"Inactive"},
            {field_id: "city", field_value:supplier.City},
            {field_id: "state", field_value:supplier.State},
            {field_id: "country", field_value:supplier.Country}
        ]
    }
    console.log("Creating a new supplier DB record for: " + supplier.Company);
    const result = await pipefy.createTableRecord(newSupplier);
    return result.data.createTableRecord.table_record.id;

}



async function main(){
    await init();
    //deleteFrozenCards(TEAMING_CARDS);
    TEAMING_CARDS = await pipefy.getAllCardsFromPipe(TEAMING_PIPE);
    createTeamingCards(FROZEN_SUPPLIERS);
}


main();

