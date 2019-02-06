'use strict';


const expect = require('chai').expect;

const config = require('../../config/local.js');

const pipefy = require('../index')({
    accessToken: config.pipefy.API_KEY, logLevel: 'debug'
});

const randomWord = require('random-word');

const USER_ID = config.pipefy.USER_ID;
const TEST_RECORDS_COUNT = 5;

const OPTIONS_FIELD_NAME = "options";
const OPTION_ONE = "one";
const OPTION_TWO = "two";

let ORGANIZATION_ID, ORG_NAME, TABLE_ID, TABLE_NAME, FIRST_TABLE_FIELD_ID, SECOND_TABLE_FIELD_ID, CURRENT_RECORD_COUNT, TABLE_LABEL_ID, LABELED_RECORD_COUNT, OPTION_FIELD_ID, OPTION_ONE_RECORD_COUNT, OPTION_TWO_RECORD_COUNT;

describe('Pipefy Table Export', () => {


    describe('#createOrganization', () => {
        it('should return created organization data from API', async () => {
            ORG_NAME = randomWord();
            const result = await pipefy.createOrganization({industry: 'technology', name: ORG_NAME});

            ORGANIZATION_ID = result.data.createOrganization.organization.id;
            console.log("Org ID: '$o' Org Name: '%on'", ORGANIZATION_ID, ORG_NAME);
            expect(result).to.have.deep.property('data.createOrganization.organization');
        });
    });

    describe('#createTable', () => {
        it('should return created table id from API', async () => {

            TABLE_NAME = randomWord();
            const result = await pipefy.createTable({organization_id: ORGANIZATION_ID, name: TABLE_NAME});

            TABLE_ID = result.data.createTable.table.id;
            expect(result).to.have.deep.property('data.createTable.table');
        });
    });

    describe('#createTableFields', () => {
        it('should return success', async () => {

            const table_fields = [{
                table_id: TABLE_ID,
                type: "number",
                label: "General Number",
                description: "Select your gender",
                required: true,
                minimal_view: false
            },
                {
                    table_id: TABLE_ID,
                    type: "short_text",
                    label: "Text",
                    required: false,
                    description: "test text field"
                },
                {
                    table_id: TABLE_ID,
                    type: "select",
                    label: OPTIONS_FIELD_NAME,
                    required: true,
                    options:[OPTION_ONE, OPTION_TWO],
                    description: "option text field"
                }
                ];

            const field_ids = await pipefy.createTableFields(TABLE_ID, table_fields);

            FIRST_TABLE_FIELD_ID = field_ids[0];
            SECOND_TABLE_FIELD_ID =field_ids[1];
            OPTION_FIELD_ID = field_ids[2];

            expect(field_ids.length).to.equals(3);
        }).timeout(50000);
    });

    describe('#createTableRecords', () => {
        it('should return success', async () => {

            const oldRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);

            OPTION_ONE_RECORD_COUNT = 0;
            OPTION_TWO_RECORD_COUNT = 0;

            for (let counter = 0; counter < TEST_RECORDS_COUNT; counter++) {

                let optionValue = OPTION_ONE;

                if (counter % 2 === 0){
                    optionValue = OPTION_TWO;
                    OPTION_TWO_RECORD_COUNT++;
                }else{
                    optionValue = OPTION_ONE;
                    OPTION_ONE_RECORD_COUNT++;
                }

                const table_record = {
                    table_id: TABLE_ID,
                    title: counter + " - " + randomWord(),
                    fields_attributes: [
                        {field_id: FIRST_TABLE_FIELD_ID, field_value: counter + " -" + randomWord()},
                        {field_id: SECOND_TABLE_FIELD_ID, field_value: counter + " - " + randomWord()},
                        {field_id: OPTION_FIELD_ID, field_value: optionValue},
                    ]
                }
                const result = await pipefy.createTableRecord(table_record);
                expect(result).to.have.deep.property('data.createTableRecord.table_record.id');
            }

            const newRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);
            expect(newRecordCount.data.table.table_records_count - oldRecordCount.data.table.table_records_count).to.equals(TEST_RECORDS_COUNT);
            CURRENT_RECORD_COUNT = newRecordCount.data.table.table_records_count;

        }).timeout(50000);
    });

    describe('#testExport', ()=> {
        it('should create and delete filter table', async () => {
            const status = await pipefy.exportTableToCSV(TABLE_ID, `tmp/${TABLE_ID}.csv`);

        }).timeout(50000);
    });

    describe('#deleteTable', () => {
        it('should delete table ', async () => {

            const result = await pipefy.deleteTable(TABLE_ID);

            expect(result).to.have.deep.property('data.deleteTable.success');
        });
    });


    describe('#deleteOrganization', () => {
        it('should return success on delete organization from API', async () => {
            const result = await pipefy.deleteOrganization(ORGANIZATION_ID);
            expect(result).to.have.deep.property('data.deleteOrganization.success');
        });
    });
});