'use strict';

const PIPEFY_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjoxNDI3MzQsImVtYWlsIjoicGllZHBpcGVyQHNzY3RhMS5jb20iLCJhcHBsaWNhdGlvbiI6NDc3N319.0cEQkFkUhO1bxHBcqLjauqL31d8bJYBHOmhgMGmOM9T09yN7OiFcyMtJ8UcWuLE6rQ1WBzxESIstrwC9PKrusw';

const expect = require('chai').expect;
const Fuse = require('fuse-js-latest');
const fs = require('fs');
const parseFullName = require('parse-full-name').parseFullName;

const pipefy = require('../index')({
    accessToken: PIPEFY_TOKEN, logLevel: 'debug'
});

const SUPPLIER_TABLE_ID = 'XMv9yFAu';
const PARTNER_REP_TABLE_ID = 'vj30csjd';
const CANDIDATE_TABLE_ID = 'GlpPegIu';
const TEAMING_PIPE = 378470;
let SUPPLIERS, PIPEFY_SUPPLIERS, PIPEFY_REPS, TEAMING_CARDS, CANDIDATES;
let CARDS_MISSING_SUPPLIERS=[];
let CARDS_MISSING_REPS =[];
let DUPLICATE_PERSONS = [];
let DUPLICATE_COMPANIES = [];

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
    threshold: 0.2,
    location: 0,
    distance: 100,
    maxPatternLength: 52,
    minMatchCharLength: 1,
    keys: [
        "node.record_fields.value"
    ]};

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
    console.log('loaded ' + TEAMING_CARDS.length + ' teaming cards');
    console.log('loaded ' + PIPEFY_SUPPLIERS.length + ' pipefy suppliers');
}

async function decorateCards(){
    for (let card of TEAMING_CARDS){
        //find and link the id of the supplier company
        console.log("looking for suppliers");
        const supplierSearch = findMatchingSupplier(card.node.title, SUPPLIER_SEARCH_OPTIONS);
        if (supplierSearch && supplierSearch.length > 0){
            const updateResult = await pipefy.updateCardField({card_id:card.node.id,field_id:"supplier_information",new_value:supplierSearch[0].item});
            console.log("Updated supplier on " + card.node.title);
        }else{
            CARDS_MISSING_SUPPLIERS.add(card.node.title);
        }

        //find and link all POCs
        const repSearch = await findReps(card.node.title);
        if (repSearch.length > 0){
            const repResult = await pipefy.updateCardField({card_id:card.node.id,field_id:"who_is_the_poc_s", new_value:repSearch});
            console.log("Updated card [" + card.node.title +"] with " + repSearch.length + " reps");
        }else{
            CARDS_MISSING_REPS.add(card.node.id);
        }

        //find and link all working contractors

        //find and link all submitted candidates
    }
}

function findReps(companyName){
    let emails=[];
    let reps=[];
    const supplier = findCompany(companyName);
    if (supplier && supplier["Emails"] && supplier["Emails"].constructor === Array){
        emails = supplier["Emails"];
    }else{
        emails.push(supplier["Emails"]);
    }

    for (let email of emails){
        const repId = findRepByEmail(email);
        reps.push(repId);
    }
    return reps;
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

function findRep(name, email){
    const options = {
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

    console.log("Looking for: " + name + " email: " + email);
    const fuse = new Fuse(PIPEFY_REPS, options);
    let result = fuse.search(name);
    if (!result || !result.length > 0){
        result = fuse.search(email);
    }

    if (result && result.length > 0){
        console.log("found rep: " + name);
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


async function main(){
    await init();
    await decorateCards();
    showIncorrectData();
}


main();

function getValue(field){
    return field?field.value:"";
}

/* Creates a new record in supplier table*/
async function createNewSupplier(supplier, status){
    const newSupplier = {
        table_id: SUPPLIER_TABLE_ID,
        title: supplier["Company Name"],
        fields_attributes: [
            {field_id: "what", field_value: supplier["Company Name"]},
            {field_id: "ssc_status", field_value:status}
        ]
    }
    console.log("Creating a new supplier DB record for: " + supplier["Company Name"]);
    return await pipefy.createTableRecord(newSupplier);
}

async function createInactiveRep(supplier, isNew){
    let primaryEmail, additionalEmails;

    if (supplier && supplier["Contact"] && supplier["Contact"].constructor === Array){
        primaryEmail = supplier["Contact"][0];
        additionalEmails = supplier["Contact"].filter(email => email!=primaryEmail).join(",");
    }else{
        primaryEmail = supplier["Contact"];
        additionalEmails = "";
    }

    let primaryName, additionalNames;

    if (supplier["Contact person name"] && supplier["Contact person name"].constructor === Array){
        primaryName = supplier["Contact person name"][0];
        additionalNames = supplier["Contact person name"].filter(name => name!=primaryName).join(",");
    }else{
        primaryName = supplier["Contact person name"];
    }

    if (!isNew && !findRep(primaryName, primaryEmail)){
        const fullName = parseFullName(primaryName);
        const newRep = {
            table_id: PARTNER_REP_TABLE_ID,
            title: primaryName,
            fields_attributes: [
                {field_id: "full_name", field_value: primaryName},
                {field_id: "preferred_first_name", field_value: fullName.first},
                {field_id: "email", field_value: primaryEmail},
                {field_id: "status", field_value:"Active"},
                {field_id: "company", field_value: supplier["supplier_record_id"]}
            ]
        }
        const result = await pipefy.createTableRecord(newRep);
        //assert(result.data.createTableRecord.success);
        console.log("created inactive company rep: " + primaryName + " for company " + supplier["Company Name"])
    }
}

async function createActiveRep(supplier, isNew){
    let primaryEmail, additionalEmails;

    if (supplier["Contacts"].constructor === Array){
        primaryEmail = supplier["Contacts"][0];
        additionalEmails = supplier["Contacts"].filter(email => email!=primaryEmail).join(",");
    }else{
        primaryEmail = supplier["Contacts"];
        additionalEmails = "";
    }

    let primaryName = "", additionalNames = "";

    if (supplier["Contact Person Name"] && supplier["Contact Person Name"].constructor === Array){
        primaryName = supplier["Contact Person Name"][0];
        additionalNames = supplier["Contact Person Name"].filter(name => name!=primaryName).join(",");
    }

    if (!isNew && !findRep(primaryName, primaryEmail)){
        const fullName = parseFullName(primaryName);
        const newRep = {
            table_id: PARTNER_REP_TABLE_ID,
            title: primaryName,
            fields_attributes: [
                {field_id: "full_name", field_value: primaryName},
                {field_id: "preferred_first_name", field_value: fullName.first},
                {field_id: "email", field_value: primaryEmail},
                {field_id: "status", field_value:"Active"},
                {field_id: "company", field_value: supplier["supplier_record_id"]}
            ]
        }
        const result = await pipefy.createTableRecord(newRep);
        //assert(result.data.createTableRecord.success);
        console.log("created active company rep: " + primaryName + " for company " + supplier["Company Name"])
    }
}

async function analyzeActiveSuppliers(){
    const options = {
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


    let found = 0;
    for (let i = 0; i < ACTIVE_SUPPLIERS.length; i++){
        const supplier = ACTIVE_SUPPLIERS[i];
        const result = findMatchingSupplier(supplier["Company Name"],options);
        if (result && result.length > 0){
            ACTIVE_SUPPLIERS[i]["supplier_record_id"] = result[0].item;
            found++;
        }
        else{
            //Create the Supplier Record////////////////
            const result = await createNewSupplier(supplier,"Active");
            ACTIVE_SUPPLIERS[i]["supplier_record_id"] = result.data.createTableRecord.table_record.id;
        }
        console.log('company: ' + supplier["Company Name"], result);

        await createActiveRep(supplier);
    }

    console.log("Found: " + found + " suppliers, " + (ACTIVE_SUPPLIERS.length - found) + " left not created");
}

async function analyzeInactiveSuppliers(){

    let isNew = false;

    const options = {
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

    let found = 0;
    for (let i = 0; i < INACTIVE_SUPPLIERS.length; i++){
        const supplier = INACTIVE_SUPPLIERS[i];
        const result = findMatchingSupplier(supplier["Company Name"], options);
        //Does the supplier already exist?
        if (result && result.length > 0){
            INACTIVE_SUPPLIERS[i]["supplier_record_id"] = result[0].item;
            supplier["supplier_record_id"] = result[0].item;
            found++;
            console.log('found existing inactive company: ' + supplier["Company Name"]);
        }
        else {
            //Create the Supplier Record////////////////
            const result = await createNewSupplier(supplier,"Inactive");
            INACTIVE_SUPPLIERS[i]["supplier_record_id"] = result.data.createTableRecord.table_record.id;
            supplier["supplier_record_id"] = result.data.createTableRecord.table_record.id;
            isNew = true;
            console.log('created new inactive company: ' + supplier["Company Name"]);
        }

        await createInactiveRep(supplier, isNew);
    }

    console.log("Found: " + found + " suppliers, " + (INACTIVE_SUPPLIERS.length - found) + " left not created");
}

/*
Takes information from supplier table and moves it to a separate Partner Reps table. Links back to the supplier table.
 */
async function copyPeopleFromSuppliersToPartnerReps(){
    const suppliers = await pipefy.getTableRecords(SUPPLIER_TABLE_ID);

    const delRes = await pipefy.deleteRecords(PARTNER_REP_TABLE_ID);

    for (const supplier of suppliers){
        const name = supplier.node.record_fields.find(field => field.name === "Contact Name");
        const title = supplier.node.record_fields.find(field => field.name === "Title");
        const phone = supplier.node.record_fields.find(field => field.name === "Contact Mobile Phone");
        const email = supplier.node.record_fields.find(field => field.name === "Main Contact E-mail");


        const fullName = parseFullName(getValue(name));

        const partnerRep = {
            table_id: PARTNER_REP_TABLE_ID,
            title: getValue(name),
            fields_attributes: [
                {field_id: "full_name", field_value: getValue(name)},
                {field_id: "preferred_first_name", field_value: fullName.first},
                {field_id: "email", field_value: getValue(email)},
                {field_id: "phone", field_value: getValue(phone)},
                {field_id: "title", field_value: getValue(title)},
                {field_id: "status", field_value:"Active"},
                {field_id: "company", field_value: supplier.node.id}
            ]
        }
        const result = await pipefy.createTableRecord(partnerRep);

        if (supplier.node.record_fields.find(field => field.name === "Second Contact Name")){
            const secondName = supplier.node.record_fields.find(field => field.name === "Second Contact Name");
            const secondTitle = supplier.node.record_fields.find(field => field.name === "Second Contact Title");
            const secondPhone = supplier.node.record_fields.find(field => field.name === "Second Contact Phone");
            const secondEmail = supplier.node.record_fields.find(field => field.name === "Second Contact E-mail");

            const secondFullName = parseFullName(getValue(secondName));

            const partnerRep2 = {
                table_id: PARTNER_REP_TABLE_ID,
                title: getValue(secondName),
                fields_attributes: [
                    {field_id: "full_name", field_value: getValue(secondName)},
                    {field_id: "preferred_first_name", field_value: secondFullName.first},
                    {field_id: "title", field_value: getValue(secondTitle)},
                    {field_id: "email", field_value: getValue(secondEmail)},
                    {field_id: "phone", field_value: getValue(secondPhone)},
                    {field_id: "status", field_value:"Active"},
                    {field_id: "company", field_value: supplier.node.id}
                ]
            }

            const result2 = await pipefy.createTableRecord(partnerRep2);
        }

    }
}
//copyPeopleFromSuppliersToPartnerReps();

