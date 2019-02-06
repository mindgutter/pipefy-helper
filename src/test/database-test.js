'use strict';


const expect = require('chai').expect;

const randomWord = require('random-word');

const config = require('../../config/local.js');

const pipefy = require('../index')({
    accessToken: config.pipefy.API_KEY, logLevel: 'debug'
});

const USER_ID = config.pipefy.USER_ID;

const TEST_RECORDS_COUNT = 5;

let ORGANIZATION_ID, ORG_NAME, TABLE_ID, TABLE_NAME, FIRST_TABLE_FIELD_ID, SECOND_TABLE_FIELD_ID, CURRENT_RECORD_COUNT, TABLE_LABEL_ID, LABELED_RECORD_COUNT;

describe('Pipefy Table Tests', () => {

    describe('#getMe', () => {
        it('should return personal info from API', async () => {
            const result = await pipefy.getMe();
            expect(result).to.have.deep.property('data.me');
        });
    });

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
            }];

            const field_ids = await pipefy.createTableFields(TABLE_ID, table_fields);

            FIRST_TABLE_FIELD_ID = field_ids[0];
            SECOND_TABLE_FIELD_ID =field_ids[1];

            expect(field_ids.length).to.equals(2);
        }).timeout(50000);
    });

    describe('#createLabels', () => {
        it('should return all labels', async () => {

            const result = await pipefy.createLabel({table_id:TABLE_ID, name:randomWord(), color:"#000000"});

            TABLE_LABEL_ID = result.data.createLabel.label.id;

            expect(result).to.have.deep.property('data.createLabel.label.id');

            const tableInfo = await pipefy.getTable(TABLE_ID);
            expect (TABLE_LABEL_ID).to.equals(tableInfo.data.table.labels[0].id);

        }).timeout(5000);
    });

    describe('#createTableRecords', () => {
        it('should return success', async () => {

            const oldRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);

            LABELED_RECORD_COUNT = 0;

            for (let counter = 0; counter < TEST_RECORDS_COUNT; counter++) {
                let labels = [];
                if (counter % 2 === 0){
                    labels.push(TABLE_LABEL_ID);
                    LABELED_RECORD_COUNT++;
                }
                const table_record = {
                    table_id: TABLE_ID,
                    title: counter + " - " + randomWord(),
                    fields_attributes: [
                        {field_id: FIRST_TABLE_FIELD_ID, field_value: counter + " -" + randomWord()},
                        {field_id: SECOND_TABLE_FIELD_ID, field_value: counter + " - " + randomWord()},
                    ],
                    label_ids:labels
                }
                const result = await pipefy.createTableRecord(table_record);
                expect(result).to.have.deep.property('data.createTableRecord.table_record.id');
            }

            const newRecordCount = await pipefy.getTableRecordsCount(TABLE_ID);
            expect(newRecordCount.data.table.table_records_count - oldRecordCount.data.table.table_records_count).to.equals(TEST_RECORDS_COUNT);
            CURRENT_RECORD_COUNT = newRecordCount.data.table.table_records_count;
        }).timeout(50000);
     });

    describe('#getTableRecords', () => {

        it('should return all records', async () => {
            const records = await pipefy.getTableRecords(TABLE_ID);
            expect(records.length).to.equals(CURRENT_RECORD_COUNT);
        }).timeout(50000);
    });

    describe('#getLabeledTableRecords', () => {

        it('should return only labeled records', async () => {
            const records = await pipefy.getTableRecords(TABLE_ID, 50, {label_ids:[TABLE_LABEL_ID]});
            expect(records.length).to.equals(LABELED_RECORD_COUNT);
        }).timeout(50000);
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
        }).timeout(50000);
    });

    describe('#deleteTable', () => {
        it('should delete table ', async () => {

            //const result = await pipefy.deleteTable(TABLE_ID);

            expect(result).to.have.deep.property('data.deleteTable.success');
        });
    });


    describe('#deleteOrganization', () => {
        it('should return success on delete organization from API', async () => {
            //const result = await pipefy.deleteOrganization(ORGANIZATION_ID);
            expect(result).to.have.deep.property('data.deleteOrganization.success');
        });
    });
});