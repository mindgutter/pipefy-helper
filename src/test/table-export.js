'use strict';

const config = require('../../config/local.js');

const pipefy = require('../index')({
    accessToken: config.pipefy.PRODUCTION_API_KEY, logLevel: 'debug'
});

const TABLE_ID = "vj30csjd";

async function exportTable()
{
    const status = pipefy.exportTableToCSV(TABLE_ID, "../../tmp/partnerReps.csv");
}


exportTable();

