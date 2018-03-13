'use strict';

const TEST_PIPEFY_TOKEN =
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJ1c2VyIjp7ImlkIjoxNDUwMTYsImVtYWlsIjoibWluZGd1dHRlckBnbWFpbC5jb20iLCJhcHBsaWNhdGlvbiI6NDc2NX19.adUu_ASSsoDj4sYXYgaVO9zT2p-Lbe-1GiuMhpV1G--MvcsSRgX5nKEAWTR6m3gdsVezBVsGp36TO8Bj7FdQbQ';

const expect = require('chai').expect;
const pipefy = require('../index')({
    accessToken: TEST_PIPEFY_TOKEN, logLevel: 'debug'
});

const randomWord = require('random-word');

const USER_ID = 145016;
const TEST_RECORDS_COUNT = 10;

let ORGANIZATION_ID, TABLE_ID, TABLE_NAME, FIRST_TABLE_FIELD_ID, SECOND_TABLE_FIELD_ID, CURRENT_RECORD_COUNT;

describe('Pipefy Table Tests', () => {

    describe('#getMe', () => {
        it('should return personal info from API', async () => {
            const result = await pipefy.getMe();
            expect(result).to.have.deep.property('data.me');
        });
    });

    describe('#createOrganization', () => {
        it('should return created organization data from API', async () => {
            const result = await pipefy.createOrganization({industry: 'technology', name: randomWord()});

            ORGANIZATION_ID = result.data.createOrganization.organization.id;
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
            }];

            const field_ids = await pipefy.createTableFields(TABLE_ID, table_fields);

            FIRST_TABLE_FIELD_ID = field_ids[0];
            SECOND_TABLE_FIELD_ID =field_ids[1];

            expect(field_ids.length).to.equals(2);
        });
    });

    describe('#createTableRecords', () => {
        it('should return success', async () => {

            const oldRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);

            for (let counter = 0; counter < TEST_RECORDS_COUNT; counter++) {
                const table_record = {
                    table_id: TABLE_ID,
                    title: counter + " - " + randomWord(),
                    fields_attributes: [
                        {field_id: FIRST_TABLE_FIELD_ID, field_value: counter + " -" + randomWord()},
                        {field_id: SECOND_TABLE_FIELD_ID, field_value: counter + " - " + randomWord()},
                    ]
                }
                const result = await pipefy.createTableRecord(table_record);
                expect(result).to.have.deep.property('data.createTableRecord.table_record.id');
            }

            const newRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);
            expect(newRecordCount.data.table.table_records_count - oldRecordCount.data.table.table_records_count).to.equals(TEST_RECORDS_COUNT);
            CURRENT_RECORD_COUNT = newRecordCount.data.table.table_records_count;
        });
     });

    describe('#getTableRecords', () => {
        it('should return all records', async () => {

            const records = await pipefy.getTableRecords(TABLE_ID);
            expect(records.length).to.equals(CURRENT_RECORD_COUNT);
        });
    });

    describe('#updateTableRecord', () => {
        it('should return all records', async () => {

            const NUMBER_OF_RECORDS_TO_UPDATE = 5;
            const records = await pipefy.getTableRecords(TABLE_ID, NUMBER_OF_RECORDS_TO_UPDATE);
            for (let record of records){
                const newValue = randomWord();
                const result = await pipefy.updateTableField({tableId:TABLE_ID,recordId:record.node.id,fieldId:FIRST_TABLE_FIELD_ID,newValue:newValue})
                expect(result).to.have.deep.property('data.setTableRecordFieldValue.table_record_field.value');
                expect(newValue).to.equals(result.data.setTableRecordFieldValue.table_record_field.value);
            }
        });
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