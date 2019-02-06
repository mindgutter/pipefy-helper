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

const log = require('loglevel');


function Pipefy(config) {

    if (!config) {
        throw `No 'config' parameter specified.`;
    } else if (!config.accessToken) {
        throw `No 'accessToken' property specified.`;
    }

    if (!config.logLevel) {
        log.setLevel(log.levels.SILENT, false);
    } else {
        log.setLevel(config.logLevel, false);
    }


    const client = require('graphql-client')({
        url: 'https://app.pipefy.com/queries',
        headers: {
            Authorization: 'Bearer ' + config.accessToken
        }
    });


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
          organization{
            id
          }
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
          array_value
        }
        labels{
            id
            name
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
      cards_can_be_moved_to_phases{
        id
        name
      }
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
      array_value
    }
  }
}`;
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
      cards_count
      created_at
      last_updated_by_card
      phases {
        id
        name
        cards_count
        fields{
           uuid
           id
           label
        }
      }
      start_form_fields{
        uuid
        id
        label
      }
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
     * @param {object} params.public_form_settings - Settings of the public form
     * @param {string} params.title_field_id - Id of the title field
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
      title
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
     * @param {Array.object} params.fields_attributes
     * @param {string} params.attachments
     * @returns A promise with the response body
     */
    this.createCard = async function (params) {
        return await client.query(CREATE_CARD_QUERY, params);
    };

    const CREATE_CARD_RELATION_QUERY = `mutation CreateCardRelation($childId: ID!, $parentId: ID!, $sourceId: ID!, $sourceType: String!) {
  createCardRelation(input: {childId: $childId, parentId: $parentId, sourceId: $sourceId, sourceType: $sourceType}) {
    cardRelation {
      id
    }
  }
}`;
    /**
     * The endpoint to create a card, in case of success a query is returned. When fields_attributes is passed as parameter, the field_value of first field_attribute replaces the card title.
     * @function
     * @param {object} params - The card new data
     * @param {number} params.childId - The child card id
     * @param {number} params.parentId - The parent card title
     * @param {number} params.sourceId - The id of the pipe or table for the child card
     * @param {string} params.sourceType - Type of relation either through a pipe connection or a connection field (PipeRelation, or Field)
     * @returns A promise with the response body
     */
    this.createCardRelation = async function (params) {
        return await client.query(CREATE_CARD_RELATION_QUERY, params);
    };

    /*
        const DELETE_CARD_RELATION_QUERY = `mutation DeleteCardRelation($id: ID!) {
      deleteCardRelation(input: {id: $id}) {
        cardRelation {
          id
        }
      }
    }`;
    */
    /**
     * The endpoint to create a card, in case of success a query is returned. When fields_attributes is passed as parameter, the field_value of first field_attribute replaces the card title.
     * @function
     * @param {object} params - The card new data
     * @param {number} params.id - The child card id
     * @returns A promise with the response body
     */
    /* this has not been added to Pipefy API yet
     this.deleteCardRelation = async function (id) {
         return await client.query(DELETE_CARD_RELATION_QUERY, {id:id});
     };
     */


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
     * @param {Undefined} params.new_value - Value of the field
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

    const CREATE_WEBHOOK_QUERY = `mutation CreateWebhook($actions: [String]!, $name:String! $url:String!, $email:String, $headers:Json, $pipe_id:ID, $table_id:ID) {
  createWebhook(input: {actions: $actions, name: $name, url: $url, email: $email, headers: $headers, pipe_id: $pipe_id, table_id: $table_id}) {
    webhook {
      id
      name
      actions
      url
      email
      headers
    }
  }
}`;
    /**
     * Mutation to create a webhook related to a pipe or table event.
     * @function
     * @param {object} params - The pipe relation new data
     * @param {Array.} params.actions - The actions which trigger the webhook - options are: card.create, card.done, card.expired, card.late, card.move, card.overdue
     * @param {string} params.name - Webhook name
     * @param {string} params.url - Webhook url
     * @param {string=} params.email - email of creator
     * @param {json=} params.headers - Json formatted header values to include in webhook call
     * @param {string=} params.pipe_id - id of the pipe which fires the events
     * @param {string=} params.table_id - id of the table where events are fired
     * @returns A promise with the response body
     */
    this.createWebhook = async function (params) {
        try {
            return await client.query(CREATE_WEBHOOK_QUERY, params);
        } catch (err) {
            log.debug(err);
        }
    };


    const UPDATE_WEBHOOK_QUERY = `mutation UpdateWebhook($id: ID!, $actions: [String], $url: String, $email: String, $headers: Json) {
  updateWebhook(input: {id: $id, actions: $actions, url: $url, email: $email, headers: $headers}) {
    webhook {
      id
      name
      actions
      url
      email
      headers
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


    ///////////////Batch fetching of cards from phases and pipes//////////////////////

    const PHASE_CARDS_QUERY = `query fetchCards($phaseId:ID!, $startCursor:String, $batchSize:Int) {
      phase(id: $phaseId) {
        cards_count
        cards(first:$batchSize, after:$startCursor){
            edges{
                node {
                    id
                    title
                }
            }
                
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
        }
      }
    }`;

    const MAX_CARD_BATCH_SIZE = 30; // this is the current upper limit set by pipefy per card fetch
    /**
     * A helper function to fetch a maximum of 30 cards from a phase starting from a startCursor
     * @function
     * @param {string} phaseId - id of the phase from which to get the cards
     * @param {number} batchSize - number of records to fetch
     * @param {string=} startCursor  - place to start fetching
     * @returns {json} - a JSON object with data and next cursor
     */
    async function fetchCardBatchFromPhase(phaseId, batchSize, startCursor) {
        const variables = {phaseId: phaseId, batchSize: batchSize};

        if (startCursor) {
            variables.startCursor = startCursor;
        }

        const results = await client.query(PHASE_CARDS_QUERY, variables);
        const pageInfo = results.data.phase.cards.pageInfo;
        return {
            data: results.data.phase.cards.edges,
            nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
        }
    }


    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} phaseId - id of the phase from which to get the cards
     * @param {number} batchSize - number of records to fetch
     * @param {string=} startCursor  - place to start fetching
     * @returns {JSON} - a JSON object with cards
     */
    async function fetchAllCardsFromPhase(phaseId, batchSize, startCursor = undefined) {
        const fragment = await fetchCardBatchFromPhase(phaseId, batchSize, startCursor);
        if (fragment.nextCursor) {
            return fragment.data.concat(await fetchAllCardsFromPhase(phaseId, batchSize, fragment.nextCursor));
        } else {
            return fragment.data;
        }
    }


    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} phaseId - id of the phase from which to get the cards
     * @returns {JSON} - a JSON object with cards
     */
    this.getAllCardsFromPhase = async function (phaseId, batchSize = MAX_CARD_BATCH_SIZE) {
        return await fetchAllCardsFromPhase(phaseId, batchSize);
    }

    const PHASE_CARD_COUNT_QUERY = `query fetchPhaseCardCount($phaseId:ID!){
        phase(id: $phaseId) {
            cards_count
        }
    }`;
    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} phaseId - id of the phase from which to get the cards
     * @returns {number} - a count of cards
     */
    this.getCardCountFromPhase = async function (phaseId) {
        var body = await client.query(PHASE_CARD_COUNT_QUERY, {phaseId: phaseId});
        var count = body.data.phase.cards_count;
        log.debug("Phase has " + count + " cards")
        return count;
    };


    /////////////////////BATCH FETCHING FROM PIPE//////////////////////////////////////

    const PIPE_CARDS_QUERY = `query fetchCards($pipeId:ID!, $startCursor:String, $batchSize:Int) {
      allCards(pipeId: $pipeId, first:$batchSize, after:$startCursor) {
    	edges{
          node{
            id
            title
            assignees {
              id
            }
            attachments_count
            checklist_items_checked_count
            checklist_items_count
            child_relations {
              name
              source_type
            }
            comments {
              id
              text
              created_at
              author_name
            }
            comments_count
            createdAt
            createdBy {
              id
              name
            }
            current_phase {
              id
              name
              cards_can_be_moved_to_phases{
                id
                name
              }
            }
            labels{
                id
                name
            }
            current_phase_age
            done
            due_date
            emailMessagingAddress
            expired
            fields{
              name
              value
              field{
                id
                label
                type
                options
                uuid
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

    function logCards(cards) {
        for (var card of cards) {
            console.log(card.node.id)
        }
    }

    /**
     * A helper function to fetch a maximum of 30 cards from a phase starting from a startCursor
     * @function
     * @param {string} pipeId - id of the phase from which to get the cards
     * @param {string=} startCursor  - place to start fetching
     * @returns {json} - a JSON object with data and next cursor
     */
    async function fetchCardBatchFromPipe(pipeId, batchSize, startCursor) {
        const variables = {pipeId: pipeId, batchSize: batchSize};

        if (startCursor) {
            variables.startCursor = startCursor;
        }

        try {
            const results = await client.query(PIPE_CARDS_QUERY, variables);
            const pageInfo = results.data.allCards.pageInfo;
            return {
                data: results.data.allCards.edges,
                nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
            }
        } catch (err) {
            console.log(err);
            throw `fetchCardBatchFromPipe failed ${err}`;
        }
    };


    /**
     * A function to get all cards from a pipe
     * @function
     * @param {string} pipeId - id of the pipe from which to get the cards
     * @param {string=} startCursor  - place to start fetching
     * @returns {Json} - a JSON object with cards
     */
    async function fetchAllCardsFromPipe(pipeId, batchSize, startCursor = undefined) {
        const fragment = await fetchCardBatchFromPipe(pipeId, batchSize, startCursor);
        if (fragment.nextCursor) {
            return fragment.data.concat(await fetchAllCardsFromPipe(pipeId, batchSize, fragment.nextCursor));
        } else {
            return fragment.data;
        }
    };


    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} pipeId - id of the pipe from which to get the cards
     * @returns {Json} - a JSON object with cards
     */
    this.getAllCardsFromPipe = async function (pipeId, batchSize = MAX_CARD_BATCH_SIZE) {
        try {
            return await fetchAllCardsFromPipe(pipeId, batchSize);
        } catch (err) {
            console.log("Error while getting all cards", err);
        }
    }

    const PIPE_CARD_COUNT_QUERY = `query fetchPipeCardCount($pipeId:ID!){
        pipe(id: $pipeId) {
            cards_count
        }
    }`;
    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} pipeId - id of the pipe from which to get the cards
     * @returns {number} - a count of cards in the pipe
     */
    this.getCardCountFromPipe = async function (pipeId) {
        var body = await client.query(PIPE_CARD_COUNT_QUERY, {pipeId: pipeId});
        var count = body.data.pipe.cards_count;
        log.debug("Pipe has " + count + " cards")
        return count;
    };

    /**
     * A function to get all cards from a phase
     * @function
     * @param {string} pipeId - id of the pipe from which to delete the cards
     * @returns {number}  - A number of deleted cards
     */
    this.deleteAllCardsFromPipe = async function (pipeId) {
        const cards = await this.getAllCardsFromPipe(pipeId);
        let deleteCount = 0;
        let card;
        for (card of cards) {
            await this.deleteCard(card.node.id);
            deleteCount++;
        }
        return deleteCount;
    };


    /////////////////////DATABASE FUNCTIONS//////////////////////
    const TABLE_FIELDS_QUERY = `query getTableFields($tableID: ID!) {
        table(id: $tableID) {
            description

            table_fields {
                id
                label
                type
                options
            }

            table_records_count
        }
    }`;

    /**
     * A helper function to fetch a maximum of 30 cards from a phase starting from a startCursor
     * @function
     * @param {string} tableID - id of the phase from which to get the cards
     * @returns {json} - a JSON object with data and next cursor
     */
    this.getTableFields = async function (tableID) {
        const results = await client.query(TABLE_FIELDS_QUERY, {tableID: tableID});

        return results;
    };

    const TABLE_RECORDS_QUERY = `query fetchTableRecords($tableId:ID!, $startCursor:String, $batchSize: Int, $filter: TableRecordSearch) {
      table_records(table_id: $tableId, after: $startCursor, first: $batchSize, search: $filter) {
        matchCount
        edges {
          cursor
          node {
            id
            title
            url
            record_fields {
              name
              value
              date_value
              datetime_value
              field {
                id
              }
              array_value
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
     * A helper function to fetch a maximum of 30 cards from a phase starting from a startCursor
     * @function
     * @param {string} tableId - id of the phase from which to get the cards
     * @param {number=} batchSize - how many records fetch at once
     * @param {json=} filter - filter records by labels or title
     * @param {string=} startCursor  - place to start fetching
     * @returns {json} - a JSON object with data and next cursor
     */
    async function fetchRecordBatchFromTable(tableId, batchSize, filter, startCursor) {
        const variables = {tableId: tableId, batchSize: batchSize, filter: filter};

        if (startCursor) {
            variables.startCursor = startCursor;
        }

        const results = await client.query(TABLE_RECORDS_QUERY, variables);

        const pageInfo = results.data.table_records.pageInfo;
        return {
            data: results.data.table_records.edges,
            nextCursor: pageInfo.hasNextPage ? pageInfo.endCursor : undefined,
        }
    };


    /**
     * A function to get all cards from a pipe
     * @function
     * @param {string} tableId - id of the pipe from which to get the cards
     * @param {number=} batchSize - how many records fetch at once
     * @param {json=} filter - filter records by labels or title
     * @param {string=} startCursor  - place to start fetching
     * @returns {Json} - a JSON object with cards
     */
    async function fetchAllRecordsFromTable(tableId, batchSize, filter = undefined, startCursor = undefined) {
        const fragment = await fetchRecordBatchFromTable(tableId, batchSize, filter, startCursor);
        if (fragment.nextCursor) {
            return fragment.data.concat(await fetchAllRecordsFromTable(tableId, batchSize, filter, fragment.nextCursor));
        } else {
            return fragment.data;
        }
    };

    const MAX_RECORD_BATCH_SIZE = 50;

    /**
     * A function to get all records from a table
     * @function
     * @param {string} tableId - id of the pipe from which to get the cards
     * @param {number=} batchSize - how many records to fetch at a time, default is maxiumum (50 currently)
     * @param {json=} filter - filters records by labels or title
     * @returns {Array.object} - an array of table records
     */
    this.getTableRecords = async function (tableId, batchSize = MAX_RECORD_BATCH_SIZE, filter = undefined) {
        return await fetchAllRecordsFromTable(tableId, batchSize, filter);
    };


    const DELETE_RECORD_QUERY = `mutation DeleteTableRecord($id: ID!) {
  deleteTableRecord(input: {id: $id}) {
    success
  }
}`;

    /**
     * A function to get all records from a table
     * @function
     * @param {string} recordId - id of the pipe from which to get the cards
     * @returns promise
     */
    this.deleteRecord = async function (recordId) {
        return await client.query(DELETE_RECORD_QUERY, {id: recordId});
    };

    /**
     * A function to get all records from a table
     * @function
     * @param {string} tableId - id of the pipe from which to get the cards
     * @param {Array.number=} selectedRecords - Array of ids of records to delete, if empty, this function will delete all records
     * @returns {number} - count of records deleted
     */
    this.deleteRecords = async function (tableId, selectedRecords = undefined) {
        const records = await fetchAllRecordsFromTable(tableId, MAX_RECORD_BATCH_SIZE);
        let deleteCount = 0;

        for (var r of records) {
            if (!selectedRecords || (selectedRecords && selectedRecords.includes(r.node.id))) {
                const status = await this.deleteRecord(r.node.id);
                deleteCount++;
            }
        }
        return deleteCount;
    };


    const DELETE_TABLE_QUERY = `mutation DeleteTable($id: ID!) {
  deleteTable(input: {id: $id}) {
    success
  }
}`;
    /**
     * A function to get all records from a table
     * @function
     * @param {string} tableId - id of the pipe from which to get the cards
     * @returns A promise with the response body
     */
    this.deleteTable = async function (id) {
        return await client.query(DELETE_TABLE_QUERY, {id: id});
    };


    const CREATE_TABLE_QUERY = `mutation CreateTable($name: String!, $organization_id: ID!, $labels: [LabelInput], $public:Boolean, $description: String, $authorization: TableAuthorization, $members: [MemberInput]) {
  createTable(
    input: {
      organization_id: $organization_id
      name: $name
      description: $description
      public: $public
      authorization: $authorization
      labels:$labels
      members:$members
    }
  ) {
    table {
      id
      name
      description
      public
      authorization
    }
  }
}`;

    /**
     * A function to create table
     * @function
     * @param {Object} params
     * @param {string} params.name - Name of the table
     * @param {number} params.organization_id - Id of the organization
     * @param {string} params.authorization - valid options are read, write
     * @param {string} params.description  - description of the table
     * @param {Array.LabelInput} params.labels - Array of labels to use for the records {name:labelName, color:HEX}
     * @param {Array.MemberInput} params.members - Array of user members
     * @param {boolean} params.public  - Whether the table is public
     *
     * @returns {number} - count of records deleted
     *
     * organization_id: ID!
     */
    this.createTable = async function (params) {
        return await client.query(CREATE_TABLE_QUERY, params);
    };

    const GET_TABLE_QUERY =
        `query getTable($tableID: ID!) {
        table(id: $tableID) {
            authorization
            create_record_button_label
            description
            icon
            id
            labels {
                id
            }

            members {
                role_name
            }
            my_permissions {
                can_manage_record
                can_manage_table
            }
            name
            public
            public_form
            summary_attributes {
                id
            }
            summary_options {
                name
            }
            table_fields {
                id
                allChildrenMustBeDoneToFinishParent
                canConnectExisting
                canConnectMultiples
                canCreateNewConnected
                childMustExistToFinishParent
                connectedRepo
                custom_validation
                description
                help
                label
                minimal_view
                options
                required
                type
                unique
            }

            title_field {
                id
            }
            
            organization {
    			id
    		}
        }
    }`

    /**
     * A function to get all records from a table
     * @function
     * @param {string} tableID - id of the pipe from which to get the cards
     * @returns {Object} - table info
     */
    this.getTable = async function (tableID) {
        return await client.query(GET_TABLE_QUERY, {tableID: tableID});
    };

    /**
     * clone table within the same organization
     * @function
     * @param {string} params.sourceTableID - ID of the table to clone
     * @param {string} params.newTableName - desired name for the table
     */
    this.cloneTable = async function (sourceTableID, newTableName) {
        const table = await getTable(sourceTableID);
    }

    const CREATE_TABLE_FIELD_QUERY = `mutation CreateTableField($table_id: ID!, $type: ID!, $label: String!, $options: [String], $description: String, $help: String, $required: Boolean, $minimal_view: Boolean, $custom_validation: String) {
  createTableField(input: {table_id: $table_id, type: $type, label: $label, options: $options, description: $description, help: $help, required: $required, minimal_view: $minimal_view, custom_validation: $custom_validation}) {
    table_field {
      id
      label
      type
      options
      description
      help
      required
      minimal_view
      custom_validation
    }
  }
}`;

    /**
     * A function to create table field
     * @function
     * @param {Object} params - configurations for the new field
     * @param {string} params.tableId - id of the pipe from which to get the cards
     * @param {string} params.type - field type
     * @param {string} params.label - label to use for the field
     * @param {string} params.options - field options
     * @param {string} params.description - field description
     * @param {string} params.help - help text
     * @param {boolean} params.required - specifies is the field required
     * @param {boolean} params.minimal_view - specifies how the field is displayed on a form
     * @param {string} params.custom_validation - validation rules for the field value
     * @returns Promise
     */
    this.createTableField = async function (params) {
        return await client.query(CREATE_TABLE_FIELD_QUERY, params);
    };

    /**
     * A function to get all records from a table
     * @function
     * @param {string} - table_id
     * @param {Array.Object} params - configurations for the new field
     * @param {string} params.tableId - id of the pipe from which to get the cards
     * @param {string} params.type - field type
     * @param {string} params.label - label to use for the field
     * @param {string} params.options - field options
     * @param {string} params.description - field description
     * @param {string} params.help - help text
     * @param {boolean} params.required - specifies is the field required
     * @param {boolean} params.minimal_view - specifies how the field is displayed on a form
     * @param {string} params.custom_validation - validation rules for the field value
     * @returns {Array.string} - array of field ids.
     */
    this.createTableFields = async function (table_id, params) {
        let count = 0;
        let field_ids = [params.length];
        for (let i = 0; i < params.length; i++) {
            const result = await client.query(CREATE_TABLE_FIELD_QUERY, params[i]);
            field_ids[i] = result.data.createTableField.table_field.id;
            count++
        }

        return field_ids;
    };


    const CREATE_TABLE_RECORD_QUERY = `mutation CreateTableRecord ($table_id: ID!, $title:String!, $due_date:DateTime, $fields_attributes:[FieldValueInput],$label_ids:[ID], $assignee_ids:[ID]){
  createTableRecord(
    input: {
      table_id: $table_id
      title: $title
      due_date: $due_date
      fields_attributes: $fields_attributes
      label_ids: $label_ids
      assignee_ids: $assignee_ids
    }
  ) {
    table_record {
      id
      title
      due_date
      record_fields {
        name
        value
      }
    }
  }
}`;
    /**
     * A function to get all records from a table
     * @function
     * @param {Array.Object} params - configurations for the new field
     * @param {string} params.table_id - id of the pipe from which to get the cards
     * @param {string} params.title - record title
     * @param {string} params.due_date - if the record has a due date
     * @param {Array.FieldInput} params.fields_attributes - field values
     * @param {Array.number} params.label_ids - any labels that should be applied to the record
     * @returns {Object} - record values
     */

    this.createTableRecord = async function (params) {
        return await client.query(CREATE_TABLE_RECORD_QUERY, params);
    };

    const TABLE_RECORDS_COUNT_QUERY = `query fetchTableRecordCount($tableId:ID!){
    table(id: $tableId) {
     table_records_count
        }
    }`;
    /**
     * A function to get all records from a table
     * @function
     * @param {number} table_id - id of the table
     * @returns {number} - count of records
     */
    this.getTableRecordsCount = async function (tableId) {
        return await client.query(TABLE_RECORDS_COUNT_QUERY, {tableId: tableId});
    };

    const UPDATE_TABLE_FIELD_QUERY = `mutation ($recordId: ID!, $fieldId: ID!, $newValue: [UndefinedInput]) {
      setTableRecordFieldValue(
        input: {
          table_record_id: $recordId
          field_id: $fieldId
          value: $newValue
        })
      {
        table_record {
          id
          title
        }
        table_record_field {
          value
        }
      }
    }`;
    /**
     * A function to get all records from a table
     * @function
     * @param {Object} params - parameters for update
     * @param {number} params.recordId - id of the record to update
     * @param {string} params.fieldId - id of the field to update
     * @param {UndefinedInput} params.newValue - new value
     * @returns promise
     */
    this.updateTableField = async function (params) {
        return await client.query(UPDATE_TABLE_FIELD_QUERY, params);
    };

    /**
     * This function will return an array of recordIDs that match each distinct field value
     * This matrix can be written to filter table
     * @param tableID - Table to analyze
     * @returns {Promise<Array>} - array will contain an element for every distinct field value for the provided field
     */
    this.getFilterTable = async function (tableID) {
        //find filter table in the current organization

        const result = await this.getTable(tableID);

        if (result == null || result == undefined || result.data.table == null) {
            return this.generateError("Could not find table with tableID: " + tableID);
        }

        if (result.data.table.name === FILTER_TABLE_INFO.filterTableName) {
            return this.generateError("Cannot filter table " + FILTER_TABLE_INFO.filterTableName);
        }

        const orgID = result.data.table.organization.id;

        const org = await this.getOrganizationById(orgID);
        let filterTable = org.data.organization.tables.edges.find(table => (table.node.name === FILTER_TABLE_INFO.filterTableName));

        return filterTable;
    }

    /**
     * This function will return an array of recordIDs that match each distinct field value
     * This matrix can be written to filter table
     * @param tableID - Table to analyze
     * @param fieldID - Field to analyze
     * @returns {Promise<Array>} - array will contain an element for every distinct field value for the provided field
     */
    this.initializeFilterTable = async function (tableID) {
        //find filter table in the current organization

        let filterTable = await this.getFilterTable(tableID);
        let filterTableID, orgID, isNew;

        if (filterTable == null || filterTable == undefined) {
            const table = await this.getTable(tableID);
            filterTable = await this.createFilterTable(table.data.table.organization.id);
            filterTableID = filterTable.filterTableID;
            orgID = filterTable.orgID;
            isNew = true;
        }else{
            filterTableID = filterTable.node.id;
            orgID = filterTable.node.organization.id;
            isNew = false;
        }

        const tableInfo = await this.getTable(filterTableID);
        const fields = tableInfo.data.table.table_fields;


        const filterTableInfo = {
            orgID: orgID,
            filterTableID: filterTableID,
            filterNameFieldID: fields.find(field => (field.label === FILTER_TABLE_INFO.filterNameColumn)).id,
            tableIDFieldID: fields.find(field => (field.label === FILTER_TABLE_INFO.tableIDColumn)).id,
            fieldIDFieldID: fields.find(field => (field.label === FILTER_TABLE_INFO.fieldIDColumn)).id,
            valueFieldID: fields.find(field => (field.label === FILTER_TABLE_INFO.valueColumn)).id,
            recordIDSFieldID: fields.find(field => (field.label === FILTER_TABLE_INFO.recordIDSColumn)).id,
            isNew: isNew
        };

        return filterTableInfo;
    }

    this.generateError = function (errorMsg) {
        return {error: errorMsg};
    }

    /**
     *
     * @param tableID
     * @param filter
     * @param {string} filter.fieldName
     * @param [string] filter.includeValues
     * @returns {Promise<void>}
     */

    this.getFilteredTableRecords = async function (tableID, filter) {
        const filterTableInfo = await this.initializeFilterTable(tableID);

        if (filterTableInfo == null) {
            return this.generateError("Could not find table with tableID: " + tableID);
        }

        if (filterTableInfo.hasOwnProperty('error')) {
            return filterTableInfo;
        }

        const enhancedFilter = {
            filterTableInfo: filterTableInfo,
            tableID: tableID,
            fieldID: await this.getFieldID(tableID, filter.fieldName),
            includeValues: filter.includeValues
        };

        if (enhancedFilter.fieldID == null || enhancedFilter.fieldID == undefined) {
            return this.generateError("Field " + filter.fieldName + " not found in tableID: " + tableID);
        }

        //populate the filter table if it is new
        if (filterTableInfo.isNew || !this.isFieldValueFilterPresent(enhancedFilter)) {
            const result = await this.initializeFieldFilter(enhancedFilter);
        }


        const ignore_ids = await this.getIgnoreIDs(enhancedFilter);

        const search = {ignore_ids: []};
        search.ignore_ids = ignore_ids;

        return await this.getTableRecords(tableID, MAX_RECORD_BATCH_SIZE, search);
    };


    /**
     * Returns a list of ids to ignore based on data in filter table
     * @param filter
     * @param {string} filter.fieldID
     * @param {string} filter.tableID
     * @param [string] filter.includeValues
     * @returns [number] ignoreIDs
     */
    this.getIgnoreIDs = async function (filter) {
        //check if we already have an appropriate record in the table
        const records = await this.getTableRecords(filter.filterTableInfo.filterTableID);


        let ignoreIDs = [];
        records.forEach(function (record) {
            const foundTableID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.tableIDFieldID)).value;
            const foundFieldID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.fieldIDFieldID)).value;
            const foundFieldValue = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.valueFieldID)).value;
            const foundRecordIDs = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.recordIDSFieldID)).value;


            if (foundTableID === filter.tableID && foundFieldID === filter.fieldID) {
                if (!filter.includeValues.find(value => (foundFieldValue === value))) {
                    ignoreIDs = ignoreIDs.concat(JSON.parse("[" + foundRecordIDs + "]"));
                }
            }
        });

        return ignoreIDs;
    };


    /**
     * Returns field id based on tableID and Field Name
     * @param {string} tableID
     * @param {string} fieldName
     */
    this.getFieldID = async function (tableID, fieldName) {
        const tableInfo = await this.getTable(tableID);
        const field = tableInfo.data.table.table_fields.find(field => (field.label === fieldName));
        if (field == undefined) {
            this.generateError("Could not find field: " + fieldName + " in tableID: " + tableID);
        } else {
            return field.id
        }
    }


    /**
     * The following section handles filtering pipefy tables based on values of any field
     * It does this by creating filter records in a dedicated filter table where all record ids of each distinct value of the specified field are recorded
     * These ids can later be used to only get records with chosen field value
     * This can significantly reduce time required to fetch records
     */

    const FILTER_TABLE_INFO = {
        filterTableName: "Filters",
        filterNameColumn: "Filter Name",
        tableIDColumn: "Table ID",
        fieldIDColumn: "Field ID",
        valueColumn: "Value",
        recordIDSColumn: "Record IDs"
    }


    /**
     * This function will return an array of recordIDs that match each distinct field value
     * This matrix can be written to filter table
     * @param tableID - Table to analyze
     * @param fieldID - Field to analyze
     * @returns {Promise<Array>} - array will contain an element for every distinct field value for the provided field
     */

    this.createFieldValueMatrix = async function (filter) {
        const tableInfo = await this.getTable(filter.tableID);
        const records = await this.getTableRecords(filter.tableID);
        let matrix = [];

        records.forEach(function (record) {
            const field = record.node.record_fields.find(field => field.field.id === filter.fieldID);

            const id = record.node.id;

            const filterName = tableInfo.data.table.name + " : " + field.name + " : " + field.value;

            const anotherFilter = {
                name: filterName,
                tableID: filter.tableID,
                fieldID: filter.fieldID,
                fieldValue: field.value,
                id: id
            };

            let arr = matrix.find(arr => arr.value === field.value);
            if (arr == null) {
                arr = {
                    name: anotherFilter.name,
                    tableID: anotherFilter.tableID,
                    fieldID: anotherFilter.fieldID,
                    value: anotherFilter.fieldValue,
                    ids: [anotherFilter.id]
                };
                matrix.push(arr);
            } else {
                arr.ids.push(id);
            }
        });

        return matrix;
    }


    /**
     * Stores the field value matrix in filter table
     * @param matrix
     * @param filter
     * @returns {Promise<void>}
     */

    this.storeFieldValueMatrix = async function (matrix, filter) {
        //check if we already have an appropriate record in the table
        const records = await this.getTableRecords(filter.filterTableInfo.filterTableID);


        let foundRecords = [];
        records.forEach(function (record) {
            const foundTableID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.tableIDFieldID)).value;
            const foundFieldID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.fieldIDFieldID)).value;


            if (foundTableID === filter.tableID && foundFieldID === filter.fieldID) {
                foundRecords.push(record.node.id);
            }
        });

        //delete all previous filter records for this table/field combination
        if (foundRecords.length > 0) {
            const deleteResult = await this.deleteRecords(filter.filterTableInfo.filterTableID, foundRecords);
        }


        for await (const e of matrix) {
            const tableRecord = {
                table_id: filter.filterTableInfo.filterTableID,
                title: e.name,
                fields_attributes: [
                    {field_id: filter.filterTableInfo.filterNameFieldID, field_value: e.name},
                    {field_id: filter.filterTableInfo.tableIDFieldID, field_value: e.tableID},
                    {field_id: filter.filterTableInfo.fieldIDFieldID, field_value: e.fieldID},
                    {field_id: filter.filterTableInfo.valueFieldID, field_value: e.value},
                    {field_id: filter.filterTableInfo.recordIDSFieldID, field_value: e.ids.join()},
                ]
            }

            const insertResult = await this.createTableRecord(tableRecord);
        }
    }


    /**
     * This function will return an array of recordIDs that match each distinct field value
     * This matrix can be written to filter table
     * @param filter
     * @param {string} filter.tableID - Table to analyze
     * @param {string} filter.fieldID - Field to analyze
     * @returns {Promise<Array>} - array will contain an element for every distinct field value for the provided field
     */
    this.initializeFieldFilter = async function (filter) {
        //find all records for each value variation of a given field
        //the resulting matrix will have a row for each value, with the record ids that have that value
        const matrix = await this.createFieldValueMatrix(filter);

        //store the value matrix in filter table
        const result = await this.storeFieldValueMatrix(matrix, filter);

        return matrix;
    }


    /**
     * This function will return an array of recordIDs that match each distinct field value
     * This matrix can be written to filter table
     * @param {string} tableID - Table to analyze
     * @param {string} fieldID - Field to analyze
     * @returns {boolean} - returns true if field filter deleted
     */
    this.deleteFieldFilter = async function (tableID, fieldID) {
        //find all records for each value variation of a given field
        //the resulting matrix will have a row for each value, with the record ids that have that value

        const filterTable = await this.getFilterTable(tableID);

        if (filterTable) {
            const records = await this.getTableRecords(filterTable.node.id);

            for await (const record of records) {
                const foundTableID = record.node.record_fields.find(field => (field.name ===FILTER_TABLE_INFO.tableIDColumn )).value;
                const foundFieldID = record.node.record_fields.find(field => (field.name === FILTER_TABLE_INFO.fieldIDColumn)).value;
                const recordId = record.node.id;

                if (foundTableID === tableID && foundFieldID === fieldID) {
                    const delStatus = await this.deleteRecord(recordId);
                    if (delStatus.errors) {
                        throw delStatus;
                    }
                }
            }


            return true;
        }
        return true;

    }
    /**
     *
     * @param {string} orgID
     * @returns filterTableInfo
     *
     * */
    this.createFilterTable = async function (orgID) {

        const result = await this.createTable({organization_id: orgID, name: FILTER_TABLE_INFO.filterTableName});

        const filterTableID = result.data.createTable.table.id;

        const table_fields = [{
            table_id: filterTableID,
            type: "short_text",
            label: FILTER_TABLE_INFO.filterNameColumn,
            description: "Name of the filter",
            required: true,
            minimal_view: false
        },
            {
                table_id: filterTableID,
                type: "short_text",
                label: FILTER_TABLE_INFO.tableIDColumn,
                required: true,
                description: "ID of the table to filter"
            },
            {
                table_id: filterTableID,
                type: "short_text",
                label: FILTER_TABLE_INFO.fieldIDColumn,
                required: true,
                description: "ID of the field to filter"
            },
            {
                table_id: filterTableID,
                type: "short_text",
                label: FILTER_TABLE_INFO.valueColumn,
                required: true,
                description: "ID of the field to filter"
            },
            {
                table_id: filterTableID,
                type: "long_text",
                label: FILTER_TABLE_INFO.recordIDSColumn,
                required: true,
                description: "IDs of the records matching the value"
            }

        ];

        const field_ids = await this.createTableFields(filterTableID, table_fields);

        const filterTableInfo = {
            orgID: orgID,
            filterTableID: filterTableID,
            filterNameFieldID: field_ids[0],
            tableIDFieldID: field_ids[1],
            fieldIDFieldID: field_ids[2],
            valueFieldID: field_ids[3],
            recordIDSFieldID: field_ids[4],
            isNew: true
        };

        return filterTableInfo;
    }


    /**
     *
     * @param filter
     */
    this.isFieldValueFilterPresent = async function (filter) {
        const records = await this.getTableRecords(filter.filterTableInfo.filterTableID);

        records.forEach(function (record) {
            const foundTableID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.tableIDFieldID)).value;
            const foundFieldID = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.fieldIDFieldID)).value;
            const foundFieldValue = record.node.record_fields.find(field => (field.field.id === filter.filterTableInfo.valueFieldID)).value

            if (foundTableID === filter.tableID && foundFieldID === filter.fieldID && filter.includeValues.includes(foundFieldValue)) {
                return true;
            }
        });

        return false;
    }

    /**
     *
     * @param {string} tableID
     * @param {string} csvFile
     * @returns status
     *
     * */
    this.exportTableToCSV = async function(tableID, csvFile){

        const tableInfo = await this.getTable(tableID);
        const records = await this.getTableRecords(tableID);

        const createCsvWriter = require('csv-writer').createObjectCsvWriter;

        let header = [];

        for (const field of tableInfo.data.table.table_fields){
            header.push({id:field.id, title:field.label});
        }

        const csvWriter = await createCsvWriter({
            path: csvFile,
            header
        });

        let csvRecords = [];
        for (const record of records){
            let fieldValues = new Map();
            let fieldFound = false;

            for (const f of header){
                for (const field of record.node.record_fields){
                    if (field.field.id == f.id){
                        fieldValues.set(field.field.id,field.value);
                        fieldFound = true;
                    }
                }

                if (!fieldFound){
                    fieldValues.set(f.id, "");
                }
            }

            csvRecords.push(strMapToObj(fieldValues));
        }

        const status = await csvWriter.writeRecords(csvRecords);

        return status;
    }


    function strMapToObj(strMap) {
        let obj = Object.create(null);
        for (let [k,v] of strMap) {
            // We don’t escape the key '__proto__'
            // which can cause problems on older engines
            obj[k] = v;
        }
        return obj;
    }

    function mapToJson(map) {
        return JSON.stringify([...map]);
    }

    function strMapToJson(strMap) {
        return JSON.stringify(strMapToObj(strMap));
    }



    const CLONE_CARD_QUERY = `mutation CreateCard($pipe_id: ID!, $assignee_ids: [ID], $attachments: [String], $due_date: DateTime, $fields_attributes: [FieldValueInput], $label_ids: [ID], $parent_ids: [ID], $phase_id: ID, $title: String) {
createCard(input: {pipe_id: $pipe_id, phase_id: $phase_id, parent_ids: $parent_ids, assignee_ids: $assignee_ids, attachments: $attachments, due_date: $due_date, fields_attributes: $fields_attributes, label_ids: $label_ids, title: $title}) {
card {
  id
  title
}
}
}`;
}


module.exports = function (config) {
    return new Pipefy(config);
};