/** @module pipefy-helper  */

/**
 * Creates a new Pipefy Helper API client
 *
 * @example
 *
 * Basic usage:
 *
 * ```javascript
 * var pipefy = require('pipefy-helper')({
 *    accessToken: <token>,
 *    logLevel: '<['info', 'warn', 'debug', 'trace']>'
 * });
 *
 * pipefy.getMe();
 * ```
 * @param {object} config - Configuration options object
 * @param {string} config.accessToken - Personal access token (required)
 * @param {string} config.logLevel - Set the log level (optional)
 */

'use strict';

var log = require('loglevel');


function Pipefy(config) {
    if (!config) {
        console.error(`No 'config' parameter specified.`);
    } else if (!config.accessToken) {
        console.error(`No 'accessToken' property specified.`);
    }

    if (!config.logLevel) {
        log.setLevel(log.levels.SILENT, false);
    } else {
        log.setLevel(config.logLevel, false);
    }

    const baseUrl = 'https://app.pipefy.com/queries';

    const client = require('graphql-client')({
        url: 'https://app.pipefy.com/queries',
        headers: {
            Authorization: 'Bearer ' + config.accessToken
        }
    });

    /**
     * Custom querying
     * @function
     * @param {string} body - string of body request
     * @returns
     */
    this.customQuery = async function (body) {
        return client.query(body, undefined, function (req, res) {
            log.debug('Status:', res.status);
        });
    };

    const GET_ME_QUERY = `query { me { id, name, username, avatar_url, email, locale, time_zone } }`;
    /**
     * Get information about yourself.
     * @function
     * @returns A promise with the response body
     */
    this.getMe = async function () {
        return await client.query(GET_ME_QUERY, undefined);
    };

    const GET_ORGANIZATIONS_QUERY = `query { organizations{ id, name, pipes { name } } }`;
    /**
     * Get the list of Organizations.
     * @function
     * @returns A promise with the response body
     */
    this.getOrganizations = async function () {
        return await client.query(GET_ORGANIZATIONS_QUERY, undefined);
    };

    const GET_ORGANIZATION_BY_ID_QUERY = `
  query getOrganizationByID($id: ID!) {
  organization(id: $id) {
    name
    pipes {
      id
      name
      phases {
        name
      }
    }
    tables {
      edges {
        node {
          id
          name
        }
      }
    }
  }
}`;

    /**
     * Get an organization by organization id, with pipes and phases.
     * @function
     * @param {number} id - The organization id
     * @returns A promise with the response body
     */

    this.getOrganizationById = async function (id) {
        return await client.query(GET_ORGANIZATION_BY_ID_QUERY, {id: id});
    };

    const GET_PIPES_BY_IDS_QUERY = `query getPipesByIds ($ids: [ID]!) { 
    pipes(ids: $ids) { 
      id 
      name
      phases{ 
        id
        name
        cards(first: 10){
          edges{
            node{
              id
              title
            } 
          } 
        } 
      } 
    } 
  }`;

    /**
     * Get pipes by pipes ids, with phases and cards.
     * @function
     * @param {Array} ids - An array with pipes ids
     * @returns A promise with the response body
     */
    this.getPipesByIds = async function (ids) {
        return await client.query(GET_PIPES_BY_IDS_QUERY, {ids: ids});
    };


    const GET_PIPE_BY_ID_QUERY = `query getPipeById ($id: ID!) {
        pipe(id:$id) {
            phases{
                id
                name
                cards(first: 10){
                    edges{
                        node{
                            id
                            title
                        }
                    }
                }
            }
        }
    }`;
    /**
     * Get a pipe by pipe id, with phases and cards.
     * @function
     * @param {number} id - A pipe id
     * @returns A promise with the response body
     */

    this.getPipeById = async function (id) {
        return await client.query(GET_PIPE_BY_ID_QUERY, {id: id});
    };

    const GET_PHASE_BY_ID_QUERY = `query getPhaseById($id: ID!) {
  phase(id: $id) {
    id
    name
    cards_count
    cards {
      edges {
        node {
          id
          title
        }
      }
    }
    fields {
      id
    }
    cards_can_be_moved_to_phases {
      id
      name
    }
  }
}`;

    /**
     * Get a phase by phase id, with cards, fields and cards cane be moved to phases.
     * @function
     * @param {number} id - A phase id
     * @returns A promise with the response body
     */
    this.getPhaseById = async function (id) {
        return await client.query(GET_PHASE_BY_ID_QUERY, {id: id});
    };

    const GET_CARDS_BY_PIPE_ID_QUERY = `query getCardsByPipeId($pipe_id: ID!, $start:String) {
  cards(pipe_id: $pipe_id, first: 30, after: $start) {
    edges {
      node {
        title
        assignees {
          id
          username
        }
        child_relations {
          name
          cards {
            id
          }
        }
        fields {
          name
          value
          phase_field {
            id
          }
        }
      }
    }
    pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
     }
  }
}`;
    /**
     * Get cards by pipe id, with assignees, child relations, fields ...
     * @function
     * @param {number} pipe_id - A pipe id
     * @param {string} start - cursor to start pagination, provided by pageInfo endCursor in previous calls
     * @returns A promise with the response body
     */
    this.getCardsByPipeId = async function (pipe_id, start = undefined) {
        return await client.query(GET_CARDS_BY_PIPE_ID_QUERY, {pipe_id: pipe_id, start: start});
    };

    const GET_CARD_BY_ID_QUERY = `query getCardById($id: ID!) {
  card(id: $id) {
    current_phase {
      id
      name
    }
    pipe {
      id
    }
    title
    assignees {
      id
      username
    }
    child_relations {
      name
      cards {
        id
      }
    }
    fields {
      name
      value
      phase_field {
        id
      }
    }
  }
}

`;
    /**
     * Get a card by card id, with assignees, child relations, fields ...
     * @function
     * @param {number} id - A card id
     * @returns A promise with the response body
     */

    this.getCardById = async function (id) {
        return await client.query(GET_CARD_BY_ID_QUERY, {id: id});
    };

    const GET_PIPE_RELATIONS_BY_IDS_QUERY = `query getPipeRelationsByIds($ids: [ID]!) {
  pipe_relations(ids: $ids) {
    id
    name
    parent
    child
    canCreateNewItems
    canConnectExistingItems
    canConnectMultipleItems
    childMustExistToMoveParent
    childMustExistToFinishParent
    allChildrenMustBeDoneToMoveParent
    allChildrenMustBeDoneToFinishParent
    autoFillFieldEnabled
    ownFieldMaps{
      fieldId
      inputMode
      value
    }
  }
}`;
    /**
     * Get a list of pipe relations by their ids, with properties and the child name
     * @function
     * @param {Array} ids - An array with pipe relations ids
     * @returns A promise with the response body
     */

    this.getPipeRelationByIds = async function (ids) {
        return await client.query(GET_PIPE_RELATIONS_BY_IDS_QUERY, {ids: ids});
    };

    const CREATE_ORGANIZATION_QUERY = `mutation createOrganization($industry:String!, $name:String!){
        createOrganization(
            input: {
            industry: $industry
            name: $name
        }
    ) {
            organization {
                id
                name
            }
        }
    }`;
    /**
     * Mutation to create a organization, in case of success a query is returned.
     * @function
     * @param {object} params - The new organization data
     * @param {string} params.industry - The company industry (e.g.: 'technology', 'consulting')
     * @param {string} params.name - The company name
     * @returns A promise with the response body
     */
    this.createOrganization = async function (params) {
        return await client.query(CREATE_ORGANIZATION_QUERY, params);
    };


    const UPDATE_ORGANIZATION_QUERY = `mutation UpdateOrganization($id: ID!, $name: String!, $only_admin_can_create_pipes: Boolean, $only_admin_can_invite_users: Boolean, $force_omniauth_to_normal_users: Boolean) {
  updateOrganization(input: {id: $id, name: $name, only_admin_can_create_pipes: $only_admin_can_create_pipes, only_admin_can_invite_users: $only_admin_can_invite_users, force_omniauth_to_normal_users: $force_omniauth_to_normal_users}) {
    organization {
      name
      only_admin_can_create_pipes
      only_admin_can_invite_users
      force_omniauth_to_normal_users
    }
  }
}`;
    /**
     * Mutation to update a organization, in case of success a query is returned.
     * @function
     * @param {object} params - The new organization data
     * @param {number} params.id - The organization id
     * @param {string} params.name - The new organization name
     * @param {boolean} params.only_admin_can_invite_users - Only admin can invite users
     * @param {boolean} params.only_admin_can_create_pipes - Only admin can create pipes
     * @param {boolean} params.force_omniauth_to_normal_users - Force omniauth to normal users
     * @returns A promise with the response body
     */

    this.updateOrganization = async function (params) {
        return await client.query(UPDATE_ORGANIZATION_QUERY, params);
    };

    const DELETE_ORG_QUERY = `mutation DeleteOrganization($id: ID!) {
  deleteOrganization(input: {id: $id}) {
    success
  }
}`;
    /**
     * Mutation to delete an organization, in case of success a query is returned.
     * @function
     * @param {number} id - The organization id
     * @returns A promise with the response body
     */
    this.deleteOrganization = async function (id) {
        return await client.query(DELETE_ORG_QUERY, {id: id});
    };

    const CLONE_PIPES_QUERY = `mutation ClonePipes($organization_id: ID!, $pipe_template_ids: [ID]!) {
  clonePipes(input: {organization_id:$organization_id, pipe_template_ids:$pipe_template_ids}) {
    pipes {
      id
    }
  }
}`;
    /**
     * Mutation to clone a pipe, in case of success a query is returned.
     * @function
     * @param {object} params - The pipes data
     * @param {string} params.organization_id - The organization id
     * @param {Array} params.pipe_template_ids - An array with pipes ids to be used as template
     * @returns A promise with the response body
     */
    this.clonePipes = async function (params) {
        return await client.query(CLONE_PIPES_QUERY, params);
    };

    const CREATE_PIPE_QUERY = `mutation CreatePipe($name: String!, $organization_id: ID!, $labels: [LabelInput], $members: [MemberInput], $phases: [PhaseInput], $preferences: RepoPreferenceInput, $start_form_fields: [PhaseFieldInput]) {
  createPipe(input: {name: $name, organization_id: $organization_id, labels: $labels, members: $members, phases: $phases, preferences: $preferences, start_form_fields: $start_form_fields}) {
    pipe {
      id
    }
  }
}`;
    /**
     * Mutation to create a pipe, in case of success a query is returned.
     * @function
     * @param {object} params
     * @param {number} params.organization_id - The organization id
     * @param {string} params.name - The pipe name
     * @param {Array.<object>} params.labels - An array of objects with 'name' and 'color' properties
     * @param {Array.<object>} params.members - An array of objects with 'user_id' and 'role_name' properties
     * @param {Array.<object>} params.phases - An array of objects with 'name' and 'done' properties
     * @param {Array.<object>} params.start_form_fields - An array of objects with 'label' and 'type_id' properties
     * @returns A promise with the response body
     */
    this.createPipe = async function (params) {
        return await client.query(CREATE_PIPE_QUERY, params);
    };

    const UPDATE_PIPE_QUERY = `mutation UpdatePipe($id: ID!, $name: String, $anyone_can_create_card: Boolean, $expiration_time_by_unit: Int, $expiration_unit: Int, $icon: String, $only_assignees_can_edit_cards: Boolean, $only_admin_can_remove_cards: Boolean, $preferences: RepoPreferenceInput, $public: Boolean, $public_form: Boolean, $publicFormSettings: PublicFormSettingsInput, $title_field_id: ID) {
  updatePipe(input: {id: $id, name: $name, anyone_can_create_card: $anyone_can_create_card, expiration_time_by_unit: $expiration_time_by_unit, expiration_unit: $expiration_unit, icon: $icon, only_assignees_can_edit_cards: $only_assignees_can_edit_cards, only_admin_can_remove_cards: $only_admin_can_remove_cards, preferences: $preferences, public: $public, public_form: $public_form, publicFormSettings: $publicFormSettings, title_field_id: $title_field_id}) {
    pipe {
      id
    }
  }
}

`;
    /**
     * Mutation to update a pipe, in case of success a query is returned.
     * @function
     * @param {object} params - The pipe new data
     * @param {number} params.id - The pipe id
     * @param {string} params.name - The pipe name
     * @param {boolean} params.anyone_can_create_card - Anyone can create cards
     * @param {number} params.expiration_time_by_unit
     * @param {number} params.expiration_unit - Minutes: 60, Hours: 3600, Day: 86400
     * @param {string} params.icon
     * @param {object} params.preferences
     * @param {boolean} params.public_form - Is the start form public
     * @param {boolean} params.public - It the pipe public
     * @param {object} param.public_form_settings - Settings of the public form
     * @param {string} title_field_id - Id of the title field
     * @param {boolean} params.only_admin_can_remove_cards - Only admin can remove cards
     * @param {boolean} params.only_assignees_can_edit_cards - Only assignees can edit cards
     * @returns A promise with the response body
     */
    this.updatePipe = async function (params) {
        return await client.query(UPDATE_PIPE_QUERY, params);
    };

    const DELETE_PIPE_QUERY = `mutation DeletePipe($id: ID!) {
  deletePipe(input: {id: $id}) {
    success
  }
}`;
    /**
     * Mutation to delete a pipe, in case of success a query is returned.
     * @function
     * @param {number} id - The pipe id
     * @returns A promise with the response body
     */
    this.deletePipe = async function (id) {
        return await client.query(DELETE_PIPE_QUERY, {id: id});
    };

    const CREATE_PHASE_QUERY = `mutation CreatePhase($name: String!, $pipe_id: ID!, $can_receive_card_directly_from_draft: Boolean, $description: String, $done: Boolean, $lateness_time: Int, $only_admin_can_move_to_previous: Boolean) {
  createPhase(input: {name: $name, pipe_id: $pipe_id, can_receive_card_directly_from_draft: $can_receive_card_directly_from_draft, description: $description, done: $done, lateness_time: $lateness_time, only_admin_can_move_to_previous: $only_admin_can_move_to_previous}) {
    phase {
      id
    }
  }
}`;
    /**
     * Mutation to create a phase in a pipe, in case of success a query is returned.
     * @function
     * @param {object} params - The new phase data
     * @param {number} params.pipe_id - The pipe id
     * @param {string} params.name - The phase name
     * @param {string} params.description - The phase description
     * @param {boolean} params.done - It is done
     * @param {number} params.lateness_time - When does the card become late
     * @param {boolean} params.only_admin_can_move_to_previous - Only admin can move to previous
     * @param {boolean} params.can_receive_card_directly_from_draft - Can receive card directly from draft
     * @returns A promise with the response body
     */
    this.createPhase = async function (params) {
        return await client.query(CREATE_PHASE_QUERY, params);
    };

    const UPDATE_PHASE_QUERY = `mutation UpdatePhase($id: ID!, $name: String!, $can_receive_card_directly_from_draft: Boolean, $description: String, $done: Boolean, $lateness_time: Int) {
  updatePhase(input: {id:$id, name: $name, can_receive_card_directly_from_draft: $can_receive_card_directly_from_draft, description: $description, done: $done, lateness_time: $lateness_time}) {
    phase {
      id
    }
  }
}`;
    /**
     * Mutation to update a phase, in case of success a query is returned.
     * @function
     * @param {object} params - The new phase data
     * @param {number} params.id - The phase id
     * @param {string} params.name - The phase name
     * @param {number} params.lateness_time - Determines when card becomes late
     * @param {boolean} params.can_receive_card_directly_from_draft - Can receive card directly from draft
     * @param {string} params.description - The phase description
     * @returns A promise with the response body
     */
    this.updatePhase = async function (params) {
        return await client.query(UPDATE_PHASE_QUERY, params);
    };


    const DELETE_PHASE_QUERY = `mutation DeletePhase($id: ID!) {
  deletePhase(input: {id: $id}) {
    success
  }
}`;
    /**
     * Mutation to delete a phase of a pipe, in case of success a query is returned.
     * @function
     * @param {number} id - The phase id
     * @returns A promise with the response body
     */
    this.deletePhase = async function (id) {
        return await client.query(DELETE_PHASE_QUERY, {id: id});
    };

    const CREATE_PHASE_FIELD_QUERY = `mutation CreatePhaseField($label: String!, $phase_id: ID!, $type: ID!, $allChildrenMustBeDoneToFinishParent: Boolean, $allChildrenMustBeDoneToMoveParent: Boolean, $canConnectExisting: Boolean, $canConnectMultiples: Boolean, $canCreateNewConnected: Boolean, $childMustExistToFinishParent: Boolean, $connectedRepoId: ID, $custom_validation: String, $description: String, $editable: Boolean, $help: String, $minimal_view: Boolean, $options: [String], $required: Boolean, $sync_with_card: Boolean) {
  createPhaseField(input: {label: $label, phase_id: $phase_id, type: $type, allChildrenMustBeDoneToFinishParent: $allChildrenMustBeDoneToFinishParent, allChildrenMustBeDoneToMoveParent: $allChildrenMustBeDoneToMoveParent, canConnectExisting: $canConnectExisting, canConnectMultiples: $canConnectMultiples, canCreateNewConnected: $canCreateNewConnected, childMustExistToFinishParent: $childMustExistToFinishParent, connectedRepoId: $connectedRepoId, custom_validation: $custom_validation, description: $description, editable: $editable, help: $help, minimal_view: $minimal_view, options: $options, required: $required, sync_with_card: $sync_with_card}) {
    phase_field {
      id
    }
  }
}`;
    /**
     * Mutation to create a phase field, in case of success a query is returned.
     * @function
     * @param {object} params - The phase field new data
     * @param {number} params.phase_id - The phase id
     * @param {string} params.type - The phase type
     * @param {string} params.label - The phase label
     * @param {boolean} params.allChildrenMustBeDoneToFinishParent
     * @param {boolean} params.allChildrenMustBeDoneToMoveParent
     * @param {boolean} params.canConnectExisting
     * @param {boolean} params.canConnectMultiples
     * @param {boolean} params.canConnectNewConnected
     * @param {boolean} params.childMustExistToFinishParent
     * @param {string} params.connectedRepoId
     * @param {string} params.custom_validation
     * @param {string} params.description - The phase description
     * @param {boolean} params.required - It is required
     * @param {string} params.help - Help text
     * @param {Array.string} params.options
     * @param {boolean} params.minimal_view - Is it minimized
     * @param {boolean} params.editable - It is editable
     * @param {boolean} params.sync_with_card - Sync with card
     * @returns A promise with the response body
     */
    this.createPhaseField = async function (params) {
        return await client.query(CREATE_PHASE_FIELD_QUERY, params);
    };


    const UPDATE_PHASE_FIELD_QUERY = `mutation UpdatePhaseField($id: ID!, $label: String!, $allChildrenMustBeDoneToFinishParent: Boolean, $allChildrenMustBeDoneToMoveParent: Boolean, $canConnectExisting: Boolean, $canConnectMultiples: Boolean, $canCreateNewConnected: Boolean, $childMustExistToFinishParent: Boolean, $custom_validation: String, $description: String, $editable: Boolean, $help: String, $minimal_view: Boolean, $options: [String], $required: Boolean, $sync_with_card: Boolean) {
  updatePhaseField(input: {id: $id, label: $label, allChildrenMustBeDoneToFinishParent: $allChildrenMustBeDoneToFinishParent, allChildrenMustBeDoneToMoveParent: $allChildrenMustBeDoneToMoveParent, canConnectExisting: $canConnectExisting, canConnectMultiples: $canConnectMultiples, canCreateNewConnected: $canCreateNewConnected, childMustExistToFinishParent: $childMustExistToFinishParent, custom_validation: $custom_validation, description: $description, editable: $editable, help: $help, minimal_view: $minimal_view, options: $options, required: $required, sync_with_card: $sync_with_card}) {
    phase_field {
      id
    }
  }
}`;
    /**
     * Mutation to create a phase field, in case of success a query is returned.
     * @function
     * @param {object} params - The phase field new data
     * @param {number} params.id - The id if the field
     * @param {string} params.label - The phase label
     * @param {boolean} params.allChildrenMustBeDoneToFinishParent
     * @param {boolean} params.allChildrenMustBeDoneToMoveParent
     * @param {boolean} params.canConnectExisting
     * @param {boolean} params.canConnectMultiples
     * @param {boolean} params.canConnectNewConnected
     * @param {boolean} params.childMustExistToFinishParent
     * @param {string} params.custom_validation
     * @param {string} params.description - The phase description
     * @param {boolean} params.required - It is required
     * @param {string} params.help - Help text
     * @param {Array.string} params.options
     * @param {boolean} params.minimal_view - Is it minimized
     * @param {boolean} params.editable - It is editable
     * @param {boolean} params.sync_with_card - Sync with card
     * @returns A promise with the response body
     */
    this.updatePhaseField = async function (params) {
        return await client.query(UPDATE_PHASE_FIELD_QUERY, params);
    };

    const DELETE_PHASE_FIELD_QUERY = `mutation DeletePhaseField($id: ID!) {
  deletePhaseField(input: {id: $id}) {
    success
  }
}`;
    /**
     * Mutation to delete a phase field, in case of success a query is returned.
     * @function
     * @param {number} id - The phase field id
     * @returns A promise with the response body
     */
    this.deletePhaseField = async function (id) {
        return await client.query(DELETE_PHASE_FIELD_QUERY, {id: id});
    };

    const CREATE_LABEL_QUERY = `mutation CreateLabel($color:String!, $name:String!, $pipe_id: ID, $table_id:ID) {
  createLabel(input: {color: $color, name:$name, pipe_id:$pipe_id, table_id:$table_id}) {
    label {
      id
    }
  }
}`;
    /**
     * Mutation to create a label, in case of success a query is returned.
     * @function
     * @param {object} params - The label new data
     * @param {string} params.pipe_id - The pipe id
     * @param {string} params.table_id - The table id
     * @param {string} params.name - The label name
     * @param {string} params.color - The label color
     * @returns A promise with the response body
     */
    this.createLabel = async function (params) {
        return await client.query(CREATE_LABEL_QUERY, params);
    };

    const UPDATE_LABEL_QUERY = `mutation UpdateLabel($id: ID!, $color: String!, $name: String!) {
  updateLabel(input: {id: $id, color: $color, name: $name}) {
    label {
      id
    }
  }
}`;
    /**
     * Mutation to update a label, in case of success a query is returned.
     * @function
     * @param {object} params - The label new data
     * @param {number} params.id - The label id
     * @param {string} params.color - The label color
     * @param {string} params.name - The label name
     * @returns A promise with the response body
     */
    this.updateLabel = async function (params) {
        return await client.query(UPDATE_LABEL_QUERY, params);
    };

    const DELETE_LABEL_QUERY = `mutation DeleteLabel($id: ID!) {
  deleteLabel(input: {id: $id}) {
    success
  }
}`;

    /**
     * Mutation to delete a label, in case of success a query is returned.
     * @function
     * @param {number} id - The label id
     * @returns A promise with the response body
     */
    this.deleteLabel = async function (id) {
        return await client.query(DELETE_LABEL_QUERY, {id: id});
    };

    const CREATE_CARD_QUERY = `mutation CreateCard($pipe_id: ID!, $assignee_ids: [ID], $attachments: [String], $due_date: DateTime, $fields_attributes: [FieldValueInput], $label_ids: [ID], $parent_ids: [ID], $phase_id: ID, $title: String) {
  createCard(input: {pipe_id: $pipe_id, phase_id: $phase_id, parent_ids: $parent_ids, assignee_ids: $assignee_ids, attachments: $attachments, due_date: $due_date, fields_attributes: $fields_attributes, label_ids: $label_ids, title: $title}) {
    card {
      id
    }
  }
}`;
    /**
     * The endpoint to create a card, in case of success a query is returned. When fields_attributes is passed as parameter, the field_value of first field_attribute replaces the card title.
     * @function
     * @param {object} params - The card new data
     * @param {number} params.pipe_id - The pipe id
     * @param {string} params.phase_id - The id of the phase
     * @param {Array.string} params.parent_ids
     * @param {string} params.title - The card title
     * @param {string} params.due_date - Date in string format
     * @param {Array.string} params.assignee_ids - An array with assignes ids numbers
     * @param {Array.string} params.label_ids - An array with labels ids numbers
     * @returns A promise with the response body
     */
    this.createCard = async function (params) {
        return await client.query(CREATE_CARD_QUERY, params);
    };

    const UPDATE_CARD_QUERY = `mutation UpdateCard($id: ID!, $assignee_ids: [ID], $due_date: DateTime, $label_ids: [ID], $title: String) {
  updateCard(input: {id: $id, assignee_ids: $assignee_ids, due_date: $due_date, label_ids: $label_ids, title: $title}) {
    card {
      id
    }
  }
}`;
    /**
     * The endpoint to create a card, in case of success a query is returned. When fields_attributes is passed as parameter, the field_value of first field_attribute replaces the card title.
     * @function
     * @param {object} params - The card new data
     * @param {number} params.id - The card id
     * @param {string} params.title - The card title
     * @param {string} params.due_date - Date in string format
     * @param {Array.string} params.assignee_ids - An array with assignes ids numbers
     * @param {Array.string} params.label_ids - An array with labels ids numbers
     * @returns A promise with the response body
     */
    this.updateCard = async function (params) {
        return await client.query(UPDATE_CARD_QUERY, params);
    };


    const DELETE_CARD_QUERY = `mutation DeleteCard($id: ID!) {
  deleteCard(input: {id: $id}) {
    success
  }
}`;
    /**
     * The endpoint to delete a card, in case of success a query "success": true is returned.
     * @function
     * @param {number} id - The card id
     * @returns A promise with the response body
     */
    this.deleteCard = async function (id) {
        return await client.query(DELETE_CARD_QUERY, {id: id});
    };


    const MOVE_CARD_TO_PHASE_QUERY = `mutation MoveCardToPhase($card_id: ID!, $destination_phase_id: ID!) {
  moveCardToPhase(input: {card_id: $card_id, destination_phase_id: $destination_phase_id}) {
    card {
      id
    }
  }
}`;
    /**
     * The endpoint to move a card to a phase, in case of success a card's query is returned.
     * @function
     * @param {object} params
     * @param {number} params.card_id - The card id
     * @param {number} params.destination_phase_id - The destination phase id
     * @returns A promise with the response body
     */
    this.moveCardToPhase = async function (params) {
        return await client.query(MOVE_CARD_TO_PHASE_QUERY, params);
    };


    const UPDATE_CARD_FIELD_QUERY = `mutation UpdateCardField($card_id: ID!, $field_id: ID!, $new_value: UndefinedInput) {
  updateCardField(input: {card_id: $card_id, field_id: $field_id, new_value: $new_value}) {
    card {
      id
    }
    success
  }
}`;

    /**
     * Mutation to update a card's field value.
     * @function
     * @param {object} params
     * @param {number} params.card_id - The card id
     * @param {number} params.field_id - The field id
     * @param {UndefinedInput} params.new_value - Value of the field
     * @returns A promise with the response body
     */
    this.updateCardField = async function (params) {
        return await client.query(UPDATE_CARD_FIELD_QUERY, params);
    };

    const CREATE_COMMENT_QUERY = `mutation CreateComment($card_id: ID!, $text: String!) {
  createComment(input: {card_id: $card_id, text: $text}) {
   comment {
     id
   }
  }
}`;
    /**
     * Mutation to create a comment to a card, in case of success a query is returned.
     * @function
     * @param {object} params - The comment new data
     * @param {number} params.card_id - The card id
     * @param {string} params.text - The comment text
     * @returns A promise with the response body
     */
    this.createComment = async function (params) {
        return await client.query(CREATE_COMMENT_QUERY, params);
    };

    const UPDATE_COMMENT_QUERY = `mutation UpdateComment($id: ID!, $text:String!) {
  updateComment(input: {id: $id, text:$text}) {
    comment {
      id
    }
  }
}`;
    /**
     * Mutation to update a comment, in case of success a query is returned.
     * @function
     * @param {object} params - The comment new data
     * @param {number} params.id - The comment id
     * @param {string} params.text - The comment text
     * @returns A promise with the response body
     */
    this.updateComment = async function (params) {
        return await client.query(UPDATE_COMMENT_QUERY, params);
    };

    const DELETE_COMMENT_QUERY = `mutation DeleteComment($id: ID!) {
  deleteComment(input: {id: $id}) {
    success
  }
}`;
    /**
     * Mutation to delete a comment of a Card, in case of success a query is returned.
     * @function
     * @param {number} id - The comment id
     * @returns A promise with the response body
     */
    this.deleteComment = async function (id) {
        return await client.query(DELETE_COMMENT_QUERY, {id: id});
    };

    const SET_ROLE_QUERY = `mutation SetRole($member: MemberInput!, $organization_id: ID, $pipe_id:ID, $table_id:ID ) {
  setRole(input: {member: $member, organization_id: $organization_id, pipe_id:$pipe_id, table_id:$table_id}) {
   member{
    role_name
    user {
      id
    }
  }
  }
}`;
    /**
     * Mutation to set a user's role, in case of success a query is returned.
     * @function
     * @param {object} params - The role data
     * @param {string} params.pipe_id - The pipe id
     * @param {string} params.table_id - id of the table
     * @param {string} params.organization_id - The organization id
     * @param {string} params.member.user_id - The member user id
     * @param {string} params.member.role_name - The member role name
     * @returns
     */
    this.setRole = async function (params) {
        return await client.query(SET_ROLE_QUERY, params);
    };

    const CREATE_PIPE_RELATION_QUERY = `mutation CreatePipeRelation($parentId: ID!, $childId: ID!, $name: String!, $autoFillFieldEnabled: Boolean!, $allChildrenMustBeDoneToMoveParent: Boolean!, $allChildrenMustBeDoneToFinishParent: Boolean!, $canConnectMultipleItems: Boolean!, $canConnectExistingItems: Boolean!, $canCreateNewItems: Boolean!, $childMustExistToMoveParent: Boolean!, $childMustExistToFinishParent: Boolean!, $ownFieldMaps: [FieldMapInput]) {
  createPipeRelation(input: {parentId: $parentId, childId: $childId, name: $name, autoFillFieldEnabled: $autoFillFieldEnabled, allChildrenMustBeDoneToMoveParent: $allChildrenMustBeDoneToMoveParent, allChildrenMustBeDoneToFinishParent: $allChildrenMustBeDoneToFinishParent, canConnectMultipleItems: $canConnectMultipleItems, canConnectExistingItems: $canConnectExistingItems, canCreateNewItems: $canCreateNewItems, childMustExistToMoveParent: $childMustExistToMoveParent, childMustExistToFinishParent: $childMustExistToFinishParent, ownFieldMaps: $ownFieldMaps}) {
    pipeRelation {
      id
    }
  }
}`;
    /**
     * Mutation to update a pipe relation, in case of success a query is returned.
     * @function
     * @param {object} params - The pipe relation new data
     * @param {string} params.name - The pipe relation new name
     * @param {string} params.parentId - id of the parent pipe or table
     * @param {string} params.childId - id of the child pipe or table
     * @param {boolean} params.autoFillFieldEnabled - autofill enabled
     * @param {boolean} params.childMustExistToMoveParent - Child must exist to move parent
     * @param {boolean} params.childMustExistToFinishParent - Child must exist to finish parent
     * @param {boolean} params.allChildrenMustBeDoneToFinishParent - All children must to be done to finish parent
     * @param {boolean} params.allChildrenMustBeDoneToMoveParent - All children must be done to move parent
     * @param {boolean} params.canCreateConnectedItems - Can create connected cards
     * @param {boolean} params.canSearchConnectedItems - Can search connected cards
     * @param {boolean} params.canConnectMultipleItems - Can connect multiple cards
     * @param {Array.=} params.ownFieldMaps - array of FieldMapInput objects
     * @returns A promise with the response body
     */
    this.createPipeRelation = async function (params) {
        return await client.query(CREATE_PIPE_RELATION_QUERY, params);
    };


    const UPDATE_PIPE_RELATION_QUERY = `mutation UpdatePipeRelation($id: ID!, $name: String!, $autoFillFieldEnabled: Boolean!, $allChildrenMustBeDoneToMoveParent: Boolean!, $allChildrenMustBeDoneToFinishParent: Boolean!, $canConnectMultipleItems: Boolean!, $canConnectExistingItems: Boolean!, $canCreateNewItems: Boolean!, $childMustExistToMoveParent: Boolean!, $childMustExistToFinishParent: Boolean!, $ownFieldMaps: [FieldMapInput]) {
  updatePipeRelation(input: {id: $id, name: $name, autoFillFieldEnabled: $autoFillFieldEnabled, allChildrenMustBeDoneToMoveParent: $allChildrenMustBeDoneToMoveParent, allChildrenMustBeDoneToFinishParent: $allChildrenMustBeDoneToFinishParent, canConnectMultipleItems: $canConnectMultipleItems, canConnectExistingItems: $canConnectExistingItems, canCreateNewItems: $canCreateNewItems, childMustExistToMoveParent: $childMustExistToMoveParent, childMustExistToFinishParent: $childMustExistToFinishParent, ownFieldMaps: $ownFieldMaps}) {
    pipeRelation {
      id
    }
  }
}`;
    /**
     * Mutation to update a pipe relation, in case of success a query is returned.
     * @function
     * @param {object} params - The pipe relation new data
     * @param {number} params.id - The pipe relation id
     * @param {string} params.name - The pipe relation new name
     * @param {boolean=} params.autoFillFieldEnabled - autofill enabled
     * @param {boolean=} params.allChildrenMustBeDoneToFinishParent - All children must to be done to finish parent
     * @param {boolean=} params.allChildrenMustBeDoneToMoveParent - All children must be done to move parent
     * @param {boolean=} params.canConnectExistingItems - Can connect multiple cards
     * @param {boolean=} params.canConnectMultipleItems - Can connect multiple cards
     * @param {boolean=} params.canCreateNewItems - Can connect multiple cards
     * @param {boolean=} params.childMustExistToMoveParent - Child must exist to move parent
     * @param {boolean=} params.childMustExistToFinishParent - Child must exist to finish parent
     * @param {Array.=} params.ownFieldMaps - array of FieldMapInput objects
     * @returns A promise with the response body
     */
    this.updatePipeRelation = async function (params) {
        return await client.query(UPDATE_PIPE_RELATION_QUERY, params);
    };

    const DELETE_PIPE_RELATION_QUERY = `mutation DeletePipeRelation($id: ID!) {
  deletePipeRelation(input: {id: $id}) {
    clientMutationId
    success
  }
}`;

    /**
     * Mutation to delete a pipe relation, in case of success a query "success": true is returned.
     * @function
     * @param {number} id - The pipe relation id
     * @returns A promise with the response body
     */
    this.deletePipeRelation = async function (id) {
        return await client.query(DELETE_PIPE_RELATION_QUERY, {id: id});
    };

    const CREATE_WEBHOOK_QUERY = `mutation CreateWebhook($actions: [String]!, $url:String!, $email:String, $headers:Json, $pipe_id:ID, $table_id:ID) {
  createWebhook(input: {actions: $actions, name: $name, url: $url, email: $email, headers: $headers, pipe_id: $pipe_id, table_id: $table_id}) {
    webhook {
      id
    }
  }
}`;
    /**
     * Mutation to create a webhook related to a pipe or table event.
     * @function
     * @param {object} params - The pipe relation new data
     * @param {Array.} params.actions - The actions which trigger the webhook
     * @param {string} params.url - Webhook url
     * @param {string=} params.email - email of creator
     * @param {json=} params.headers - Json formatted header values to include in webhook call
     * @param {string=} params.pipe_id - id of the pipe which fires the events
     * @param {string=} params.table_id - id of the table where events are fired
     * @returns A promise with the response body
     */
    this.createWebhook = async function (params) {
        return await client.query(CREATE_WEBHOOK_QUERY, params);
    };


    const UPDATE_WEBHOOK_QUERY = `mutation UpdateWebhook($id: ID!, $actions: [String], $url: String, $email: String, $headers: Json) {
  updateWebhook(input: {id: $id, actions: $actions, url: $url, email: $email, headers: $headers}) {
    webhook {
      id
    }
  }
}`;
    /**
     * Mutation to update a webhook.
     * @function
     * @param {object} params - The pipe relation new data
     * @param {string} params.id - Id of the webhook, returned by createWebhook function
     * @param {Array.=} params.actions - The actions which trigger the webhook
     * @param {string=} params.url - Webhook url
     * @param {string=} params.email - email of creator
     * @param {json=} params.headers - Json formatted header values to include in webhook call
     * @returns A promise with the response body
     */
    this.updateWebhook = async function (params) {
        return await client.query(UPDATE_WEBHOOK_QUERY, params);
    };

    const DELETE_WEBHOOK_QUERY = `mutation DeleteWebhook($id: ID!) {
  deleteWebhook(input: {id: $id}) {
    clientMutationId
    success
  }
}`;
    /**
     * Mutation to delete a webhook.
     * @function
     * @param {string} id - id of webhook to delete
     * @returns A promise with the response body
     */
    this.deleteWebhook = async function (id) {
        return await client.query(DELETE_WEBHOOK_QUERY, {id: id});
    };

}

module.exports = function (config) {
    return new Pipefy(config);
};