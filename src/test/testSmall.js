'use strict';


var expect = require('chai').expect;

const config = require('../../config/local.js');

const pipefy = require('../index')({
    accessToken: config.pipefy.API_KEY, logLevel: 'debug'
});

const USER_ID = config.pipefy.USER_ID;

var ORGANIZATION_ID, PIPE_ID, CLONE_PIPE_ID, PIPE_RELATION_ID, LABEL_ID, PHASE_ID, PHASE_FIELD_ID, CARD_ID, COMMENT_ID;


async function cleanOrgs()
{
 var result = await pipefy.getOrganizations();

    var org;
    for (org of result.data.organizations) {
        if (org.name == "Capsule Corp." || org.name == "DONT DELETE") {
            try {
                var r = await pipefy.deleteOrganization(org.id);
                console.debug(r);
            }
            catch (error){
                console.debug(error)
            }
        }
    }
}

cleanOrgs();


