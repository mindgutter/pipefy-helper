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
const CANDIDATE_TABLE_ID = 'GlpPegIu';
const CONTRACTOR_TABLE_ID = `5Y7m36nK`;
const CONTRACTOR_CONNECTION_ID = 21454;
const CANDIDATES_CONNECTION_ID = 21544;
const POC_CONNECTION_ID = 21356;
const TEAMING_PIPE = 378470;
let SUPPLIERS, PIPEFY_SUPPLIERS, PIPEFY_REPS, TEAMING_CARDS, CANDIDATES, CONTRACTORS;
let CARDS_MISSING_SUPPLIERS=[];
let CARDS_MISSING_REPS =[];
let DUPLICATE_PERSONS = [];

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

function showIncorrectData(){
    console.log("Found " + CARDS_MISSING_SUPPLIERS.length + " cards missing suppliers",CARDS_MISSING_SUPPLIERS);
    console.log("Found " + CARDS_MISSING_REPS.length + " cards missing reps",CARDS_MISSING_REPS);
    console.log("Found " + DUPLICATE_PERSONS.length + " duplicate reps in db", DUPLICATE_PERSONS);
}

function loadJson(fileName) {
    return JSON.parse(fs.readFileSync(fileName, 'utf8'));
}

async function init(){
    SUPPLIERS = loadJson('nda/data/allSuppliers.json');
    console.log('loaded ' + SUPPLIERS.length + ' suppliers');
    PIPEFY_SUPPLIERS = await pipefy.getTableRecords(SUPPLIER_TABLE_ID);
    PIPEFY_REPS = await pipefy.getTableRecords(PARTNER_REP_TABLE_ID);
    TEAMING_CARDS = await pipefy.getAllCardsFromPipe(TEAMING_PIPE);
    CANDIDATES = await pipefy.getTableRecords(CANDIDATE_TABLE_ID);
    CONTRACTORS = await pipefy.getTableRecords(CONTRACTOR_TABLE_ID);
    console.log('loaded ' + TEAMING_CARDS.length + ' teaming cards');
    console.log('loaded ' + PIPEFY_SUPPLIERS.length + ' pipefy suppliers');
}

async function decorateCards(){
    for (let card of TEAMING_CARDS){
        let supplierId = undefined;
        //find and link the id of the supplier company
        console.log("looking for suppliers");
        const suppliers = findMatchingSupplier(card.node.title, SUPPLIER_SEARCH_OPTIONS);
        if (suppliers && suppliers.length > 0){
            const updateResult = await pipefy.updateCardField({card_id:card.node.id,field_id:"supplier_information",new_value:suppliers[0].item});
            console.log("Updated supplier on " + card.node.title);
            supplierId = suppliers[0].item;
        }else{
            CARDS_MISSING_SUPPLIERS.add(card.node.title);
        }

        //find and link all POCs
        const reps = await findReps(card.node.title);
        if (reps.length > 0){
            const repResult = await pipefy.updateCardField({card_id:card.node.id,field_id:"who_is_the_poc_s", new_value:reps});
            console.log("Updated card [" + card.node.title +"] with " + reps.length + " reps");
            for (let i = 0; i < reps.length; i++){
                const repResult = await pipefy.createCardRelation({
                    parentId: card.node.id,
                    childId: reps[i],
                    sourceId: POC_CONNECTION_ID,
                    sourceType: "PipeRelation"
                });
                console.log(repResult);
            }
        }else{
            CARDS_MISSING_REPS.add(card.node.id);
        }

        //find and link all working contractors
        if (fieldValue(card, "current_status") === "Active") {
            const contractors = await findContractors(supplierId);
            if (contractors && contractors.length > 0) {
                for (let i = 0; i < contractors.length; i++) {
                    const conResult = await pipefy.createCardRelation({
                        parentId: card.node.id,
                        childId: contractors[i],
                        sourceId: CONTRACTOR_CONNECTION_ID,
                        sourceType: "PipeRelation"
                    });
                    console.log(conResult);
                }
                console.log("Created card relation for card [" + card.node.title + "] with " + contractors.length + " contractors");
            }
        }

        //find and link all submitted candidates
    }
}


async function findReps(companyName){
    let emails=[];
    let reps=[];
    const supplier = findCompany(companyName);
    if (supplier && supplier["Emails"] && supplier["Emails"].constructor === Array){
        emails = supplier["Emails"];
    }else{
        emails.push(supplier["Emails"]);
    }

    for (let email of emails){
        let repId = findRepByEmail(email);
        if (repId == undefined){
            reps = await createRep(supplier);
        }else {
            reps = repId;
        }
    }

    return reps;
}

function fieldValue(card, fieldName){
    for (let field of card.node.fields){
        if (field.field.id === fieldName){
            return field.value;
        }
    }
    return undefined;
}

function findCompany(name){
    const fuse = new Fuse(SUPPLIERS, COMPANY_SEARCH_OPTIONS);
    const company = fuse.search(name);
    if (!company){
        console.log("Did not find company: " + name);
    }else {
        return company[0];
    }
    return company;
}

function findContractors(companyName){
    const fuse = new Fuse(CONTRACTORS, CONTRACTOR_SEARCH_OPTIONS);
    const contractors = fuse.search(companyName);
    if (!contractors){
        console.log("Did not find contractors for company: " + companyName);
    }
    return contractors;
}


function findRepByEmail(email){
    console.log("Looking for: " + email);
    const fuse = new Fuse(PIPEFY_REPS, REP_SEARCH_OPTIONS);
    let result = fuse.search(email);

    if (result && result.length > 0){
        console.log("found rep: " + email);
        if (result.length > 1){
            for (let i = 1; i < result.length; i++) {
                DUPLICATE_PERSONS.push(result[i]);
            }
            result = result[0];
        }
    }else{
        result = undefined;
    }

    return result;
}

function findMatchingSupplier(supplierName, options){
    const fuse = new Fuse(PIPEFY_SUPPLIERS, options);
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
                {field_id: "company", field_value: supplier["supplier_record_id"]}
            ]
        }
        const result = await pipefy.createTableRecord(newRep);
        console.log("created active company rep: " + names[i] + " for company " + supplier["Company"]);
        ids.push(result.data.createTableRecord.table_record.id);
    }

    return ids;
}


async function main(){
    await init();
    await decorateCards();
    showIncorrectData();
}


main();

